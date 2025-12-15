import { cn } from "@/lib/utils";
import type { TranslationStatus } from "@shared/schema";

interface LanguageChipProps {
  language: string;
  status: TranslationStatus;
  onClick?: () => void;
  className?: string;
}

const statusStyles: Record<TranslationStatus, string> = {
  not_started: "bg-muted text-muted-foreground border-transparent",
  in_progress: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800",
  completed: "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800",
};

export function LanguageChip({ language, status, onClick, className }: LanguageChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition-all",
        "hover-elevate active-elevate-2",
        statusStyles[status],
        onClick && "cursor-pointer",
        className
      )}
      data-testid={`chip-language-${language.toLowerCase()}`}
    >
      {language}
    </button>
  );
}
