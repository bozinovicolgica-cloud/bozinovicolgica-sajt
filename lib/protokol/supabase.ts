import "server-only";
import { supabase } from "@/lib/server/integrations";

// Isti Supabase projekat i klijent kao glavni sajt (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).
// Service role ključ, zato se poziva SAMO sa servera (API rute, server stranice).

export const supabaseConfigured = supabase() !== null;

export async function insertRow(table: string, row: Record<string, unknown>) {
  const sb = supabase();
  if (!sb) throw new Error("Supabase nije podešen (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).");
  const { error } = await sb.from(table).insert(row);
  if (error) throw new Error(`Supabase insert u ${table} nije uspeo: ${error.message}`);
}

export async function selectRows<T>(table: string, filter: Record<string, string>): Promise<T[]> {
  const sb = supabase();
  if (!sb) throw new Error("Supabase nije podešen.");
  let q = sb.from(table).select("*");
  for (const [k, v] of Object.entries(filter)) q = q.eq(k, v);
  const { data, error } = await q;
  if (error) throw new Error(`Supabase select nije uspeo: ${error.message}`);
  return (data ?? []) as T[];
}
