
CREATE TABLE public.player_innings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id TEXT NOT NULL,
  player_name TEXT NOT NULL,
  team_name TEXT,
  image_url TEXT,
  match_id TEXT,
  runs INTEGER NOT NULL DEFAULT 0,
  balls_faced INTEGER NOT NULL DEFAULT 0,
  fours INTEGER NOT NULL DEFAULT 0,
  sixes INTEGER NOT NULL DEFAULT 0,
  dismissed BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.player_innings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view innings" ON public.player_innings FOR SELECT USING (true);
CREATE POLICY "Anyone can insert innings" ON public.player_innings FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update innings" ON public.player_innings FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete innings" ON public.player_innings FOR DELETE USING (true);

CREATE INDEX idx_player_innings_player_id ON public.player_innings (player_id);
CREATE INDEX idx_player_innings_runs ON public.player_innings (runs DESC);
