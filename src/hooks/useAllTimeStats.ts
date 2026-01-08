import { supabase } from "@/lib/supabaseClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface PlayerAllTimeStats {
  id: string;
  player_id: string;
  player_name: string;
  team_name: string | null;
  image_url: string | null;
  matches_batted: number;
  total_runs: number;
  balls_faced: number;
  highest_score: number;
  fifties: number;
  hundreds: number;
  fours: number;
  sixes: number;
  not_outs: number;
  matches_bowled: number;
  total_wickets: number;
  balls_bowled: number;
  runs_conceded: number;
  best_bowling_wickets: number;
  best_bowling_runs: number;
  maidens: number;
}

export function useAllTimeStats() {
  const queryClient = useQueryClient();

  const { data: stats, isLoading } = useQuery({
    queryKey: ["player-all-time-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("player_all_time_stats")
        .select("*")
        .order("total_runs", { ascending: false });
      
      if (error) throw error;
      return data as PlayerAllTimeStats[];
    },
  });

  const updateStatsMutation = useMutation({
    mutationFn: async (playerStats: Omit<PlayerAllTimeStats, "id">) => {
      // First try to get existing stats
      const { data: existing } = await supabase
        .from("player_all_time_stats")
        .select("*")
        .eq("player_id", playerStats.player_id)
        .maybeSingle();

      if (existing) {
        // Update existing stats
        const { error } = await supabase
          .from("player_all_time_stats")
          .update({
            player_name: playerStats.player_name,
            team_name: playerStats.team_name,
            image_url: playerStats.image_url,
            matches_batted: existing.matches_batted + playerStats.matches_batted,
            total_runs: existing.total_runs + playerStats.total_runs,
            balls_faced: existing.balls_faced + playerStats.balls_faced,
            highest_score: Math.max(existing.highest_score, playerStats.highest_score),
            fifties: existing.fifties + playerStats.fifties,
            hundreds: existing.hundreds + playerStats.hundreds,
            fours: existing.fours + playerStats.fours,
            sixes: existing.sixes + playerStats.sixes,
            not_outs: existing.not_outs + playerStats.not_outs,
            matches_bowled: existing.matches_bowled + playerStats.matches_bowled,
            total_wickets: existing.total_wickets + playerStats.total_wickets,
            balls_bowled: existing.balls_bowled + playerStats.balls_bowled,
            runs_conceded: existing.runs_conceded + playerStats.runs_conceded,
            best_bowling_wickets: playerStats.best_bowling_wickets > existing.best_bowling_wickets 
              ? playerStats.best_bowling_wickets 
              : (playerStats.best_bowling_wickets === existing.best_bowling_wickets && playerStats.best_bowling_runs < existing.best_bowling_runs)
                ? playerStats.best_bowling_wickets
                : existing.best_bowling_wickets,
            best_bowling_runs: playerStats.best_bowling_wickets > existing.best_bowling_wickets 
              ? playerStats.best_bowling_runs 
              : (playerStats.best_bowling_wickets === existing.best_bowling_wickets && playerStats.best_bowling_runs < existing.best_bowling_runs)
                ? playerStats.best_bowling_runs
                : existing.best_bowling_runs,
            maidens: existing.maidens + playerStats.maidens,
          })
          .eq("player_id", playerStats.player_id);

        if (error) throw error;
      } else {
        // Insert new stats
        const { error } = await supabase
          .from("player_all_time_stats")
          .insert(playerStats);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["player-all-time-stats"] });
    },
  });

  // Aggregate stats by player name (treating same name as same player across teams)
  const aggregateByName = (data: PlayerAllTimeStats[] | undefined) => {
    if (!data) return [];
    
    const aggregated = new Map<string, PlayerAllTimeStats>();
    
    for (const player of data) {
      const name = player.player_name.toLowerCase().trim();
      const existing = aggregated.get(name);
      
      if (existing) {
        // Merge stats
        aggregated.set(name, {
          ...existing,
          matches_batted: existing.matches_batted + player.matches_batted,
          total_runs: existing.total_runs + player.total_runs,
          balls_faced: existing.balls_faced + player.balls_faced,
          highest_score: Math.max(existing.highest_score, player.highest_score),
          fifties: existing.fifties + player.fifties,
          hundreds: existing.hundreds + player.hundreds,
          fours: existing.fours + player.fours,
          sixes: existing.sixes + player.sixes,
          not_outs: existing.not_outs + player.not_outs,
          matches_bowled: existing.matches_bowled + player.matches_bowled,
          total_wickets: existing.total_wickets + player.total_wickets,
          balls_bowled: existing.balls_bowled + player.balls_bowled,
          runs_conceded: existing.runs_conceded + player.runs_conceded,
          best_bowling_wickets: player.best_bowling_wickets > existing.best_bowling_wickets 
            ? player.best_bowling_wickets 
            : (player.best_bowling_wickets === existing.best_bowling_wickets && player.best_bowling_runs < existing.best_bowling_runs)
              ? player.best_bowling_wickets
              : existing.best_bowling_wickets,
          best_bowling_runs: player.best_bowling_wickets > existing.best_bowling_wickets 
            ? player.best_bowling_runs 
            : (player.best_bowling_wickets === existing.best_bowling_wickets && player.best_bowling_runs < existing.best_bowling_runs)
              ? player.best_bowling_runs
              : existing.best_bowling_runs,
          maidens: existing.maidens + player.maidens,
          // Keep the first image_url found
          image_url: existing.image_url || player.image_url,
        });
      } else {
        aggregated.set(name, { ...player, team_name: null }); // Remove team association
      }
    }
    
    return Array.from(aggregated.values());
  };

  const aggregatedStats = aggregateByName(stats);

  const battingLeaderboard = aggregatedStats
    .filter(s => s.matches_batted > 0)
    .sort((a, b) => b.total_runs - a.total_runs);

  const bowlingLeaderboard = aggregatedStats
    .filter(s => s.matches_bowled > 0)
    .sort((a, b) => b.total_wickets - a.total_wickets);

  return {
    stats,
    battingLeaderboard,
    bowlingLeaderboard,
    isLoading,
    updateStats: updateStatsMutation.mutate,
  };
}
