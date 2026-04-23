import { useMemo, useState } from "react";
import { useApp } from "@/context/AppContext";
import { DEFAULT_CATEGORIES, Transaction, TRANSFER_CATEGORY } from "@/lib/types";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

function getCategoryMeta(catKey: string, t: (k: any) => string) {
  if (catKey.startsWith("custom:")) {
    return { label: catKey.slice(7), emoji: "✨", color: "hsl(var(--yellow))" };
  }
  const found = DEFAULT_CATEGORIES.find((c) => c.key === catKey);
  return {
    label: found ? t(found.key) : catKey,
    emoji: found?.emoji ?? "✨",
    color: found?.color ?? "hsl(var(--muted))",
  };
}

type StatsView = "expenses" | "incomes";

export const Statistics = () => {
  const { t, group, formatMoney, lang } = useApp();
  const [monthOffset, setMonthOffset] = useState(0);
  const [view, setView] = useState<StatsView>("expenses");

  const ref = useMemo(() => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() + monthOffset);
    return d;
  }, [monthOffset]);

  const monthLabel = new Intl.DateTimeFormat(
    lang === "ru" ? "ru-RU" : lang === "pl" ? "pl-PL" : "en-US",
    { month: "long", year: "numeric" }
  ).format(ref);

  // Monthly aggregates
  const { incomes, expenses, byCat, txs, transfersByRecipient } = useMemo(() => {
    const all = group?.transactions ?? [];
    const filtered = all.filter((tx) => {
      const d = new Date(tx.date);
      return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth();
    });
    let inc = 0, exp = 0;
    const cats: Record<string, number> = {};
    const recipients: Record<string, number> = {};
    for (const tx of filtered) {
      if (tx.type === "income") {
        inc += tx.amount;
      } else if (tx.type === "expense") {
        exp += tx.amount;
        cats[tx.category] = (cats[tx.category] || 0) + tx.amount;
        if (tx.category === TRANSFER_CATEGORY && tx.recipient) {
          recipients[tx.recipient] = (recipients[tx.recipient] || 0) + tx.amount;
        }
      }
    }
    return {
      incomes: inc,
      expenses: exp,
      byCat: cats,
      txs: filtered,
      transfersByRecipient: Object.entries(recipients).sort((a, b) => b[1] - a[1]),
    };
  }, [group, ref]);

  // Total treasury (all-time)
  const treasury = useMemo(() => {
    const all = group?.transactions ?? [];
    let bal = 0;
    for (const tx of all) {
      if (tx.type === "income") bal += tx.amount;
      else if (tx.type === "expense") bal -= tx.amount;
    }
    return bal;
  }, [group]);

  const totalForView = view === "expenses" ? expenses : incomes;

  const pieData = useMemo(() => {
    if (view === "expenses") {
      return Object.entries(byCat).map(([cat, value]) => {
        const meta = getCategoryMeta(cat, t);
        return { name: `${meta.emoji} ${meta.label}`, value, color: meta.color };
      });
    }
    // incomes — single bucket
    if (incomes <= 0) return [];
    return [{ name: `💰 ${t("incomes")}`, value: incomes, color: "hsl(var(--mint))" }];
  }, [view, byCat, incomes, t]);

  return (
    <div className="space-y-4">
      {/* Treasury */}
      <div className="glass rounded-3xl p-5 shadow-card">
        <div className="text-xs font-semibold text-muted-foreground mb-1">{t("treasury")}</div>
        <div
          className={cn(
            "font-display font-bold text-3xl transition-colors",
            treasury < 0 ? "text-destructive" : "text-foreground"
          )}
        >
          {formatMoney(treasury)}
        </div>
      </div>

      {/* Month switcher */}
      <div className="flex items-center justify-between glass rounded-2xl p-3 shadow-card">
        <button
          onClick={() => setMonthOffset((x) => x - 1)}
          className="h-10 w-10 rounded-xl hover:bg-muted flex items-center justify-center transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="font-display font-bold text-lg capitalize">{monthLabel}</div>
        <button
          onClick={() => setMonthOffset((x) => Math.min(0, x + 1))}
          disabled={monthOffset >= 0}
          className="h-10 w-10 rounded-xl hover:bg-muted flex items-center justify-center transition-colors disabled:opacity-30"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Clickable totals */}
      <div className="grid grid-cols-2 gap-3">
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setView("incomes")}
          className={cn(
            "bg-gradient-mint rounded-3xl p-4 shadow-card text-left transition-all",
            view === "incomes" ? "ring-2 ring-primary scale-[1.02]" : "opacity-80 hover:opacity-100"
          )}
        >
          <div className="text-xs font-semibold text-primary-foreground/70 mb-1">{t("totalIncome")}</div>
          <div className="font-display font-bold text-lg text-primary-foreground truncate">{formatMoney(incomes)}</div>
        </motion.button>
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setView("expenses")}
          className={cn(
            "bg-gradient-peach rounded-3xl p-4 shadow-card text-left transition-all",
            view === "expenses" ? "ring-2 ring-primary scale-[1.02]" : "opacity-80 hover:opacity-100"
          )}
        >
          <div className="text-xs font-semibold text-accent-foreground/70 mb-1">{t("totalExpense")}</div>
          <div className="font-display font-bold text-lg text-accent-foreground truncate">{formatMoney(expenses)}</div>
        </motion.button>
      </div>

      {/* Pie */}
      <div className="glass rounded-3xl p-5 shadow-card">
        <h3 className="font-display font-bold mb-3">
          {view === "expenses" ? t("expenses") : t("incomes")} · {t("byCategory")}
        </h3>
        {pieData.length === 0 ? (
          <div className="text-center text-muted-foreground py-12 text-sm">
            {t("noTransactions")}
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="w-full sm:w-1/2 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={85}
                    paddingAngle={3}
                  >
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} stroke="hsl(var(--background))" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: 16,
                      border: "none",
                      background: "hsl(var(--card))",
                      boxShadow: "0 8px 24px -8px hsl(250 40% 60% / 0.2)",
                    }}
                    formatter={(v: number, name) => {
                      const pct = totalForView > 0 ? ((v / totalForView) * 100).toFixed(1) : "0";
                      return [`${formatMoney(v)} · ${pct}% ${t("percentOfTotal")}`, name as string];
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full sm:w-1/2 space-y-2">
              {pieData
                .slice()
                .sort((a, b) => b.value - a.value)
                .map((d) => {
                  const pct = totalForView > 0 ? ((d.value / totalForView) * 100).toFixed(1) : "0";
                  return (
                    <div key={d.name} className="flex items-center justify-between text-sm gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="h-3 w-3 rounded-full shrink-0" style={{ background: d.color }} />
                        <span className="truncate">{d.name}</span>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-semibold">{formatMoney(d.value)}</div>
                        <div className="text-[10px] text-muted-foreground">{pct}%</div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </div>

      {/* Transfers by recipient (only in expense view) */}
      {view === "expenses" && transfersByRecipient.length > 0 && (
        <div className="glass rounded-3xl p-5 shadow-card">
          <h3 className="font-display font-bold mb-3">💸 {t("transfersTo")}</h3>
          <div className="space-y-2">
            {transfersByRecipient.map(([name, sum]) => (
              <div
                key={name}
                className="flex items-center justify-between p-3 rounded-2xl bg-muted/40"
              >
                <span className="font-semibold truncate">{name}</span>
                <span className="font-display font-bold text-rose-700">{formatMoney(sum)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tx list */}
      <div className="glass rounded-3xl p-5 shadow-card">
        <h3 className="font-display font-bold mb-3">{t("transactions")}</h3>
        {txs.length === 0 ? (
          <div className="text-center text-muted-foreground py-8 text-sm">{t("addFirst")}</div>
        ) : (
          <div className="space-y-2">
            {txs.map((tx) => <TxRow key={tx.id} tx={tx} />)}
          </div>
        )}
      </div>
    </div>
  );
};

const TxRow = ({ tx }: { tx: Transaction }) => {
  const { t, group, me, isAdmin, formatMoney, formatDate, deleteTransaction } = useApp();
  const member = group?.members.find((m) => m.id === tx.memberId);
  const meta = getCategoryMeta(tx.category, t);
  const canEdit = isAdmin || tx.memberId === me?.id;
  const sign = tx.type === "income" ? "+" : "−";
  const colorClass = tx.type === "income" ? "text-emerald-700" : "text-rose-700";
  const subtitle = tx.category === TRANSFER_CATEGORY && tx.recipient
    ? `→ ${tx.recipient}`
    : tx.comment;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center gap-3 p-3 rounded-2xl hover:bg-muted/40 transition-colors group"
    >
      <div
        className="h-11 w-11 rounded-2xl flex items-center justify-center text-lg shrink-0"
        style={{ background: meta.color, opacity: 0.85 }}
      >
        {meta.emoji}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 text-sm">
          <span className="font-semibold truncate">{meta.label}</span>
          {subtitle && <span className="text-muted-foreground truncate">· {subtitle}</span>}
        </div>
        <div className="text-xs text-muted-foreground flex items-center gap-1.5">
          <span>{member?.emoji} {member?.name}</span>
          <span>·</span>
          <span>{formatDate(tx.date)}</span>
        </div>
      </div>
      <div className={`font-display font-bold ${colorClass}`}>
        {sign}{formatMoney(tx.amount)}
      </div>
      {canEdit && (
        <button
          onClick={() => deleteTransaction(tx.id)}
          className="opacity-0 group-hover:opacity-100 text-xs text-muted-foreground hover:text-destructive transition-opacity"
          title={t("delete")}
        >
          ✕
        </button>
      )}
    </motion.div>
  );
};
