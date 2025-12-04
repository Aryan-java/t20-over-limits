import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface GamePlayer {
  id: string;
  session_id: string;
  nickname: string;
  team_id: string | null;
  is_admin: boolean;
  joined_at: string;
}

export interface GameSession {
  id: string;
  code: string;
  admin_id: string;
  status: string;
  game_state: any;
  created_at: string;
  updated_at: string;
}

const generateCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

export const useGameSession = () => {
  const [session, setSession] = useState<GameSession | null>(null);
  const [players, setPlayers] = useState<GamePlayer[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<GamePlayer | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!session) return;

    const playersChannel = supabase
      .channel(`players-${session.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'game_players',
          filter: `session_id=eq.${session.id}`
        },
        () => {
          fetchPlayers(session.id);
        }
      )
      .subscribe();

    const sessionChannel = supabase
      .channel(`session-${session.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'game_sessions',
          filter: `id=eq.${session.id}`
        },
        (payload) => {
          setSession(payload.new as GameSession);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(playersChannel);
      supabase.removeChannel(sessionChannel);
    };
  }, [session?.id]);

  const fetchPlayers = async (sessionId: string) => {
    const { data, error } = await supabase
      .from('game_players')
      .select('*')
      .eq('session_id', sessionId)
      .order('joined_at', { ascending: true });

    if (!error && data) {
      setPlayers(data);
    }
  };

  const createSession = async (nickname: string) => {
    setLoading(true);
    setError(null);

    try {
      const code = generateCode();
      const playerId = crypto.randomUUID();

      // Create session
      const { data: sessionData, error: sessionError } = await supabase
        .from('game_sessions')
        .insert({
          code,
          admin_id: playerId,
          status: 'lobby'
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      // Add admin as player
      const { data: playerData, error: playerError } = await supabase
        .from('game_players')
        .insert({
          id: playerId,
          session_id: sessionData.id,
          nickname,
          is_admin: true
        })
        .select()
        .single();

      if (playerError) throw playerError;

      setSession(sessionData);
      setCurrentPlayer(playerData);
      setPlayers([playerData]);

      // Store in localStorage for persistence
      localStorage.setItem('game_player_id', playerId);
      localStorage.setItem('game_session_id', sessionData.id);

      return sessionData;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const joinSession = async (code: string, nickname: string) => {
    setLoading(true);
    setError(null);

    try {
      // Find session by code
      const { data: sessionData, error: sessionError } = await supabase
        .from('game_sessions')
        .select('*')
        .eq('code', code.toUpperCase())
        .single();

      if (sessionError || !sessionData) {
        throw new Error('Invalid game code');
      }

      if (sessionData.status !== 'lobby') {
        throw new Error('Game has already started');
      }

      const playerId = crypto.randomUUID();

      // Add player
      const { data: playerData, error: playerError } = await supabase
        .from('game_players')
        .insert({
          id: playerId,
          session_id: sessionData.id,
          nickname,
          is_admin: false
        })
        .select()
        .single();

      if (playerError) throw playerError;

      setSession(sessionData);
      setCurrentPlayer(playerData);
      await fetchPlayers(sessionData.id);

      localStorage.setItem('game_player_id', playerId);
      localStorage.setItem('game_session_id', sessionData.id);

      return sessionData;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const selectTeam = async (teamId: string) => {
    if (!currentPlayer || !session) return;

    // Check if team is already taken
    const teamTaken = players.some(p => p.team_id === teamId && p.id !== currentPlayer.id);
    if (teamTaken) {
      setError('This team is already taken');
      return false;
    }

    const { error } = await supabase
      .from('game_players')
      .update({ team_id: teamId })
      .eq('id', currentPlayer.id);

    if (!error) {
      setCurrentPlayer({ ...currentPlayer, team_id: teamId });
      return true;
    }
    return false;
  };

  const updateGameState = async (gameState: any) => {
    if (!session || !currentPlayer?.is_admin) return;

    await supabase
      .from('game_sessions')
      .update({ game_state: gameState, updated_at: new Date().toISOString() })
      .eq('id', session.id);
  };

  const startGame = async () => {
    if (!session || !currentPlayer?.is_admin) return;

    await supabase
      .from('game_sessions')
      .update({ status: 'playing' })
      .eq('id', session.id);
  };

  const leaveSession = async () => {
    if (!currentPlayer) return;

    await supabase
      .from('game_players')
      .delete()
      .eq('id', currentPlayer.id);

    localStorage.removeItem('game_player_id');
    localStorage.removeItem('game_session_id');
    setSession(null);
    setCurrentPlayer(null);
    setPlayers([]);
  };

  const rejoinSession = useCallback(async () => {
    const playerId = localStorage.getItem('game_player_id');
    const sessionId = localStorage.getItem('game_session_id');

    if (!playerId || !sessionId) return false;

    try {
      const { data: playerData } = await supabase
        .from('game_players')
        .select('*')
        .eq('id', playerId)
        .single();

      if (!playerData) {
        localStorage.removeItem('game_player_id');
        localStorage.removeItem('game_session_id');
        return false;
      }

      const { data: sessionData } = await supabase
        .from('game_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (!sessionData) {
        localStorage.removeItem('game_player_id');
        localStorage.removeItem('game_session_id');
        return false;
      }

      setSession(sessionData);
      setCurrentPlayer(playerData);
      await fetchPlayers(sessionId);
      return true;
    } catch {
      return false;
    }
  }, []);

  return {
    session,
    players,
    currentPlayer,
    loading,
    error,
    createSession,
    joinSession,
    selectTeam,
    updateGameState,
    startGame,
    leaveSession,
    rejoinSession,
    setError
  };
};
