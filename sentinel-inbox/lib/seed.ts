import type { Txn, Band } from "./types";

// Mock transactions — mirrors the design prototype's seed data 1:1.
// Replace with a Supabase query (see lib/supabase.ts) when wiring the real backend.
type RawTxn = Omit<Txn, "read"> & { read?: boolean };

const t = (
  id: string, merchant: string, amount: number, cat: string, score: number,
  status: Txn["status"], time: string, ago: string, city: string, country: string,
  last4: string, device: string, channel: string, feats: Txn["feats"], starred: boolean,
): Txn => ({
  id, merchant, amount, cat, score, status, time, ago, city, country,
  last4, device, channel, feats, starred,
  read: status !== "new",
});

export const SEED: Txn[] = [
  t("TXN-88213", "Lumira Marketplace", 1240.0, "Online shopping", 0.97, "new", "10:42", "12 min", "Lagos", "NG", "4471", "iPhone 14 · Safari", "card-not-present", [["Amount 18× customer avg", 34, "up"], ["New device fingerprint", 26, "up"], ["Velocity: 6 txns / 4 min", 22, "up"], ["Billing≠shipping country", 12, "up"]], true),
  t("TXN-88207", "PetroMax Fuel", 89.5, "Gas / transport", 0.91, "new", "10:39", "15 min", "Abuja", "NG", "9920", "Android · Chrome", "card-present", [["Card tested 3× in 90s", 38, "up"], ["Unusual hour (03:11)", 24, "up"], ["Merchant high-risk MCC", 19, "up"], ["Geo jump 480km", 11, "up"]], false),
  t("TXN-88199", "FreshCart Grocery", 450.0, "Grocery", 0.64, "review", "10:31", "23 min", "Nairobi", "KE", "3310", "Web · Edge", "card-not-present", [["Amount above category norm", 28, "up"], ["First purchase at merchant", 21, "up"], ["Trusted device", -14, "down"], ["Known IP range", -9, "down"]], false),
  t("TXN-88188", "Cineplex Stream", 12.0, "Entertainment", 0.22, "review", "10:18", "36 min", "Accra", "GH", "1180", "Smart TV app", "recurring", [["Recurring subscription", -31, "down"], ["Stable device", -18, "down"], ["Off-hours charge", 9, "up"]], false),
  t("TXN-88172", "Vega Wire Transfer", 5400.0, "Money transfer", 0.94, "new", "09:58", "56 min", "Johannesburg", "ZA", "7782", "Web · Chrome", "transfer", [["Large outbound transfer", 33, "up"], ["New beneficiary", 27, "up"], ["Account age 6 days", 23, "up"], ["VPN / proxy IP", 13, "up"]], true),
  t("TXN-88150", "Nimbus Cloud", 79.99, "SaaS / software", 0.31, "review", "09:40", "1 hr", "Cairo", "EG", "2245", "Web · Firefox", "card-not-present", [["Matches prior charges", -22, "down"], ["Trusted merchant", -17, "down"], ["Slight amount change", 7, "up"]], false),
  t("TXN-88133", "GoldTap Jewelry", 2310.0, "Luxury retail", 0.88, "new", "09:22", "1 hr", "Lagos", "NG", "5567", "iPhone 15 · Safari", "card-present", [["High-value luxury MCC", 29, "up"], ["Outside spending pattern", 26, "up"], ["Recently reset PIN", 18, "up"], ["Same-store repeat 2h", 9, "up"]], false),
  t("TXN-88120", "MetroRide", 6.75, "Gas / transport", 0.14, "cleared", "09:05", "2 hr", "Kampala", "UG", "4471", "Android · App", "card-present", [["Routine commute charge", -29, "down"], ["Trusted device", -20, "down"]], false),
  t("TXN-88098", "ByteForge Games", 64.0, "Online shopping", 0.58, "review", "08:47", "2 hr", "Lagos", "NG", "3310", "Console", "card-not-present", [["Mismatched billing zip", 24, "up"], ["Gift-card adjacent MCC", 17, "up"], ["Returning customer", -12, "down"]], false),
  t("TXN-88061", "Harbor Airlines", 980.0, "Travel", 0.79, "new", "08:20", "3 hr", "Dakar", "SN", "7782", "Web · Chrome", "card-not-present", [["One-way intl, same-day", 27, "up"], ["New passenger name", 22, "up"], ["Card added 1h ago", 20, "up"], ["Loyalty number present", -11, "down"]], false),
  t("TXN-88034", "Sunbelt Pharmacy", 43.2, "Healthcare", 0.19, "cleared", "07:58", "3 hr", "Lagos", "NG", "9920", "Web · Safari", "card-present", [["In-network pharmacy", -26, "down"], ["Typical basket size", -15, "down"]], false),
  t("TXN-87990", "Kova Electronics", 1899.0, "Online shopping", 0.92, "fraud", "07:30", "4 hr", "Lagos", "NG", "5567", "Web · Chrome", "card-not-present", [["Confirmed chargeback ring", 40, "up"], ["Stolen-card BIN match", 31, "up"], ["Reshipper address", 18, "up"]], false),
];

export function band(s: number): Band {
  if (s >= 0.8) return { key: "high", label: "High risk", color: "#d93025", bg: "#fce8e6", ring: "#f6aea9" };
  if (s >= 0.4) return { key: "med", label: "Medium", color: "#b06000", bg: "#feefc3", ring: "#fcd663" };
  return { key: "low", label: "Cleared", color: "#188038", bg: "#e6f4ea", ring: "#a8dab5" };
}

export function money(n: number): string {
  return "$" + Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function themeVars(layout: "modern" | "classic"): React.CSSProperties {
  const css =
    layout === "classic"
      ? "--bg:#f5f5f5;--surface:#ffffff;--ink:#202124;--ink-soft:#5f6368;--border:#e3e3e3;--hover:#f2f2f2;--sel:#fce8e6;--sel-ink:#d93025;--accent:#d93025;--accent-ink:#ffffff;--search-bg:#ffffff;--search-bd:#dadce0;--search-radius:4px;--rowsel:#fff8f7;--pill:4px"
      : "--bg:#f8fafd;--surface:#ffffff;--ink:#1f1f1f;--ink-soft:#444746;--border:#eef0f3;--hover:#f0f4f9;--sel:#d3e3fd;--sel-ink:#001d35;--accent:#c2e7ff;--accent-ink:#001d35;--search-bg:#eaf1fb;--search-bd:transparent;--search-radius:26px;--rowsel:#fdf0ef;--pill:14px";
  const o: any = {};
  css.split(";").forEach((d) => {
    const i = d.indexOf(":");
    if (i < 0) return;
    o[d.slice(0, i).trim()] = d.slice(i + 1).trim();
  });
  return o;
}
