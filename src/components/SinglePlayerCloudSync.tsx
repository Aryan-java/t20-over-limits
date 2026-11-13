import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCricketStore } from "@/hooks/useCricketStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

type SaveState = {
  teams: unknown[];
  fixtures: unknown[];
  currentMatch: unknown;
  matchHistory: unknown[];
  tournament: unknown;
  tradeProposals: unknown[];
};

const snapshot = (): SaveState => {
  const state = useCricketStore.getState();
  return {
    teams: state.teams,
    fixtures: state.fixtures,
    currentMatch: state.currentMatch,
    matchHistory: state.matchHistory,
    tournament: state.tournament,
    tradeProposals: state.tradeProposals,
  };
};

const hasLocalProgress = (state: SaveState) =>
  state.teams.length > 0 || state.fixtures.length > 0 || state.matchHistory.length > 0 || !!state.currentMatch || !!state.tournament;

export default function SinglePlayerCloudSync() {
  const { user, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [conflict, setConflict] = useState<SaveState | null>(null);
  const [pendingLocal, setPendingLocal] = useState<SaveState | null>(null);
  const [synced, setSynced] = useState(false);
  const readyRef = useRef(false);

  useEffect(() => {
    if (!user || loading || readyRef.current) return;
    let cancelled = false;
    const load = async () => {
      setBusy(true);
      setMessage("Checking your cloud save…");
      const { data, error } = await (supabase as any)
        .from("single_player_tournament_saves")
        .select("state")
        .eq("user_id", user.id)
        .maybeSingle();
      if (cancelled) return;
      if (error) {
        setMessage("Cloud connection failed. Your browser save is still available.");
        setBusy(false);
        return;
      }
      const local = snapshot();
      if (data?.state) {
        const remote = data.state as SaveState;
        if (hasLocalProgress(local) && JSON.stringify(local) !== JSON.stringify(remote)) {
          setPendingLocal(local);
          setConflict(remote);
          setMessage("Two saves found. Choose which one to keep; neither has been overwritten.");
        } else {
          useCricketStore.setState(remote as any);
          readyRef.current = true;
          setSynced(true);
          setMessage("Cloud tournament restored.");
        }
      } else {
        const { error: saveError } = await (supabase as any)
          .from("single_player_tournament_saves")
          .upsert({ user_id: user.id, state: local, updated_at: new Date().toISOString() });
        if (cancelled) return;
        if (saveError) setMessage("Could not upload this device's save. Local data remains safe.");
        else {
          readyRef.current = true;
          setSynced(true);
          setMessage("This device's tournament has been backed up to your account.");
        }
      }
      setBusy(false);
    };
    void load();
    return () => { cancelled = true; };
  }, [user, loading]);

  useEffect(() => {
    if (!user || !synced) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let saving = false;
    const unsubscribe = useCricketStore.subscribe((state) => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(async () => {
        if (saving) return;
        saving = true;
        const save: SaveState = {
          teams: state.teams, fixtures: state.fixtures, currentMatch: state.currentMatch,
          matchHistory: state.matchHistory, tournament: state.tournament, tradeProposals: state.tradeProposals,
        };
        const { error } = await (supabase as any)
          .from("single_player_tournament_saves")
          .upsert({ user_id: user.id, state: save, updated_at: new Date().toISOString() });
        setMessage(error ? "Cloud save failed. Your local browser backup remains." : "All changes saved to your account.");
        saving = false;
      }, 800);
    });
    return () => {
      unsubscribe();
      if (timer) clearTimeout(timer);
    };
  }, [user, synced]);

  const chooseSave = async (save: SaveState) => {
    if (!user) return;
    setBusy(true);
    useCricketStore.setState(save as any);
    const { error } = await (supabase as any)
      .from("single_player_tournament_saves")
      .upsert({ user_id: user.id, state: save, updated_at: new Date().toISOString() });
    setBusy(false);
    if (error) {
      setMessage("Cloud upload failed. Your local copy remains on this device.");
      return;
    }
    readyRef.current = true;
    setConflict(null);
    setPendingLocal(null);
    setSynced(true);
    setMessage("Selected tournament saved to your account.");
  };

  const signIn = async (create: boolean) => {
    setBusy(true);
    setMessage("");
    const result = create
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (result.error) setMessage(result.error.message);
    else if (create && !result.data.session) setMessage("Check your email to confirm your account, then sign in.");
  };

  if (loading) return null;
  return (
    <Card className="mb-5 border-border/70 bg-card/80">
      <CardContent className="p-4">
        {user ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium">Cloud backup · {user.email}</p>
              <p className="text-xs text-muted-foreground">{message || "Preparing your account save…"}</p>
              {conflict && pendingLocal && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" disabled={busy} onClick={() => void chooseSave(conflict)}>Use cloud save</Button>
                  <Button size="sm" variant="outline" disabled={busy} onClick={() => void chooseSave(pendingLocal)}>Keep this device's save</Button>
                </div>
              )}
            </div>
            <Button size="sm" variant="outline" disabled={busy} onClick={() => void supabase.auth.signOut()}>Sign out</Button>
          </div>
        ) : (
          <div className="flex flex-wrap items-end gap-2">
            <div className="mr-auto">
              <p className="text-sm font-medium">Back up tournaments across devices</p>
              <p className="text-xs text-muted-foreground">Sign in to sync teams, fixtures, scorecards and tournament progress.</p>
            </div>
            <Input className="w-44" type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
            <Input className="w-40" type="password" placeholder="Password (6+)" value={password} onChange={e => setPassword(e.target.value)} />
            <Button size="sm" disabled={busy || !email || password.length < 6} onClick={() => void signIn(false)}>Sign in</Button>
            <Button size="sm" variant="outline" disabled={busy || !email || password.length < 6} onClick={() => void signIn(true)}>Create account</Button>
          </div>
        )}
        {message && !user && <p className="mt-2 text-xs text-muted-foreground">{message}</p>}
      </CardContent>
    </Card>
  );
}
