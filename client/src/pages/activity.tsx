import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import {
  History,
  Video,
  Languages,
  Calendar as CalendarIcon,
  Tv,
  Settings,
  Check,
  Plus,
  Trash2,
  Edit2,
  Filter,
  ExternalLink,
  X,
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { PageContainer } from "@/components/ui/page-container";
import { EmptyState } from "@/components/ui/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
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

const eventTypeConfig: Record<string, { icon: React.ElementType; color: string; labelKey: string }> = {
  video_added: { icon: Plus, color: "text-green-500", labelKey: "activity.videoAdded" },
  translation_started: { icon: Languages, color: "text-blue-500", labelKey: "activity.translationStarted" },
  translation_completed: { icon: Check, color: "text-green-500", labelKey: "activity.translationCompleted" },
  video_deleted: { icon: Trash2, color: "text-red-500", labelKey: "activity.videoDeleted" },
  schedule_created: { icon: Calendar, color: "text-purple-500", labelKey: "activity.scheduleCreated" },
  schedule_updated: { icon: Edit2, color: "text-orange-500", labelKey: "activity.scheduleUpdated" },
  channel_added: { icon: Tv, color: "text-green-500", labelKey: "activity.channelAdded" },
  channel_updated: { icon: Edit2, color: "text-blue-500", labelKey: "activity.channelUpdated" },
  channel_deleted: { icon: Trash2, color: "text-red-500", labelKey: "activity.channelDeleted" },
  language_added: { icon: Plus, color: "text-green-500", labelKey: "activity.languageAdded" },
  language_removed: { icon: Trash2, color: "text-red-500", labelKey: "activity.languageRemoved" },
  settings_updated: { icon: Settings, color: "text-muted-foreground", labelKey: "activity.settingsUpdated" },
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
  // Common patterns in our logs:
  // - `Видео добавлено: "https://..."`
  // - `...: https://...`
  // Legacy English strings that may exist in DB:
  // - `Settings were updated`
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

  // Clean up leftover punctuation/whitespace
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
  const [eventFilterOpen, setEventFilterOpen] = useState(false);
  const [startDatePickerOpen, setStartDatePickerOpen] = useState(false);
  const [endDatePickerOpen, setEndDatePickerOpen] = useState(false);

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
        <div className="mb-4 md:mb-6 lg:mb-8 flex flex-col gap-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">
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

          {/* Filters row */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Select 
              value={eventFilter} 
              onValueChange={setEventFilter}
              open={eventFilterOpen}
              onOpenChange={(open) => {
                setEventFilterOpen(open);
                // Close date pickers when event filter opens
                if (open) {
                  setStartDatePickerOpen(false);
                  setEndDatePickerOpen(false);
                }
              }}
            >
              <SelectTrigger className="w-full sm:w-[200px] h-9 text-sm" data-testid="select-filter-event">
                <Filter className="mr-2 h-4 w-4" aria-hidden="true" />
                <SelectValue placeholder={t("activity.filterEvents")} />
              </SelectTrigger>
              <SelectContent>
                {eventTypeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {t(option.labelKey)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Popover open={startDatePickerOpen} onOpenChange={(open) => {
              setStartDatePickerOpen(open);
              // Close event filter and end date picker when start date picker opens
              if (open) {
                setEventFilterOpen(false);
                setEndDatePickerOpen(false);
              }
            }}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full sm:w-[200px] h-9 justify-start text-left font-normal text-sm",
                    !startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "dd.MM.yyyy", { locale: ru }) : t("activity.startDate")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={(date) => {
                    setStartDate(date);
                    // Close picker after selection
                    setStartDatePickerOpen(false);
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {startDate && (
              <Button
                variant="ghost"
                size="sm"
                className="h-9 w-9 p-0"
                onClick={() => setStartDate(undefined)}
              >
                <X className="h-4 w-4" />
              </Button>
            )}

            <Popover open={endDatePickerOpen} onOpenChange={(open) => {
              setEndDatePickerOpen(open);
              // Close event filter and start date picker when end date picker opens
              if (open) {
                setEventFilterOpen(false);
                setStartDatePickerOpen(false);
              }
            }}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full sm:w-[200px] h-9 justify-start text-left font-normal text-sm",
                    !endDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, "dd.MM.yyyy", { locale: ru }) : t("activity.endDate")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={(date) => {
                    setEndDate(date);
                    // Close picker after selection
                    setEndDatePickerOpen(false);
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {endDate && (
              <Button
                variant="ghost"
                size="sm"
                className="h-9 w-9 p-0"
                onClick={() => setEndDate(undefined)}
              >
                <X className="h-4 w-4" />
              </Button>
            )}

            {hasDateFilter && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setStartDate(undefined);
                  setEndDate(undefined);
                }}
                className="h-9 gap-2"
              >
                <X className="h-4 w-4" />
                {t("activity.clearFilter")}
              </Button>
            )}
          </div>
        </div>

        {isLoading ? (
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="flex items-start gap-4 p-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-full max-w-md" />
                    </div>
                    <Skeleton className="h-4 w-24" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : filteredLogs.length === 0 ? (
          <EmptyState
            icon={History}
            title={hasDateFilter ? t("activity.noLogsInRange") : t("activity.noActivity")}
            description={hasDateFilter ? "" : t("activity.noActivityDescription")}
          />
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {filteredLogs.map((log) => {
                  const config = eventTypeConfig[log.eventType] || {
                    icon: History,
                    color: "text-muted-foreground",
                    labelKey: log.eventType,
                  };
                  const Icon = config.icon;
                  const { text: descriptionText, url } = extractUrlFromDescription(log.description);

                  return (
                    <div
                      key={log.id}
                      className="grid grid-cols-[24px_1fr_auto] md:grid-cols-[40px_1fr_168px] grid-rows-[auto_auto] items-start gap-x-2 md:gap-x-4 gap-y-1 p-4"
                      data-testid={`row-activity-${log.id}`}
                    >
                      <div
                        className={cn(
                          "flex items-center justify-center row-span-2",
                          "h-6 w-6 md:h-10 md:w-10"
                        )}
                      >
                        <Icon className={cn("h-4 w-4 md:h-5 md:w-5", config.color)} />
                      </div>

                      {/* Row 1: event label */}
                      <div className="min-w-0 flex items-center gap-2">
                        <Badge variant="outline">
                          {t(config.labelKey)}
                        </Badge>
                      </div>
                      <div className="flex-shrink-0 text-right tabular-nums" />

                      {/* Row 2: description + optional link, and the relative time aligned to it */}
                      <div className="min-w-0 flex min-w-0 items-start gap-2">
                        {url && (
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-[1px] flex-shrink-0 text-muted-foreground hover:text-foreground"
                            title="Открыть ссылку"
                            aria-label="Открыть ссылку"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        )}
                        <p className="min-w-0 text-xs leading-snug text-muted-foreground" data-testid="text-activity-description">
                          {descriptionText}
                        </p>
                      </div>
                      <div className="flex-shrink-0 text-right tabular-nums">
                        <p className="text-xs text-muted-foreground" data-testid="text-activity-time">
                          {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true, locale: ru })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
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
