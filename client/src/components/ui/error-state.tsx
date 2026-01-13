import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
  retryLabel?: string;
}

export function ErrorState({
  title = "Произошла ошибка",
  description = "Не удалось загрузить данные. Пожалуйста, попробуйте еще раз.",
  onRetry,
  className,
  retryLabel = "Повторить",
}: ErrorStateProps) {
  return (
    <div
      className={cn("flex flex-col items-center justify-center py-16 text-center", className)}
      data-testid="error-state"
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
        <AlertCircle className="h-8 w-8 text-destructive" />
      </div>
      <h3 className="mt-4 text-heading-2" data-testid="text-error-title">
        {title}
      </h3>
      <p
        className="mt-2 max-w-sm text-xs text-muted-foreground/80"
        data-testid="text-error-description"
      >
        {description}
      </p>
      {onRetry && (
        <div className="mt-6">
          <Button
            onClick={onRetry}
            variant="outline"
            size="lg"
            className="gap-2"
            data-testid="button-retry"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            {retryLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
