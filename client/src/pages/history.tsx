import { useState, useEffect, useRef, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, History as HistoryIcon, Search } from "lucide-react";
import { Header } from "@/components/layout/header";
import { PageContainer } from "@/components/ui/page-container";
import { EmptyState } from "@/components/ui/empty-state";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/language-provider";
import { extractYouTubeVideoId } from "@/lib/youtube";
import { usePageVisibility } from "@/hooks/use-page-visibility";
import { cn } from "@/lib/utils";
import type { VideoWithTranslations } from "@shared/schema";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

export default function HistoryPage() {
  const { t } = useTranslation();
  const isPageVisible = usePageVisibility();
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedLanguageFilter, setSelectedLanguageFilter] = useState<string>("all");
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus search input on mount (desktop only)
  useEffect(() => {
    // Only auto-focus on desktop to avoid opening keyboard on mobile
    if (window.innerWidth >= 768 && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  const { data: videos = [], isLoading } = useQuery<VideoWithTranslations[]>({
    queryKey: ["/api/videos"],
    // Use cached data while refetching for smoother UX
    placeholderData: (previousData) => previousData,
    refetchInterval: isPageVisible ? 5000 : false, // Обновление каждые 5 секунд только когда страница видима
    staleTime: 2000, // Данные считаются устаревшими через 2 секунды
  });

  // Get all unique languages from published translations
  const availableLanguages = useMemo(() => {
    const languages = new Set<string>();
    videos.forEach((v) => {
      v.translations
        .filter((tr) => Boolean(tr.translatedUrl))
        .forEach((tr) => languages.add(tr.language));
    });
    return Array.from(languages).sort();
  }, [videos]);

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
    .filter((x) => {
      // Filter by search query (title)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const title = x.video.title?.toLowerCase() || "";
        if (!title.includes(query)) return false;
      }
      // Filter by language
      if (selectedLanguageFilter !== "all") {
        const hasLanguage = x.publishedTranslations.some(
          (tr) => tr.language === selectedLanguageFilter
        );
        if (!hasLanguage) return false;
      }
      return true;
    })
    .sort((a, b) =>
      a.publishedTranslations[0].publishedAt.getTime() <
      b.publishedTranslations[0].publishedAt.getTime()
        ? 1
        : -1
    );

  const getThumb = (url?: string | null) => {
    if (!url) return null;
    const id = extractYouTubeVideoId(url);
    return id ? `https://img.youtube.com/vi/${id}/mqdefault.jpg` : null;
  };

  return (
    <div className="flex flex-1 flex-col">
      <Header title={t("history.title")} />
      <PageContainer>
        {/* Search and filter bar */}
        <div className="mb-4 flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={searchInputRef}
              type="text"
              placeholder="Поиск по названию видео..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-full"
              data-testid="input-search-video"
            />
          </div>
          {availableLanguages.length > 0 && (
            <Select value={selectedLanguageFilter} onValueChange={setSelectedLanguageFilter}>
              <SelectTrigger className="w-full sm:w-[180px]" data-testid="select-language-filter">
                <SelectValue placeholder="Все языки" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все языки</SelectItem>
                {availableLanguages.map((language) => (
                  <SelectItem key={language} value={language}>
                    {language}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="mb-4 md:mb-6 lg:mb-8">
          <p className="text-heading-3">{t("history.description")}</p>
        </div>

        {isLoading && videos.length === 0 ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="p-3">
                <div className="flex items-center gap-3">
                  <div className="h-[68px] w-[120px] rounded-md bg-muted animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-5 w-3/4 bg-muted animate-pulse rounded" />
                    <div className="h-4 w-1/2 bg-muted animate-pulse rounded" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : historyVideos.length === 0 ? (
          <EmptyState
            icon={HistoryIcon}
            title={t("history.noItems")}
            description={t("history.noItemsDescription")}
            action={
              <div className="flex flex-col items-center gap-2">
                <p className="text-xs text-muted-foreground/60">
                  Перейдите в очередь, чтобы добавить видео
                </p>
              </div>
            }
          />
        ) : (
          <div className="grid gap-4 md:gap-5 grid-cols-1 md:grid-cols-2">
            {historyVideos.map(({ video, publishedTranslations }) => {
              const originalUrl = video.url;
              const title = video.title || t("history.untitled");
              const totalTranslations = video.translations.length;
              const publishedCount = publishedTranslations.length;
              const allDone = totalTranslations > 0 && publishedCount === totalTranslations;
              const progressPct =
                totalTranslations > 0 ? (publishedCount / totalTranslations) * 100 : 0;
              const thumbnailUrl = getThumb(originalUrl) || video.thumbnailUrl;

              return (
                <Card
                  key={video.id}
                  className="overflow-hidden flex flex-col border border-border/60 hover:border-border/80 hover:shadow-md transition-all duration-200 shadow-sm"
                >
                  {/* Preview */}
                  <div className="relative w-full aspect-video bg-muted overflow-hidden">
                    {thumbnailUrl ? (
                      <img
                        src={thumbnailUrl}
                        alt={title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-muted">
                        <HistoryIcon className="h-12 w-12 text-muted-foreground/50" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-4 md:p-5 space-y-3 md:space-y-4 flex-1 flex flex-col">
                    {/* Title */}
                    <div>
                      <h3 className="text-lg md:text-xl font-bold line-clamp-2 leading-tight mb-2">
                        {title}
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
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground">
                          Прогресс
                        </span>
                        <span className="text-sm font-semibold tabular-nums">
                          {publishedCount}/{totalTranslations} готово ({Math.round(progressPct)}%)
                        </span>
                      </div>
                      <Progress value={progressPct} className="h-2" />
                      {allDone && (
                        <Badge
                          variant="outline"
                          className="bg-status-done/10 text-status-done-fg border-status-done-border text-xs"
                        >
                          {t("common.done")}
                        </Badge>
                      )}
                    </div>

                    {/* Translations */}
                    <div className="space-y-2 flex-1">
                      <p className="text-sm font-medium text-muted-foreground">Переводы:</p>
                      <div className="space-y-2">
                        {publishedTranslations.map((tr) => {
                          const url = tr.translatedUrl || "";
                          return (
                            <a
                              key={tr.id}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={cn(
                                "flex items-center justify-between gap-3 rounded-lg px-3 py-2.5",
                                "border border-border/40 bg-card/50 hover:bg-muted/30",
                                "hover:border-border/60 transition-all",
                                "group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                              )}
                            >
                              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                <Badge
                                  variant="outline"
                                  className="bg-status-done/10 text-status-done-fg border-status-done-border text-xs font-medium shrink-0"
                                >
                                  {tr.language}
                                </Badge>
                                <span className="text-xs text-muted-foreground/70 tabular-nums font-medium truncate">
                                  {format(tr.publishedAt, "dd.MM.yyyy HH:mm", { locale: ru })}
                                </span>
                              </div>
                              <ExternalLink className="h-4 w-4 text-muted-foreground/50 group-hover:text-primary transition-colors shrink-0" />
                            </a>
                          );
                        })}
                      </div>
                    </div>

                    {/* Original video link */}
                    <div className="pt-2 border-t border-border/30">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        asChild
                      >
                        <a
                          href={originalUrl}
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
            })}
          </div>
        )}
      </PageContainer>
    </div>
  );
}
