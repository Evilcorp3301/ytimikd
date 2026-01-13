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
  in_progress: "bg-status-progress text-status-progress-fg border-status-progress-border",
  completed: "bg-status-done text-status-done-fg border-status-done-border",
  scheduled: "bg-status-scheduled text-status-scheduled-fg border-status-scheduled-border",
};

export function LanguageChip({
  language,
  status,
  scheduledDate,
  onClick,
  className,
}: LanguageChipProps) {
  const displayStatus = getDisplayStatus(status, scheduledDate);
  const statusLabel = getStatusLabel(displayStatus);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] border h-11 md:h-[var(--chip-height)] px-3 md:px-[var(--space-3)] py-2 md:py-[var(--space-1)] text-sm md:text-xs font-medium transition-all touch-manipulation",
        "hover-elevate active-elevate-2",
        statusStyles[displayStatus],
        onClick && "cursor-pointer",
        className
      )}
      data-testid={`chip-language-${language.toLowerCase()}`}
      title={`${language} - ${statusLabel}`}
    >
      <span className="font-medium">{language}</span>
      <span className="text-status leading-none opacity-75">{statusLabel}</span>
    </button>
  );
}
