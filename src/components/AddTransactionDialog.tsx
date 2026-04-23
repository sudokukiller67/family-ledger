import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DEFAULT_CATEGORIES, TRANSFER_CATEGORY } from "@/lib/types";
import { TxType } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export const AddTransactionDialog = ({ open, onOpenChange }: Props) => {
  const { t, addTransaction, currencySymbol, group, activeMember, rememberRecipient } = useApp();
  const [type, setType] = useState<TxType>("expense");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState<Date>(new Date());
  const [category, setCategory] = useState<string>("cat_food");
  const [customCat, setCustomCat] = useState("");
  const [comment, setComment] = useState("");

  // Recipient state for transfers
  const [recipientMode, setRecipientMode] = useState<"list" | "manual">("list");
  const [recipientMember, setRecipientMember] = useState<string>("");
  const [recipientManual, setRecipientManual] = useState("");

  const reset = () => {
    setType("expense"); setAmount(""); setDate(new Date());
    setCategory("cat_food"); setCustomCat(""); setComment("");
    setRecipientMode("list"); setRecipientMember(""); setRecipientManual("");
  };

  const isTransfer = type === "expense" && category === TRANSFER_CATEGORY;

  const handleSubmit = () => {
    const num = parseFloat(amount.replace(",", "."));
    if (!num || num <= 0) return;

    if (type === "income") {
      addTransaction({
        type: "income",
        amount: num,
        date: date.toISOString(),
        category: "cat_other",
        comment: comment.trim() || undefined,
      });
    } else {
      let cat = category;
      let recipient: string | undefined;
      if (category === "custom") cat = `custom:${customCat.trim() || "—"}`;
      if (isTransfer) {
        const memberName = group?.members.find((m) => m.id === recipientMember)?.name;
        recipient =
          recipientMode === "list"
            ? memberName
            : recipientManual.trim();
        if (!recipient) return;
        if (recipientMode === "manual") rememberRecipient(recipient);
      }
      addTransaction({
        type: "expense",
        amount: num,
        date: date.toISOString(),
        category: cat,
        comment: comment.trim() || undefined,
        recipient,
      });
    }
    reset();
    onOpenChange(false);
  };

  const typeStyles: Record<TxType, string> = {
    income: "bg-gradient-mint text-primary-foreground",
    expense: "bg-gradient-peach text-accent-foreground",
  };

  const expenseCategories = DEFAULT_CATEGORIES;
  const knownRecipients = group?.recipients ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl max-w-md p-6 border-0 shadow-soft max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-display">{t("addTransaction")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {activeMember && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-2xl px-3 py-2">
              <span>{t("activeMember")}:</span>
              <span className="text-base">{activeMember.emoji}</span>
              <span className="font-semibold text-foreground">{activeMember.name}</span>
            </div>
          )}

          {/* Type tabs */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-muted/50 rounded-2xl">
            {(["income", "expense"] as TxType[]).map((tType) => (
              <button
                key={tType}
                onClick={() => setType(tType)}
                className={cn(
                  "py-2.5 rounded-xl text-sm font-semibold transition-all",
                  type === tType ? typeStyles[tType] + " shadow-soft" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {t(tType)}
              </button>
            ))}
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-semibold mb-2 text-foreground/80">{t("amount")}</label>
            <div className="relative">
              <Input
                type="number"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={type === "income" ? t("depositAmount") : "0.00"}
                className="rounded-2xl h-14 text-2xl font-bold pr-14"
              />
              <span className="absolute right-5 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">
                {currencySymbol}
              </span>
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-semibold mb-2 text-foreground/80">{t("date")}</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full h-12 rounded-2xl justify-start font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(date, "PPP")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 rounded-2xl" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => d && setDate(d)}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Expense-only fields */}
          {type === "expense" && (
            <>
              <div>
                <label className="block text-sm font-semibold mb-2 text-foreground/80">{t("category")}</label>
                <div className="grid grid-cols-3 gap-2">
                  {expenseCategories.map((c) => (
                    <button
                      key={c.key}
                      onClick={() => setCategory(c.key)}
                      className={cn(
                        "p-3 rounded-2xl border-2 transition-all text-sm font-medium",
                        category === c.key
                          ? "border-primary bg-primary/10 shadow-soft"
                          : "border-transparent bg-muted/50 hover:bg-muted"
                      )}
                    >
                      <div className="text-xl mb-1">{c.emoji}</div>
                      {t(c.key as never)}
                    </button>
                  ))}
                  <button
                    onClick={() => setCategory("custom")}
                    className={cn(
                      "p-3 rounded-2xl border-2 transition-all text-sm font-medium",
                      category === "custom"
                        ? "border-primary bg-primary/10 shadow-soft"
                        : "border-transparent bg-muted/50 hover:bg-muted"
                    )}
                  >
                    <div className="text-xl mb-1">➕</div>
                    {t("customCategory")}
                  </button>
                </div>
                {category === "custom" && (
                  <Input
                    value={customCat}
                    onChange={(e) => setCustomCat(e.target.value)}
                    placeholder={t("enterCustom")}
                    className="rounded-2xl h-11 mt-2"
                  />
                )}
              </div>

              {/* Recipient for transfer */}
              {isTransfer && (
                <div>
                  <label className="block text-sm font-semibold mb-2 text-foreground/80">{t("recipient")}</label>
                  <div className="grid grid-cols-2 gap-2 p-1 bg-muted/50 rounded-2xl mb-2">
                    {(["list", "manual"] as const).map((m) => (
                      <button
                        key={m}
                        onClick={() => setRecipientMode(m)}
                        className={cn(
                          "py-2 rounded-xl text-xs font-semibold transition-all",
                          recipientMode === m
                            ? "bg-card shadow-soft text-foreground"
                            : "text-muted-foreground"
                        )}
                      >
                        {m === "list" ? t("selectFromList") : t("enterManually")}
                      </button>
                    ))}
                  </div>
                  {recipientMode === "list" ? (
                    <div className="grid grid-cols-2 gap-2">
                      {group?.members.map((m) => (
                        <button
                          key={m.id}
                          onClick={() => setRecipientMember(m.id)}
                          className={cn(
                            "p-2.5 rounded-2xl border-2 text-sm font-medium flex items-center gap-2 transition-all",
                            recipientMember === m.id
                              ? "border-primary bg-primary/10"
                              : "border-transparent bg-muted/50 hover:bg-muted"
                          )}
                        >
                          <span className="text-lg">{m.emoji}</span>
                          <span className="truncate">{m.name}</span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <>
                      <Input
                        value={recipientManual}
                        onChange={(e) => setRecipientManual(e.target.value)}
                        placeholder={t("recipientPlaceholder")}
                        list="known-recipients"
                        className="rounded-2xl h-11"
                      />
                      <datalist id="known-recipients">
                        {knownRecipients.map((r) => (
                          <option key={r} value={r} />
                        ))}
                      </datalist>
                      {knownRecipients.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {knownRecipients.slice(0, 8).map((r) => (
                            <button
                              key={r}
                              onClick={() => setRecipientManual(r)}
                              className="px-2.5 py-1 rounded-full bg-muted/60 hover:bg-muted text-xs"
                            >
                              {r}
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </>
          )}

          {/* Comment (always) */}
          <div>
            <label className="block text-sm font-semibold mb-2 text-foreground/80">{t("comment")}</label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={2}
              className="rounded-2xl resize-none"
            />
          </div>

          <Button
            onClick={handleSubmit}
            className="w-full h-12 rounded-2xl text-base font-semibold bg-gradient-mint text-primary-foreground hover:opacity-90 shadow-soft"
          >
            {t("save")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
