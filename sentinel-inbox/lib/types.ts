// A single feature attribution from the model explainability layer (SHAP / Clarify).
// [name, signedContribution, direction]  e.g. ['Amount 18× customer avg', 34, 'up']
export type Feat = [string, number, "up" | "down"];

export type TxnStatus = "new" | "review" | "cleared" | "fraud";

export interface Txn {
  id: string;
  merchant: string;
  amount: number;
  cat: string;
  score: number; // fraud probability 0..1
  status: TxnStatus;
  time: string;
  ago: string;
  city: string;
  country: string;
  last4: string;
  device: string;
  channel: string;
  feats: Feat[];
  starred: boolean;
  read: boolean;
}

export type Layout = "modern" | "classic";

export interface Band {
  key: "high" | "med" | "low";
  label: string;
  color: string;
  bg: string;
  ring: string;
}
