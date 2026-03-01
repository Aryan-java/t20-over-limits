
-- Drop restrictive policies and recreate as permissive
DROP POLICY IF EXISTS "Anyone can view player stats" ON public.player_all_time_stats;
DROP POLICY IF EXISTS "Anyone can insert player stats" ON public.player_all_time_stats;
DROP POLICY IF EXISTS "Anyone can update player stats" ON public.player_all_time_stats;

CREATE POLICY "Anyone can view player stats" ON public.player_all_time_stats FOR SELECT USING (true);
CREATE POLICY "Anyone can insert player stats" ON public.player_all_time_stats FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update player stats" ON public.player_all_time_stats FOR UPDATE USING (true);
