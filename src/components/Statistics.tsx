import { useMemo, useState } from "react";
import { useApp } from "@/context/AppContext";
import { DEFAULT_CATEGORIES, Transaction } from "@/lib/types";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

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

export const Statistics = () => {
  const { t, group, formatMoney, lang } = useApp();
  const [monthOffset, setMonthOffset] = useState(0);

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

  const { incomes, expenses, byCat, txs } = useMemo(() => {
    const all = group?.transactions ?? [];
    const filtered = all.filter((tx) => {
      const d = new Date(tx.date);
      return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth();
    });
    let inc = 0, exp = 0;
    const cats: Record<string, number> = {};
    for (const tx of filtered) {
      if (tx.type === "income") inc += tx.amount;
      else if (tx.type === "expense") {
        exp += tx.amount;
        cats[tx.category] = (cats[tx.category] || 0) + tx.amount;
      }
    }
    return { incomes: inc, expenses: exp, byCat: cats, txs: filtered };
  }, [group, ref]);

  const pieData = Object.entries(byCat).map(([cat, value]) => {
    const meta = getCategoryMeta(cat, t);
    return { name: `${meta.emoji} ${meta.label}`, value, color: meta.color };
  });

  const balance = incomes - expenses;

  return (
    <div className="space-y-4">
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

      {/* Totals */}
      <div className="grid grid-cols-3 gap-3">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-mint rounded-3xl p-4 shadow-card">
          <div className="text-xs font-semibold text-primary-foreground/70 mb-1">{t("totalIncome")}</div>
          <div className="font-display font-bold text-lg text-primary-foreground truncate">{formatMoney(incomes)}</div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-gradient-peach rounded-3xl p-4 shadow-card">
          <div className="text-xs font-semibold text-accent-foreground/70 mb-1">{t("totalExpense")}</div>
          <div className="font-display font-bold text-lg text-accent-foreground truncate">{formatMoney(expenses)}</div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-gradient-lavender rounded-3xl p-4 shadow-card">
          <div className="text-xs font-semibold text-secondary-foreground/70 mb-1">{t("balance")}</div>
          <div className="font-display font-bold text-lg text-secondary-foreground truncate">{formatMoney(balance)}</div>
        </motion.div>
      </div>

      {/* Pie */}
      <div className="glass rounded-3xl p-5 shadow-card">
        <h3 className="font-display font-bold mb-3">{t("byCategory")}</h3>
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
                    formatter={(v: number) => formatMoney(v)}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full sm:w-1/2 space-y-2">
              {pieData
                .sort((a, b) => b.value - a.value)
                .map((d) => (
                  <div key={d.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full" style={{ background: d.color }} />
                      <span className="truncate">{d.name}</span>
                    </div>
                    <span className="font-semibold">{formatMoney(d.value)}</span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

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
  const sign = tx.type === "income" ? "+" : tx.type === "expense" ? "−" : "↔";
  const colorClass =
    tx.type === "income" ? "text-emerald-700" :
    tx.type === "expense" ? "text-rose-700" :
    "text-sky-700";

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
          {tx.comment && <span className="text-muted-foreground truncate">· {tx.comment}</span>}
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
