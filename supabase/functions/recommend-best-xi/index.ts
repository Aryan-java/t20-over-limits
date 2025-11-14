import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { teamId, players } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log(`Recommending Best XI for team ${teamId} with ${players.length} players`);

    // Prepare player data for AI analysis
    const playerSummary = players.map((p: any) => ({
      id: p.id,
      name: p.name,
      isOverseas: p.isOverseas,
      batSkill: p.batSkill,
      bowlSkill: p.bowlSkill,
      totalRuns: p.performanceHistory?.totalRuns || 0,
      totalWickets: p.performanceHistory?.totalWickets || 0,
      totalMatches: p.performanceHistory?.totalMatches || 0,
      avgRuns: p.performanceHistory?.averageRuns || 0,
      avgWickets: p.performanceHistory?.averageWickets || 0,
      formRating: p.performanceHistory?.formRating || 0,
    }));

    const systemPrompt = `You are a cricket team selector AI. Your task is to recommend the best playing XI from a squad based on player statistics and cricket team composition rules.

Rules:
1. Select exactly 11 players
2. Maximum 4 overseas players allowed
3. Team must be balanced:
   - 1 wicket-keeper (can be identified by position or skills)
   - 4-5 specialist batsmen (batSkill > 70)
   - 2-3 all-rounders (both batSkill and bowlSkill > 60)
   - 3-4 bowlers (bowlSkill > 70)
4. Consider recent performance (totalRuns, totalWickets, formRating)
5. Prioritize players with higher skills and better form

Return ONLY a JSON object with this exact structure:
{
  "selectedPlayers": ["player_id_1", "player_id_2", ...],
  "reasoning": "Brief explanation of the selection strategy",
  "teamComposition": {
    "batsmen": ["player_id"],
    "allRounders": ["player_id"],
    "bowlers": ["player_id"]
  }
}`;

    const userPrompt = `Analyze these ${players.length} players and select the best XI:

${JSON.stringify(playerSummary, null, 2)}

Remember: Maximum 4 overseas players, balanced team composition, and prioritize form and skills.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), 
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add credits to your workspace.' }), 
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;
    
    console.log('AI Response:', aiResponse);

    // Parse the AI response
    let recommendation;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = aiResponse.match(/```json\n([\s\S]*?)\n```/) || 
                        aiResponse.match(/```\n([\s\S]*?)\n```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : aiResponse;
      recommendation = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      throw new Error('Failed to parse AI recommendation');
    }

    return new Response(
      JSON.stringify(recommendation),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in recommend-best-xi function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
