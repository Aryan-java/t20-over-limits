-- Create game sessions table
CREATE TABLE public.game_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code VARCHAR(6) NOT NULL UNIQUE,
  admin_id UUID NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'lobby',
  game_state JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create players table (anonymous with nicknames)
CREATE TABLE public.game_players (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.game_sessions(id) ON DELETE CASCADE,
  nickname VARCHAR(50) NOT NULL,
  team_id VARCHAR(50),
  is_admin BOOLEAN NOT NULL DEFAULT false,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_players ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read game sessions (anonymous access)
CREATE POLICY "Anyone can view game sessions"
ON public.game_sessions FOR SELECT
USING (true);

-- Allow anyone to create game sessions
CREATE POLICY "Anyone can create game sessions"
ON public.game_sessions FOR INSERT
WITH CHECK (true);

-- Allow updates (for game state)
CREATE POLICY "Anyone can update game sessions"
ON public.game_sessions FOR UPDATE
USING (true);

-- Allow anyone to view players
CREATE POLICY "Anyone can view players"
ON public.game_players FOR SELECT
USING (true);

-- Allow anyone to join
CREATE POLICY "Anyone can join games"
ON public.game_players FOR INSERT
WITH CHECK (true);

-- Allow updates to players
CREATE POLICY "Anyone can update players"
ON public.game_players FOR UPDATE
USING (true);

-- Allow deleting players
CREATE POLICY "Anyone can delete players"
ON public.game_players FOR DELETE
USING (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_players;

-- Index for quick code lookup
CREATE INDEX idx_game_sessions_code ON public.game_sessions(code);
CREATE INDEX idx_game_players_session ON public.game_players(session_id);