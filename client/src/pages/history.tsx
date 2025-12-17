import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ExternalLink, History as HistoryIcon } from "lucide-react";
import { Header } from "@/components/layout/header";
import { PageContainer } from "@/components/ui/page-container";
import { EmptyState } from "@/components/ui/empty-state";
import { VideoThumbnail } from "@/components/ui/video-thumbnail";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useTranslation } from "@/lib/language-provider";
import { extractYouTubeVideoId } from "@/lib/youtube";
import type { VideoWithTranslations } from "@shared/schema";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

export default function HistoryPage() {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const { data: videos = [], isLoading } = useQuery<VideoWithTranslations[]>({
    queryKey: ["/api/videos"],
  });

  const historyVideos = videos
    .map((v) => ({
      video: v,
      publishedTranslations: v.translations
        .filter((tr) => Boolean(tr.translatedUrl))
        .map((tr) => ({
          ...tr,
          publishedAt: tr.publishedDate ? new Date(tr.publishedDate) : new Date(tr.createdAt),
        }))
        .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime()),
    }))
    .filter((x) => x.publishedTranslations.length > 0)
    .sort((a, b) => a.publishedTranslations[0].publishedAt.getTime() < b.publishedTranslations[0].publishedAt.getTime() ? 1 : -1);

  const getThumb = (url?: string | null) => {
    if (!url) return null;
    const id = extractYouTubeVideoId(url);
    return id ? `https://img.youtube.com/vi/${id}/mqdefault.jpg` : null;
  };

  return (
    <div className="flex flex-1 flex-col">
      <Header title={t("history.title")} />
      <PageContainer>
        <div className="mb-4 md:mb-6 lg:mb-8">
          <p className="text-hint">{t("history.description")}</p>
        </div>

        {isLoading ? (
          <Card className="p-4">Загрузка...</Card>
        ) : historyVideos.length === 0 ? (
          <EmptyState icon={HistoryIcon} title={t("history.noItems")} description={t("history.noItemsDescription")} />
        ) : (
          <div className="space-y-3">
            {historyVideos.map(({ video, publishedTranslations }) => {
              const latest = publishedTranslations[0];
              const originalUrl = video.url;
              const title = video.title || t("history.untitled");
              const isOpen = expanded[video.id] ?? false;
              const totalTranslations = video.translations.length;
              const publishedCount = publishedTranslations.length;
              const allDone = totalTranslations > 0 && publishedCount === totalTranslations;
              const progressPct = totalTranslations > 0 ? (publishedCount / totalTranslations) * 100 : 0;

              return (
                <Card key={video.id} className="p-4">
                  <button
                    type="button"
                    className="w-full text-left"
                    onClick={() => setExpanded((p) => ({ ...p, [video.id]: !isOpen }))}
                  >
                    <div className="flex items-center gap-4">
                      {/* Group preview should always reflect the source/original video */}
                      <VideoThumbnail thumbnailUrl={getThumb(originalUrl) || video.thumbnailUrl} size="md" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{title}</p>
                            <div className="mt-1 flex flex-wrap items-center gap-2">
                              {allDone ? (
                                <Badge
                                  variant="outline"
                                  className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800"
                                >
                                  {t("common.done")}
                                </Badge>
                              ) : (
                                <>
                                  <Badge variant="secondary">
                                    {publishedCount}/{totalTranslations} опублик.
                                  </Badge>
                                  <div className="flex items-center gap-2 min-w-[140px]" title={format(latest.publishedAt, "dd.MM.yyyy HH:mm", { locale: ru })}>
                                    <Progress value={progressPct} className="h-2 w-28" />
                                    <span className="text-hint text-number">
                                      {Math.round(progressPct)}%
                                    </span>
                                  </div>
                                </>
                              )}
                              <a
                                href={originalUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-hint hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                                title={t("history.viewOriginal")}
                              >
                                <ExternalLink className="h-3 w-3" />
                                {t("history.originalVideo")}
                              </a>
                            </div>
                          </div>
                          <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} aria-hidden="true" />
                        </div>
                      </div>
                    </div>
                  </button>

                  {isOpen && (
                    <div className="mt-4 space-y-2">
                      {publishedTranslations.map((tr) => (
                        <div key={tr.id} className="flex items-center justify-between gap-3 rounded-md border px-3 py-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <Badge variant="outline">{tr.language}</Badge>
                            <a
                              href={tr.translatedUrl || undefined}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex min-w-0 items-center gap-1 truncate text-xs text-primary hover:underline"
                              title={tr.translatedUrl || undefined}
                            >
                              <ExternalLink className="h-3 w-3 flex-shrink-0" />
                              {t("history.viewTranslation")}
                            </a>
                          </div>
                          <span className="flex-shrink-0 text-hint text-number">
                            {format(tr.publishedAt, "dd.MM.yyyy HH:mm", { locale: ru })}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </PageContainer>
    </div>
  );
}


