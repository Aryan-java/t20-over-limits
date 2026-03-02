
-- Drop the restrictive policies
DROP POLICY IF EXISTS "Anyone can view player stats" ON public.player_all_time_stats;
DROP POLICY IF EXISTS "Anyone can insert player stats" ON public.player_all_time_stats;
DROP POLICY IF EXISTS "Anyone can update player stats" ON public.player_all_time_stats;

-- Recreate as permissive policies
CREATE POLICY "Anyone can view player stats"
ON public.player_all_time_stats
FOR SELECT
USING (true);

CREATE POLICY "Anyone can insert player stats"
ON public.player_all_time_stats
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update player stats"
ON public.player_all_time_stats
FOR UPDATE
USING (true);

CREATE POLICY "Anyone can delete player stats"
ON public.player_all_time_stats
FOR DELETE
USING (true);
