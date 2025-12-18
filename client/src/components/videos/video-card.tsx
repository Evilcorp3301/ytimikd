import { MoreVertical, Trash2, Edit2, AlertTriangle, Download } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { VideoThumbnail } from "@/components/ui/video-thumbnail";
import { LanguageChip } from "@/components/ui/language-chip";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { extractYouTubeVideoId } from "@/lib/youtube";
import { useTranslation } from "@/lib/language-provider";
import { apiRequest } from "@/lib/queryClient";
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
  const { t } = useTranslation();

  const videoId = extractYouTubeVideoId(video.url);
  const thumbnailUrl = video.thumbnailUrl || (videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : null);

  const downloadThumbnail = async () => {
    if (!videoId) return;
    const res = await apiRequest("GET", `/api/youtube/thumbnail?videoId=${encodeURIComponent(videoId)}`);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `thumbnail_${videoId}.jpg`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const translationsByStatus = video.translations.reduce<Record<TranslationStatus | "scheduled", { language: string; id: string; scheduledDate?: Date | null }[]>>(
    (acc, t) => {
      // Check if translation is scheduled (has scheduledDate in future)
      if (t.scheduledDate) {
        const scheduled = new Date(t.scheduledDate);
        const now = new Date();
        if (scheduled.getTime() > now.getTime()) {
          if (!acc.scheduled) acc.scheduled = [];
          acc.scheduled.push({ language: t.language, id: t.id, scheduledDate: t.scheduledDate });
          return acc;
        }
      }
      // Otherwise use regular status
      const status = t.status as TranslationStatus;
      if (!acc[status]) acc[status] = [];
      acc[status].push({ language: t.language, id: t.id, scheduledDate: t.scheduledDate });
      return acc;
    },
    { not_started: [], in_progress: [], completed: [], scheduled: [] }
  );

  const totalCount = video.translations.length;
  const completedCount = translationsByStatus.completed.length;
  const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <Card className="overflow-hidden group flex flex-col border-border/30" data-testid={`card-video-${video.id}`}>
      {/* Full-width thumbnail */}
      <div className="relative w-full aspect-video bg-muted overflow-hidden">
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={video.title || "Video thumbnail"}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-muted">
            <svg className="h-12 w-12 text-muted-foreground/50" viewBox="0 0 24 24" fill="currentColor">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
          </div>
        )}
        
        {/* Overlay actions on hover */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150">
          <div className="flex items-center gap-3">
            <a
              href={video.url}
              target="_blank"
              rel="noopener noreferrer"
              className="relative inline-flex items-center justify-center h-[var(--button-height-lg)] w-[var(--button-height-lg)] rounded-full overflow-hidden isolate text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              data-testid="link-video-url"
              title="Открыть на YouTube"
              aria-label="Открыть на YouTube"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-[hsl(var(--brand-from))] via-[hsl(var(--brand-via))] to-[hsl(var(--brand-to))] opacity-90" />
              <svg className="h-5 w-5 relative z-10" viewBox="0 0 24 24" fill="currentColor">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
            </a>
            <Button
              variant="ghost"
              size="icon"
              className="relative h-[var(--button-height-lg)] w-[var(--button-height-lg)] rounded-full overflow-hidden isolate text-white border-0"
              onClick={(e) => {
                e.stopPropagation();
                downloadThumbnail();
              }}
              disabled={!videoId}
              data-testid="button-download-thumbnail"
              title="Скачать превью"
              aria-label="Скачать превью"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-[hsl(var(--brand-from))] via-[hsl(var(--brand-via))] to-[hsl(var(--brand-to))] opacity-90" />
              <Download className="h-4 w-4 relative z-10" />
            </Button>
          </div>
        </div>

        {/* Video ID badge in corner */}
        {videoId && (
          <div className="absolute top-2 right-2">
            <Badge variant="secondary" className="font-mono text-xs py-[var(--space-1)] px-[var(--space-2)] bg-black/40 text-white/70 border-0">
              {videoId}
            </Badge>
          </div>
        )}
      </div>

      {/* Content section */}
      <div className="p-4 space-y-3 flex-1">
        {/* Title and menu */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 
              className="text-heading-3 line-clamp-2 leading-snug" 
              data-testid="text-video-title"
              title={video.title || "Без названия"}
            >
              {video.title || "Без названия"}
            </h3>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="flex-shrink-0" 
                data-testid="button-video-menu"
                aria-label="Меню видео"
                title="Меню видео"
              >
                <MoreVertical className="h-4 w-4" aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit?.(video.id)} data-testid="menu-item-edit">
                <Edit2 className="mr-2 h-4 w-4" aria-hidden="true" />
                {t("common.edit")}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete?.(video.id)}
                className="text-destructive"
                data-testid="menu-item-delete"
              >
                <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />
                {t("common.delete")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Category badge */}
        {video.subcategory?.category && (
          <div>
            <Badge variant="outline" className="text-xs font-normal text-muted-foreground/70 border-muted-foreground/30">
              {video.subcategory.category.name} / {video.subcategory.name}
            </Badge>
          </div>
        )}

        {/* Grouped Languages by Status */}
        <div className="flex flex-wrap items-center gap-2">
          {completedCount > 0 && (
            <Badge 
              variant="outline" 
              className="text-xs px-[var(--space-2)] py-[var(--space-1)] bg-status-done text-status-done-fg border-status-done-border"
            >
              ✓ {completedCount} готово
            </Badge>
          )}
          {translationsByStatus.scheduled && translationsByStatus.scheduled.length > 0 && (
            <Badge 
              variant="outline" 
              className="text-xs px-[var(--space-2)] py-[var(--space-1)] bg-status-scheduled text-status-scheduled-fg border-status-scheduled-border"
            >
              📅 {translationsByStatus.scheduled.length} запланировано
            </Badge>
          )}
          {translationsByStatus.in_progress.length > 0 && (
            <Badge 
              variant="outline" 
              className="text-xs px-[var(--space-2)] py-[var(--space-1)] bg-status-progress text-status-progress-fg border-status-progress-border"
            >
              ◐ {translationsByStatus.in_progress.length} в работе
            </Badge>
          )}
          {translationsByStatus.not_started.length > 0 && (
            <Badge 
              variant="outline" 
              className="text-xs px-[var(--space-2)] py-[var(--space-1)] bg-muted/50 text-muted-foreground border-muted-foreground/30"
            >
              ○ {translationsByStatus.not_started.length} не начато
            </Badge>
          )}
          {totalCount === 0 && (
            <span className="text-xs text-muted-foreground/60">No languages assigned</span>
          )}
        </div>

        {/* Individual language chips with urgency indicators */}
        {totalCount > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground/50">Кликните на язык →</p>
            <div className="flex flex-wrap gap-1.5">
              {video.translations.map((translation) => {
                const urgency = getScheduleUrgency(translation.scheduledDate);
                return (
                  <div key={translation.id} className="relative">
                    <LanguageChip
                      language={translation.language}
                      status={translation.status as TranslationStatus}
                      scheduledDate={translation.scheduledDate}
                      onClick={() => onLanguageClick?.(video.id, translation.language)}
                    />
                    {translation.scheduledDate && urgency !== "normal" && (
                      <div
                        className={cn(
                          "absolute -top-1 -right-1 h-3 w-3 rounded-full flex items-center justify-center",
                          urgency === "urgent" ? "bg-red-500" : "bg-orange-400"
                        )}
                        title={urgency === "urgent" ? "Меньше 2 часов до публикации" : "Меньше 12 часов до публикации"}
                      >
                        {urgency === "urgent" && <AlertTriangle className="h-2 w-2 text-white" />}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Progress Bar - at the very bottom of the card */}
      {totalCount > 0 && (
        <div className="w-full mt-auto">
          <Progress value={progressPercentage} className="h-1 rounded-none" />
        </div>
      )}
    </Card>
  );
}
