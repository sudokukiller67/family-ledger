import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { Crown, Copy, LogOut, UserPlus, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmojiPicker } from "./EmojiPicker";
import { AVATAR_EMOJIS } from "@/lib/types";
import { motion, AnimatePresence } from "framer-motion";

export const MembersPanel = () => {
  const { t, group, me, isAdmin, promoteMember, leaveSession, addMember } = useApp();
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmoji, setNewEmoji] = useState(AVATAR_EMOJIS[0]);

  if (!group) return null;

  const copyCode = () => {
    navigator.clipboard.writeText(group.id);
    toast.success(t("codeCopied"));
  };

  const handleAdd = () => {
    if (!newName.trim()) {
      toast.error(t("requiredFields"));
      return;
    }
    addMember(newName, newEmoji);
    setNewName("");
    setNewEmoji(AVATAR_EMOJIS[0]);
    setShowAdd(false);
    toast.success(t("add") + " ✓");
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
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display font-bold">{t("members")}</h3>
          {isAdmin && (
            <Button
              size="sm"
              onClick={() => setShowAdd((v) => !v)}
              className="rounded-xl text-xs h-8"
              variant={showAdd ? "outline" : "default"}
            >
              {showAdd ? <X className="h-3.5 w-3.5 mr-1" /> : <UserPlus className="h-3.5 w-3.5 mr-1" />}
              {showAdd ? t("cancel") : t("addMember")}
            </Button>
          )}
        </div>

        <AnimatePresence>
          {showAdd && isAdmin && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="space-y-3 p-4 mb-3 rounded-2xl bg-muted/40">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-foreground/80">
                    {t("newMemberName")}
                  </label>
                  <Input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder={t("yourName")}
                    className="rounded-2xl h-11"
                  />
                </div>
                <EmojiPicker value={newEmoji} onChange={setNewEmoji} />
                <Button onClick={handleAdd} className="w-full rounded-2xl h-11 font-semibold">
                  <UserPlus className="h-4 w-4 mr-1" /> {t("add")}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

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
