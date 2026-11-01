-- Atomic, service-role-only fixture match commit.
-- Appends the delivery and advances match state/version in one transaction.
-- Depends on the multi-team foundation migration.

CREATE OR REPLACE FUNCTION public.mp_commit_fixture_state(
  p_match uuid,
  p_actor uuid,
  p_expected_version integer,
  p_state jsonb,
  p_status text,
  p_delivery jsonb DEFAULT NULL,
  p_result jsonb DEFAULT NULL,
  p_winner_team uuid DEFAULT NULL
) RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  m public.multiplayer_matches;
  f public.multiplayer_fixtures;
  new_version integer;
  innings_no integer;
  delivery_no integer;
  over_no integer;
  ball_no integer;
  actual_count integer;
BEGIN
  IF p_state IS NULL OR jsonb_typeof(p_state) <> 'object' THEN
    RAISE EXCEPTION 'Match state must be a JSON object';
  END IF;
  IF p_status NOT IN ('ready','live','innings_break','paused','completed','abandoned') THEN
    RAISE EXCEPTION 'Invalid match status';
  END IF;

  SELECT * INTO m FROM public.multiplayer_matches
    WHERE id=p_match FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Match not found'; END IF;
  IF m.version <> p_expected_version THEN
    RAISE EXCEPTION 'Version conflict' USING ERRCODE='40001';
  END IF;
  IF m.status IN ('completed','abandoned') THEN
    RAISE EXCEPTION 'Match is already terminal';
  END IF;

  SELECT * INTO f FROM public.multiplayer_fixtures
    WHERE id=m.fixture_id AND room_id=m.room_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Fixture not found'; END IF;

  IF p_delivery IS NOT NULL THEN
    IF jsonb_typeof(p_delivery) <> 'object' THEN
      RAISE EXCEPTION 'Delivery must be a JSON object';
    END IF;
    BEGIN
      innings_no := (p_delivery->>'innings_number')::integer;
      delivery_no := (p_delivery->>'delivery_number')::integer;
      over_no := (p_delivery->>'over_number')::integer;
      ball_no := (p_delivery->>'ball_in_over')::integer;
    EXCEPTION WHEN OTHERS THEN
      RAISE EXCEPTION 'Delivery sequence fields must be integers';
    END;
    IF innings_no IS NULL OR delivery_no IS NULL OR over_no IS NULL OR ball_no IS NULL\n       OR innings_no NOT IN (1,2) OR delivery_no < 1 OR over_no < 1 OR ball_no NOT BETWEEN 1 AND 6 THEN
      RAISE EXCEPTION 'Invalid delivery sequence';
    END IF;
    IF jsonb_typeof(p_delivery->'payload') <> 'object' THEN
      RAISE EXCEPTION 'Delivery payload must be a JSON object';
    END IF;
    SELECT count(*) INTO actual_count FROM public.multiplayer_deliveries
      WHERE match_id=p_match AND innings_number=innings_no;
    IF delivery_no <> actual_count+1 THEN
      RAISE EXCEPTION 'Delivery sequence conflict; expected %, received %',actual_count+1,delivery_no
        USING ERRCODE='40001';
    END IF;
    INSERT INTO public.multiplayer_deliveries(
      match_id,innings_number,delivery_number,over_number,ball_in_over,payload
    ) VALUES (
      p_match,innings_no,delivery_no,over_no,ball_no,p_delivery->'payload'
    );
  END IF;

  IF p_status='completed' THEN
    IF p_result IS NULL OR jsonb_typeof(p_result) <> 'object' THEN
      RAISE EXCEPTION 'Completed matches require a result object';
    END IF;
    IF p_winner_team IS NOT NULL AND p_winner_team NOT IN (f.home_team_id,f.away_team_id) THEN
      RAISE EXCEPTION 'Winner must be one of the fixture teams';
    END IF;
    UPDATE public.multiplayer_fixtures
      SET status='completed', winner_team_id=p_winner_team,
          result=p_result, completed_at=now()
      WHERE id=f.id;
  ELSIF p_status='abandoned' THEN
    UPDATE public.multiplayer_fixtures
      SET status='cancelled', result=coalesce(p_result,'{}'::jsonb), completed_at=now()
      WHERE id=f.id;
  END IF;

  UPDATE public.multiplayer_matches
    SET state=p_state, status=p_status, version=version+1, updated_at=now(),
        completed_at=CASE WHEN p_status IN ('completed','abandoned') THEN now() ELSE completed_at END
    WHERE id=p_match AND version=p_expected_version
    RETURNING version INTO new_version;
  IF new_version IS NULL THEN
    RAISE EXCEPTION 'Version conflict' USING ERRCODE='40001';
  END IF;

  INSERT INTO public.multiplayer_events(room_id,actor_user_id,type,payload)
    VALUES (
      m.room_id,p_actor,'fixture_match_committed',
      jsonb_build_object('match_id',p_match,'fixture_id',f.id,'version',new_version,
        'status',p_status,'delivery',p_delivery,'result',p_result)
    );
  RETURN new_version;
END $$;

REVOKE ALL ON FUNCTION public.mp_commit_fixture_state(uuid,uuid,integer,jsonb,text,jsonb,jsonb,uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mp_commit_fixture_state(uuid,uuid,integer,jsonb,text,jsonb,jsonb,uuid)
  TO service_role;
