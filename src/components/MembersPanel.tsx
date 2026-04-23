import { useApp } from "@/context/AppContext";
import { Crown, Copy, LogOut } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export const MembersPanel = () => {
  const { t, group, me, isAdmin, promoteMember, leaveSession } = useApp();
  if (!group) return null;

  const copyCode = () => {
    navigator.clipboard.writeText(group.id);
    toast.success(t("codeCopied"));
  };

  return (
    <div className="space-y-4">
      {/* Invite */}
      <div className="bg-gradient-sky rounded-3xl p-5 shadow-card">
        <div className="text-xs font-semibold text-foreground/60 mb-2">{t("inviteCode")}</div>
        <div className="flex items-center gap-3">
          <div className="font-mono font-bold text-3xl tracking-widest flex-1">{group.id}</div>
          <button
            onClick={copyCode}
            className="h-12 w-12 rounded-2xl bg-white/60 hover:bg-white/80 flex items-center justify-center transition-colors"
            aria-label={t("copyCode")}
          >
            <Copy className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Members list */}
      <div className="glass rounded-3xl p-5 shadow-card">
        <h3 className="font-display font-bold mb-3">{t("members")}</h3>
        <div className="space-y-2">
          {group.members.map((m) => (
            <div key={m.id} className="flex items-center gap-3 p-3 rounded-2xl hover:bg-muted/40 transition-colors">
              <div className="h-11 w-11 rounded-2xl bg-gradient-mint flex items-center justify-center text-xl">
                {m.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold flex items-center gap-1.5">
                  {m.name}
                  {m.id === me?.id && <span className="text-xs text-muted-foreground">({t("welcome")})</span>}
                </div>
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  {m.role === "admin" && <Crown className="h-3 w-3 text-yellow-600" />}
                  {m.role === "admin" ? t("admin") : t("member")}
                </div>
              </div>
              {isAdmin && m.role !== "admin" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => promoteMember(m.id)}
                  className="rounded-xl text-xs"
                >
                  <Crown className="h-3 w-3 mr-1" /> {t("makeAdmin")}
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={() => {
          if (confirm(t("confirmLeave"))) leaveSession();
        }}
        className="w-full p-4 rounded-2xl text-destructive-foreground bg-destructive/30 hover:bg-destructive/50 transition-colors text-sm font-semibold flex items-center justify-center gap-2"
      >
        <LogOut className="h-4 w-4" /> {t("leaveGroup")}
      </button>
    </div>
  );
};
