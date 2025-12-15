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

export function VideoThumbnail({ thumbnailUrl, title, className, size = "md" }: VideoThumbnailProps) {
  return (
    <div
      className={cn(
        "relative flex-shrink-0 overflow-hidden rounded-md bg-muted",
        sizeClasses[size],
        className
      )}
      data-testid="img-video-thumbnail"
    >
      {thumbnailUrl ? (
        <img
          src={thumbnailUrl}
          alt={title || "Video thumbnail"}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-muted">
          <Play className="h-6 w-6 text-muted-foreground" />
        </div>
      )}
    </div>
  );
}
