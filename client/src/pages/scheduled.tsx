import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { format, differenceInHours, differenceInMinutes } from "date-fns";
import { ru } from "date-fns/locale";
import { Calendar as CalendarIcon, Clock, AlertTriangle, Tv, ExternalLink, ArrowUpDown, Plus } from "lucide-react";
import { Header } from "@/components/layout/header";
import { PageContainer } from "@/components/ui/page-container";
import { EmptyState } from "@/components/ui/empty-state";
import { VideoThumbnail } from "@/components/ui/video-thumbnail";
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
import type { TranslationWithDetails, Channel } from "@shared/schema";

type UrgencyLevel = "normal" | "warning" | "urgent";

function getUrgencyLevel(scheduledDate: Date, currentTime: Date = new Date()): UrgencyLevel {
  const hoursUntil = differenceInHours(scheduledDate, currentTime);

  if (hoursUntil <= 2) return "urgent";
  if (hoursUntil <= 12) return "warning";
  return "normal";
}

const urgencyStyles: Record<UrgencyLevel, { card: string; badge: string; icon: string; urgencyBadge: string }> = {
  normal: {
    card: "border-l-4 border-l-transparent",
    badge: "bg-muted text-muted-foreground",
    icon: "text-muted-foreground",
    urgencyBadge: "bg-muted text-muted-foreground",
  },
  warning: {
    card: "border-l-4 border-l-orange-400 shadow-sm shadow-orange-200/50 dark:shadow-orange-900/30",
    badge: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
    icon: "text-orange-500",
    urgencyBadge: "bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900/40 dark:text-orange-300 dark:border-orange-700",
  },
  urgent: {
    card: "border-l-4 border-l-red-500 shadow-md shadow-red-200/50 dark:shadow-red-900/40 animate-pulse",
    badge: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
    icon: "text-red-500",
    urgencyBadge: "bg-red-100 text-red-700 border-red-300 dark:bg-red-900/40 dark:text-red-300 dark:border-red-700",
  },
};

function getTimeUntilString(scheduledDate: Date, currentTime: Date = new Date()): string {
  const minutesUntil = differenceInMinutes(scheduledDate, currentTime);
  const hoursUntil = differenceInHours(scheduledDate, currentTime);

  if (minutesUntil < 60) {
    return `через ${minutesUntil} мин`;
  }
  if (hoursUntil < 24) {
    return `через ${hoursUntil} ч`;
  }
  return format(scheduledDate, "dd.MM в HH:mm", { locale: ru });
}

type SortOption = "date_asc" | "date_desc" | "time_asc" | "time_desc";

export default function ScheduledPage() {
  const { t } = useTranslation();
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
  const { data: allScheduledTranslations = [] } = useQuery<TranslationWithDetails[]>({
    queryKey: ["/api/translations?scheduled=true"],
  });

  // Build query URL with filters for displaying translations
  const translationsQueryUrl = (() => {
    const params = new URLSearchParams({ scheduled: "true" });
    if (channelFilter !== "all") {
      params.append("channelId", channelFilter);
    }
    return `/api/translations?${params.toString()}`;
  })();

  const { data: scheduledTranslations = [], isLoading } = useQuery<TranslationWithDetails[]>({
    queryKey: [translationsQueryUrl],
  });

  const { data: allChannels = [] } = useQuery<Channel[]>({
    queryKey: ["/api/channels"],
  });

  // Get unique channel IDs from ALL scheduled translations (not filtered)
  const availableChannelIds = useMemo(() => {
    return new Set(
      allScheduledTranslations
        .map((t) => t.channelId)
        .filter((id): id is string => Boolean(id))
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
    const styles = urgencyStyles[urgency];

    return (
      <Card
        key={translation.id}
        className={cn("transition-all", styles.card)}
        data-testid={`card-scheduled-${translation.id}`}
      >
        <CardContent className="p-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
            <VideoThumbnail
              thumbnailUrl={getVideoThumbnail(translation.video?.url)}
              title={translation.video?.title}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4 mb-1.5">
                <div className="min-w-0 flex-1">
                  <h3 className="text-heading-3 truncate mb-1.5 leading-tight" data-testid="text-video-title">
                    {translation.video?.title || t("scheduled.untitledVideo")}
                  </h3>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge variant="secondary" className="text-muted-foreground/60 text-xs h-5 font-normal">{translation.language}</Badge>
                    {translation.video?.subcategory?.category && translation.video?.subcategory && (
                      <Badge variant="outline" className="text-xs text-muted-foreground/60 border-muted-foreground/20 h-5 font-normal">
                        {translation.video.subcategory.category.name} / {translation.video.subcategory.name}
                      </Badge>
                    )}
                    {!groupByChannel && translation.channel && (
                      <span className="text-xs text-muted-foreground/50">
                        {translation.channel.name}
                      </span>
                    )}
                    {translation.video?.url && (
                      <a
                        href={translation.video.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-muted-foreground/50 hover:text-foreground/70 transition-colors"
                        title={t("history.viewOriginal")}
                      >
                        <ExternalLink className="h-3 w-3" />
                        {t("history.originalVideo")}
                      </a>
                    )}
                  </div>
                </div>
                {(urgency === "urgent" || urgency === "warning") && (
                  <Badge 
                    variant="outline" 
                    className={cn("text-xs font-medium border shrink-0 h-5", styles.urgencyBadge)}
                  >
                    {urgency === "urgent" ? (
                      <>
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Срочно
                      </>
                    ) : (
                      "Скоро"
                    )}
                  </Badge>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <div className={cn("flex items-center gap-1.5", styles.icon)}>
                  {urgency === "urgent" ? (
                    <AlertTriangle className="h-3.5 w-3.5 opacity-70" />
                  ) : (
                    <Clock className="h-3.5 w-3.5 opacity-50" />
                  )}
                  <span className="text-muted-foreground/60 tabular-nums" data-testid="text-scheduled-date">
                    {format(scheduledDate, "dd.MM.yyyy HH:mm", { locale: ru })}
                  </span>
                  <span className="text-muted-foreground/50 tabular-nums">
                    ({getTimeUntilString(scheduledDate, now)})
                  </span>
                </div>
                {translation.voiceOverName && (
                  <span className="text-muted-foreground/50">
                    {t("scheduled.voice")}: {translation.voiceOverName}
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
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
                <SelectTrigger className="w-full sm:w-[180px] sm:shrink-0" data-testid="select-filter-channel">
                  <Tv className="mr-2 h-4 w-4 shrink-0" />
                  <SelectValue placeholder={t("scheduled.allChannels")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("common.all")} {t("nav.channels")}</SelectItem>
                  {channels.map((channel) => (
                    <SelectItem key={channel.id} value={channel.id}>
                      {channel.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* Sort filter */}
              <Select value={sortOption} onValueChange={(value) => setSortOption(value as SortOption)}>
                <SelectTrigger className="w-full sm:w-[220px] sm:shrink-0" data-testid="select-sort">
                  <ArrowUpDown className="mr-2 h-4 w-4 shrink-0" />
                  <SelectValue placeholder="Сортировка" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date_asc">По дате (сначала ближайшие)</SelectItem>
                  <SelectItem value="date_desc">По дате (сначала дальние)</SelectItem>
                  <SelectItem value="time_asc">По времени до публикации (сначала ближайшие)</SelectItem>
                  <SelectItem value="time_desc">По времени до публикации (сначала дальние)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {isLoading ? (
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
              return filteredAndSortedTranslations instanceof Map && filteredAndSortedTranslations.size === 0;
            } else {
              return Array.isArray(filteredAndSortedTranslations) && filteredAndSortedTranslations.length === 0;
            }
          })() ? (
          <EmptyState
            icon={CalendarIcon}
            title={t("scheduled.noTranslations")}
            description="Нет запланированных переводов. Перейдите в очередь, чтобы запланировать публикацию переводов."
            action={
              <Link href="/queue">
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
                <div key={channelId} className="space-y-2.5">
                  <div className="flex items-center gap-2 mb-2">
                    <Tv className="h-4 w-4 text-muted-foreground" />
                    <h2 className="text-heading-2 font-semibold">{channelName}</h2>
                    <Badge variant="secondary" className="text-xs">
                      {translations.length} {translations.length === 1 ? "перевод" : translations.length < 5 ? "перевода" : "переводов"}
                    </Badge>
                  </div>
                  {translations.map((translation) => renderTranslationCard(translation))}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-2.5">
            {(filteredAndSortedTranslations as typeof scheduledTranslations).map((translation) => {
              return renderTranslationCard(translation);
            })}
          </div>
        )}
      </PageContainer>
    </div>
  );
}
