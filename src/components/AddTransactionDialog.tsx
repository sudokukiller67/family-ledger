import { useState } from "react";
import { motion } from "framer-motion";
import { useApp } from "@/context/AppContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DEFAULT_CATEGORIES } from "@/lib/types";
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
  const { t, addTransaction, currencySymbol } = useApp();
  const [type, setType] = useState<TxType>("expense");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState<Date>(new Date());
  const [category, setCategory] = useState<string>("cat_food");
  const [customCat, setCustomCat] = useState("");
  const [comment, setComment] = useState("");

  const reset = () => {
    setType("expense"); setAmount(""); setDate(new Date());
    setCategory("cat_food"); setCustomCat(""); setComment("");
  };

  const handleSubmit = () => {
    const num = parseFloat(amount.replace(",", "."));
    if (!num || num <= 0) return;
    const cat = category === "custom" ? `custom:${customCat.trim() || "—"}` : category;
    addTransaction({
      type,
      amount: num,
      date: date.toISOString(),
      category: cat,
      comment: comment.trim() || undefined,
    });
    reset();
    onOpenChange(false);
  };

  const typeStyles: Record<TxType, string> = {
    income: "bg-gradient-mint text-primary-foreground",
    expense: "bg-gradient-peach text-accent-foreground",
    transfer: "bg-gradient-sky text-foreground",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl max-w-md p-6 border-0 shadow-soft">
        <DialogHeader>
          <DialogTitle className="text-2xl font-display">{t("addTransaction")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Type tabs */}
          <div className="grid grid-cols-3 gap-2 p-1 bg-muted/50 rounded-2xl">
            {(["income", "expense", "transfer"] as TxType[]).map((tType) => (
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
                placeholder="0.00"
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

          {/* Category */}
          <div>
            <label className="block text-sm font-semibold mb-2 text-foreground/80">{t("category")}</label>
            <div className="grid grid-cols-3 gap-2">
              {DEFAULT_CATEGORIES.map((c) => (
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

          {/* Comment */}
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
