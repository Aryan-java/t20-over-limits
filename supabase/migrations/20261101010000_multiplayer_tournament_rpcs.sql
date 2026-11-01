-- Secure, host-authorized RPCs for the additive multi-team tournament schema.
-- This migration depends on 20261101000000_multiplayer_tournament_foundation.sql.

CREATE OR REPLACE FUNCTION public.mp_create_team(
  p_room uuid, p_owner uuid, p_name text, p_squad jsonb DEFAULT '[]'::jsonb
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE r public.multiplayer_rooms; tid uuid; n text := btrim(coalesce(p_name, ''));
BEGIN
  r := public.mp_require_host(p_room);
  IF r.status NOT IN ('lobby','ready') THEN
    RAISE EXCEPTION 'Teams can only be created before the room starts';
  END IF;
  IF length(n) NOT BETWEEN 1 AND 60 THEN RAISE EXCEPTION 'Team name must be 1-60 characters'; END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.multiplayer_room_members
    WHERE room_id=p_room AND user_id=p_owner
  ) THEN RAISE EXCEPTION 'Team owner must be a room member'; END IF;
  IF p_squad IS NULL OR jsonb_typeof(p_squad) <> 'array' THEN
    RAISE EXCEPTION 'Squad must be a JSON array';
  END IF;
  INSERT INTO public.multiplayer_teams(room_id,name,squad)
    VALUES (p_room,n,p_squad) RETURNING id INTO tid;
  INSERT INTO public.multiplayer_team_members(room_id,team_id,user_id,role)
    VALUES (p_room,tid,p_owner,'owner');
  PERFORM public.mp_log(p_room,'tournament_team_created',
    jsonb_build_object('team_id',tid,'name',n,'owner_id',p_owner));
  RETURN tid;
END $$;

CREATE OR REPLACE FUNCTION public.mp_create_tournament(
  p_room uuid, p_name text, p_format text DEFAULT 'round_robin', p_settings jsonb DEFAULT '{}'::jsonb
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE r public.multiplayer_rooms; tid uuid; n text := btrim(coalesce(p_name,''));
BEGIN
  r := public.mp_require_host(p_room);
  IF r.status NOT IN ('lobby','ready') THEN RAISE EXCEPTION 'Tournament setup is locked'; END IF;
  IF length(n) NOT BETWEEN 1 AND 80 THEN RAISE EXCEPTION 'Tournament name must be 1-80 characters'; END IF;
  IF p_format <> 'round_robin' THEN
    RAISE EXCEPTION 'Only round_robin is currently supported';
  END IF;
  IF p_settings IS NULL OR jsonb_typeof(p_settings) <> 'object' THEN
    RAISE EXCEPTION 'Settings must be a JSON object';
  END IF;
  INSERT INTO public.multiplayer_tournaments(room_id,name,format,settings,created_by)
    VALUES(p_room,n,p_format,p_settings,auth.uid()) RETURNING id INTO tid;
  PERFORM public.mp_log(p_room,'tournament_created',jsonb_build_object('tournament_id',tid,'name',n));
  RETURN tid;
END $$;

CREATE OR REPLACE FUNCTION public.mp_register_tournament_team(
  p_room uuid, p_tournament uuid, p_team uuid, p_seed integer DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE r public.multiplayer_rooms; t public.multiplayer_tournaments;
BEGIN
  r := public.mp_require_host(p_room);
  SELECT * INTO t FROM public.multiplayer_tournaments
    WHERE id=p_tournament AND room_id=p_room FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Tournament not found in this room'; END IF;
  IF t.status <> 'setup' THEN RAISE EXCEPTION 'Tournament registration is closed'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.multiplayer_teams WHERE id=p_team AND room_id=p_room) THEN
    RAISE EXCEPTION 'Team not found in this room';
  END IF;
  IF p_seed IS NOT NULL AND p_seed < 1 THEN RAISE EXCEPTION 'Seed must be positive'; END IF;
  INSERT INTO public.multiplayer_tournament_teams(room_id,tournament_id,team_id,seed)
    VALUES(p_room,p_tournament,p_team,p_seed);
  PERFORM public.mp_log(p_room,'tournament_team_registered',
    jsonb_build_object('tournament_id',p_tournament,'team_id',p_team));
END $$;

CREATE OR REPLACE FUNCTION public.mp_generate_round_robin(
  p_room uuid, p_tournament uuid
) RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  r public.multiplayer_rooms;
  t public.multiplayer_tournaments;
  teams uuid[];
  n integer;
  slots uuid[];
  fixed uuid;
  tmp uuid;
  round_no integer;
  i integer;
  fixture_no integer;
  made integer := 0;
BEGIN
  r := public.mp_require_host(p_room);
  SELECT * INTO t FROM public.multiplayer_tournaments
    WHERE id=p_tournament AND room_id=p_room FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Tournament not found in this room'; END IF;
  IF t.status <> 'setup' THEN RAISE EXCEPTION 'Tournament is not in setup'; END IF;
  IF EXISTS (SELECT 1 FROM public.multiplayer_fixtures WHERE tournament_id=p_tournament) THEN
    RAISE EXCEPTION 'Fixtures have already been generated';
  END IF;
  SELECT array_agg(team_id ORDER BY coalesce(seed,2147483647),joined_at,team_id)
    INTO teams FROM public.multiplayer_tournament_teams
    WHERE room_id=p_room AND tournament_id=p_tournament;
  n := coalesce(array_length(teams,1),0);
  IF n < 2 THEN RAISE EXCEPTION 'Register at least two teams'; END IF;
  slots := teams;
  IF n % 2 = 1 THEN slots := array_append(slots,NULL::uuid); n := n+1; END IF;
  fixed := slots[1];
  FOR round_no IN 1..(n-1) LOOP
    fixture_no := 0;
    FOR i IN 1..(n/2) LOOP
      IF slots[i] IS NOT NULL AND slots[n-i+1] IS NOT NULL THEN
        fixture_no := fixture_no+1;
        INSERT INTO public.multiplayer_fixtures(
          room_id,tournament_id,round_number,fixture_number,home_team_id,away_team_id
        ) VALUES (
          p_room,p_tournament,round_no,fixture_no,slots[i],slots[n-i+1]
        );
        made := made+1;
      END IF;
    END LOOP;
    -- Circle method: keep slot 1 fixed, rotate the remaining slots clockwise.
    tmp := slots[n];
    FOR i IN REVERSE n..3 LOOP slots[i] := slots[i-1]; END LOOP;
    slots[2] := tmp;
  END LOOP;
  UPDATE public.multiplayer_tournaments SET status='ready',updated_at=now()
    WHERE id=p_tournament;
  PERFORM public.mp_log(p_room,'tournament_fixtures_generated',
    jsonb_build_object('tournament_id',p_tournament,'fixtures',made,'teams',n));
  RETURN made;
END $$;

CREATE OR REPLACE FUNCTION public.mp_advance_fixture(
  p_room uuid, p_tournament uuid
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  r public.multiplayer_rooms;
  t public.multiplayer_tournaments;
  f public.multiplayer_fixtures;
  mid uuid;
BEGIN
  r := public.mp_require_host(p_room);
  SELECT * INTO t FROM public.multiplayer_tournaments
    WHERE id=p_tournament AND room_id=p_room FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Tournament not found in this room'; END IF;
  IF t.status NOT IN ('ready','live') THEN RAISE EXCEPTION 'Tournament cannot advance'; END IF;
  IF EXISTS (
    SELECT 1 FROM public.multiplayer_fixtures
    WHERE tournament_id=p_tournament AND status='live'
  ) THEN RAISE EXCEPTION 'A fixture is already live'; END IF;
  IF EXISTS (
    SELECT 1 FROM public.multiplayer_fixtures
    WHERE tournament_id=p_tournament AND status IN ('scheduled','ready')
      AND (round_number,fixture_number) < (
        SELECT round_number,fixture_number FROM public.multiplayer_fixtures
        WHERE tournament_id=p_tournament AND status IN ('scheduled','ready')
        ORDER BY round_number,fixture_number LIMIT 1
      )
  ) THEN RAISE EXCEPTION 'An earlier fixture is incomplete'; END IF;
  SELECT * INTO f FROM public.multiplayer_fixtures
    WHERE tournament_id=p_tournament AND status IN ('scheduled','ready')
    ORDER BY round_number,fixture_number LIMIT 1 FOR UPDATE;
  IF NOT FOUND THEN
    IF NOT EXISTS (SELECT 1 FROM public.multiplayer_fixtures
      WHERE tournament_id=p_tournament AND status NOT IN ('completed','forfeit','cancelled')) THEN
      UPDATE public.multiplayer_tournaments SET status='completed',updated_at=now()
        WHERE id=p_tournament;
      RETURN NULL;
    END IF;
    RAISE EXCEPTION 'No fixture is currently eligible to start';
  END IF;
  INSERT INTO public.multiplayer_matches(room_id,fixture_id,status,settings)
    VALUES(p_room,f.id,'ready',t.settings) RETURNING id INTO mid;
  UPDATE public.multiplayer_fixtures SET status='live',started_at=now() WHERE id=f.id;
  UPDATE public.multiplayer_tournaments SET status='live',updated_at=now()
    WHERE id=p_tournament;
  PERFORM public.mp_log(p_room,'fixture_activated',
    jsonb_build_object('tournament_id',p_tournament,'fixture_id',f.id,'match_id',mid));
  RETURN mid;
END $$;

REVOKE ALL ON FUNCTION public.mp_create_team(uuid,uuid,text,jsonb) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.mp_create_tournament(uuid,text,text,jsonb) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.mp_register_tournament_team(uuid,uuid,uuid,integer) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.mp_generate_round_robin(uuid,uuid) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.mp_advance_fixture(uuid,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.mp_create_team(uuid,uuid,text,jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mp_create_tournament(uuid,text,text,jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mp_register_tournament_team(uuid,uuid,uuid,integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mp_generate_round_robin(uuid,uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mp_advance_fixture(uuid,uuid) TO authenticated;
