import { useApp } from "@/context/AppContext";
import { AVATAR_EMOJIS } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Props {
  value: string;
  onChange: (emoji: string) => void;
}

export const EmojiPicker = ({ value, onChange }: Props) => {
  const { t } = useApp();
  return (
    <div>
      <label className="block text-sm font-semibold mb-2 text-foreground/80">
        {t("chooseAvatar")}
      </label>
      <div className="grid grid-cols-10 gap-2 p-3 rounded-2xl bg-muted/50">
        {AVATAR_EMOJIS.map((e) => (
          <button
            key={e}
            type="button"
            onClick={() => onChange(e)}
            className={cn(
              "h-10 w-10 rounded-2xl text-xl flex items-center justify-center transition-all",
              "hover:scale-110 hover:bg-card",
              value === e && "bg-card shadow-soft scale-110 ring-2 ring-primary"
            )}
          >
            {e}
          </button>
        ))}
      </div>
    </div>
  );
};
