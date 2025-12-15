import { MoreVertical, Trash2, Edit2, Clock, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { VideoThumbnail } from "@/components/ui/video-thumbnail";
import { LanguageChip } from "@/components/ui/language-chip";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { VideoWithTranslations, TranslationStatus } from "@shared/schema";

type UrgencyLevel = "normal" | "warning" | "urgent";

function getScheduleUrgency(scheduledDate: Date | null | undefined): UrgencyLevel {
  if (!scheduledDate) return "normal";
  const now = new Date();
  const scheduled = new Date(scheduledDate);
  const msUntil = scheduled.getTime() - now.getTime();
  if (msUntil <= 0) return "urgent";
  const hoursUntil = msUntil / (1000 * 60 * 60);
  if (hoursUntil < 2) return "urgent";
  if (hoursUntil <= 12) return "warning";
  return "normal";
}

interface VideoCardProps {
  video: VideoWithTranslations;
  onLanguageClick?: (videoId: string, language: string) => void;
  onDelete?: (videoId: string) => void;
  onEdit?: (videoId: string) => void;
}

export function VideoCard({ video, onLanguageClick, onDelete, onEdit }: VideoCardProps) {
  const getVideoId = (url: string) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
    return match ? match[1] : null;
  };

  const videoId = getVideoId(video.url);
  const thumbnailUrl = video.thumbnailUrl || (videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : null);

  const translationsByStatus = video.translations.reduce<Record<TranslationStatus, { language: string }[]>>(
    (acc, t) => {
      const status = t.status as TranslationStatus;
      if (!acc[status]) acc[status] = [];
      acc[status].push({ language: t.language });
      return acc;
    },
    { not_started: [], in_progress: [], completed: [] }
  );

  return (
    <Card className="p-4 transition-shadow overflow-hidden" data-testid={`card-video-${video.id}`}>
      <div className="flex gap-3 sm:gap-4">
        <VideoThumbnail thumbnailUrl={thumbnailUrl} title={video.title} />
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-sm font-semibold" data-testid="text-video-title">
                {video.title || "Untitled Video"}
              </h3>
              <a
                href={video.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-flex items-center text-red-500 hover:text-red-600 transition-colors"
                data-testid="link-video-url"
                title="Открыть на YouTube"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </a>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" data-testid="button-video-menu">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit?.(video.id)} data-testid="menu-item-edit">
                  <Edit2 className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onDelete?.(video.id)}
                  className="text-destructive"
                  data-testid="menu-item-delete"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {video.translations.map((translation) => {
          const urgency = getScheduleUrgency(translation.scheduledDate);
          return (
            <div key={translation.id} className="relative">
              <LanguageChip
                language={translation.language}
                status={translation.status as TranslationStatus}
                onClick={() => onLanguageClick?.(video.id, translation.language)}
              />
              {translation.scheduledDate && urgency !== "normal" && (
                <div
                  className={cn(
                    "absolute -top-1 -right-1 h-3 w-3 rounded-full flex items-center justify-center",
                    urgency === "urgent" ? "bg-red-500" : "bg-orange-400"
                  )}
                  title={urgency === "urgent" ? "Less than 2 hours remaining" : "Less than 12 hours remaining"}
                >
                  {urgency === "urgent" && <AlertTriangle className="h-2 w-2 text-white" />}
                </div>
              )}
            </div>
          );
        })}
        {video.translations.length === 0 && (
          <span className="text-xs text-muted-foreground">No languages assigned</span>
        )}
      </div>
    </Card>
  );
}
