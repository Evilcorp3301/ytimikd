import { useState } from "react";
import { MoreVertical, Trash2, Edit2, AlertTriangle, Download, CheckCircle2, Clock, Calendar, Circle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { extractYouTubeVideoId } from "@/lib/youtube";
import { useTranslation } from "@/lib/language-provider";
import { apiRequest } from "@/lib/queryClient";
import type { VideoWithTranslations, TranslationStatus } from "@shared/schema";

// Helper functions for translation status display
type DisplayStatus = TranslationStatus | "scheduled";

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

function getTranslationStatusIcon(status: DisplayStatus) {
  switch (status) {
    case "completed":
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    case "in_progress":
      return <Clock className="h-4 w-4 text-blue-500" />;
    case "scheduled":
      return <Calendar className="h-4 w-4 text-purple-500" />;
    case "not_started":
    default:
      return <Circle className="h-4 w-4 text-muted-foreground/50" />;
  }
}

function getTranslationStatusLabel(status: DisplayStatus, t: (key: string) => string): string {
  switch (status) {
    case "completed":
      return t("queue.completed");
    case "in_progress":
      return t("queue.inProgress");
    case "scheduled":
      return "План";
    case "not_started":
    default:
      return t("queue.notStarted");
  }
}

function getTranslationStatusStyles(status: DisplayStatus): string {
  switch (status) {
    case "completed":
      return "text-green-500";
    case "in_progress":
      return "text-blue-500";
    case "scheduled":
      return "text-purple-500";
    case "not_started":
    default:
      return "text-muted-foreground/50";
  }
}

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

  // Determine primary status for indicator
  const getPrimaryStatus = () => {
    if (completedCount === totalCount && totalCount > 0) return "completed";
    if (translationsByStatus.in_progress.length > 0) return "in_progress";
    if (translationsByStatus.scheduled && translationsByStatus.scheduled.length > 0)
      return "scheduled";
    if (translationsByStatus.not_started.length > 0) return "not_started";
    return "none";
  };

  const primaryStatus = getPrimaryStatus();
  const statusColors = {
    completed: "bg-green-500",
    in_progress: "bg-blue-500",
    scheduled: "bg-purple-500",
    not_started: "bg-muted-foreground/50",
    none: "bg-muted-foreground/30",
  };

  return (
    <Card
      className="overflow-hidden group flex flex-col border border-border/60 hover:border-border/80 hover:shadow-md hover:bg-muted/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-all duration-200 relative shadow-sm"
      data-testid={`card-video-${video.id}`}
    >
      {/* Status indicator bar - яркий индикатор статуса */}
      {primaryStatus !== "none" && (
        <div className={cn("absolute top-0 left-0 right-0 h-1", statusColors[primaryStatus])} />
      )}
      {/* Preview area - область превью */}
      <div className="relative w-full aspect-video bg-muted overflow-hidden border-b border-border/20">
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

      {/* Metadata and actions section - область метаданных и действий */}
      <div className="p-4 md:p-5 space-y-3 md:space-y-4 flex-1 bg-card">
        {/* Title and menu */}
        <div className="flex items-start justify-between gap-2 md:gap-3">
          <div className="flex-1 min-w-0">
            <h3
              className="text-base md:text-heading-3 line-clamp-2 leading-snug font-semibold"
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
                className="flex-shrink-0 h-8 w-8"
                data-testid="button-video-menu"
                aria-label="Меню видео"
                title="Меню видео"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-4 w-4" aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit?.(video.id)} data-testid="menu-item-edit">
                <Edit2 className="h-4 w-4" aria-hidden="true" />
                <span>{t("common.edit")}</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete?.(video.id)}
                className="text-destructive"
                data-testid="menu-item-delete"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                <span>{t("common.delete")}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Category badge */}
        {video.subcategory?.category && (
          <div>
            <Badge
              variant="outline"
              className="text-xs font-normal text-muted-foreground/70 border-muted-foreground/30"
            >
              {video.subcategory.category.name} / {video.subcategory.name}
            </Badge>
          </div>
        )}

        {/* Languages Table */}
        {totalCount > 0 ? (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow className="hover:bg-muted/50">
                  <TableHead className="text-left">Язык</TableHead>
                  <TableHead className="text-right">{t("translation.status")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {video.translations.map((translation) => {
                  const displayStatus = getDisplayStatus(
                    translation.status as TranslationStatus,
                    translation.scheduledDate
                  );

                  return (
                    <TableRow
                      key={translation.id}
                      className={cn(
                        "cursor-pointer hover:bg-muted/30 transition-colors",
                        onLanguageClick && "cursor-pointer"
                      )}
                      onClick={() => onLanguageClick?.(video.id, translation.language)}
                    >
                      <TableCell className="font-medium text-left">
                        <div className="flex items-center gap-2">
                          {getTranslationStatusIcon(displayStatus)}
                          <span>{translation.language}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={cn("text-status", getTranslationStatusStyles(displayStatus))}>
                          {getTranslationStatusLabel(displayStatus, t)}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-4 text-sm">
            Нет языков назначено
          </div>
        )}
      </div>

      {/* Progress Bar - at the very bottom of the card, separated area */}
      {totalCount > 0 && (
        <div className="w-full mt-auto border-t border-border/20 bg-muted/30">
          <Progress value={progressPercentage} className="h-1.5 rounded-none" />
        </div>
      )}
    </Card>
  );
}
