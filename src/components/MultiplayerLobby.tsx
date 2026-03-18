import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Copy, Check, LogOut, Users, Crown, Loader2 } from "lucide-react";
import { useMultiplayerStore } from "@/hooks/useMultiplayerStore";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const MultiplayerLobby = () => {
  const { sessionCode, players, isAdmin, nickname, leaveGame, lobbyStatus } = useMultiplayerStore();
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopy = async () => {
    if (!sessionCode) return;
    await navigator.clipboard.writeText(sessionCode);
    setCopied(true);
    toast({ title: "Code copied!" });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLeave = async () => {
    await leaveGame();
    toast({ title: "Left the game" });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background" />
        <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md space-y-6">
        {/* Game Code Card */}
        <Card className="border-primary/20 bg-card/95 backdrop-blur-sm">
          <CardContent className="p-6 text-center space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Share this code with friends</p>
              <div className="flex items-center justify-center gap-3">
                <span className="text-4xl font-mono font-extrabold tracking-[0.3em] text-foreground">
                  {sessionCode}
                </span>
                <Button variant="ghost" size="icon" onClick={handleCopy} className="shrink-0">
                  {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <Badge variant="secondary" className="text-xs">
              Waiting for players to join...
            </Badge>
          </CardContent>
        </Card>

        {/* Players List */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              Players ({players.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {players.map((player) => (
              <div
                key={player.id}
                className={cn(
                  "flex items-center justify-between p-3 rounded-lg border border-border/50 bg-muted/20",
                  player.nickname === nickname && "border-primary/30 bg-primary/5"
                )}
              >
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                    {player.nickname.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-medium text-foreground text-sm">{player.nickname}</span>
                  {player.nickname === nickname && (
                    <Badge variant="outline" className="text-[10px]">You</Badge>
                  )}
                </div>
                {player.isAdmin && (
                  <Badge className="bg-accent/15 text-accent border-accent/30 text-[10px]">
                    <Crown className="h-3 w-3 mr-1" />
                    Host
                  </Badge>
                )}
              </div>
            ))}

            {players.length < 2 && (
              <div className="text-center py-4 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
                Waiting for more players...
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={handleLeave}>
            <LogOut className="h-4 w-4 mr-2" />
            Leave
          </Button>
          {isAdmin && (
            <Button className="flex-1" disabled={players.length < 2}>
              Start Game
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MultiplayerLobby;
