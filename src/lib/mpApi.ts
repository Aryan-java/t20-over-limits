import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

async function errMsg(error: any): Promise<string> {
  try {
    const body = await error?.context?.json?.();
    if (body?.error) return typeof body.error === "string" ? body.error : JSON.stringify(body.error);
  } catch { /* ignore */ }
  return error?.message ?? "Something went wrong";
}

/** Calls a secure room action; shows a toast on failure. Returns data or null. */
export async function rpc<T = unknown>(fn: string, args: Record<string, unknown>): Promise<T | null> {
  const { data, error } = await (supabase.rpc as any)(fn, args);
  if (error) {
    toast({ title: "Not allowed", description: error.message, variant: "destructive" });
    return null;
  }
  return (data ?? true) as T;
}

export async function engine(action: "start" | "play" | "override_play" | "select_batter", roomId: string, expectedVersion: number, extra: Record<string, unknown> = {}) {
  const { data, error } = await supabase.functions.invoke("mp-engine", { body: { action, roomId, expectedVersion, ...extra } });
  if (error) {
    toast({ title: "Not allowed", description: await errMsg(error), variant: "destructive" });
    return null;
  }
  return data;
}
