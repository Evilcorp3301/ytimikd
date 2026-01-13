import { useState } from "react";
import { Play } from "lucide-react";
import { cn } from "@/lib/utils";

interface VideoThumbnailProps {
  thumbnailUrl?: string | null;
  title?: string | null;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "w-20 h-[45px]",
  md: "w-[120px] h-[68px]",
  lg: "w-[160px] h-[90px]",
};

const sizeDimensions = {
  sm: { width: 80, height: 45 },
  md: { width: 120, height: 68 },
  lg: { width: 160, height: 90 },
};

const iconSizes = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8",
};

export function VideoThumbnail({
  thumbnailUrl,
  title,
  className,
  size = "md",
}: VideoThumbnailProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleError = () => {
    setHasError(true);
    setIsLoading(false);
  };

  const handleLoad = () => {
    setIsLoading(false);
  };

  const showFallback = !thumbnailUrl || hasError;

  return (
    <div
      className={cn(
        "relative flex-shrink-0 overflow-hidden rounded-md bg-muted",
        sizeClasses[size],
        className
      )}
      data-testid="img-video-thumbnail"
    >
      {showFallback ? (
        <div className="flex h-full w-full items-center justify-center bg-muted">
          <Play className={cn("text-muted-foreground/60", iconSizes[size])} />
        </div>
      ) : (
        <>
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground/20 border-t-muted-foreground/60" />
            </div>
          )}
          <img
            src={thumbnailUrl}
            alt={title || "Video thumbnail"}
            width={sizeDimensions[size].width}
            height={sizeDimensions[size].height}
            className={cn(
              "h-full w-full object-cover transition-opacity duration-200",
              isLoading ? "opacity-0" : "opacity-100"
            )}
            loading="lazy"
            onError={handleError}
            onLoad={handleLoad}
          />
        </>
      )}
    </div>
  );
}
