import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmojiPicker } from "./EmojiPicker";
import { Sparkles, Users, Plus, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { LangCurrencySwitcher } from "./LangCurrencySwitcher";

type Step = "welcome" | "create" | "join";

export const Onboarding = () => {
  const { t, createGroup, joinGroup } = useApp();
  const [step, setStep] = useState<Step>("welcome");
  const [familyName, setFamilyName] = useState("");
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("🦊");
  const [code, setCode] = useState("");

  const handleCreate = () => {
    if (!familyName.trim() || !name.trim()) {
      toast.error(t("requiredFields"));
      return;
    }
    createGroup(familyName, name, emoji);
  };

  const handleJoin = () => {
    if (!code.trim() || !name.trim()) {
      toast.error(t("requiredFields"));
      return;
    }
    const g = joinGroup(code, name, emoji);
    if (!g) toast.error(t("notFound"));
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      <div className="absolute top-4 right-4">
        <LangCurrencySwitcher />
      </div>

      <AnimatePresence mode="wait">
        {step === "welcome" && (
          <motion.div
            key="welcome"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-md"
          >
            <div className="text-center mb-10">
              <div className="text-7xl mb-4 animate-float">💝</div>
              <h1 className="text-4xl mb-2">{t("appName")}</h1>
              <p className="text-muted-foreground">{t("tagline")}</p>
            </div>

            <div className="space-y-4">
              <button
                onClick={() => setStep("create")}
                className="w-full p-6 rounded-3xl bg-gradient-mint shadow-card hover:shadow-glow transition-all hover:-translate-y-1 group"
              >
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-2xl bg-white/60 flex items-center justify-center text-2xl">
                    <Sparkles className="h-7 w-7 text-primary-foreground" />
                  </div>
                  <div className="text-left">
                    <div className="font-display font-bold text-lg text-primary-foreground">
                      {t("createGroup")}
                    </div>
                    <div className="text-sm text-primary-foreground/70">
                      {t("welcome")} 👋
                    </div>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setStep("join")}
                className="w-full p-6 rounded-3xl bg-gradient-lavender shadow-card hover:shadow-glow transition-all hover:-translate-y-1"
              >
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-2xl bg-white/60 flex items-center justify-center">
                    <Users className="h-7 w-7 text-secondary-foreground" />
                  </div>
                  <div className="text-left">
                    <div className="font-display font-bold text-lg text-secondary-foreground">
                      {t("joinGroup")}
                    </div>
                    <div className="text-sm text-secondary-foreground/70">
                      {t("enterCode")}
                    </div>
                  </div>
                </div>
              </button>
            </div>
          </motion.div>
        )}

        {step === "create" && (
          <motion.div
            key="create"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="w-full max-w-md glass rounded-3xl p-8 shadow-soft"
          >
            <button onClick={() => setStep("welcome")} className="mb-4 text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm">
              <ArrowLeft className="h-4 w-4" /> {t("back")}
            </button>
            <h2 className="text-2xl mb-6">{t("createGroup")}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2 text-foreground/80">{t("familyName")}</label>
                <Input value={familyName} onChange={(e) => setFamilyName(e.target.value)} placeholder="Smith" className="rounded-2xl h-12" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-foreground/80">{t("yourName")}</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="🌸" className="rounded-2xl h-12" />
              </div>
              <EmojiPicker value={emoji} onChange={setEmoji} />
              <Button onClick={handleCreate} className="w-full h-12 rounded-2xl text-base font-semibold bg-gradient-mint text-primary-foreground hover:opacity-90 shadow-soft">
                <Plus className="h-5 w-5 mr-1" /> {t("create")}
              </Button>
            </div>
          </motion.div>
        )}

        {step === "join" && (
          <motion.div
            key="join"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="w-full max-w-md glass rounded-3xl p-8 shadow-soft"
          >
            <button onClick={() => setStep("welcome")} className="mb-4 text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm">
              <ArrowLeft className="h-4 w-4" /> {t("back")}
            </button>
            <h2 className="text-2xl mb-6">{t("joinGroup")}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2 text-foreground/80">{t("groupCode")}</label>
                <Input
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="ABC123"
                  className="rounded-2xl h-12 tracking-widest text-center font-mono text-lg uppercase"
                  maxLength={6}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-foreground/80">{t("yourName")}</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} className="rounded-2xl h-12" />
              </div>
              <EmojiPicker value={emoji} onChange={setEmoji} />
              <Button onClick={handleJoin} className="w-full h-12 rounded-2xl text-base font-semibold bg-gradient-lavender text-secondary-foreground hover:opacity-90 shadow-soft">
                {t("join")}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
