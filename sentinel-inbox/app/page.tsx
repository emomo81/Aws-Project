import InboxApp from "@/components/InboxApp";

// The inbox is fully interactive (client-side) and currently runs on mock data
// from lib/seed.ts. To wire the real backend:
//   1. Fetch transactions from Supabase here (Server Component) and pass as a prop.
//   2. Subscribe to Supabase Realtime in InboxApp for live alert updates.
//   3. Route fraud scoring through /api/score (server-side SageMaker proxy).
export default function Page() {
  return <InboxApp />;
}
