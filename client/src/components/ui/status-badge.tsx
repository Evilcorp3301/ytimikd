import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { TranslationStatus } from "@shared/schema";

interface StatusBadgeProps {
  status: TranslationStatus;
  className?: string;
}

const statusConfig: Record<TranslationStatus, { label: string; className: string }> = {
  not_started: {
    label: "Not Started",
    className: "bg-muted text-muted-foreground border-muted-foreground/20",
  },
  in_progress: {
    label: "In Progress",
    className: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800",
  },
  completed: {
    label: "Completed",
    className: "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800",
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <Badge
      variant="outline"
      className={cn("font-medium", config.className, className)}
      data-testid={`badge-status-${status}`}
    >
      {config.label}
    </Badge>
  );
}
