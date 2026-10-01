import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";

export default function MultiplayerAuth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const signIn = async () => {
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) toast({ title: "Sign in failed", description: error.message, variant: "destructive" });
  };
  const signUp = async () => {
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/multiplayer` } });
    setBusy(false);
    if (error) return toast({ title: "Sign up failed", description: error.message, variant: "destructive" });
    if (!data.session) setSent(true);
  };

  const fields = (
    <div className="space-y-3">
      <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <Input type="password" placeholder="Password (6+ characters)" value={password} onChange={(e) => setPassword(e.target.value)} />
    </div>
  );

  return (
    <Card className="max-w-md mx-auto animate-card-enter">
      <CardHeader>
        <CardTitle>Multiplayer</CardTitle>
        <CardDescription>Sign in to create or join a room. Single-player needs no account.</CardDescription>
      </CardHeader>
      <CardContent>
        {sent ? (
          <p className="text-sm text-muted-foreground">Check your email and click the confirmation link, then come back and sign in.</p>
        ) : (
          <Tabs defaultValue="in">
            <TabsList className="grid grid-cols-2 w-full mb-4">
              <TabsTrigger value="in">Sign in</TabsTrigger>
              <TabsTrigger value="up">Sign up</TabsTrigger>
            </TabsList>
            <TabsContent value="in" className="space-y-3">{fields}<Button className="w-full" disabled={busy} onClick={signIn}>Sign in</Button></TabsContent>
            <TabsContent value="up" className="space-y-3">{fields}<Button className="w-full" disabled={busy || password.length < 6} onClick={signUp}>Create account</Button></TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}
