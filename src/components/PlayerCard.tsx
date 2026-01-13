import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Player } from "@/types/cricket";
import { PlayerAllTimeStats } from "@/hooks/useAllTimeStats";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SkillRadarChart } from "@/components/ui/SkillRadarChart";
import { MilestoneBadge, MilestoneBadgeGroup } from "@/components/ui/MilestoneBadge";
import { CareerStatsGraph, StatProgressBar } from "@/components/ui/CareerStatsGraph";
import { 
  Globe, 
  TrendingUp, 
  Target, 
  ChevronRight, 
  Zap,
  Trophy,
  Star,
  Flame,
  BarChart3
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PlayerCardProps {
  player: Player;
  stats?: PlayerAllTimeStats;
  variant?: "compact" | "detailed" | "full";
  onClick?: () => void;
  className?: string;
  showRadar?: boolean;
  showStats?: boolean;
  showMilestones?: boolean;
  index?: number;
}

export function PlayerCard({
  player,
  stats,
  variant = "compact",
  onClick,
  className,
  showRadar = true,
  showStats = true,
  showMilestones = true,
  index = 0,
}: PlayerCardProps) {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);

  const getPlayerRole = () => {
    const diff = player.batSkill - player.bowlSkill;
    if (diff > 20) return { role: "Batsman", color: "text-cricket-gold", bgColor: "bg-cricket-gold/10", icon: TrendingUp };
    if (diff < -20) return { role: "Bowler", color: "text-cricket-purple", bgColor: "bg-cricket-purple/10", icon: Target };
    return { role: "All-Rounder", color: "text-primary", bgColor: "bg-primary/10", icon: Zap };
  };

  const role = getPlayerRole();
  const RoleIcon = role.icon;

  // Calculate milestones from stats
  const getMilestones = () => {
    if (!stats) return [];
    const milestones: Array<{ type: "century" | "half-century" | "five-wickets" | "power-hitter" | "economical"; count?: number }> = [];
    
    if (stats.hundreds > 0) milestones.push({ type: "century", count: stats.hundreds });
    if (stats.fifties > 0) milestones.push({ type: "half-century", count: stats.fifties });
    if (stats.best_bowling_wickets >= 5) milestones.push({ type: "five-wickets" });
    if (stats.sixes > 10) milestones.push({ type: "power-hitter" });
    if (stats.balls_bowled > 0 && (stats.runs_conceded / (stats.balls_bowled / 6)) < 7) {
      milestones.push({ type: "economical" });
    }
    
    return milestones;
  };

  const milestones = getMilestones();

  // Generate mock career data for the graph
  const generateCareerData = () => {
    if (!stats || stats.matches_batted === 0) return [];
    const matches = Math.min(stats.matches_batted, 10);
    const avgRuns = stats.total_runs / stats.matches_batted;
    return Array.from({ length: matches }, () => 
      Math.max(0, Math.round(avgRuns + (Math.random() - 0.5) * avgRuns))
    );
  };

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate(`/player/${player.id}`);
    }
  };

  if (variant === "compact") {
    return (
      <Card 
        className={cn(
          "group cursor-pointer overflow-hidden transition-all duration-300",
          "hover:shadow-xl hover:-translate-y-1 hover:border-primary/30",
          "bg-card/80 backdrop-blur-sm border-border/50",
          "dark:bg-card/60 dark:hover:bg-card/80",
          className
        )}
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{ animationDelay: `${index * 50}ms` }}
      >
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            {/* Avatar with skill ring */}
            <div className="relative">
              <div className={cn(
                "absolute inset-0 rounded-full transition-all duration-300",
                isHovered ? "bg-primary/20 blur-lg scale-125" : "bg-transparent"
              )} />
              <Avatar className="h-14 w-14 ring-2 ring-offset-2 ring-offset-background ring-primary/30 group-hover:ring-primary transition-all">
                <AvatarImage src={player.imageUrl} alt={player.name} />
                <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/5 font-bold text-lg">
                  {player.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {player.isOverseas && (
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-cricket-purple flex items-center justify-center">
                  <Globe className="h-3 w-3 text-white" />
                </div>
              )}
            </div>

            {/* Player Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-bold truncate group-hover:text-primary transition-colors">
                  {player.name}
                </h3>
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <Badge variant="outline" className={cn("text-xs py-0 px-1.5", role.bgColor, role.color)}>
                  <RoleIcon className="h-3 w-3 mr-1" />
                  {role.role}
                </Badge>
              </div>
            </div>

            {/* Mini Radar */}
            {showRadar && (
              <div className={cn(
                "transition-all duration-300",
                isHovered ? "scale-110" : "scale-100"
              )}>
                <SkillRadarChart
                  batting={player.batSkill}
                  bowling={player.bowlSkill}
                  size={70}
                  animated={false}
                />
              </div>
            )}

            <ChevronRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>

          {/* Skills bar */}
          <div className="flex items-center gap-4 mt-4">
            <div className="flex-1">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-muted-foreground">Batting</span>
                <span className="font-bold text-cricket-gold">{player.batSkill}</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-cricket-gold/60 to-cricket-gold rounded-full transition-all duration-500"
                  style={{ width: `${player.batSkill}%` }}
                />
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-muted-foreground">Bowling</span>
                <span className="font-bold text-cricket-purple">{player.bowlSkill}</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-cricket-purple/60 to-cricket-purple rounded-full transition-all duration-500"
                  style={{ width: `${player.bowlSkill}%` }}
                />
              </div>
            </div>
          </div>

          {/* Milestones */}
          {showMilestones && milestones.length > 0 && (
            <div className="mt-3 pt-3 border-t border-border/50">
              <MilestoneBadgeGroup milestones={milestones} />
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  if (variant === "detailed") {
    return (
      <Card 
        className={cn(
          "group cursor-pointer overflow-hidden transition-all duration-300",
          "hover:shadow-2xl hover:border-primary/40",
          "bg-card/90 backdrop-blur-sm",
          className
        )}
        onClick={handleClick}
        style={{ animationDelay: `${index * 50}ms` }}
      >
        {/* Header with gradient */}
        <div className="relative h-24 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent overflow-hidden">
          <div className="absolute inset-0 bg-pitch-pattern opacity-10" />
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
          
          {/* Overseas badge */}
          {player.isOverseas && (
            <Badge className="absolute top-3 right-3 bg-cricket-purple text-white border-0">
              <Globe className="h-3 w-3 mr-1" />
              Overseas
            </Badge>
          )}
        </div>

        <CardContent className="p-5 -mt-10 relative">
          <div className="flex items-start gap-4">
            {/* Large Avatar */}
            <Avatar className="h-20 w-20 ring-4 ring-background shadow-xl">
              <AvatarImage src={player.imageUrl} alt={player.name} />
              <AvatarFallback className="bg-gradient-to-br from-primary to-primary/50 text-white font-bold text-2xl">
                {player.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 pt-2">
              <h3 className="text-xl font-bold group-hover:text-primary transition-colors">
                {player.name}
              </h3>
              <Badge variant="outline" className={cn("mt-1", role.bgColor, role.color)}>
                <RoleIcon className="h-3 w-3 mr-1" />
                {role.role}
              </Badge>
            </div>

            {/* Radar Chart */}
            {showRadar && (
              <SkillRadarChart
                batting={player.batSkill}
                bowling={player.bowlSkill}
                size={100}
              />
            )}
          </div>

          {/* Stats Section */}
          {showStats && stats && (
            <div className="mt-6 space-y-4">
              <div className="grid grid-cols-4 gap-3">
                <div className="text-center p-2 rounded-lg bg-muted/50">
                  <div className="text-lg font-bold text-cricket-gold">{stats.total_runs}</div>
                  <div className="text-[10px] text-muted-foreground uppercase">Runs</div>
                </div>
                <div className="text-center p-2 rounded-lg bg-muted/50">
                  <div className="text-lg font-bold text-cricket-purple">{stats.total_wickets}</div>
                  <div className="text-[10px] text-muted-foreground uppercase">Wickets</div>
                </div>
                <div className="text-center p-2 rounded-lg bg-muted/50">
                  <div className="text-lg font-bold">{stats.highest_score}</div>
                  <div className="text-[10px] text-muted-foreground uppercase">High Score</div>
                </div>
                <div className="text-center p-2 rounded-lg bg-muted/50">
                  <div className="text-lg font-bold">{stats.matches_batted}</div>
                  <div className="text-[10px] text-muted-foreground uppercase">Matches</div>
                </div>
              </div>

              {/* Career Graph */}
              <CareerStatsGraph
                data={generateCareerData()}
                label="Recent Form"
                color="gold"
                height={50}
              />
            </div>
          )}

          {/* Milestones */}
          {showMilestones && milestones.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <div className="text-xs text-muted-foreground mb-2">Achievements</div>
              <div className="flex flex-wrap gap-2">
                {milestones.map((m, i) => (
                  <MilestoneBadge key={i} type={m.type} count={m.count} size="md" />
                ))}
              </div>
            </div>
          )}

          <Button 
            variant="ghost" 
            className="w-full mt-4 group-hover:bg-primary/10"
          >
            View Full Profile
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Full variant
  return (
    <Card 
      className={cn(
        "overflow-hidden transition-all duration-300",
        "bg-card/95 backdrop-blur-sm border-2",
        className
      )}
    >
      {/* Hero Header */}
      <div className="relative h-32 bg-gradient-to-br from-primary via-primary/80 to-cricket-purple overflow-hidden">
        <div className="absolute inset-0 bg-pitch-pattern opacity-20" />
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        
        {player.isOverseas && (
          <Badge className="absolute top-4 right-4 bg-white/20 text-white border-white/30 backdrop-blur-sm">
            <Globe className="h-3 w-3 mr-1" />
            Overseas Player
          </Badge>
        )}
        
        <Badge className={cn("absolute top-4 left-4 border-0", role.bgColor, role.color)}>
          <RoleIcon className="h-3 w-3 mr-1" />
          {role.role}
        </Badge>
      </div>

      <CardContent className="p-6 -mt-16 relative">
        <div className="flex flex-col md:flex-row items-start gap-6">
          {/* Avatar */}
          <Avatar className="h-28 w-28 ring-4 ring-background shadow-2xl">
            <AvatarImage src={player.imageUrl} alt={player.name} />
            <AvatarFallback className="bg-gradient-to-br from-primary to-cricket-purple text-white font-bold text-3xl">
              {player.name.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <h2 className="text-2xl font-bold">{player.name}</h2>
            
            {/* Milestones */}
            {showMilestones && milestones.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {milestones.map((m, i) => (
                  <MilestoneBadge key={i} type={m.type} count={m.count} size="md" />
                ))}
              </div>
            )}
          </div>

          {/* Large Radar */}
          {showRadar && (
            <div className="hidden md:block">
              <SkillRadarChart
                batting={player.batSkill}
                bowling={player.bowlSkill}
                size={150}
              />
            </div>
          )}
        </div>

        {/* Stats Grid */}
        {showStats && stats && (
          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="stadium-card rounded-xl p-4 text-center">
              <Trophy className="h-6 w-6 mx-auto mb-2 text-cricket-gold" />
              <div className="text-2xl font-bold text-cricket-gold">{stats.total_runs}</div>
              <div className="text-xs text-muted-foreground">Total Runs</div>
            </div>
            <div className="stadium-card rounded-xl p-4 text-center">
              <Target className="h-6 w-6 mx-auto mb-2 text-cricket-purple" />
              <div className="text-2xl font-bold text-cricket-purple">{stats.total_wickets}</div>
              <div className="text-xs text-muted-foreground">Total Wickets</div>
            </div>
            <div className="stadium-card rounded-xl p-4 text-center">
              <Star className="h-6 w-6 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold">{stats.highest_score}</div>
              <div className="text-xs text-muted-foreground">Highest Score</div>
            </div>
            <div className="stadium-card rounded-xl p-4 text-center">
              <BarChart3 className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
              <div className="text-2xl font-bold">{stats.matches_batted}</div>
              <div className="text-xs text-muted-foreground">Matches</div>
            </div>
          </div>
        )}

        {/* Detailed Stats */}
        {showStats && stats && (
          <div className="mt-6 grid md:grid-cols-2 gap-6">
            {/* Batting */}
            <div className="space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-cricket-gold" />
                Batting Stats
              </h4>
              <StatProgressBar label="Strike Rate" value={Math.round((stats.total_runs / Math.max(stats.balls_faced, 1)) * 100)} maxValue={200} color="gold" />
              <StatProgressBar label="Average" value={Math.round(stats.total_runs / Math.max(stats.matches_batted - stats.not_outs, 1))} maxValue={100} color="gold" />
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 bg-muted/50 rounded-lg">
                  <div className="font-bold text-sm">{stats.fifties}</div>
                  <div className="text-[10px] text-muted-foreground">50s</div>
                </div>
                <div className="p-2 bg-muted/50 rounded-lg">
                  <div className="font-bold text-sm">{stats.hundreds}</div>
                  <div className="text-[10px] text-muted-foreground">100s</div>
                </div>
                <div className="p-2 bg-muted/50 rounded-lg">
                  <div className="font-bold text-sm">{stats.sixes}</div>
                  <div className="text-[10px] text-muted-foreground">6s</div>
                </div>
              </div>
            </div>

            {/* Bowling */}
            <div className="space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <Target className="h-4 w-4 text-cricket-purple" />
                Bowling Stats
              </h4>
              <StatProgressBar 
                label="Economy" 
                value={Math.round((stats.runs_conceded / Math.max(stats.balls_bowled / 6, 1)) * 10)} 
                maxValue={120} 
                color="purple" 
              />
              <StatProgressBar 
                label="Average" 
                value={Math.round(stats.runs_conceded / Math.max(stats.total_wickets, 1))} 
                maxValue={50} 
                color="purple" 
              />
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 bg-muted/50 rounded-lg">
                  <div className="font-bold text-sm">{stats.best_bowling_wickets}/{stats.best_bowling_runs}</div>
                  <div className="text-[10px] text-muted-foreground">Best</div>
                </div>
                <div className="p-2 bg-muted/50 rounded-lg">
                  <div className="font-bold text-sm">{stats.maidens}</div>
                  <div className="text-[10px] text-muted-foreground">Maidens</div>
                </div>
                <div className="p-2 bg-muted/50 rounded-lg">
                  <div className="font-bold text-sm">{Math.floor(stats.balls_bowled / 6)}.{stats.balls_bowled % 6}</div>
                  <div className="text-[10px] text-muted-foreground">Overs</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Career Graph */}
        {showStats && stats && (
          <div className="mt-6">
            <CareerStatsGraph
              data={generateCareerData()}
              label="Career Performance (Last 10 Matches)"
              color="gold"
              height={80}
              showValues
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default PlayerCard;
