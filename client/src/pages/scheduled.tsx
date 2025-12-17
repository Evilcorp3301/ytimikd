import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, differenceInHours, differenceInMinutes } from "date-fns";
import { ru } from "date-fns/locale";
import { Calendar as CalendarIcon, Clock, AlertTriangle, Tv, ExternalLink } from "lucide-react";
import { Header } from "@/components/layout/header";
import { PageContainer } from "@/components/ui/page-container";
import { EmptyState } from "@/components/ui/empty-state";
import { VideoThumbnail } from "@/components/ui/video-thumbnail";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

export default function ScheduledPage() {
  const { t } = useTranslation();
  const [channelFilter, setChannelFilter] = useState<string>("all");
  const [now, setNow] = useState(new Date());

  // Update time every minute for real-time countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  const { data: scheduledTranslations = [], isLoading } = useQuery<TranslationWithDetails[]>({
    queryKey: ["/api/translations?scheduled=true"],
  });

  const { data: channels = [] } = useQuery<Channel[]>({
    queryKey: ["/api/channels"],
  });

  const filteredTranslations = scheduledTranslations
    // Show all scheduled items. When the time arrives, backend cron moves it to history automatically.
    .filter((t) => t.scheduledDate && (channelFilter === "all" || t.channelId === channelFilter))
    .sort((a, b) => new Date(a.scheduledDate!).getTime() - new Date(b.scheduledDate!).getTime());

  const getVideoThumbnail = (url?: string) => {
    if (!url) return null;
    const videoId = extractYouTubeVideoId(url);
    return videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : null;
  };

  return (
    <div className="flex flex-1 flex-col">
      <Header title={t("scheduled.title")} />
      <PageContainer>
        <div className="mb-4 md:mb-6 lg:mb-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Select value={channelFilter} onValueChange={setChannelFilter}>
              <SelectTrigger className="w-[180px]" data-testid="select-filter-channel">
                <Tv className="mr-2 h-4 w-4" />
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
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-orange-400" />
              <span className="text-muted-foreground">{t("scheduled.within12h")}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-red-500" />
              <span className="text-muted-foreground">{t("scheduled.within2h")}</span>
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
        ) : filteredTranslations.length === 0 ? (
          <EmptyState
            icon={CalendarIcon}
            title={t("scheduled.noTranslations")}
            description={t("scheduled.noTranslationsDescription")}
          />
        ) : (
          <div className="space-y-4">
            {filteredTranslations.map((translation) => {
              const scheduledDate = new Date(translation.scheduledDate!);
              const urgency = getUrgencyLevel(scheduledDate, now);
              const styles = urgencyStyles[urgency];

              return (
                <Card
                  key={translation.id}
                  className={cn("transition-all", styles.card)}
                  data-testid={`card-scheduled-${translation.id}`}
                >
                  <CardContent className="p-4">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                      <VideoThumbnail
                        thumbnailUrl={getVideoThumbnail(translation.video?.url)}
                        title={translation.video?.title}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold truncate mb-2" data-testid="text-video-title">
                              {translation.video?.title || t("scheduled.untitledVideo")}
                            </h3>
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge variant="secondary">{translation.language}</Badge>
                              {translation.video?.subcategory?.category && translation.video?.subcategory && (
                                <Badge variant="outline" className="text-xs">
                                  {translation.video.subcategory.category.name} / {translation.video.subcategory.name}
                                </Badge>
                              )}
                              {translation.channel && (
                                <span className="text-xs text-muted-foreground">
                                  {translation.channel.name}
                                </span>
                              )}
                              {translation.video?.url && (
                                <a
                                  href={translation.video.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
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
                              className={cn("text-xs font-medium border shrink-0", styles.urgencyBadge)}
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
                        <div className="flex flex-wrap items-center gap-4 text-xs">
                          <div className={cn("flex items-center gap-1.5", styles.icon)}>
                            {urgency === "urgent" ? (
                              <AlertTriangle className="h-4 w-4" />
                            ) : (
                              <Clock className="h-4 w-4" />
                            )}
                            <span className="text-muted-foreground" data-testid="text-scheduled-date">
                              {format(scheduledDate, "dd.MM.yyyy HH:mm", { locale: ru })}
                            </span>
                            <span className="text-muted-foreground">
                              ({getTimeUntilString(scheduledDate, now)})
                            </span>
                          </div>
                          {translation.voiceOverName && (
                            <span className="text-muted-foreground">
                              {t("scheduled.voice")}: {translation.voiceOverName}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </PageContainer>
    </div>
  );
}
