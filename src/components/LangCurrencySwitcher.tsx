import { useApp } from "@/context/AppContext";
import { Lang, Currency } from "@/lib/i18n";
import { Globe, Coins } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const LangCurrencySwitcher = () => {
  const { lang, currency, setLang, setCurrency } = useApp();
  return (
    <div className="flex items-center gap-2">
      <Select value={lang} onValueChange={(v) => setLang(v as Lang)}>
        <SelectTrigger className="rounded-2xl glass h-10 w-[110px] border-0 shadow-card">
          <Globe className="h-4 w-4 mr-1" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="rounded-2xl">
          <SelectItem value="ru">🇷🇺 Русский</SelectItem>
          <SelectItem value="pl">🇵🇱 Polski</SelectItem>
          <SelectItem value="en">🇬🇧 English</SelectItem>
        </SelectContent>
      </Select>
      <Select value={currency} onValueChange={(v) => setCurrency(v as Currency)}>
        <SelectTrigger className="rounded-2xl glass h-10 w-[90px] border-0 shadow-card">
          <Coins className="h-4 w-4 mr-1" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="rounded-2xl">
          <SelectItem value="EUR">€ EUR</SelectItem>
          <SelectItem value="PLN">zł PLN</SelectItem>
          <SelectItem value="USD">$ USD</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};
