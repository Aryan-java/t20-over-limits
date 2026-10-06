import { supabase } from "@/integrations/supabase/client";

/** Reads every row of a table in 1000-row pages (the backend caps a single read at 1000). */
export async function fetchAllRows<T = any>(table: "player_all_time_stats" | "player_innings"): Promise<T[]> {
  const page = 1000;
  const out: T[] = [];
  for (let from = 0; ; from += page) {
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .order("id", { ascending: true })
      .range(from, from + page - 1);
    if (error) throw error;
    out.push(...((data || []) as T[]));
    if (!data || data.length < page) break;
  }
  return out;
}
