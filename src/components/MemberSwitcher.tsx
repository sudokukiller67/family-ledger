import { useApp } from "@/context/AppContext";
import { cn } from "@/lib/utils";

export const MemberSwitcher = () => {
  const { t, group, activeMember, setActiveMemberId } = useApp();
  if (!group || group.members.length === 0) return null;

  return (
    <div className="glass rounded-2xl p-2 shadow-card">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground px-2 pt-1 pb-1.5 font-semibold">
        {t("activeMember")}
      </div>
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {group.members.map((m) => {
          const active = m.id === activeMember?.id;
          return (
            <button
              key={m.id}
              onClick={() => setActiveMemberId(m.id)}
              className={cn(
                "shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all",
                active
                  ? "bg-gradient-mint text-primary-foreground shadow-soft scale-105"
                  : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
              title={m.name}
            >
              <span className="text-base leading-none">{m.emoji}</span>
              <span className="max-w-[80px] truncate">{m.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
