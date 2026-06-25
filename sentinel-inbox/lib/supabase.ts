import { createClient } from "@supabase/supabase-js";
import type { Txn } from "./types";

// Browser client (safe — uses the public anon key + Row-Level Security).
// For Server Components / Route Handlers with auth cookies, use @supabase/ssr instead.
export function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) throw new Error("Supabase env vars missing — see .env.example");
  return createClient(url, anon);
}

// Maps a row from the `transactions` table to the UI's Txn shape.
// Adjust column names to match your schema (supabase/schema.sql).
export function rowToTxn(r: any): Txn {
  return {
    id: r.txn_id,
    merchant: r.merchant,
    amount: Number(r.amount),
    cat: r.category,
    score: Number(r.fraud_score),
    status: r.status,
    time: r.txn_time,
    ago: r.ago ?? "",
    city: r.city,
    country: r.country,
    last4: r.card_last4,
    device: r.device,
    channel: r.channel,
    feats: r.feats ?? [],
    starred: !!r.starred,
    read: !!r.read,
  };
}

// Example queries (uncomment in a Server Component once the table exists):
//
// export async function fetchQueue(): Promise<Txn[]> {
//   const sb = getSupabase();
//   const { data, error } = await sb
//     .from("transactions")
//     .select("*")
//     .in("status", ["new", "review"])
//     .order("fraud_score", { ascending: false });
//   if (error) throw error;
//   return (data ?? []).map(rowToTxn);
// }
//
// export async function updateStatus(id: string, status: Txn["status"]) {
//   const sb = getSupabase();
//   await sb.from("transactions").update({ status }).eq("txn_id", id);
// }
