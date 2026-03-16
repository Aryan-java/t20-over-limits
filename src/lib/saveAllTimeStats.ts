import { supabase } from "@/integrations/supabase/client";
import { Match, Player } from "@/types/cricket";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function upsertPlayerStats(player: Player, teamName: string, didBat: boolean, didBowl: boolean) {
  const playerId = player.id;

  const { data: existing } = await supabase
    .from("player_all_time_stats")
    .select("*")
    .eq("player_id", playerId)
    .maybeSingle();

  const battingRuns = player.runs || 0;
  const ballsFaced = player.balls || 0;
  const fours = player.fours || 0;
  const sixes = player.sixes || 0;
  const isNotOut = !player.dismissed && didBat ? 1 : 0;
  const fifties = battingRuns >= 50 && battingRuns < 100 ? 1 : 0;
  const hundreds = battingRuns >= 100 ? 1 : 0;
  const wickets = player.wickets || 0;
  const runsConceded = player.runsConceded || 0;
  const ballsBowled = Math.floor((player.oversBowled || 0) * 6);
  const maidens = player.maidens || 0;

  if (existing) {
    const ex = existing as any;
    const { error } = await supabase
      .from("player_all_time_stats")
      .update({
        player_name: player.name,
        team_name: teamName,
        image_url: player.imageUrl || ex.image_url,
        matches_batted: ex.matches_batted + (didBat ? 1 : 0),
        total_runs: ex.total_runs + battingRuns,
        balls_faced: ex.balls_faced + ballsFaced,
        highest_score: Math.max(ex.highest_score, battingRuns),
        fifties: ex.fifties + fifties,
        hundreds: ex.hundreds + hundreds,
        fours: ex.fours + fours,
        sixes: ex.sixes + sixes,
        not_outs: ex.not_outs + isNotOut,
        matches_bowled: ex.matches_bowled + (didBowl ? 1 : 0),
        total_wickets: ex.total_wickets + wickets,
        balls_bowled: ex.balls_bowled + ballsBowled,
        runs_conceded: ex.runs_conceded + runsConceded,
        best_bowling_wickets:
          wickets > ex.best_bowling_wickets
            ? wickets
            : wickets === ex.best_bowling_wickets && runsConceded < ex.best_bowling_runs
            ? wickets
            : ex.best_bowling_wickets,
        best_bowling_runs:
          wickets > ex.best_bowling_wickets
            ? runsConceded
            : wickets === ex.best_bowling_wickets && runsConceded < ex.best_bowling_runs
            ? runsConceded
            : ex.best_bowling_runs,
        maidens: ex.maidens + maidens,
      } as any)
      .eq("player_id", playerId);
    if (error) {
      console.error(`Failed to update stats for ${player.name}:`, error);
      throw error;
    }
  } else {
    const { error } = await supabase.from("player_all_time_stats").insert({
      player_id: playerId,
      player_name: player.name,
      team_name: teamName,
      image_url: player.imageUrl || null,
      matches_batted: didBat ? 1 : 0,
      total_runs: battingRuns,
      balls_faced: ballsFaced,
      highest_score: battingRuns,
      fifties,
      hundreds,
      fours,
      sixes,
      not_outs: isNotOut,
      matches_bowled: didBowl ? 1 : 0,
      total_wickets: wickets,
      balls_bowled: ballsBowled,
      runs_conceded: runsConceded,
      best_bowling_wickets: wickets,
      best_bowling_runs: runsConceded,
      maidens,
    } as any);
    if (error) {
      console.error(`Failed to insert stats for ${player.name}:`, error);
      throw error;
    }
  }
}

export async function saveAllTimeStats(match: Match): Promise<boolean> {
  try {
    const allPlayers: { player: Player; teamName: string }[] = [];

    const team1Setup = match.team1Setup;
    const team2Setup = match.team2Setup;

    const team1Players = team1Setup?.playingXI || match.team1.squad.filter((p) => p.isPlaying);
    const team2Players = team2Setup?.playingXI || match.team2.squad.filter((p) => p.isPlaying);

    console.log(`[saveAllTimeStats] Saving stats for ${team1Players.length + team2Players.length} players`);
    console.log(`[saveAllTimeStats] Team1 setup exists: ${!!team1Setup}, Team2 setup exists: ${!!team2Setup}`);

    team1Players.forEach((p) => allPlayers.push({ player: p, teamName: match.team1.name }));
    team2Players.forEach((p) => allPlayers.push({ player: p, teamName: match.team2.name }));

    const batchSize = 3;
    for (let i = 0; i < allPlayers.length; i += batchSize) {
      const batch = allPlayers.slice(i, i + batchSize);
      await Promise.all(
        batch.map(({ player, teamName }) => {
          const didBat = (player.balls || 0) > 0 || (player.runs || 0) > 0 || player.dismissed;
          const didBowl = (player.oversBowled || 0) > 0;
          return upsertPlayerStats(player, teamName, !!didBat, !!didBowl);
        })
      );
      if (i + batchSize < allPlayers.length) await delay(200);
    }

    return true;
  } catch (err) {
    console.error("Failed to save all-time stats:", err);
    return false;
  }
}
