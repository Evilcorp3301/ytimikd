import { useState, useEffect, useRef, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ExternalLink, History as HistoryIcon, Search, Copy, Check } from "lucide-react";
import { Header } from "@/components/layout/header";
import { PageContainer } from "@/components/ui/page-container";
import { EmptyState } from "@/components/ui/empty-state";
import { VideoThumbnail } from "@/components/ui/video-thumbnail";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/lib/language-provider";
import { extractYouTubeVideoId } from "@/lib/youtube";
import type { VideoWithTranslations } from "@shared/schema";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

export default function HistoryPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedLanguageFilter, setSelectedLanguageFilter] = useState<string>("all");
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus search input on mount
  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  const { data: videos = [], isLoading, isFetching } = useQuery<VideoWithTranslations[]>({
    queryKey: ["/api/videos"],
    // Use cached data while refetching for smoother UX
    placeholderData: (previousData) => previousData,
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
        const hasLanguage = x.publishedTranslations.some((tr) => tr.language === selectedLanguageFilter);
        if (!hasLanguage) return false;
      }
      return true;
    })
    .sort((a, b) => a.publishedTranslations[0].publishedAt.getTime() < b.publishedTranslations[0].publishedAt.getTime() ? 1 : -1);

  const copyToClipboard = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(url);
      toast({
        title: "URL скопирован",
        description: "Ссылка скопирована в буфер обмена",
      });
      setTimeout(() => setCopiedUrl(null), 2000);
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось скопировать URL",
        variant: "destructive",
      });
    }
  };

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
                <p className="text-xs text-muted-foreground/60">Перейдите в очередь, чтобы добавить видео</p>
              </div>
            }
          />
        ) : (
          <div className="space-y-2">
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
                <Card key={video.id} className="p-3 md:p-4 border-border/60 shadow-sm">
                  <button
                    type="button"
                    className="w-full text-left hover:bg-muted/20 transition-colors rounded touch-manipulation min-h-[44px]"
                    onClick={() => setExpanded((p) => ({ ...p, [video.id]: !isOpen }))}
                  >
                    <div className="flex items-center gap-3">
                      {/* Group preview should always reflect the source/original video */}
                      <VideoThumbnail thumbnailUrl={getThumb(originalUrl) || video.thumbnailUrl} size="md" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-heading-3 leading-tight mb-1.5">{title}</p>
                            <div className="flex flex-wrap items-center gap-2">
                              {allDone ? (
                                <Badge
                                  variant="outline"
                                  className="bg-green-50/50 text-green-600/80 border-green-200/50 dark:bg-green-900/15 dark:text-green-400/70 dark:border-green-800/50 text-xs h-5"
                                >
                                  {t("common.done")}
                                </Badge>
                              ) : (
                                <>
                                  <Badge variant="secondary" className="text-muted-foreground/60 text-xs h-5 font-normal tabular-nums">
                                    {publishedCount}/{totalTranslations}
                                  </Badge>
                                  <div className="flex items-center gap-1.5" title={format(latest.publishedAt, "dd.MM.yyyy HH:mm", { locale: ru })}>
                                    <Progress value={progressPct} className="h-1.5 w-20 opacity-50" />
                                    <span className="text-xs text-muted-foreground/60 tabular-nums">
                                      {Math.round(progressPct)}%
                                    </span>
                                  </div>
                                </>
                              )}
                              <a
                                href={originalUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs text-muted-foreground/50 hover:text-foreground/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm transition-colors"
                                title={t("history.viewOriginal")}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <ExternalLink className="h-3 w-3" />
                                {t("history.originalVideo")}
                              </a>
                            </div>
                          </div>
                          <ChevronDown className={`h-4 w-4 text-muted-foreground/50 transition-transform flex-shrink-0 ${isOpen ? "rotate-180" : ""}`} aria-hidden="true" />
                        </div>
                      </div>
                    </div>
                  </button>

                  {isOpen && (
                    <div className="mt-3 space-y-1.5 border-t border-border/30 pt-3">
                      {publishedTranslations.map((tr) => {
                        const url = tr.translatedUrl || "";
                        const isCopied = copiedUrl === url;
                        return (
                          <div key={tr.id} className="flex items-center justify-between gap-4 rounded px-3 md:px-[var(--space-3)] py-3 md:py-[var(--space-2)] hover:bg-muted/20 transition-colors min-h-[44px]">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <Badge variant="outline" className="bg-green-50/50 text-green-600/80 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700 text-xs h-5 font-normal shrink-0">
                                {tr.language} — Готово
                              </Badge>
                              <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex min-w-0 items-center gap-1 truncate text-xs text-primary/70 hover:text-primary hover:underline transition-colors"
                                title={url}
                              >
                                <ExternalLink className="h-3 w-3 flex-shrink-0" />
                                {t("history.viewTranslation")}
                              </a>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {url && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-11 w-11 md:h-7 md:w-auto md:px-2 text-xs touch-manipulation"
                                  onClick={() => copyToClipboard(url)}
                                  title="Скопировать URL"
                                >
                                  {isCopied ? (
                                    <Check className="h-3 w-3 text-green-600" />
                                  ) : (
                                    <Copy className="h-3 w-3" />
                                  )}
                                </Button>
                              )}
                              <span className="text-xs text-muted-foreground/50 tabular-nums text-right min-w-[100px] sm:min-w-[120px] shrink-0">
                                {format(tr.publishedAt, "dd.MM.yyyy HH:mm", { locale: ru })}
                              </span>
                            </div>
                          </div>
                        );
                      })}
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


