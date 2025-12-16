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
        <p className="mb-4 md:mb-6 lg:mb-8 text-xs text-muted-foreground">{t("manualArchive.description")}</p>

        {isLoading ? (
          <Card className="p-4">Загрузка...</Card>
        ) : archivedManual.length === 0 ? (
          <EmptyState
            icon={ArchiveIcon}
            title={t("manualArchive.noItems")}
            description={t("manualArchive.noItemsDescription")}
          />
        ) : (
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {archivedManual.map((video) => {
              const archivedAt = new Date(video.archivedAt || video.createdAt);
              const thumbUrl = getThumb(video.url) || video.thumbnailUrl;
              return (
                <Card key={video.id} className="flex flex-col overflow-hidden hover:shadow-lg transition-shadow" data-testid={`card-archived-${video.id}`}>
                  <div className="relative w-full aspect-video bg-muted overflow-hidden">
                    {thumbUrl ? (
                      <img
                        src={thumbUrl}
                        alt={video.title || t("manualArchive.untitled")}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-muted">
                        <ArchiveIcon className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="p-4 flex-1 flex flex-col">
                    <h3 className="font-semibold text-sm mb-2 line-clamp-2">
                      {video.title || t("manualArchive.untitled")}
                    </h3>
                    <div className="mt-auto pt-3 border-t">
                      <p className="text-xs text-muted-foreground">
                        {t("manualArchive.cancelledAt")}: {format(archivedAt, "dd.MM.yyyy HH:mm", { locale: ru })}
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
