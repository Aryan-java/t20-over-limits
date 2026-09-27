ALTER FUNCTION public.mp_clean_name(text) SET search_path = public;
ALTER FUNCTION public.mp_validate_team(jsonb) SET search_path = public;
REVOKE ALL ON FUNCTION public.mp_is_member(uuid,uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.mp_side_of(uuid,uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mp_is_member(uuid,uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mp_side_of(uuid,uuid) TO authenticated;
REVOKE ALL ON FUNCTION public.mp_require_uid() FROM PUBLIC, anon;