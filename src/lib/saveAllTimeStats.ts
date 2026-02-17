import { Match, Player } from "@/types/cricket";
import { supabase } from "@/lib/supabaseClient";

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const savePlayerStats = async (
  player: Player,
  teamName: string,
  retries = 3
): Promise<{ success: boolean; player: string; error?: unknown }> => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const runs = player.runs || 0;
      const balls = player.balls || 0;
      const fours = player.fours || 0;
      const sixes = player.sixes || 0;
      const wickets = player.wickets || 0;
      const runsConceded = player.runsConceded || 0;
      const oversBowled = player.oversBowled || 0;
      const ballsBowled = Math.floor(oversBowled) * 6 + Math.round((oversBowled % 1) * 10);
      const maidens = player.maidens || 0;
      const didBat = balls > 0 || runs > 0;
      const didBowl = ballsBowled > 0 || wickets > 0;
      const notOut = !player.dismissed && didBat ? 1 : 0;

      const { data: existing, error: fetchError } = await supabase
        .from("player_all_time_stats")
        .select("*")
        .eq("player_id", player.id)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (existing) {
        const newHighScore = Math.max(existing.highest_score, runs);
        const newFifties = existing.fifties + (runs >= 50 && runs < 100 ? 1 : 0);
        const newHundreds = existing.hundreds + (runs >= 100 ? 1 : 0);

        let bestWickets = existing.best_bowling_wickets;
        let bestRuns = existing.best_bowling_runs;
        if (wickets > bestWickets || (wickets === bestWickets && runsConceded < bestRuns)) {
          bestWickets = wickets;
          bestRuns = runsConceded;
        }

        const { error: updateError } = await supabase
          .from("player_all_time_stats")
          .update({
            player_name: player.name,
            team_name: teamName,
            image_url: player.imageUrl || null,
            matches_batted: existing.matches_batted + (didBat ? 1 : 0),
            total_runs: existing.total_runs + runs,
            balls_faced: existing.balls_faced + balls,
            highest_score: newHighScore,
            fifties: newFifties,
            hundreds: newHundreds,
            fours: existing.fours + fours,
            sixes: existing.sixes + sixes,
            not_outs: existing.not_outs + notOut,
            matches_bowled: existing.matches_bowled + (didBowl ? 1 : 0),
            total_wickets: existing.total_wickets + wickets,
            balls_bowled: existing.balls_bowled + ballsBowled,
            runs_conceded: existing.runs_conceded + runsConceded,
            best_bowling_wickets: bestWickets,
            best_bowling_runs: bestRuns,
            maidens: existing.maidens + maidens,
          })
          .eq("player_id", player.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from("player_all_time_stats")
          .insert({
            player_id: player.id,
            player_name: player.name,
            team_name: teamName,
            image_url: player.imageUrl || null,
            matches_batted: didBat ? 1 : 0,
            total_runs: runs,
            balls_faced: balls,
            highest_score: runs,
            fifties: runs >= 50 && runs < 100 ? 1 : 0,
            hundreds: runs >= 100 ? 1 : 0,
            fours: fours,
            sixes: sixes,
            not_outs: notOut,
            matches_bowled: didBowl ? 1 : 0,
            total_wickets: wickets,
            balls_bowled: ballsBowled,
            runs_conceded: runsConceded,
            best_bowling_wickets: wickets,
            best_bowling_runs: runsConceded,
            maidens: maidens,
          });

        if (insertError) throw insertError;
      }

      return { success: true, player: player.name };
    } catch (error) {
      if (attempt < retries) {
        console.log(`Retrying ${player.name} (attempt ${attempt + 1}/${retries})...`);
        await delay(500 * attempt);
        continue;
      }
      console.error(`Error saving stats for ${player.name}:`, error);
      return { success: false, player: player.name, error };
    }
  }
  return { success: false, player: player.name, error: "Max retries exceeded" };
};

export const saveAllTimeStats = async (completedMatch: Match): Promise<boolean> => {
  try {
    const allPlayers: { player: Player; teamName: string }[] = [];

    const team1Setup = completedMatch.team1Setup;
    const team2Setup = completedMatch.team2Setup;

    if (team1Setup?.playingXI) {
      team1Setup.playingXI.forEach(p =>
        allPlayers.push({ player: { ...p, currentTeamId: completedMatch.team1.id }, teamName: completedMatch.team1.name })
      );
    }
    if (team2Setup?.playingXI) {
      team2Setup.playingXI.forEach(p =>
        allPlayers.push({ player: { ...p, currentTeamId: completedMatch.team2.id }, teamName: completedMatch.team2.name })
      );
    }

    console.log(`Saving stats for ${allPlayers.length} players...`);

    const batchSize = 5;
    const results: { success: boolean; player: string; error?: unknown }[] = [];

    for (let i = 0; i < allPlayers.length; i += batchSize) {
      const batch = allPlayers.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(({ player, teamName }) => savePlayerStats(player, teamName))
      );
      results.push(...batchResults);

      if (i + batchSize < allPlayers.length) {
        await delay(100);
      }
    }

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success);

    console.log(`All-time stats saved: ${successful}/${allPlayers.length} players updated successfully`);
    if (failed.length > 0) {
      console.warn("Failed players:", failed.map(f => f.player).join(", "));
    }

    return failed.length === 0;
  } catch (error) {
    console.error("Error saving all-time stats:", error);
    return false;
  }
};
