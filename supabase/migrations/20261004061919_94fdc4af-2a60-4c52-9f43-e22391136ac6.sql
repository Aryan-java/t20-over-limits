CREATE OR REPLACE FUNCTION public.mp_set_my_squad(p_room uuid, p_team jsonb)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE u uuid := mp_require_uid(); r multiplayer_rooms; s char; n int; ov int; uniq int;
BEGIN
  SELECT * INTO r FROM multiplayer_rooms WHERE id=p_room FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Room not found'; END IF;
  s := mp_side_of(p_room, u);
  IF s IS NULL THEN RAISE EXCEPTION 'Only a team owner can build a squad' USING ERRCODE='42501'; END IF;
  IF r.status NOT IN ('lobby','ready') THEN RAISE EXCEPTION 'Squads are locked once the match starts'; END IF;
  PERFORM mp_validate_team(p_team);
  n := jsonb_array_length(p_team->'squad');
  IF n < 18 OR n > 25 THEN RAISE EXCEPTION 'Squad must have 18-25 players'; END IF;
  SELECT count(DISTINCT p->>'id'), count(*) FILTER (WHERE coalesce((p->>'isOverseas')::boolean,false))
    INTO uniq, ov FROM jsonb_array_elements(p_team->'squad') p;
  IF uniq <> n THEN RAISE EXCEPTION 'Duplicate players in squad'; END IF;
  IF ov > 8 THEN RAISE EXCEPTION 'Maximum 8 overseas players in squad'; END IF;
  IF s = 'A' THEN UPDATE multiplayer_rooms SET team_a=p_team, setups = setups - 'A', status='lobby' WHERE id=p_room;
  ELSE UPDATE multiplayer_rooms SET team_b=p_team, setups = setups - 'B', status='lobby' WHERE id=p_room; END IF;
  UPDATE multiplayer_room_members SET ready=false WHERE room_id=p_room AND user_id=u;
  PERFORM mp_log(p_room, 'squad_built', jsonb_build_object('side', s, 'name', p_team->>'name', 'players', n));
END $$;
REVOKE ALL ON FUNCTION public.mp_set_my_squad(uuid,jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mp_set_my_squad(uuid,jsonb) TO authenticated;