-- Create all-time player stats table
CREATE TABLE public.player_all_time_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id TEXT NOT NULL UNIQUE,
  player_name TEXT NOT NULL,
  team_name TEXT,
  image_url TEXT,
  
  -- Batting stats
  matches_batted INTEGER NOT NULL DEFAULT 0,
  total_runs INTEGER NOT NULL DEFAULT 0,
  balls_faced INTEGER NOT NULL DEFAULT 0,
  highest_score INTEGER NOT NULL DEFAULT 0,
  fifties INTEGER NOT NULL DEFAULT 0,
  hundreds INTEGER NOT NULL DEFAULT 0,
  fours INTEGER NOT NULL DEFAULT 0,
  sixes INTEGER NOT NULL DEFAULT 0,
  not_outs INTEGER NOT NULL DEFAULT 0,
  
  -- Bowling stats
  matches_bowled INTEGER NOT NULL DEFAULT 0,
  total_wickets INTEGER NOT NULL DEFAULT 0,
  balls_bowled INTEGER NOT NULL DEFAULT 0,
  runs_conceded INTEGER NOT NULL DEFAULT 0,
  best_bowling_wickets INTEGER NOT NULL DEFAULT 0,
  best_bowling_runs INTEGER NOT NULL DEFAULT 0,
  maidens INTEGER NOT NULL DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.player_all_time_stats ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (game data is public)
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

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.update_player_stats_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_player_all_time_stats_updated_at
  BEFORE UPDATE ON public.player_all_time_stats
  FOR EACH ROW
  EXECUTE FUNCTION public.update_player_stats_updated_at();