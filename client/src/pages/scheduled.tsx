import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import {
  Calendar as CalendarIcon,
  Clock,
  AlertTriangle,
  Tv,
  ExternalLink,
  ArrowUpDown,
  Plus,
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { PageContainer } from "@/components/ui/page-container";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { getPath } from "@/lib/paths";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/language-provider";
import { extractYouTubeVideoId } from "@/lib/youtube";
import { getUrgencyLevel, getTimeUntilString, type UrgencyLevel } from "@/lib/time";
import { differenceInHours, differenceInMinutes } from "date-fns";
import { usePageVisibility } from "@/hooks/use-page-visibility";
import type { TranslationWithDetails, Channel } from "@shared/schema";

// Цвета для полос статуса
const urgencyBarColors: Record<UrgencyLevel, string> = {
  normal: "bg-green-500",
  warning: "bg-orange-500",
  urgent: "bg-red-500",
};

// Цвета для текста "Осталось"
const urgencyTextColors: Record<UrgencyLevel, string> = {
  normal: "text-green-600 dark:text-green-400",
  warning: "text-orange-600 dark:text-orange-400",
  urgent: "text-red-600 dark:text-red-400",
};

// Функция для форматирования оставшегося времени
function getTimeRemainingString(scheduledDate: Date, currentTime: Date): string {
  const minutesUntil = differenceInMinutes(scheduledDate, currentTime);
  const hoursUntil = differenceInHours(scheduledDate, currentTime);

  if (minutesUntil < 60) {
    return `Осталось: ${minutesUntil} минут`;
  }

  const hours = hoursUntil;
  const minutes = minutesUntil % 60;

  if (minutes === 0) {
    return `Осталось: ${hours} ${hours === 1 ? "час" : hours < 5 ? "часа" : "часов"}`;
  }

  return `Осталось: ${hours} ${hours === 1 ? "час" : hours < 5 ? "часа" : "часов"} ${minutes} ${minutes === 1 ? "минута" : minutes < 5 ? "минуты" : "минут"}`;
}

type SortOption = "date_asc" | "date_desc" | "time_asc" | "time_desc";

export default function ScheduledPage() {
  const { t } = useTranslation();
  const isPageVisible = usePageVisibility();
  const [channelFilter, setChannelFilter] = useState<string>("all");
  const [sortOption, setSortOption] = useState<SortOption>("date_asc");
  const [groupByChannel, setGroupByChannel] = useState<boolean>(false);
  const [now, setNow] = useState(new Date());

  // Update time every minute for real-time countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  // Get ALL scheduled translations (without channel filter) to build channel list
  const {
    data: allScheduledTranslations = [],
    error: allScheduledError,
    refetch: refetchAllScheduled,
  } = useQuery<TranslationWithDetails[]>({
    queryKey: ["/api/translations?scheduled=true"],
    refetchInterval: isPageVisible ? 10000 : false, // Обновление каждые 10 секунд только когда страница видима
    staleTime: 5000, // Данные считаются устаревшими через 5 секунд
  });

  // Build query URL with filters for displaying translations
  const translationsQueryUrl = (() => {
    const params = new URLSearchParams({ scheduled: "true" });
    if (channelFilter !== "all") {
      params.append("channelId", channelFilter);
    }
    return `/api/translations?${params.toString()}`;
  })();

  const {
    data: scheduledTranslations = [],
    isLoading,
    error: scheduledError,
    refetch: refetchScheduled,
  } = useQuery<TranslationWithDetails[]>({
    queryKey: [translationsQueryUrl],
    refetchInterval: isPageVisible ? 10000 : false, // Обновление каждые 10 секунд только когда страница видима
    staleTime: 5000, // Данные считаются устаревшими через 5 секунд
  });

  const {
    data: allChannels = [],
    error: channelsError,
    refetch: refetchChannels,
  } = useQuery<Channel[]>({
    queryKey: ["/api/channels"],
    refetchInterval: isPageVisible ? 15000 : false, // Каналы обновляются реже - каждые 15 секунд
  });

  // Get unique channel IDs from ALL scheduled translations (not filtered)
  const availableChannelIds = useMemo(() => {
    return new Set(
      allScheduledTranslations.map((t) => t.channelId).filter((id): id is string => Boolean(id))
    );
  }, [allScheduledTranslations]);

  // Filter channels to show only those used in scheduled translations, remove duplicates
  const channels = useMemo(() => {
    const channelMap = new Map<string, Channel>();
    allChannels.forEach((channel) => {
      if (availableChannelIds.has(channel.id) && !channelMap.has(channel.id)) {
        channelMap.set(channel.id, channel);
      }
    });
    return Array.from(channelMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [allChannels, availableChannelIds]);

  // Reset filter if selected channel is not in available channels
  useEffect(() => {
    if (channelFilter !== "all" && !channels.some((ch) => ch.id === channelFilter)) {
      setChannelFilter("all");
    }
  }, [channelFilter, channels]);

  // Handle channel filter change with explicit callback
  const handleChannelFilterChange = (value: string) => {
    setChannelFilter(value);
  };

  const filteredAndSortedTranslations = useMemo(() => {
    const filtered = scheduledTranslations
      // Backend already filters for future scheduled dates, but add extra safety check
      .filter((t) => {
        if (!t.scheduledDate) return false;
        const scheduledDate = new Date(t.scheduledDate);
        const now = new Date();
        // Only show future scheduled translations
        return scheduledDate.getTime() > now.getTime();
      });

    // Sort translations
    const sorted = [...filtered].sort((a, b) => {
      const dateA = new Date(a.scheduledDate!).getTime();
      const dateB = new Date(b.scheduledDate!).getTime();
      const timeUntilA = dateA - now.getTime();
      const timeUntilB = dateB - now.getTime();

      switch (sortOption) {
        case "date_asc":
          return dateA - dateB;
        case "date_desc":
          return dateB - dateA;
        case "time_asc":
          return timeUntilA - timeUntilB;
        case "time_desc":
          return timeUntilB - timeUntilA;
        default:
          return dateA - dateB;
      }
    });

    // Group by channel if enabled
    if (groupByChannel) {
      const grouped = new Map<string, typeof sorted>();
      sorted.forEach((translation) => {
        const channelId = translation.channelId || "no-channel";
        const channelName = translation.channel?.name || "Без канала";
        const key = `${channelId}|${channelName}`;
        if (!grouped.has(key)) {
          grouped.set(key, []);
        }
        grouped.get(key)!.push(translation);
      });
      return grouped;
    }

    return sorted;
  }, [scheduledTranslations, sortOption, groupByChannel, now]);

  const getVideoThumbnail = (url?: string) => {
    if (!url) return null;
    const videoId = extractYouTubeVideoId(url);
    return videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : null;
  };

  function renderTranslationCard(translation: TranslationWithDetails) {
    const scheduledDate = new Date(translation.scheduledDate!);
    const urgency = getUrgencyLevel(scheduledDate, now);
    const thumbnailUrl = getVideoThumbnail(translation.video?.url);
    const title = translation.video?.title || t("scheduled.untitledVideo");

    return (
      <Card
        key={translation.id}
        className="overflow-hidden flex flex-col border border-border/60 hover:border-border/80 hover:shadow-md transition-all duration-200 relative shadow-sm"
        data-testid={`card-scheduled-${translation.id}`}
      >
        {/* Цветная полоса статуса сверху */}
        <div className={cn("absolute top-0 left-0 right-0 h-1", urgencyBarColors[urgency])} />

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
              <CalendarIcon className="h-12 w-12 text-muted-foreground/50" />
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
            <div className="flex flex-wrap items-center gap-2">
              {translation.video?.subcategory?.category && translation.video?.subcategory && (
                <Badge
                  variant="outline"
                  className="text-xs font-normal text-muted-foreground/70 border-muted-foreground/30"
                >
                  {translation.video.subcategory.category.name} / {translation.video.subcategory.name}
                </Badge>
              )}
              {!groupByChannel && translation.channel && (
                <span className="text-xs text-muted-foreground/60">{translation.channel.name}</span>
              )}
            </div>
          </div>

          {/* Language and Voice Over */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">Язык:</span>
              <Badge
                variant="secondary"
                className="text-xs font-medium bg-status-scheduled/10 text-status-scheduled-fg border-status-scheduled-border"
              >
                {translation.language}
              </Badge>
            </div>
            {translation.voiceOverName && (
              <div className="text-sm text-muted-foreground/70">
                {t("scheduled.voice")}: {translation.voiceOverName}
              </div>
            )}
          </div>

          {/* Scheduled Date and Time */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground/60" />
              <span className="font-medium tabular-nums">
                {format(scheduledDate, "dd.MM.yyyy HH:mm", { locale: ru })}
              </span>
            </div>
            <div className={cn("flex items-center gap-2 text-sm font-semibold", urgencyTextColors[urgency])}>
              <AlertTriangle className={cn("h-4 w-4", urgency === "normal" && "hidden")} />
              <span>{getTimeRemainingString(scheduledDate, now)}</span>
            </div>
          </div>

          {/* Original video link */}
          {translation.video?.url && (
            <div className="pt-2 border-t border-border/30">
              <Button variant="outline" size="sm" className="w-full" asChild>
                <a
                  href={translation.video.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  {t("history.originalVideo")}
                </a>
              </Button>
            </div>
          )}
        </div>
      </Card>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <Header title={t("scheduled.title")} />
      <PageContainer>
        {/* Filters section - optimized for mobile and desktop */}
        <div className="mb-4 md:mb-6 lg:mb-8">
          {/* Mobile: button first, then filters. Desktop: filters left, button right */}
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
            {/* Group by channel button - first on mobile (order-1), right on desktop (order-3) */}
            <Button
              variant={groupByChannel ? "default" : "outline"}
              size="sm"
              onClick={() => setGroupByChannel(!groupByChannel)}
              className="gap-2 w-full sm:w-auto sm:order-3 sm:shrink-0"
            >
              <Tv className="h-4 w-4" />
              {groupByChannel ? "По списку" : "По каналам"}
            </Button>

            {/* Filters row - on mobile: stacked (order-2), on desktop: horizontal (order-1) */}
            <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:order-1 sm:flex-1 sm:max-w-2xl">
              {/* Channel filter */}
              <Select value={channelFilter} onValueChange={handleChannelFilterChange}>
                <SelectTrigger
                  className="w-full sm:w-[180px] sm:shrink-0"
                  data-testid="select-filter-channel"
                >
                  <Tv className="mr-2 h-4 w-4 shrink-0" />
                  <SelectValue placeholder={t("scheduled.allChannels")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {t("common.all")} {t("nav.channels")}
                  </SelectItem>
                  {channels.map((channel) => (
                    <SelectItem key={channel.id} value={channel.id}>
                      {channel.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Sort filter */}
              <Select
                value={sortOption}
                onValueChange={(value) => setSortOption(value as SortOption)}
              >
                <SelectTrigger
                  className="w-full sm:w-[220px] sm:shrink-0"
                  data-testid="select-sort"
                >
                  <ArrowUpDown className="mr-2 h-4 w-4 shrink-0" />
                  <SelectValue placeholder="Сортировка" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date_asc">По дате (сначала ближайшие)</SelectItem>
                  <SelectItem value="date_desc">По дате (сначала дальние)</SelectItem>
                  <SelectItem value="time_asc">
                    По времени до публикации (сначала ближайшие)
                  </SelectItem>
                  <SelectItem value="time_desc">
                    По времени до публикации (сначала дальние)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {scheduledError || allScheduledError || channelsError ? (
          <ErrorState
            title={t("common.error")}
            description={
              scheduledError instanceof Error
                ? scheduledError.message
                : allScheduledError instanceof Error
                  ? allScheduledError.message
                  : channelsError instanceof Error
                    ? channelsError.message
                    : "Не удалось загрузить запланированные переводы"
            }
            onRetry={() => {
              refetchScheduled();
              refetchAllScheduled();
              refetchChannels();
            }}
            retryLabel={t("common.retry")}
          />
        ) : isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="p-4">
                <div className="flex gap-4">
                  <Skeleton className="h-[68px] w-[120px] rounded-md" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-1/3" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (() => {
            if (groupByChannel) {
              return (
                filteredAndSortedTranslations instanceof Map &&
                filteredAndSortedTranslations.size === 0
              );
            } else {
              return (
                Array.isArray(filteredAndSortedTranslations) &&
                filteredAndSortedTranslations.length === 0
              );
            }
          })() ? (
          <EmptyState
            icon={CalendarIcon}
            title={t("scheduled.noTranslations")}
            description="Нет запланированных переводов. Перейдите в очередь, чтобы запланировать публикацию переводов."
            action={
              <Link href={getPath("/queue")}>
                <Button size="lg" className="gap-2" data-testid="button-schedule-translation">
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  Запланировать перевод
                </Button>
              </Link>
            }
          />
        ) : groupByChannel && filteredAndSortedTranslations instanceof Map ? (
          <div className="space-y-6">
            {Array.from(filteredAndSortedTranslations.entries()).map(([key, translations]) => {
              const [channelId, channelName] = key.split("|");
              return (
                <div key={channelId} className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Tv className="h-4 w-4 text-muted-foreground" />
                    <h2 className="text-heading-2 font-semibold">{channelName}</h2>
                    <Badge variant="secondary" className="text-xs">
                      {translations.length}{" "}
                      {translations.length === 1
                        ? "перевод"
                        : translations.length < 5
                          ? "перевода"
                          : "переводов"}
                    </Badge>
                  </div>
                  <div className="grid gap-4 md:gap-5 grid-cols-1 md:grid-cols-2">
                    {translations.map((translation) => renderTranslationCard(translation))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="grid gap-4 md:gap-5 grid-cols-1 md:grid-cols-2">
            {(filteredAndSortedTranslations as typeof scheduledTranslations).map((translation) => {
              return renderTranslationCard(translation);
            })}
          </div>
        )}
      </PageContainer>
    </div>
  );
}
