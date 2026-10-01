import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { rpc } from "@/lib/mpApi";

export default function MultiplayerHome({ email }: { email: string }) {
  const nav = useNavigate();
  const [name, setName] = useState(email.split("@")[0].slice(0, 32));
  const [code, setCode] = useState("");
  const [overs, setOvers] = useState("5");
  const [busy, setBusy] = useState(false);

  const create = async () => {
    setBusy(true);
    const r = await rpc<{ id: string }>("mp_create_room", { p_display_name: name, p_overs: Number(overs) });
    setBusy(false);
    if (r) nav(`/multiplayer/${r.id}`);
  };
  const join = async () => {
    setBusy(true);
    const r = await rpc<{ id: string }>("mp_join_room", { p_code: code, p_display_name: name });
    setBusy(false);
    if (r) nav(`/multiplayer/${r.id}`);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-4 animate-card-enter">
      <Card>
        <CardContent className="pt-6">
          <label className="text-sm text-muted-foreground">Your display name</label>
          <Input value={name} maxLength={32} onChange={(e) => setName(e.target.value)} />
        </CardContent>
      </Card>
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle>Create room</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Select value={overs} onValueChange={setOvers}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{[2, 5, 10, 20].map((o) => <SelectItem key={o} value={String(o)}>{o} overs</SelectItem>)}</SelectContent>
            </Select>
            <Button className="w-full" disabled={busy || !name.trim()} onClick={create}>Create room</Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Join room</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Input placeholder="6-character code" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} className="tracking-widest font-mono uppercase" />
            <Button className="w-full" variant="secondary" disabled={busy || code.length !== 6 || !name.trim()} onClick={join}>Join</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
