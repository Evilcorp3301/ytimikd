import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ExternalLink, History as HistoryIcon } from "lucide-react";
import { Header } from "@/components/layout/header";
import { PageContainer } from "@/components/ui/page-container";
import { EmptyState } from "@/components/ui/empty-state";
import { VideoThumbnail } from "@/components/ui/video-thumbnail";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
        <p className="mb-6 text-muted-foreground">{t("history.description")}</p>

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

              return (
                <Card key={video.id} className="p-4">
                  <button
                    type="button"
                    className="w-full text-left"
                    onClick={() => setExpanded((p) => ({ ...p, [video.id]: !isOpen }))}
                  >
                    <div className="flex items-center gap-4">
                      {/* Group preview should always reflect the source/original video */}
                      <VideoThumbnail thumbnailUrl={getThumb(originalUrl) || video.thumbnailUrl} size="sm" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{title}</p>
                            <div className="mt-1 flex flex-wrap items-center gap-2">
                              <Badge variant="secondary">
                                {publishedTranslations.length} публикац.
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {t("history.publishedAt")}: {format(latest.publishedAt, "dd.MM.yyyy HH:mm", { locale: ru })}
                              </span>
                            </div>
                          </div>
                          <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
                        </div>
                      </div>
                    </div>
                  </button>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <a
                      href={originalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                      title={t("history.viewOriginal")}
                    >
                      <ExternalLink className="h-3 w-3" />
                      {t("history.originalVideo")}
                    </a>
                  </div>

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
                              className="truncate text-sm text-primary hover:underline"
                              title={tr.translatedUrl || undefined}
                            >
                              {t("history.viewTranslation")}
                            </a>
                          </div>
                          <span className="flex-shrink-0 text-xs text-muted-foreground">
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


