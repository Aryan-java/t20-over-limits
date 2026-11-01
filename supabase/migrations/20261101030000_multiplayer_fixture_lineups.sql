-- Fixture-specific XI selection and readiness gates.
-- Depends on the multi-team schema and tournament RPC foundation.

CREATE TABLE public.multiplayer_fixture_lineups (
  room_id uuid NOT NULL,
  fixture_id uuid NOT NULL,
  team_id uuid NOT NULL,
  owner_user_id uuid NOT NULL,
  playing_xi text[] NOT NULL,
  impact_players text[] NOT NULL DEFAULT '{}',
  ready_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (fixture_id, team_id),
  FOREIGN KEY (room_id, fixture_id)
    REFERENCES public.multiplayer_fixtures(room_id, id) ON DELETE CASCADE,
  FOREIGN KEY (room_id, team_id)
    REFERENCES public.multiplayer_teams(room_id, id) ON DELETE CASCADE,
  FOREIGN KEY (room_id, owner_user_id)
    REFERENCES public.multiplayer_room_members(room_id, user_id) ON DELETE CASCADE,
  CHECK (cardinality(playing_xi) = 11),
  CHECK (cardinality(impact_players) <= 4),
  CHECK (array_position(playing_xi, NULL) IS NULL),
  CHECK (array_position(impact_players, NULL) IS NULL)
);
CREATE INDEX idx_mp_fixture_lineups_room_fixture
  ON public.multiplayer_fixture_lineups(room_id, fixture_id);

ALTER TABLE public.multiplayer_fixture_lineups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "room members view fixture lineups"
  ON public.multiplayer_fixture_lineups FOR SELECT TO authenticated
  USING (public.mp_is_member(room_id, auth.uid()));
GRANT SELECT ON public.multiplayer_fixture_lineups TO authenticated;
GRANT ALL ON public.multiplayer_fixture_lineups TO service_role;

CREATE OR REPLACE FUNCTION public.mp_submit_fixture_lineup(
  p_room uuid,
  p_fixture uuid,
  p_team uuid,
  p_xi text[],
  p_impact text[] DEFAULT '{}'
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  u uuid := public.mp_require_uid();
  f public.multiplayer_fixtures;
  tm public.multiplayer_teams;
  squad_ids text[];
  xi_count integer;
  impact_count integer;
  overseas_count integer;
BEGIN
  SELECT * INTO f FROM public.multiplayer_fixtures
    WHERE id=p_fixture AND room_id=p_room FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Fixture not found in this room'; END IF;
  IF f.status NOT IN ('scheduled','ready') THEN
    RAISE EXCEPTION 'Lineups are locked once the fixture starts';
  END IF;
  SELECT * INTO tm FROM public.multiplayer_teams
    WHERE id=p_team AND room_id=p_room FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Team not found in this room'; END IF;
  IF p_team NOT IN (f.home_team_id,f.away_team_id) THEN
    RAISE EXCEPTION 'Team is not part of this fixture';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.multiplayer_team_members
    WHERE room_id=p_room AND team_id=p_team AND user_id=u AND role='owner'
  ) THEN
    RAISE EXCEPTION 'Only this team owner can submit its lineup' USING ERRCODE='42501';
  END IF;
  IF p_xi IS NULL OR cardinality(p_xi) <> 11
     OR (SELECT count(DISTINCT x) FROM unnest(p_xi) x) <> 11 THEN
    RAISE EXCEPTION 'Select exactly 11 unique players';
  END IF;
  p_impact := coalesce(p_impact,'{}'::text[]);
  IF cardinality(p_impact) > 4
     OR (SELECT count(DISTINCT x) FROM unnest(p_impact) x) <> cardinality(p_impact) THEN
    RAISE EXCEPTION 'Select up to 4 unique impact players';
  END IF;
  IF p_xi && p_impact THEN
    RAISE EXCEPTION 'A player cannot be in both the Playing XI and impact list';
  END IF;
  SELECT array_agg(p->>'id') INTO squad_ids
    FROM jsonb_array_elements(tm.squad) p;
  IF NOT (p_xi <@ coalesce(squad_ids,'{}'::text[]))
     OR NOT (p_impact <@ coalesce(squad_ids,'{}'::text[])) THEN
    RAISE EXCEPTION 'All selected players must belong to this team squad';
  END IF;
  SELECT count(*) INTO overseas_count
    FROM jsonb_array_elements(tm.squad) p
    WHERE p->>'id' = ANY(p_xi)
      AND coalesce((p->>'isOverseas')::boolean,false);
  IF overseas_count > 4 THEN RAISE EXCEPTION 'Maximum 4 overseas players in the Playing XI'; END IF;

  INSERT INTO public.multiplayer_fixture_lineups(
    room_id,fixture_id,team_id,owner_user_id,playing_xi,impact_players,ready_at,updated_at
  ) VALUES (
    p_room,p_fixture,p_team,u,p_xi,p_impact,now(),now()
  )
  ON CONFLICT (fixture_id,team_id) DO UPDATE SET
    owner_user_id=EXCLUDED.owner_user_id,
    playing_xi=EXCLUDED.playing_xi,
    impact_players=EXCLUDED.impact_players,
    ready_at=now(),
    updated_at=now();

  PERFORM public.mp_log(p_room,'fixture_lineup_confirmed',
    jsonb_build_object('fixture_id',p_fixture,'team_id',p_team,'player_count',cardinality(p_xi)));
END $$;

-- Replace activation with a readiness gate. Both owners must have a current
-- confirmed XI; an old confirmation from a former owner is not sufficient.
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
  ready_count integer;
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

  SELECT * INTO f FROM public.multiplayer_fixtures
    WHERE tournament_id=p_tournament AND status IN ('scheduled','ready')
    ORDER BY round_number,fixture_number LIMIT 1 FOR UPDATE;
  IF NOT FOUND THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.multiplayer_fixtures
      WHERE tournament_id=p_tournament
        AND status NOT IN ('completed','forfeit','cancelled')
    ) THEN
      UPDATE public.multiplayer_tournaments SET status='completed',updated_at=now()
        WHERE id=p_tournament;
      RETURN NULL;
    END IF;
    RAISE EXCEPTION 'No fixture is currently eligible to start';
  END IF;

  SELECT count(*) INTO ready_count
    FROM public.multiplayer_fixture_lineups l
    JOIN public.multiplayer_team_members owner
      ON owner.room_id=l.room_id AND owner.team_id=l.team_id
     AND owner.user_id=l.owner_user_id AND owner.role='owner'
    WHERE l.room_id=p_room AND l.fixture_id=f.id
      AND l.team_id IN (f.home_team_id,f.away_team_id);
  IF ready_count <> 2 THEN
    RAISE EXCEPTION 'Both team owners must confirm their Playing XI before kickoff';
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

REVOKE ALL ON FUNCTION public.mp_submit_fixture_lineup(uuid,uuid,uuid,text[],text[])
  FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.mp_submit_fixture_lineup(uuid,uuid,uuid,text[],text[])
  TO authenticated;
REVOKE ALL ON FUNCTION public.mp_advance_fixture(uuid,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.mp_advance_fixture(uuid,uuid) TO authenticated;
