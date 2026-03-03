
CREATE TABLE public.player_all_time_stats (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id text NOT NULL,
  player_name text NOT NULL,
  team_name text,
  image_url text,
  matches_batted integer NOT NULL DEFAULT 0,
  total_runs integer NOT NULL DEFAULT 0,
  balls_faced integer NOT NULL DEFAULT 0,
  highest_score integer NOT NULL DEFAULT 0,
  fifties integer NOT NULL DEFAULT 0,
  hundreds integer NOT NULL DEFAULT 0,
  fours integer NOT NULL DEFAULT 0,
  sixes integer NOT NULL DEFAULT 0,
  not_outs integer NOT NULL DEFAULT 0,
  matches_bowled integer NOT NULL DEFAULT 0,
  total_wickets integer NOT NULL DEFAULT 0,
  balls_bowled integer NOT NULL DEFAULT 0,
  runs_conceded integer NOT NULL DEFAULT 0,
  best_bowling_wickets integer NOT NULL DEFAULT 0,
  best_bowling_runs integer NOT NULL DEFAULT 0,
  maidens integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.player_all_time_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view player stats"
ON public.player_all_time_stats FOR SELECT USING (true);

CREATE POLICY "Anyone can insert player stats"
ON public.player_all_time_stats FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update player stats"
ON public.player_all_time_stats FOR UPDATE USING (true);

CREATE POLICY "Anyone can delete player stats"
ON public.player_all_time_stats FOR DELETE USING (true);

CREATE OR REPLACE FUNCTION public.update_player_stats_updated_at()
RETURNS trigger LANGUAGE plpgsql
SET search_path = 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE TRIGGER update_player_stats_timestamp
BEFORE UPDATE ON public.player_all_time_stats
FOR EACH ROW EXECUTE FUNCTION public.update_player_stats_updated_at();
