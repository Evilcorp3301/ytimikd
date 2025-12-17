import { cn } from "@/lib/utils";
import type { TranslationStatus } from "@shared/schema";

interface LanguageChipProps {
  language: string;
  status: TranslationStatus;
  scheduledDate?: Date | null;
  onClick?: () => void;
  className?: string;
}

type DisplayStatus = "not_started" | "in_progress" | "completed" | "scheduled";

function getDisplayStatus(status: TranslationStatus, scheduledDate?: Date | null): DisplayStatus {
  if (scheduledDate) {
    const scheduled = new Date(scheduledDate);
    const now = new Date();
    if (scheduled.getTime() > now.getTime()) {
      return "scheduled";
    }
  }
  return status;
}

function getStatusLabel(status: DisplayStatus): string {
  switch (status) {
    case "not_started":
      return "Не начато";
    case "in_progress":
      return "В работе";
    case "completed":
      return "Готово";
    case "scheduled":
      return "Запланировано";
    default:
      return "";
  }
}

const statusStyles: Record<DisplayStatus, string> = {
  not_started: "bg-muted/50 text-muted-foreground border-muted-foreground/30",
  in_progress: "bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700",
  completed: "bg-green-50 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700",
  scheduled: "bg-purple-50 text-purple-700 border-purple-300 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-700",
};

export function LanguageChip({ language, status, scheduledDate, onClick, className }: LanguageChipProps) {
  const displayStatus = getDisplayStatus(status, scheduledDate);
  const statusLabel = getStatusLabel(displayStatus);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-all",
        "hover-elevate active-elevate-2",
        statusStyles[displayStatus],
        onClick && "cursor-pointer",
        className
      )}
      data-testid={`chip-language-${language.toLowerCase()}`}
      title={`${language} - ${statusLabel}`}
    >
      <span className="font-medium">{language}</span>
      <span className="text-[10px] leading-none opacity-75">{statusLabel}</span>
    </button>
  );
}
