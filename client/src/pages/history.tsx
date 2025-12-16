import { useQuery } from "@tanstack/react-query";
import { ExternalLink, History as HistoryIcon } from "lucide-react";
import { Header } from "@/components/layout/header";
import { PageContainer } from "@/components/ui/page-container";
import { EmptyState } from "@/components/ui/empty-state";
import { VideoThumbnail } from "@/components/ui/video-thumbnail";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useTranslation } from "@/lib/language-provider";
import { extractYouTubeVideoId } from "@/lib/youtube";
import type { TranslationWithDetails } from "@shared/schema";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

export default function HistoryPage() {
  const { t } = useTranslation();

  const { data: translations = [], isLoading } = useQuery<TranslationWithDetails[]>({
    queryKey: ["/api/translations?archived=true"],
  });

  const historyItems = translations
    .filter((tr) => tr.video?.isArchived === true)
    // exclude manual cancellations; keep "auto" and legacy null
    .filter((tr) => tr.video?.archivedReason !== "manual")
    // show completed/published only
    .filter((tr) => tr.status === "completed" || tr.publishedDate)
    .sort((a, b) => new Date(b.publishedDate || b.createdAt).getTime() - new Date(a.publishedDate || a.createdAt).getTime());

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
        ) : historyItems.length === 0 ? (
          <EmptyState icon={HistoryIcon} title={t("history.noItems")} description={t("history.noItemsDescription")} />
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("history.translatedVideo")}</TableHead>
                  <TableHead className="w-[120px]">{t("history.originalVideo")}</TableHead>
                  <TableHead className="w-[180px]">{t("history.publishedAt")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {historyItems.map((tr) => {
                  const translatedUrl = tr.translatedUrl || null;
                  const originalUrl = tr.video?.url || null;
                  const title = tr.video?.title || t("history.untitled");
                  const publishedAt = tr.publishedDate ? new Date(tr.publishedDate) : null;

                  return (
                    <TableRow key={tr.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <VideoThumbnail
                            thumbnailUrl={getThumb(translatedUrl) || getThumb(originalUrl)}
                            size="sm"
                          />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium max-w-[320px]">{title}</p>
                            {translatedUrl ? (
                              <a
                                href={translatedUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-xs text-primary hover:underline"
                              >
                                <ExternalLink className="h-3 w-3" />
                                {t("history.viewTranslation")}
                              </a>
                            ) : (
                              <span className="text-xs text-muted-foreground">-</span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {originalUrl ? (
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
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {publishedAt ? (
                          <span className="text-sm">
                            {format(publishedAt, "dd.MM.yyyy HH:mm", { locale: ru })}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        )}
      </PageContainer>
    </div>
  );
}


