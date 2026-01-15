import { useState } from "react";
import { Download, ExternalLink } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { LanguageChip } from "@/components/ui/language-chip";
import { extractYouTubeVideoId } from "@/lib/youtube";
import { useTranslation } from "@/lib/language-provider";
import { apiRequest } from "@/lib/queryClient";
import type { VideoWithTranslations, TranslationStatus } from "@shared/schema";

interface VideoCardProps {
  video: VideoWithTranslations;
  onLanguageClick?: (videoId: string, language: string) => void;
  onDelete?: (videoId: string) => void;
  onEdit?: (videoId: string) => void;
}

export function VideoCard({ video, onLanguageClick, onDelete, onEdit }: VideoCardProps) {
  const { t } = useTranslation();
  const [thumbnailError, setThumbnailError] = useState(false);

  const videoId = extractYouTubeVideoId(video.url);
  const thumbnailUrl =
    video.thumbnailUrl || (videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : null);

  const downloadThumbnail = async () => {
    if (!videoId) return;
    const res = await apiRequest(
      "GET",
      `/api/youtube/thumbnail?videoId=${encodeURIComponent(videoId)}`
    );
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

  const translationsByStatus = video.translations.reduce<
    Record<
      TranslationStatus | "scheduled",
      { language: string; id: string; scheduledDate?: Date | null }[]
    >
  >(
    (acc, t) => {
      // Check if translation is scheduled (has scheduledDate in future)
      // Add to scheduled category if it has a future scheduledDate
      if (t.scheduledDate) {
        const scheduled = new Date(t.scheduledDate);
        const now = new Date();
        if (scheduled.getTime() > now.getTime()) {
          if (!acc.scheduled) acc.scheduled = [];
          acc.scheduled.push({ language: t.language, id: t.id, scheduledDate: t.scheduledDate });
        }
      }
      // Always add to regular status category
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
    <Card
      className="overflow-hidden group flex flex-col border border-border/60 hover:border-border/80 hover:shadow-md transition-all duration-200 shadow-sm"
      data-testid={`card-video-${video.id}`}
    >
      {/* Preview area - область превью */}
      <div className="relative w-full aspect-video bg-muted overflow-hidden">
        {thumbnailUrl && !thumbnailError ? (
          <img
            src={thumbnailUrl}
            alt={video.title || "Video thumbnail"}
            className="w-full h-full object-cover"
            loading="lazy"
            width={640}
            height={360}
            onError={() => setThumbnailError(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-muted">
            <svg
              className="h-12 w-12 text-muted-foreground/50"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
            </svg>
          </div>
        )}

        {/* Overlay actions - visible on mobile, hover on desktop */}
        <div className="absolute inset-0 bg-black/0 md:group-hover:bg-black/30 flex items-center justify-center opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-150">
          <div className="flex items-center gap-3">
            <a
              href={video.url}
              target="_blank"
              rel="noopener noreferrer"
              className="relative inline-flex items-center justify-center h-11 w-11 md:h-[var(--button-height-lg)] md:w-[var(--button-height-lg)] rounded-full overflow-hidden isolate text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring touch-manipulation"
              data-testid="link-video-url"
              title="Открыть на YouTube"
              aria-label="Открыть на YouTube"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-[hsl(var(--brand-from))] via-[hsl(var(--brand-via))] to-[hsl(var(--brand-to))] opacity-90" />
              <svg className="h-5 w-5 relative z-10" viewBox="0 0 24 24" fill="currentColor">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
              </svg>
            </a>
            <Button
              variant="ghost"
              size="icon"
              className="relative h-11 w-11 md:h-[var(--button-height-lg)] md:w-[var(--button-height-lg)] rounded-full overflow-hidden isolate text-white border-0 touch-manipulation"
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

        {/* Video ID badge - visible on mobile, hover on desktop */}
        {videoId && (
          <div className="absolute top-2 right-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-150">
            <Badge
              variant="secondary"
              className="font-mono text-xs py-[var(--space-1)] px-[var(--space-2)] bg-black/40 text-white/70 border-0"
            >
              {videoId}
            </Badge>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 md:p-5 space-y-3 md:space-y-4 flex-1 flex flex-col">
        {/* Title */}
        <div>
          <h3
            className="text-lg md:text-xl font-bold line-clamp-2 leading-tight mb-2"
            data-testid="text-video-title"
            title={video.title || "Без названия"}
          >
            {video.title || "Без названия"}
          </h3>
          {video.subcategory?.category && (
            <Badge
              variant="outline"
              className="text-xs font-normal text-muted-foreground/70 border-muted-foreground/30"
            >
              {video.subcategory.category.name} / {video.subcategory.name}
            </Badge>
          )}
        </div>

        {/* Progress */}
        {totalCount > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                Прогресс
              </span>
              <span className="text-sm font-semibold tabular-nums">
                {completedCount}/{totalCount} готово ({Math.round(progressPercentage)}%)
              </span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        )}

        {/* Languages - LanguageChip components */}
        {totalCount > 0 ? (
          <div className="flex flex-wrap gap-3">
            {video.translations.map((translation) => {
              return (
                <div key={translation.id} className="relative group">
                  <LanguageChip
                    language={translation.language.toUpperCase()}
                    status={translation.status as TranslationStatus}
                    scheduledDate={translation.scheduledDate}
                    onClick={() => onLanguageClick?.(video.id, translation.language)}
                  />
                  {translation.translatedUrl && (
                    <a
                      href={translation.translatedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      title={t("history.viewTranslation")}
                      aria-label={t("history.viewTranslation")}
                    >
                      <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-4 text-sm">
            Нет языков назначено
          </div>
        )}

        {/* Original video link */}
        <div className="pt-2 border-t border-border/30 mt-auto">
          <Button variant="outline" size="sm" className="w-full" asChild>
            <a
              href={video.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              {t("history.originalVideo")}
            </a>
          </Button>
        </div>
      </div>
    </Card>
  );
}
