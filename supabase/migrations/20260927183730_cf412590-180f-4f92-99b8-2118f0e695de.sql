
CREATE TABLE public.multiplayer_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code varchar(6) NOT NULL UNIQUE CHECK (code ~ '^[A-HJ-NP-Z2-9]{6}$'),
  host_user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'lobby' CHECK (status IN ('lobby','ready','live','innings_break','paused','completed')),
  paused_from text,
  settings jsonb NOT NULL DEFAULT '{"overs":20}'::jsonb,
  team_a jsonb,
  team_b jsonb,
  setups jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_mp_rooms_status ON public.multiplayer_rooms(status);
CREATE INDEX idx_mp_rooms_host ON public.multiplayer_rooms(host_user_id);

CREATE TABLE public.multiplayer_room_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.multiplayer_rooms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  display_name varchar(32) NOT NULL,
  role text NOT NULL DEFAULT 'unassigned' CHECK (role IN ('team_owner','spectator','unassigned')),
  team_side char(1) CHECK (team_side IN ('A','B')),
  ready boolean NOT NULL DEFAULT false,
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (room_id, user_id),
  CHECK ((role = 'team_owner') = (team_side IS NOT NULL))
);
CREATE UNIQUE INDEX uq_mp_team_owner ON public.multiplayer_room_members(room_id, team_side) WHERE team_side IS NOT NULL;
CREATE INDEX idx_mp_members_user ON public.multiplayer_room_members(user_id);

CREATE TABLE public.multiplayer_match_state (
  room_id uuid PRIMARY KEY REFERENCES public.multiplayer_rooms(id) ON DELETE CASCADE,
  version integer NOT NULL DEFAULT 0,
  state jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.multiplayer_pending_decisions (
  room_id uuid NOT NULL REFERENCES public.multiplayer_rooms(id) ON DELETE CASCADE,
  side char(1) NOT NULL CHECK (side IN ('A','B')),
  kind text NOT NULL CHECK (kind IN ('batting','bowling')),
  version integer NOT NULL,
  payload jsonb NOT NULL,
  submitted_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (room_id, kind)
);

CREATE TABLE public.multiplayer_events (
  id bigserial PRIMARY KEY,
  room_id uuid NOT NULL REFERENCES public.multiplayer_rooms(id) ON DELETE CASCADE,
  actor_user_id uuid,
  type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_mp_events_room ON public.multiplayer_events(room_id, id DESC);

CREATE TABLE public.multiplayer_room_secrets (
  room_id uuid PRIMARY KEY REFERENCES public.multiplayer_rooms(id) ON DELETE CASCADE,
  seed text NOT NULL DEFAULT replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '')
);

GRANT SELECT ON public.multiplayer_rooms, public.multiplayer_room_members, public.multiplayer_match_state, public.multiplayer_pending_decisions, public.multiplayer_events TO authenticated;
GRANT ALL ON public.multiplayer_rooms, public.multiplayer_room_members, public.multiplayer_match_state, public.multiplayer_pending_decisions, public.multiplayer_events, public.multiplayer_room_secrets TO service_role;
GRANT USAGE ON SEQUENCE public.multiplayer_events_id_seq TO service_role;

ALTER TABLE public.multiplayer_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.multiplayer_room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.multiplayer_match_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.multiplayer_pending_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.multiplayer_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.multiplayer_room_secrets ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.mp_is_member(_room uuid, _uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM multiplayer_room_members WHERE room_id=_room AND user_id=_uid)
$$;
CREATE OR REPLACE FUNCTION public.mp_side_of(_room uuid, _uid uuid)
RETURNS char LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT team_side FROM multiplayer_room_members WHERE room_id=_room AND user_id=_uid AND role='team_owner'
$$;

CREATE POLICY "members view room" ON public.multiplayer_rooms FOR SELECT TO authenticated USING (public.mp_is_member(id, auth.uid()));
CREATE POLICY "members view members" ON public.multiplayer_room_members FOR SELECT TO authenticated USING (public.mp_is_member(room_id, auth.uid()));
CREATE POLICY "members view state" ON public.multiplayer_match_state FOR SELECT TO authenticated USING (public.mp_is_member(room_id, auth.uid()));
CREATE POLICY "members view events" ON public.multiplayer_events FOR SELECT TO authenticated USING (public.mp_is_member(room_id, auth.uid()));
CREATE POLICY "own side decisions only" ON public.multiplayer_pending_decisions FOR SELECT TO authenticated USING (public.mp_side_of(room_id, auth.uid()) = side);

CREATE TRIGGER trg_mp_rooms_updated BEFORE UPDATE ON public.multiplayer_rooms FOR EACH ROW EXECUTE FUNCTION public.update_player_stats_updated_at();

-- helpers
CREATE OR REPLACE FUNCTION public.mp_require_uid() RETURNS uuid LANGUAGE plpgsql STABLE SET search_path = public AS $$
DECLARE u uuid := auth.uid();
BEGIN IF u IS NULL THEN RAISE EXCEPTION 'Not authenticated' USING ERRCODE='42501'; END IF; RETURN u; END $$;

CREATE OR REPLACE FUNCTION public.mp_require_host(_room uuid) RETURNS public.multiplayer_rooms
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r multiplayer_rooms; u uuid := mp_require_uid();
BEGIN
  SELECT * INTO r FROM multiplayer_rooms WHERE id=_room FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Room not found'; END IF;
  IF r.host_user_id <> u THEN RAISE EXCEPTION 'Only the host can do this' USING ERRCODE='42501'; END IF;
  RETURN r;
END $$;

CREATE OR REPLACE FUNCTION public.mp_log(_room uuid, _type text, _payload jsonb DEFAULT '{}'::jsonb)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  INSERT INTO multiplayer_events(room_id, actor_user_id, type, payload) VALUES (_room, auth.uid(), _type, _payload)
$$;

CREATE OR REPLACE FUNCTION public.mp_clean_name(_n text) RETURNS text LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE n text := btrim(coalesce(_n,''));
BEGIN
  IF length(n) < 1 OR length(n) > 32 THEN RAISE EXCEPTION 'Display name must be 1-32 characters'; END IF;
  RETURN n;
END $$;

-- create room
CREATE OR REPLACE FUNCTION public.mp_create_room(p_display_name text, p_overs integer DEFAULT 20)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE u uuid := mp_require_uid(); c text; rid uuid; alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; i int; n text := mp_clean_name(p_display_name);
BEGIN
  IF p_overs NOT IN (2,5,10,20) THEN RAISE EXCEPTION 'Overs must be 2, 5, 10 or 20'; END IF;
  LOOP
    c := '';
    FOR i IN 1..6 LOOP c := c || substr(alphabet, 1 + floor(random()*32)::int, 1); END LOOP;
    EXIT WHEN NOT EXISTS (SELECT 1 FROM multiplayer_rooms WHERE code=c);
  END LOOP;
  INSERT INTO multiplayer_rooms(code, host_user_id, settings) VALUES (c, u, jsonb_build_object('overs', p_overs)) RETURNING id INTO rid;
  INSERT INTO multiplayer_room_secrets(room_id) VALUES (rid);
  INSERT INTO multiplayer_match_state(room_id) VALUES (rid);
  INSERT INTO multiplayer_room_members(room_id, user_id, display_name, role) VALUES (rid, u, n, 'unassigned');
  PERFORM mp_log(rid, 'room_created', jsonb_build_object('name', n));
  RETURN json_build_object('id', rid, 'code', c);
END $$;

CREATE OR REPLACE FUNCTION public.mp_join_room(p_code text, p_display_name text)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE u uuid := mp_require_uid(); r multiplayer_rooms; n text := mp_clean_name(p_display_name);
BEGIN
  SELECT * INTO r FROM multiplayer_rooms WHERE code = upper(btrim(coalesce(p_code,'')));
  IF NOT FOUND THEN RAISE EXCEPTION 'Room not found'; END IF;
  IF NOT EXISTS (SELECT 1 FROM multiplayer_room_members WHERE room_id=r.id AND user_id=u) THEN
    IF (SELECT count(*) FROM multiplayer_room_members WHERE room_id=r.id) >= 50 THEN RAISE EXCEPTION 'Room is full'; END IF;
    INSERT INTO multiplayer_room_members(room_id, user_id, display_name, role)
      VALUES (r.id, u, n, CASE WHEN r.status IN ('lobby','ready') THEN 'unassigned' ELSE 'spectator' END);
    PERFORM mp_log(r.id, 'member_joined', jsonb_build_object('name', n));
  END IF;
  RETURN json_build_object('id', r.id, 'code', r.code);
END $$;

CREATE OR REPLACE FUNCTION public.mp_leave_room(p_room uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE u uuid := mp_require_uid(); r multiplayer_rooms; nxt uuid;
BEGIN
  SELECT * INTO r FROM multiplayer_rooms WHERE id=p_room FOR UPDATE;
  IF NOT FOUND OR NOT mp_is_member(p_room,u) THEN RAISE EXCEPTION 'Not a member'; END IF;
  IF r.status IN ('live','innings_break','paused') AND mp_side_of(p_room,u) IS NOT NULL THEN
    RAISE EXCEPTION 'Team owners cannot leave a live match (host can reassign)';
  END IF;
  DELETE FROM multiplayer_room_members WHERE room_id=p_room AND user_id=u;
  IF r.host_user_id = u THEN
    SELECT user_id INTO nxt FROM multiplayer_room_members WHERE room_id=p_room ORDER BY joined_at LIMIT 1;
    IF nxt IS NULL THEN DELETE FROM multiplayer_rooms WHERE id=p_room; RETURN; END IF;
    UPDATE multiplayer_rooms SET host_user_id=nxt WHERE id=p_room;
  END IF;
  PERFORM mp_log(p_room, 'member_left', '{}'::jsonb);
END $$;

CREATE OR REPLACE FUNCTION public.mp_validate_team(t jsonb) RETURNS void LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE p jsonb;
BEGIN
  IF t IS NULL OR jsonb_typeof(t) <> 'object' OR coalesce(length(t->>'name'),0) NOT BETWEEN 1 AND 60 THEN RAISE EXCEPTION 'Invalid team'; END IF;
  IF jsonb_typeof(t->'squad') <> 'array' OR jsonb_array_length(t->'squad') NOT BETWEEN 11 AND 40 THEN RAISE EXCEPTION 'Squad must have 11-40 players'; END IF;
  FOR p IN SELECT * FROM jsonb_array_elements(t->'squad') LOOP
    IF coalesce(length(p->>'id'),0) NOT BETWEEN 1 AND 80 OR coalesce(length(p->>'name'),0) NOT BETWEEN 1 AND 80
       OR (p->>'batSkill')::numeric NOT BETWEEN 0 AND 100 OR (p->>'bowlSkill')::numeric NOT BETWEEN 0 AND 100 THEN
      RAISE EXCEPTION 'Invalid player in squad';
    END IF;
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.mp_set_teams(p_room uuid, p_team_a jsonb, p_team_b jsonb)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r multiplayer_rooms := mp_require_host(p_room);
BEGIN
  IF r.status NOT IN ('lobby','ready') THEN RAISE EXCEPTION 'Teams can only change in the lobby'; END IF;
  PERFORM mp_validate_team(p_team_a); PERFORM mp_validate_team(p_team_b);
  UPDATE multiplayer_rooms SET team_a=p_team_a, team_b=p_team_b, setups='{}'::jsonb, status='lobby' WHERE id=p_room;
  UPDATE multiplayer_room_members SET ready=false WHERE room_id=p_room;
  PERFORM mp_log(p_room, 'teams_selected', jsonb_build_object('A', p_team_a->>'name', 'B', p_team_b->>'name'));
END $$;

CREATE OR REPLACE FUNCTION public.mp_assign_member(p_room uuid, p_user uuid, p_role text, p_side text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r multiplayer_rooms := mp_require_host(p_room); nm text;
BEGIN
  IF p_role NOT IN ('team_owner','spectator','unassigned') THEN RAISE EXCEPTION 'Invalid role'; END IF;
  IF p_role = 'team_owner' AND (p_side IS NULL OR p_side NOT IN ('A','B')) THEN RAISE EXCEPTION 'Team side required'; END IF;
  IF p_role <> 'team_owner' THEN p_side := NULL; END IF;
  IF r.status = 'completed' THEN RAISE EXCEPTION 'Match completed'; END IF;
  SELECT display_name INTO nm FROM multiplayer_room_members WHERE room_id=p_room AND user_id=p_user;
  IF nm IS NULL THEN RAISE EXCEPTION 'User is not in this room'; END IF;
  IF p_side IS NOT NULL THEN
    UPDATE multiplayer_room_members SET role='unassigned', team_side=NULL, ready=false
      WHERE room_id=p_room AND team_side=p_side AND user_id<>p_user;
  END IF;
  UPDATE multiplayer_room_members SET role=p_role, team_side=p_side, ready=false WHERE room_id=p_room AND user_id=p_user;
  PERFORM mp_log(p_room, 'member_assigned', jsonb_build_object('name', nm, 'role', p_role, 'side', p_side));
END $$;

CREATE OR REPLACE FUNCTION public.mp_kick_member(p_room uuid, p_user uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r multiplayer_rooms := mp_require_host(p_room); nm text;
BEGIN
  IF p_user = r.host_user_id THEN RAISE EXCEPTION 'Host cannot kick themselves'; END IF;
  DELETE FROM multiplayer_room_members WHERE room_id=p_room AND user_id=p_user RETURNING display_name INTO nm;
  IF nm IS NULL THEN RAISE EXCEPTION 'User is not in this room'; END IF;
  PERFORM mp_log(p_room, 'member_kicked', jsonb_build_object('name', nm));
END $$;

CREATE OR REPLACE FUNCTION public.mp_transfer_host(p_room uuid, p_user uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r multiplayer_rooms := mp_require_host(p_room); nm text;
BEGIN
  SELECT display_name INTO nm FROM multiplayer_room_members WHERE room_id=p_room AND user_id=p_user;
  IF nm IS NULL THEN RAISE EXCEPTION 'User is not in this room'; END IF;
  UPDATE multiplayer_rooms SET host_user_id=p_user WHERE id=p_room;
  PERFORM mp_log(p_room, 'host_transferred', jsonb_build_object('name', nm));
END $$;

CREATE OR REPLACE FUNCTION public.mp_submit_team_setup(p_room uuid, p_xi text[], p_impact text[])
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE u uuid := mp_require_uid(); r multiplayer_rooms; s char; team jsonb; ids text[]; overseas int;
BEGIN
  SELECT * INTO r FROM multiplayer_rooms WHERE id=p_room FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Room not found'; END IF;
  s := mp_side_of(p_room, u);
  IF s IS NULL THEN RAISE EXCEPTION 'Only a team owner can set up a team' USING ERRCODE='42501'; END IF;
  IF r.status NOT IN ('lobby','ready') THEN RAISE EXCEPTION 'Setup is locked'; END IF;
  team := CASE WHEN s='A' THEN r.team_a ELSE r.team_b END;
  IF team IS NULL THEN RAISE EXCEPTION 'Host has not selected teams yet'; END IF;
  SELECT array_agg(p->>'id') INTO ids FROM jsonb_array_elements(team->'squad') p;
  p_impact := coalesce(p_impact, '{}');
  IF coalesce(array_length(p_xi,1),0) <> 11 OR (SELECT count(DISTINCT x) FROM unnest(p_xi) x) <> 11 THEN RAISE EXCEPTION 'Pick exactly 11 unique players'; END IF;
  IF coalesce(array_length(p_impact,1),0) > 4 OR (SELECT count(DISTINCT x) FROM unnest(p_impact) x) <> coalesce(array_length(p_impact,1),0) THEN RAISE EXCEPTION 'Up to 4 unique impact players'; END IF;
  IF NOT (p_xi <@ ids) OR NOT (p_impact <@ ids) OR (p_xi && p_impact) THEN RAISE EXCEPTION 'Players must be from your squad and not in both lists'; END IF;
  SELECT count(*) INTO overseas FROM jsonb_array_elements(team->'squad') p WHERE (p->>'id') = ANY(p_xi) AND coalesce((p->>'isOverseas')::boolean,false);
  IF overseas > 4 THEN RAISE EXCEPTION 'Max 4 overseas players in the XI'; END IF;
  UPDATE multiplayer_rooms SET setups = setups || jsonb_build_object(s, jsonb_build_object('xi', to_jsonb(p_xi), 'impact', to_jsonb(p_impact))) WHERE id=p_room;
  UPDATE multiplayer_room_members SET ready=true WHERE room_id=p_room AND user_id=u;
  PERFORM mp_log(p_room, 'team_ready', jsonb_build_object('side', s));
END $$;

CREATE OR REPLACE FUNCTION public.mp_submit_decision(p_room uuid, p_kind text, p_payload jsonb, p_expected_version integer)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE u uuid := mp_require_uid(); r multiplayer_rooms; ms multiplayer_match_state; s char; bat char; req char; k text; xi jsonb; inn jsonb;
BEGIN
  SELECT * INTO r FROM multiplayer_rooms WHERE id=p_room;
  IF NOT FOUND THEN RAISE EXCEPTION 'Room not found'; END IF;
  IF r.status <> 'live' THEN RAISE EXCEPTION 'Match is not live'; END IF;
  SELECT * INTO ms FROM multiplayer_match_state WHERE room_id=p_room;
  IF ms.version <> p_expected_version THEN RAISE EXCEPTION 'Stale version' USING ERRCODE='40001'; END IF;
  s := mp_side_of(p_room, u);
  IF s IS NULL THEN RAISE EXCEPTION 'Only team owners can submit decisions' USING ERRCODE='42501'; END IF;
  inn := ms.state->'innings'->((ms.state->>'current')::int);
  bat := inn->>'battingSide';
  IF p_kind = 'batting' THEN req := bat;
  ELSIF p_kind = 'bowling' THEN req := CASE WHEN bat='A' THEN 'B' ELSE 'A' END;
  ELSE RAISE EXCEPTION 'Invalid decision kind'; END IF;
  IF s <> req THEN RAISE EXCEPTION 'You do not control the % side right now', p_kind USING ERRCODE='42501'; END IF;
  IF jsonb_typeof(p_payload) <> 'object' THEN RAISE EXCEPTION 'Invalid payload'; END IF;
  IF p_kind = 'batting' THEN
    IF jsonb_typeof(p_payload->'aggression') <> 'number' OR (p_payload->>'aggression')::numeric NOT BETWEEN 0 AND 100 THEN RAISE EXCEPTION 'Aggression must be 0-100'; END IF;
    p_payload := jsonb_build_object('aggression', round((p_payload->>'aggression')::numeric));
  ELSE
    IF coalesce(p_payload->>'field','') NOT IN ('attacking','balanced','defensive','death') THEN RAISE EXCEPTION 'Invalid field preset'; END IF;
    FOREACH k IN ARRAY ARRAY['normal','yorker','bouncer','slower','knuckle'] LOOP
      IF jsonb_typeof(p_payload->'strategy'->k) <> 'number' OR (p_payload->'strategy'->>k)::numeric NOT BETWEEN 0 AND 100 THEN RAISE EXCEPTION 'Invalid bowling strategy'; END IF;
    END LOOP;
    xi := r.setups->req->'xi';
    IF NOT (xi ? coalesce(p_payload->>'bowlerId','')) THEN RAISE EXCEPTION 'Bowler must be in your XI'; END IF;
    p_payload := jsonb_build_object('field', p_payload->'field', 'bowlerId', p_payload->'bowlerId',
      'strategy', jsonb_build_object('normal',p_payload->'strategy'->'normal','yorker',p_payload->'strategy'->'yorker','bouncer',p_payload->'strategy'->'bouncer','slower',p_payload->'strategy'->'slower','knuckle',p_payload->'strategy'->'knuckle'));
  END IF;
  INSERT INTO multiplayer_pending_decisions(room_id, side, kind, version, payload, submitted_by)
    VALUES (p_room, s, p_kind, p_expected_version, p_payload, u)
    ON CONFLICT (room_id, kind) DO UPDATE SET side=EXCLUDED.side, version=EXCLUDED.version, payload=EXCLUDED.payload, submitted_by=EXCLUDED.submitted_by, created_at=now();
  PERFORM mp_log(p_room, 'decision_submitted', jsonb_build_object('side', s, 'kind', p_kind, 'version', p_expected_version));
END $$;

CREATE OR REPLACE FUNCTION public.mp_decision_status(p_room uuid)
RETURNS json LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE v int;
BEGIN
  IF NOT mp_is_member(p_room, auth.uid()) THEN RAISE EXCEPTION 'Not a member' USING ERRCODE='42501'; END IF;
  SELECT version INTO v FROM multiplayer_match_state WHERE room_id=p_room;
  RETURN json_build_object('version', v,
    'batting', EXISTS (SELECT 1 FROM multiplayer_pending_decisions WHERE room_id=p_room AND kind='batting' AND version=v),
    'bowling', EXISTS (SELECT 1 FROM multiplayer_pending_decisions WHERE room_id=p_room AND kind='bowling' AND version=v));
END $$;

CREATE OR REPLACE FUNCTION public.mp_set_paused(p_room uuid, p_paused boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE u uuid := mp_require_uid(); r multiplayer_rooms;
BEGIN
  SELECT * INTO r FROM multiplayer_rooms WHERE id=p_room FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Room not found'; END IF;
  IF r.host_user_id <> u AND mp_side_of(p_room,u) IS NULL THEN RAISE EXCEPTION 'Only host or team owners can pause' USING ERRCODE='42501'; END IF;
  IF p_paused THEN
    IF r.status NOT IN ('live','innings_break') THEN RAISE EXCEPTION 'Nothing to pause'; END IF;
    UPDATE multiplayer_rooms SET paused_from=status, status='paused' WHERE id=p_room;
    PERFORM mp_log(p_room, 'paused', '{}'::jsonb);
  ELSE
    IF r.status <> 'paused' THEN RAISE EXCEPTION 'Match is not paused'; END IF;
    UPDATE multiplayer_rooms SET status=coalesce(paused_from,'live'), paused_from=NULL WHERE id=p_room;
    PERFORM mp_log(p_room, 'resumed', '{}'::jsonb);
  END IF;
END $$;

-- service-role only: atomic version-guarded commit
CREATE OR REPLACE FUNCTION public.mp_commit_state(p_room uuid, p_actor uuid, p_expected_version integer, p_state jsonb, p_status text, p_event_type text, p_event jsonb)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE nv int;
BEGIN
  UPDATE multiplayer_match_state SET state=p_state, version=version+1, updated_at=now()
    WHERE room_id=p_room AND version=p_expected_version RETURNING version INTO nv;
  IF nv IS NULL THEN RAISE EXCEPTION 'Version conflict' USING ERRCODE='40001'; END IF;
  UPDATE multiplayer_rooms SET status=p_status WHERE id=p_room;
  DELETE FROM multiplayer_pending_decisions WHERE room_id=p_room;
  INSERT INTO multiplayer_events(room_id, actor_user_id, type, payload) VALUES (p_room, p_actor, p_event_type, p_event || jsonb_build_object('version', nv));
  RETURN nv;
END $$;

REVOKE ALL ON FUNCTION public.mp_commit_state(uuid,uuid,integer,jsonb,text,text,jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mp_commit_state(uuid,uuid,integer,jsonb,text,text,jsonb) TO service_role;
REVOKE ALL ON FUNCTION public.mp_log(uuid,text,jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.mp_require_host(uuid) FROM PUBLIC, anon, authenticated;
DO $$ DECLARE f text; BEGIN
  FOREACH f IN ARRAY ARRAY['mp_create_room(text,integer)','mp_join_room(text,text)','mp_leave_room(uuid)','mp_set_teams(uuid,jsonb,jsonb)','mp_assign_member(uuid,uuid,text,text)','mp_kick_member(uuid,uuid)','mp_transfer_host(uuid,uuid)','mp_submit_team_setup(uuid,text[],text[])','mp_submit_decision(uuid,text,jsonb,integer)','mp_decision_status(uuid)','mp_set_paused(uuid,boolean)'] LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION public.%s FROM PUBLIC, anon', f);
    EXECUTE format('GRANT EXECUTE ON FUNCTION public.%s TO authenticated', f);
  END LOOP;
END $$;

ALTER PUBLICATION supabase_realtime ADD TABLE public.multiplayer_rooms, public.multiplayer_room_members, public.multiplayer_match_state, public.multiplayer_events;
