import { supabase } from "@/integrations/supabase/client";
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

  const { data: stats, isLoading, isError, refetch } = useQuery({
    queryKey: ["player-all-time-stats"],
    queryFn: async () => {
      // Fetch top batting leaders
      const { data: battingData, error: battingError } = await supabase
        .from("player_all_time_stats")
        .select("*")
        .order("total_runs", { ascending: false })
        .limit(20);

      if (battingError) throw battingError;

      // Fetch top bowling leaders separately
      const { data: bowlingData, error: bowlingError } = await supabase
        .from("player_all_time_stats")
        .select("*")
        .gt("matches_bowled", 0)
        .order("total_wickets", { ascending: false })
        .limit(20);

      if (bowlingError) throw bowlingError;

      // Merge and deduplicate by player_id
      const merged = new Map<string, PlayerAllTimeStats>();
      for (const p of [...(battingData || []), ...(bowlingData || [])]) {
        if (!merged.has(p.player_id)) {
          merged.set(p.player_id, p as unknown as PlayerAllTimeStats);
        }
      }
      return Array.from(merged.values());
    },
    refetchOnWindowFocus: false,
    staleTime: 60000,
    retry: 2,
    retryDelay: 2000,
    gcTime: 1000 * 60 * 5,
  });

  const updateStatsMutation = useMutation({
    mutationFn: async (playerStats: Omit<PlayerAllTimeStats, "id">) => {
      const { data: existing } = await supabase
        .from("player_all_time_stats")
        .select("*")
        .eq("player_id", playerStats.player_id)
        .maybeSingle();

      if (existing) {
        const ex = existing as unknown as PlayerAllTimeStats;
        const { error } = await supabase
          .from("player_all_time_stats")
          .update({
            player_name: playerStats.player_name,
            team_name: playerStats.team_name,
            image_url: playerStats.image_url,
            matches_batted: ex.matches_batted + playerStats.matches_batted,
            total_runs: ex.total_runs + playerStats.total_runs,
            balls_faced: ex.balls_faced + playerStats.balls_faced,
            highest_score: Math.max(ex.highest_score, playerStats.highest_score),
            fifties: ex.fifties + playerStats.fifties,
            hundreds: ex.hundreds + playerStats.hundreds,
            fours: ex.fours + playerStats.fours,
            sixes: ex.sixes + playerStats.sixes,
            not_outs: ex.not_outs + playerStats.not_outs,
            matches_bowled: ex.matches_bowled + playerStats.matches_bowled,
            total_wickets: ex.total_wickets + playerStats.total_wickets,
            balls_bowled: ex.balls_bowled + playerStats.balls_bowled,
            runs_conceded: ex.runs_conceded + playerStats.runs_conceded,
            best_bowling_wickets:
              playerStats.best_bowling_wickets > ex.best_bowling_wickets
                ? playerStats.best_bowling_wickets
                : playerStats.best_bowling_wickets === ex.best_bowling_wickets &&
                  playerStats.best_bowling_runs < ex.best_bowling_runs
                ? playerStats.best_bowling_wickets
                : ex.best_bowling_wickets,
            best_bowling_runs:
              playerStats.best_bowling_wickets > ex.best_bowling_wickets
                ? playerStats.best_bowling_runs
                : playerStats.best_bowling_wickets === ex.best_bowling_wickets &&
                  playerStats.best_bowling_runs < ex.best_bowling_runs
                ? playerStats.best_bowling_runs
                : ex.best_bowling_runs,
            maidens: ex.maidens + playerStats.maidens,
          } as any)
          .eq("player_id", playerStats.player_id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("player_all_time_stats")
          .insert(playerStats as any);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["player-all-time-stats"] });
    },
  });

  const aggregateByName = (data: PlayerAllTimeStats[] | undefined) => {
    if (!data) return [];
    const aggregated = new Map<string, PlayerAllTimeStats>();

    for (const player of data) {
      const name = player.player_name.toLowerCase().trim();
      const existing = aggregated.get(name);

      if (existing) {
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
          best_bowling_wickets:
            player.best_bowling_wickets > existing.best_bowling_wickets
              ? player.best_bowling_wickets
              : player.best_bowling_wickets === existing.best_bowling_wickets &&
                player.best_bowling_runs < existing.best_bowling_runs
              ? player.best_bowling_wickets
              : existing.best_bowling_wickets,
          best_bowling_runs:
            player.best_bowling_wickets > existing.best_bowling_wickets
              ? player.best_bowling_runs
              : player.best_bowling_wickets === existing.best_bowling_wickets &&
                player.best_bowling_runs < existing.best_bowling_runs
              ? player.best_bowling_runs
              : existing.best_bowling_runs,
          maidens: existing.maidens + player.maidens,
          image_url: existing.image_url || player.image_url,
        });
      } else {
        aggregated.set(name, { ...player, team_name: null });
      }
    }

    return Array.from(aggregated.values());
  };

  const aggregatedStats = aggregateByName(stats);

  const battingLeaderboard = aggregatedStats
    .filter((s) => s.matches_batted > 0)
    .sort((a, b) => b.total_runs - a.total_runs);

  const bowlingLeaderboard = aggregatedStats
    .filter((s) => s.matches_bowled > 0)
    .sort((a, b) => b.total_wickets - a.total_wickets);

  return {
    stats,
    battingLeaderboard,
    bowlingLeaderboard,
    isLoading,
    isError,
    updateStats: updateStatsMutation.mutate,
    refetch,
  };
}
