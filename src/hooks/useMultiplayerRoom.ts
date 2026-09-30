import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { DecisionStatus, MatchState, Member, Room, RoomEvent } from "@/types/multiplayer";

export type ConnState = "connecting" | "live" | "reconnecting" | "offline";

export function useMultiplayerRoom(roomId: string | undefined, userId: string | undefined) {
  const [room, setRoom] = useState<Room | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [state, setState] = useState<MatchState | null>(null);
  const [version, setVersion] = useState(0);
  const [events, setEvents] = useState<RoomEvent[]>([]);
  const [decisions, setDecisions] = useState<DecisionStatus | null>(null);
  const [myDecisions, setMyDecisions] = useState<{ kind: string; version: number; payload: any }[]>([]);
  const [online, setOnline] = useState<Set<string>>(new Set());
  const [conn, setConn] = useState<ConnState>("connecting");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const everConnected = useRef(false);

  const loadDecisions = useCallback(async () => {
    if (!roomId) return;
    const [{ data: ds }, { data: mine }] = await Promise.all([
      supabase.rpc("mp_decision_status", { p_room: roomId }),
      supabase.from("multiplayer_pending_decisions").select("kind, version, payload").eq("room_id", roomId),
    ]);
    if (ds) setDecisions(ds as unknown as DecisionStatus);
    setMyDecisions((mine as any) ?? []);
  }, [roomId]);

  const refresh = useCallback(async () => {
    if (!roomId) return;
    const [r, m, s, e] = await Promise.all([
      supabase.from("multiplayer_rooms").select("*").eq("id", roomId).maybeSingle(),
      supabase.from("multiplayer_room_members").select("*").eq("room_id", roomId).order("joined_at"),
      supabase.from("multiplayer_match_state").select("*").eq("room_id", roomId).maybeSingle(),
      supabase.from("multiplayer_events").select("*").eq("room_id", roomId).order("id", { ascending: false }).limit(60),
    ]);
    if (!r.data) {
      setError("You are not in this room, or it no longer exists.");
      setLoading(false);
      return;
    }
    setError(null);
    setRoom(r.data as unknown as Room);
    setMembers((m.data as unknown as Member[]) ?? []);
    if (s.data) {
      setState(Object.keys((s.data.state as object) ?? {}).length ? (s.data.state as unknown as MatchState) : null);
      setVersion(s.data.version);
    }
    setEvents(((e.data as unknown as RoomEvent[]) ?? []).reverse());
    await loadDecisions();
    setLoading(false);
  }, [roomId, loadDecisions]);

  useEffect(() => {
    if (!roomId || !userId) return;
    refresh();
    const f = `room_id=eq.${roomId}`;
    const channel = supabase
      .channel(`mp-room-${roomId}`, { config: { presence: { key: userId } } })
      .on("postgres_changes", { event: "*", schema: "public", table: "multiplayer_rooms", filter: `id=eq.${roomId}` }, (p) => {
        if (p.eventType === "DELETE") setError("This room was closed.");
        else setRoom(p.new as unknown as Room);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "multiplayer_room_members", filter: f }, async () => {
        const { data } = await supabase.from("multiplayer_room_members").select("*").eq("room_id", roomId).order("joined_at");
        const list = (data as unknown as Member[]) ?? [];
        setMembers(list);
        if (!list.some((x) => x.user_id === userId)) setError("You were removed from this room.");
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "multiplayer_match_state", filter: f }, (p) => {
        const row = p.new as any;
        if (!row) return;
        setState(Object.keys(row.state ?? {}).length ? row.state : null);
        setVersion(row.version);
        loadDecisions();
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "multiplayer_events", filter: f }, (p) => {
        const ev = p.new as unknown as RoomEvent;
        setEvents((prev) => (prev.some((x) => x.id === ev.id) ? prev : [...prev, ev].slice(-80)));
        if (ev.type === "decision_submitted") loadDecisions();
      })
      .on("presence", { event: "sync" }, () => {
        setOnline(new Set(Object.keys(channel.presenceState())));
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          if (everConnected.current) refresh(); // resync after reconnect
          everConnected.current = true;
          setConn("live");
          await channel.track({ online_at: new Date().toISOString() });
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") setConn("reconnecting");
        else if (status === "CLOSED") setConn("offline");
      });

    const onOnline = () => refresh();
    window.addEventListener("online", onOnline);
    return () => {
      window.removeEventListener("online", onOnline);
      supabase.removeChannel(channel);
    };
  }, [roomId, userId, refresh, loadDecisions]);

  return { room, members, state, version, events, decisions, myDecisions, online, conn, error, loading, refresh, loadDecisions };
}
