import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { Statistics } from "./Statistics";
import { MembersPanel } from "./MembersPanel";
import { AddTransactionDialog } from "./AddTransactionDialog";
import { LangCurrencySwitcher } from "./LangCurrencySwitcher";
import { Plus, BarChart3, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

type Tab = "stats" | "members";

export const Dashboard = () => {
  const { t, group, me } = useApp();
  const [tab, setTab] = useState<Tab>("stats");
  const [addOpen, setAddOpen] = useState(false);

  if (!group || !me) return null;

  return (
    <div className="min-h-screen pb-32">
      <div className="max-w-2xl mx-auto px-4 pt-6">
        {/* Header */}
        <header className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-12 w-12 rounded-2xl bg-gradient-mint flex items-center justify-center text-2xl shadow-card">
              {me.emoji}
            </div>
            <div className="min-w-0">
              <div className="text-xs text-muted-foreground">{group.name}</div>
              <div className="font-display font-bold text-lg truncate">
                {t("welcome")}, {me.name}!
              </div>
            </div>
          </div>
          <LangCurrencySwitcher />
        </header>

        {/* Tabs */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-muted/50 rounded-2xl mb-5">
          <TabBtn active={tab === "stats"} onClick={() => setTab("stats")} icon={<BarChart3 className="h-4 w-4" />}>
            {t("statistics")}
          </TabBtn>
          <TabBtn active={tab === "members"} onClick={() => setTab("members")} icon={<Users className="h-4 w-4" />}>
            {t("members")}
          </TabBtn>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {tab === "stats" ? <Statistics /> : <MembersPanel />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* FAB */}
      <button
        onClick={() => setAddOpen(true)}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 h-16 px-7 rounded-full bg-gradient-mint text-primary-foreground shadow-glow hover:shadow-soft hover:-translate-y-1 transition-all flex items-center gap-2 font-bold text-base z-40"
      >
        <Plus className="h-6 w-6" /> {t("addTransaction")}
      </button>

      <AddTransactionDialog open={addOpen} onOpenChange={setAddOpen} />
    </div>
  );
};

const TabBtn = ({ active, onClick, icon, children }: { active: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode }) => (
  <button
    onClick={onClick}
    className={cn(
      "h-11 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold transition-all",
      active ? "bg-card shadow-soft text-foreground" : "text-muted-foreground hover:text-foreground"
    )}
  >
    {icon}
    {children}
  </button>
);
