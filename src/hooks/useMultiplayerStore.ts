import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

export type GameMode = 'selection' | 'single' | 'multiplayer';
export type LobbyStatus = 'idle' | 'creating' | 'joining' | 'in-lobby' | 'error';

export interface LobbyPlayer {
  id: string;
  nickname: string;
  isAdmin: boolean;
  teamId: string | null;
  joinedAt: string;
}

interface MultiplayerStore {
  // Game mode
  gameMode: GameMode;
  setGameMode: (mode: GameMode) => void;

  // Lobby state
  lobbyStatus: LobbyStatus;
  sessionId: string | null;
  sessionCode: string | null;
  playerId: string | null;
  nickname: string | null;
  isAdmin: boolean;
  players: LobbyPlayer[];
  error: string | null;

  // Channel ref
  _channel: RealtimeChannel | null;

  // Actions
  createGame: (nickname: string) => Promise<void>;
  joinGame: (code: string, nickname: string) => Promise<void>;
  leaveGame: () => Promise<void>;
  selectTeam: (teamId: string | null) => Promise<void>;
  
  // Internal
  _subscribeToLobby: (sessionId: string) => void;
  _refreshPlayers: (sessionId: string) => Promise<void>;
}

const generateCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
};

export const useMultiplayerStore = create<MultiplayerStore>((set, get) => ({
  gameMode: 'selection',
  setGameMode: (mode) => set({ gameMode: mode }),

  lobbyStatus: 'idle',
  sessionId: null,
  sessionCode: null,
  playerId: null,
  nickname: null,
  isAdmin: false,
  players: [],
  error: null,
  _channel: null,

  createGame: async (nickname: string) => {
    set({ lobbyStatus: 'creating', error: null });
    try {
      const code = generateCode();
      const tempAdminId = crypto.randomUUID();

      const { data: session, error: sessionError } = await supabase
        .from('game_sessions')
        .insert({ code, admin_id: tempAdminId, status: 'lobby', game_state: {} })
        .select()
        .single();

      if (sessionError || !session) throw new Error(sessionError?.message || 'Failed to create session');

      const { data: player, error: playerError } = await supabase
        .from('game_players')
        .insert({ session_id: session.id, nickname, is_admin: true })
        .select()
        .single();

      if (playerError || !player) throw new Error(playerError?.message || 'Failed to join as admin');

      set({
        lobbyStatus: 'in-lobby',
        sessionId: session.id,
        sessionCode: code,
        playerId: player.id,
        nickname,
        isAdmin: true,
      });

      get()._subscribeToLobby(session.id);
      await get()._refreshPlayers(session.id);
    } catch (e: any) {
      set({ lobbyStatus: 'error', error: e.message });
    }
  },

  joinGame: async (code: string, nickname: string) => {
    set({ lobbyStatus: 'joining', error: null });
    try {
      const { data: session, error: sessionError } = await supabase
        .from('game_sessions')
        .select()
        .eq('code', code.toUpperCase())
        .eq('status', 'lobby')
        .single();

      if (sessionError || !session) throw new Error('Game not found or already started');

      const { data: player, error: playerError } = await supabase
        .from('game_players')
        .insert({ session_id: session.id, nickname, is_admin: false })
        .select()
        .single();

      if (playerError || !player) throw new Error(playerError?.message || 'Failed to join');

      set({
        lobbyStatus: 'in-lobby',
        sessionId: session.id,
        sessionCode: session.code,
        playerId: player.id,
        nickname,
        isAdmin: false,
      });

      get()._subscribeToLobby(session.id);
      await get()._refreshPlayers(session.id);
    } catch (e: any) {
      set({ lobbyStatus: 'error', error: e.message });
    }
  },

  leaveGame: async () => {
    const { playerId, sessionId, _channel } = get();
    if (_channel) supabase.removeChannel(_channel);
    if (playerId) {
      await supabase.from('game_players').delete().eq('id', playerId);
    }
    set({
      lobbyStatus: 'idle',
      sessionId: null,
      sessionCode: null,
      playerId: null,
      nickname: null,
      isAdmin: false,
      players: [],
      error: null,
      _channel: null,
      gameMode: 'selection',
    });
  },

  selectTeam: async (teamId: string | null) => {
    const { playerId } = get();
    if (!playerId) return;
    await supabase.from('game_players').update({ team_id: teamId }).eq('id', playerId);
  },

  _refreshPlayers: async (sessionId: string) => {
    const { data } = await supabase
      .from('game_players')
      .select('*')
      .eq('session_id', sessionId)
      .order('joined_at', { ascending: true });

    if (data) {
      set({
        players: data.map((p) => ({
          id: p.id,
          nickname: p.nickname,
          isAdmin: p.is_admin,
          teamId: p.team_id,
          joinedAt: p.joined_at,
        })),
      });
    }
  },

  _subscribeToLobby: (sessionId: string) => {
    const existing = get()._channel;
    if (existing) supabase.removeChannel(existing);

    const channel = supabase
      .channel(`lobby-${sessionId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'game_players',
        filter: `session_id=eq.${sessionId}`,
      }, () => {
        get()._refreshPlayers(sessionId);
      })
      .subscribe();

    set({ _channel: channel });
  },
}));
