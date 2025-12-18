import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import {
  History,
  Trash2,
  ExternalLink,
  X,
  Filter,
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { PageContainer } from "@/components/ui/page-container";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/language-provider";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { ActivityLog } from "@shared/schema";

const eventTypeConfig: Record<string, { labelKey: string }> = {
  video_added: { labelKey: "activity.videoAdded" },
  translation_started: { labelKey: "activity.translationStarted" },
  translation_completed: { labelKey: "activity.translationCompleted" },
  video_deleted: { labelKey: "activity.videoDeleted" },
  schedule_created: { labelKey: "activity.scheduleCreated" },
  schedule_updated: { labelKey: "activity.scheduleUpdated" },
  channel_added: { labelKey: "activity.channelAdded" },
  channel_updated: { labelKey: "activity.channelUpdated" },
  channel_deleted: { labelKey: "activity.channelDeleted" },
  language_added: { labelKey: "activity.languageAdded" },
  language_removed: { labelKey: "activity.languageRemoved" },
  settings_updated: { labelKey: "activity.settingsUpdated" },
};

const eventTypeOptions = [
  { value: "all", labelKey: "activity.allEvents" },
  { value: "video_added", labelKey: "activity.videoAdded" },
  { value: "translation_started", labelKey: "activity.translationStarted" },
  { value: "translation_completed", labelKey: "activity.translationCompleted" },
  { value: "video_deleted", labelKey: "activity.videoDeleted" },
  { value: "schedule_created", labelKey: "activity.scheduleCreated" },
  { value: "schedule_updated", labelKey: "activity.scheduleUpdated" },
  { value: "channel_added", labelKey: "activity.channelAdded" },
  { value: "channel_updated", labelKey: "activity.channelUpdated" },
  { value: "channel_deleted", labelKey: "activity.channelDeleted" },
  { value: "language_added", labelKey: "activity.languageAdded" },
  { value: "language_removed", labelKey: "activity.languageRemoved" },
  { value: "settings_updated", labelKey: "activity.settingsUpdated" },
];

function extractUrlFromDescription(description: string): { text: string; url?: string } {
  if (description === "Settings were updated") {
    return { text: "Настройки обновлены" };
  }

  const quoted = description.match(/\"(https?:\/\/[^\"]+)\"/);
  const plain = quoted ? null : description.match(/(https?:\/\/\S+)/);
  const url = quoted?.[1] ?? plain?.[1];
  if (!url) return { text: description };

  let text = description;
  if (quoted) {
    text = text.replace(quoted[0], "");
  } else if (plain) {
    text = text.replace(plain[0], "");
  }

  text = text.replace(/\s{2,}/g, " ").replace(/\s*:\s*$/, "").trim();
  return { text, url };
}

export default function ActivityPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [eventFilter, setEventFilter] = useState<string>("all");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [clearLogDialogOpen, setClearLogDialogOpen] = useState(false);

  const queryParams = new URLSearchParams();
  if (startDate) {
    queryParams.append("startDate", startDate.toISOString());
  }
  if (endDate) {
    queryParams.append("endDate", endDate.toISOString());
  }
  const queryString = queryParams.toString();

  const { data: logs = [], isLoading } = useQuery<ActivityLog[]>({
    queryKey: ["/api/activity-logs", queryString],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/activity-logs?${queryString || "limit=1000"}`);
      return response.json();
    },
  });

  const clearLogsMutation = useMutation({
    mutationFn: async () => {
      const params = new URLSearchParams();
      if (startDate) {
        params.append("startDate", startDate.toISOString());
      }
      if (endDate) {
        params.append("endDate", endDate.toISOString());
      }
      const response = await apiRequest("DELETE", `/api/activity-logs?${params.toString()}`);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/activity-logs"] });
      toast({
        title: t("activity.logsCleared"),
        description: t("activity.logsClearedDescription", { count: data.deletedCount }),
      });
      setClearLogDialogOpen(false);
      setStartDate(undefined);
      setEndDate(undefined);
    },
    onError: (error) => {
      toast({
        title: t("common.error"),
        description: error instanceof Error ? error.message : "Не удалось очистить лог",
        variant: "destructive",
      });
    },
  });

  const filteredLogs = eventFilter === "all"
    ? logs
    : logs.filter((log) => log.eventType === eventFilter);

  const hasDateFilter = startDate || endDate;

  return (
    <div className="flex flex-1 flex-col">
      <Header title={t("activity.title")} />
      <PageContainer>
        <div className="mb-4 md:mb-6 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground/80">
              {t("activity.description")}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setClearLogDialogOpen(true)}
              className="gap-2 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
            >
              <Trash2 className="h-4 w-4" />
              {t("activity.clearLog")}
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Select value={eventFilter} onValueChange={setEventFilter}>
              <SelectTrigger className="w-full sm:w-[180px] h-8 text-xs" data-testid="select-filter-event">
                <Filter className="mr-2 h-3.5 w-3.5" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {eventTypeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {t(option.labelKey)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "h-8 text-xs",
                    !startDate && "text-muted-foreground"
                  )}
                >
                  {startDate ? format(startDate, "dd.MM.yyyy", { locale: ru }) : "С"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={setStartDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "h-8 text-xs",
                    !endDate && "text-muted-foreground"
                  )}
                >
                  {endDate ? format(endDate, "dd.MM.yyyy", { locale: ru }) : "По"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={setEndDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            {hasDateFilter && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setStartDate(undefined);
                  setEndDate(undefined);
                }}
                className="h-8 gap-1"
              >
                <X className="h-3.5 w-3.5" />
                Сбросить
              </Button>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-1">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : filteredLogs.length === 0 ? (
          <EmptyState
            icon={History}
            title={hasDateFilter ? t("activity.noLogsInRange") : t("activity.noActivity")}
            description={hasDateFilter ? "" : t("activity.noActivityDescription")}
          />
        ) : (
          <div className="space-y-1">
            {filteredLogs.map((log) => {
              const config = eventTypeConfig[log.eventType] || {
                labelKey: log.eventType,
              };
              const { text: descriptionText, url } = extractUrlFromDescription(log.description);

              return (
                <div
                  key={log.id}
                  className="flex items-start justify-between gap-3 py-2.5 px-2 border-b border-border/30 last:border-b-0 hover:bg-muted/20"
                  data-testid={`row-activity-${log.id}`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-muted-foreground/70">
                        {t(config.labelKey)}
                      </span>
                      {url && (
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-shrink-0 text-muted-foreground/60 hover:text-foreground/80 transition-colors"
                          title="Открыть ссылку"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground/60 truncate" data-testid="text-activity-description">
                      {descriptionText}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground/50 tabular-nums flex-shrink-0" data-testid="text-activity-time">
                    {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true, locale: ru })}
                  </p>
                </div>
              );
            })}
          </div>
        )}

        <AlertDialog open={clearLogDialogOpen} onOpenChange={setClearLogDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("activity.clearLog")}</AlertDialogTitle>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => clearLogsMutation.mutate()}
                disabled={clearLogsMutation.isPending}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                autoFocus
              >
                {clearLogsMutation.isPending ? t("common.loading") : t("common.delete")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </PageContainer>
    </div>
  );
}
