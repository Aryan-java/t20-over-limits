-- Enforce the tournament squad contract at the database boundary.
-- Client and Edge Function validation are defense in depth, not a substitute
-- for validation in the SECURITY DEFINER RPC used to create teams.

CREATE OR REPLACE FUNCTION public.mp_create_team(
  p_room uuid, p_owner uuid, p_name text, p_squad jsonb DEFAULT '[]'::jsonb
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  r public.multiplayer_rooms;
  tid uuid;
  n text := btrim(coalesce(p_name, ''));
  player_count integer;
  unique_ids integer;
  overseas_count integer;
BEGIN
  r := public.mp_require_host(p_room);
  IF r.status NOT IN ('lobby','ready') THEN
    RAISE EXCEPTION 'Teams can only be created before the room starts';
  END IF;
  IF length(n) NOT BETWEEN 1 AND 60 THEN
    RAISE EXCEPTION 'Team name must be 1-60 characters';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.multiplayer_room_members
    WHERE room_id=p_room AND user_id=p_owner
  ) THEN
    RAISE EXCEPTION 'Team owner must be a room member';
  END IF;
  IF p_squad IS NULL OR jsonb_typeof(p_squad) <> 'array' THEN
    RAISE EXCEPTION 'Squad must be a JSON array';
  END IF;

  player_count := jsonb_array_length(p_squad);
  IF player_count NOT BETWEEN 18 AND 25 THEN
    RAISE EXCEPTION 'Squad must contain between 18 and 25 players';
  END IF;

  SELECT count(DISTINCT p->>'id'),
         count(*) FILTER (WHERE p->'isOverseas' = 'true'::jsonb)
    INTO unique_ids, overseas_count
    FROM jsonb_array_elements(p_squad) AS squad_player(p);

  IF unique_ids <> player_count THEN
    RAISE EXCEPTION 'Squad player IDs must be present and unique';
  END IF;
  IF overseas_count > 8 THEN
    RAISE EXCEPTION 'Squad may contain at most 8 overseas players';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM jsonb_array_elements(p_squad) AS squad_player(p)
    WHERE jsonb_typeof(p) <> 'object'
       OR jsonb_typeof(p->'id') <> 'string'
       OR length(btrim(coalesce(p->>'id',''))) = 0
       OR jsonb_typeof(p->'name') <> 'string'
       OR length(btrim(coalesce(p->>'name',''))) = 0
       OR jsonb_typeof(p->'batSkill') <> 'number'
       OR jsonb_typeof(p->'bowlSkill') <> 'number'
       OR CASE WHEN jsonb_typeof(p->'batSkill') = 'number'
               THEN (p->>'batSkill')::numeric NOT BETWEEN 0 AND 100 ELSE true END
       OR CASE WHEN jsonb_typeof(p->'bowlSkill') = 'number'
               THEN (p->>'bowlSkill')::numeric NOT BETWEEN 0 AND 100 ELSE true END
       OR (p ? 'isOverseas' AND jsonb_typeof(p->'isOverseas') <> 'boolean')
  ) THEN
    RAISE EXCEPTION 'Each squad player needs a unique ID, name, valid skills (0-100), and a boolean overseas flag';
  END IF;

  INSERT INTO public.multiplayer_teams(room_id,name,squad)
    VALUES (p_room,n,p_squad) RETURNING id INTO tid;
  INSERT INTO public.multiplayer_team_members(room_id,team_id,user_id,role)
    VALUES (p_room,tid,p_owner,'owner');
  PERFORM public.mp_log(p_room,'tournament_team_created',
    jsonb_build_object('team_id',tid,'name',n,'owner_id',p_owner));
  RETURN tid;
END $$;

REVOKE ALL ON FUNCTION public.mp_create_team(uuid,uuid,text,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.mp_create_team(uuid,uuid,text,jsonb) TO authenticated;
