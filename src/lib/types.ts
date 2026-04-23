export type Role = "admin" | "member";

export interface Member {
  id: string;
  name: string;
  emoji: string;
  role: Role;
}

export type TxType = "income" | "expense";

export interface Transaction {
  id: string;
  type: TxType;
  amount: number;
  date: string; // ISO
  memberId: string;
  category: string; // category key like "cat_food", "cat_transfer", or custom string prefixed "custom:"
  comment?: string;
  recipient?: string; // for cat_transfer
  createdAt: string;
}

export interface Group {
  id: string; // invite code
  name: string;
  members: Member[];
  transactions: Transaction[];
  recipients?: string[]; // remembered manual recipients for transfers
  createdAt: string;
}

export const TRANSFER_CATEGORY = "cat_transfer";

export const DEFAULT_CATEGORIES = [
  { key: "cat_food", emoji: "🛒", color: "hsl(var(--mint))" },
  { key: "cat_housing", emoji: "🏠", color: "hsl(var(--sky))" },
  { key: "cat_health", emoji: "💊", color: "hsl(var(--pink))" },
  { key: "cat_transport", emoji: "🚗", color: "hsl(var(--peach))" },
  { key: "cat_fun", emoji: "🎉", color: "hsl(var(--lavender))" },
  { key: "cat_transfer", emoji: "💸", color: "hsl(var(--pink))" },
  { key: "cat_other", emoji: "✨", color: "hsl(var(--yellow))" },
] as const;

export const AVATAR_EMOJIS = [
  "🦊","🐻","🐼","🐨","🦁","🐯","🐸","🐧","🐰","🦄",
  "🍎","🍊","🍋","🍉","🍓","🥝","🍑","🥑","🍇","🍒",
  "🌸","🌻","🌈","⭐","🌙","☀️","🍀","🌷","🦋","🐳",
];
