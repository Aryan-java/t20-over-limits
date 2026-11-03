-- Additive foundation for multi-team multiplayer tournaments.
-- Existing A/B columns, RPCs, and room-scoped match state remain untouched.
-- This migration adds normalized entities for gradual fixture-based expansion.

ALTER TABLE public.multiplayer_rooms
  ADD COLUMN IF NOT EXISTS max_members integer NOT NULL DEFAULT 50
  CHECK (max_members BETWEEN 2 AND 100);

CREATE TABLE public.multiplayer_teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.multiplayer_rooms(id) ON DELETE CASCADE,
  name varchar(60) NOT NULL CHECK (length(btrim(name)) BETWEEN 1 AND 60),
  squad jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(squad) = 'array'),
  status text NOT NULL DEFAULT 'building'
    CHECK (status IN ('building', 'ready', 'locked', 'eliminated')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (room_id, id),
  UNIQUE (room_id, name)
);
CREATE INDEX idx_mp_teams_room ON public.multiplayer_teams(room_id, created_at);

CREATE TABLE public.multiplayer_team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL,
  team_id uuid NOT NULL,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'owner' CHECK (role IN ('owner', 'manager')),
  joined_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (room_id, team_id)
    REFERENCES public.multiplayer_teams(room_id, id) ON DELETE CASCADE,
  FOREIGN KEY (room_id, user_id)
    REFERENCES public.multiplayer_room_members(room_id, user_id) ON DELETE CASCADE,
  UNIQUE (team_id, user_id)
);
CREATE UNIQUE INDEX uq_mp_team_single_owner
  ON public.multiplayer_team_members(team_id) WHERE role = 'owner';
CREATE UNIQUE INDEX uq_mp_team_owner_per_room
  ON public.multiplayer_team_members(room_id, user_id) WHERE role = 'owner';
CREATE INDEX idx_mp_team_members_user
  ON public.multiplayer_team_members(room_id, user_id);

CREATE TABLE public.multiplayer_tournaments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.multiplayer_rooms(id) ON DELETE CASCADE,
  name varchar(80) NOT NULL CHECK (length(btrim(name)) BETWEEN 1 AND 80),
  format text NOT NULL DEFAULT 'round_robin'
    CHECK (format IN ('round_robin', 'single_elimination', 'double_elimination')),
  status text NOT NULL DEFAULT 'setup'
    CHECK (status IN ('setup', 'ready', 'live', 'completed', 'cancelled')),
  settings jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(settings) = 'object'),
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (room_id, id)
);
CREATE INDEX idx_mp_tournaments_room
  ON public.multiplayer_tournaments(room_id, created_at DESC);

CREATE TABLE public.multiplayer_tournament_teams (
  room_id uuid NOT NULL,
  tournament_id uuid NOT NULL,
  team_id uuid NOT NULL,
  seed integer CHECK (seed IS NULL OR seed > 0),
  group_name varchar(32),
  joined_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tournament_id, team_id),
  FOREIGN KEY (room_id, tournament_id)
    REFERENCES public.multiplayer_tournaments(room_id, id) ON DELETE CASCADE,
  FOREIGN KEY (room_id, team_id)
    REFERENCES public.multiplayer_teams(room_id, id) ON DELETE CASCADE
);
CREATE INDEX idx_mp_tournament_teams_room
  ON public.multiplayer_tournament_teams(room_id, tournament_id);

CREATE TABLE public.multiplayer_fixtures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL,
  tournament_id uuid NOT NULL,
  round_number integer NOT NULL CHECK (round_number > 0),
  fixture_number integer NOT NULL CHECK (fixture_number > 0),
  home_team_id uuid NOT NULL,
  away_team_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'scheduled'
    CHECK (status IN ('scheduled', 'ready', 'live', 'completed', 'forfeit', 'cancelled')),
  winner_team_id uuid,
  result jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(result) = 'object'),
  scheduled_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (home_team_id <> away_team_id),
  UNIQUE (room_id, id),
  UNIQUE (tournament_id, round_number, fixture_number),
  FOREIGN KEY (room_id, tournament_id)
    REFERENCES public.multiplayer_tournaments(room_id, id) ON DELETE CASCADE,
  FOREIGN KEY (room_id, home_team_id)
    REFERENCES public.multiplayer_teams(room_id, id),
  FOREIGN KEY (room_id, away_team_id)
    REFERENCES public.multiplayer_teams(room_id, id),
  FOREIGN KEY (room_id, winner_team_id)
    REFERENCES public.multiplayer_teams(room_id, id)
);
CREATE INDEX idx_mp_fixtures_tournament_order
  ON public.multiplayer_fixtures(tournament_id, round_number, fixture_number);
CREATE INDEX idx_mp_fixtures_status ON public.multiplayer_fixtures(status);

CREATE TABLE public.multiplayer_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL,
  fixture_id uuid NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'ready'
    CHECK (status IN ('ready', 'live', 'innings_break', 'paused', 'completed', 'abandoned')),
  version integer NOT NULL DEFAULT 0 CHECK (version >= 0),
  settings jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(settings) = 'object'),
  state jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(state) = 'object'),
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (room_id, id),
  FOREIGN KEY (room_id, fixture_id)
    REFERENCES public.multiplayer_fixtures(room_id, id) ON DELETE CASCADE
);
CREATE INDEX idx_mp_matches_room_status
  ON public.multiplayer_matches(room_id, status);

CREATE TABLE public.multiplayer_deliveries (
  id bigserial PRIMARY KEY,
  match_id uuid NOT NULL REFERENCES public.multiplayer_matches(id) ON DELETE CASCADE,
  innings_number smallint NOT NULL CHECK (innings_number IN (1, 2)),
  delivery_number integer NOT NULL CHECK (delivery_number > 0),
  over_number integer NOT NULL CHECK (over_number > 0),
  ball_in_over smallint NOT NULL CHECK (ball_in_over BETWEEN 1 AND 6),
  payload jsonb NOT NULL CHECK (jsonb_typeof(payload) = 'object'),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (match_id, innings_number, delivery_number)
);
CREATE INDEX idx_mp_deliveries_match_order
  ON public.multiplayer_deliveries(match_id, innings_number, delivery_number);

-- Room members can read the new entities. Writes are deliberately reserved
-- for trusted RPCs / the service-role engine until authorization is implemented.
ALTER TABLE public.multiplayer_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.multiplayer_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.multiplayer_tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.multiplayer_tournament_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.multiplayer_fixtures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.multiplayer_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.multiplayer_deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members view tournament teams"
  ON public.multiplayer_teams FOR SELECT TO authenticated
  USING (public.mp_is_member(room_id, auth.uid()));
CREATE POLICY "members view team memberships"
  ON public.multiplayer_team_members FOR SELECT TO authenticated
  USING (public.mp_is_member(room_id, auth.uid()));
CREATE POLICY "members view tournaments"
  ON public.multiplayer_tournaments FOR SELECT TO authenticated
  USING (public.mp_is_member(room_id, auth.uid()));
CREATE POLICY "members view tournament team entries"
  ON public.multiplayer_tournament_teams FOR SELECT TO authenticated
  USING (public.mp_is_member(room_id, auth.uid()));
CREATE POLICY "members view fixtures"
  ON public.multiplayer_fixtures FOR SELECT TO authenticated
  USING (public.mp_is_member(room_id, auth.uid()));
CREATE POLICY "members view matches"
  ON public.multiplayer_matches FOR SELECT TO authenticated
  USING (public.mp_is_member(room_id, auth.uid()));
CREATE POLICY "members view deliveries"
  ON public.multiplayer_deliveries FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.multiplayer_matches m
    WHERE m.id = match_id AND public.mp_is_member(m.room_id, auth.uid())
  ));

GRANT SELECT ON public.multiplayer_teams, public.multiplayer_team_members,
  public.multiplayer_tournaments, public.multiplayer_tournament_teams,
  public.multiplayer_fixtures, public.multiplayer_matches,
  public.multiplayer_deliveries TO authenticated;
GRANT ALL ON public.multiplayer_teams, public.multiplayer_team_members,
  public.multiplayer_tournaments, public.multiplayer_tournament_teams,
  public.multiplayer_fixtures, public.multiplayer_matches,
  public.multiplayer_deliveries TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.multiplayer_deliveries_id_seq TO service_role;

-- No authenticated INSERT/UPDATE/DELETE policies are created in this phase.
-- Secure, ownership-aware RPCs will be added before the UI writes these tables.
