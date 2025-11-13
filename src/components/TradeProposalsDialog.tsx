import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCricketStore } from "@/hooks/useCricketStore";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, XCircle, Clock, ArrowRight } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import PlayerAvatar from "./PlayerAvatar";
import { format } from "date-fns";

interface TradeProposalsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TradeProposalsDialog = ({ open, onOpenChange }: TradeProposalsDialogProps) => {
  const { teams, tradeProposals, acceptTradeProposal, rejectTradeProposal } = useCricketStore();
  const { toast } = useToast();

  const handleAccept = (proposalId: string) => {
    acceptTradeProposal(proposalId);
    toast({
      title: "Trade Accepted",
      description: "The trade has been completed successfully",
    });
  };

  const handleReject = (proposalId: string) => {
    rejectTradeProposal(proposalId);
    toast({
      title: "Trade Rejected",
      description: "The trade proposal has been rejected",
      variant: "destructive",
    });
  };

  const getTeamName = (teamId: string) => {
    return teams.find(t => t.id === teamId)?.name || "Unknown Team";
  };

  const getPlayerName = (teamId: string, playerId: string) => {
    const team = teams.find(t => t.id === teamId);
    return team?.squad.find(p => p.id === playerId);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700 border-yellow-300"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'accepted':
        return <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-300"><CheckCircle2 className="h-3 w-3 mr-1" />Accepted</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-500/10 text-red-700 border-red-300"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      default:
        return null;
    }
  };

  const pendingProposals = tradeProposals.filter(p => p.status === 'pending');
  const completedProposals = tradeProposals.filter(p => p.status !== 'pending');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Trade Proposals</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="pending">
              Pending ({pendingProposals.length})
            </TabsTrigger>
            <TabsTrigger value="history">
              History ({completedProposals.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            <ScrollArea className="h-[500px] pr-4">
              {pendingProposals.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No pending trade proposals</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingProposals.map(proposal => {
                    const fromTeam = teams.find(t => t.id === proposal.fromTeamId);
                    const toTeam = teams.find(t => t.id === proposal.toTeamId);
                    const fromPlayers = fromTeam?.squad.filter(p => proposal.fromTeamPlayerIds.includes(p.id)) || [];
                    const toPlayers = toTeam?.squad.filter(p => proposal.toTeamPlayerIds.includes(p.id)) || [];

                    return (
                      <div key={proposal.id} className="border rounded-lg p-4 space-y-4 bg-card">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-lg">{getTeamName(proposal.fromTeamId)}</h3>
                              <ArrowRight className="h-4 w-4 text-muted-foreground" />
                              <h3 className="font-semibold text-lg">{getTeamName(proposal.toTeamId)}</h3>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Proposed on {format(new Date(proposal.createdAt), 'MMM dd, yyyy')}
                            </p>
                          </div>
                          {getStatusBadge(proposal.status)}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <h4 className="font-medium text-sm text-muted-foreground">
                              {getTeamName(proposal.fromTeamId)} Offers
                            </h4>
                            <div className="space-y-2">
                              {fromPlayers.length > 0 ? (
                                fromPlayers.map(player => (
                                  <div key={player.id} className="flex items-center gap-2 p-2 bg-accent/50 rounded">
                                    <PlayerAvatar name={player.name} imageUrl={player.imageUrl} size="sm" />
                                    <span className="text-sm font-medium">{player.name}</span>
                                  </div>
                                ))
                              ) : (
                                <p className="text-sm text-muted-foreground italic">No players</p>
                              )}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <h4 className="font-medium text-sm text-muted-foreground">
                              {getTeamName(proposal.toTeamId)} Gives
                            </h4>
                            <div className="space-y-2">
                              {toPlayers.length > 0 ? (
                                toPlayers.map(player => (
                                  <div key={player.id} className="flex items-center gap-2 p-2 bg-accent/50 rounded">
                                    <PlayerAvatar name={player.name} imageUrl={player.imageUrl} size="sm" />
                                    <span className="text-sm font-medium">{player.name}</span>
                                  </div>
                                ))
                              ) : (
                                <p className="text-sm text-muted-foreground italic">No players</p>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-2 border-t">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleReject(proposal.id)}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleAccept(proposal.id)}
                          >
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            Accept
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="history">
            <ScrollArea className="h-[500px] pr-4">
              {completedProposals.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No trade history yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {completedProposals.map(proposal => {
                    const fromTeam = teams.find(t => t.id === proposal.fromTeamId);
                    const toTeam = teams.find(t => t.id === proposal.toTeamId);
                    const fromPlayers = fromTeam?.squad.filter(p => proposal.fromTeamPlayerIds.includes(p.id)) || [];
                    const toPlayers = toTeam?.squad.filter(p => proposal.toTeamPlayerIds.includes(p.id)) || [];

                    return (
                      <div key={proposal.id} className="border rounded-lg p-4 space-y-4 bg-card opacity-75">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold">{getTeamName(proposal.fromTeamId)}</h3>
                              <ArrowRight className="h-4 w-4 text-muted-foreground" />
                              <h3 className="font-semibold">{getTeamName(proposal.toTeamId)}</h3>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(proposal.createdAt), 'MMM dd, yyyy')} - {format(new Date(proposal.respondedAt || proposal.createdAt), 'MMM dd, yyyy')}
                            </p>
                          </div>
                          {getStatusBadge(proposal.status)}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <h4 className="font-medium text-sm text-muted-foreground">Offered</h4>
                            <div className="space-y-1">
                              {fromPlayers.map(player => (
                                <p key={player.id} className="text-sm">{player.name}</p>
                              ))}
                              {fromPlayers.length === 0 && <p className="text-sm text-muted-foreground italic">None</p>}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <h4 className="font-medium text-sm text-muted-foreground">Received</h4>
                            <div className="space-y-1">
                              {toPlayers.map(player => (
                                <p key={player.id} className="text-sm">{player.name}</p>
                              ))}
                              {toPlayers.length === 0 && <p className="text-sm text-muted-foreground italic">None</p>}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default TradeProposalsDialog;
