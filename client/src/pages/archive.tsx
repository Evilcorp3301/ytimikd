import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Archive as ArchiveIcon } from "lucide-react";
import { Header } from "@/components/layout/header";
import { PageContainer } from "@/components/ui/page-container";
import { EmptyState } from "@/components/ui/empty-state";
import { VideoThumbnail } from "@/components/ui/video-thumbnail";
import { Card } from "@/components/ui/card";
import { useTranslation } from "@/lib/language-provider";
import { extractYouTubeVideoId } from "@/lib/youtube";
import type { VideoWithTranslations } from "@shared/schema";

export default function ArchivePage() {
  const { t } = useTranslation();

  const { data: videos = [], isLoading } = useQuery<VideoWithTranslations[]>({
    queryKey: ["/api/videos"],
  });

  const archivedManual = videos
    .filter((v) => v.isArchived === true && v.archivedReason === "manual")
    .sort((a, b) => new Date(b.archivedAt || b.createdAt).getTime() - new Date(a.archivedAt || a.createdAt).getTime());

  const getThumb = (url?: string | null) => {
    if (!url) return null;
    const id = extractYouTubeVideoId(url);
    return id ? `https://img.youtube.com/vi/${id}/mqdefault.jpg` : null;
  };

  return (
    <div className="flex flex-1 flex-col">
      <Header title={t("manualArchive.title")} />
      <PageContainer>
        <p className="mb-6 text-muted-foreground">{t("manualArchive.description")}</p>

        {isLoading ? (
          <Card className="p-4">Загрузка...</Card>
        ) : archivedManual.length === 0 ? (
          <EmptyState
            icon={ArchiveIcon}
            title={t("manualArchive.noItems")}
            description={t("manualArchive.noItemsDescription")}
          />
        ) : (
          <div className="space-y-3">
            {archivedManual.map((video) => {
              const cancelledAt = new Date(video.archivedAt || video.createdAt);
              return (
                <Card key={video.id} className="p-4" data-testid={`card-archived-${video.id}`}>
                  <div className="flex items-center gap-4">
                    <VideoThumbnail thumbnailUrl={getThumb(video.url) || video.thumbnailUrl} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {video.title || t("manualArchive.untitled")}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {t("manualArchive.cancelledAt")}: {format(cancelledAt, "dd.MM.yyyy HH:mm", { locale: ru })}
                      </p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </PageContainer>
    </div>
  );
}
