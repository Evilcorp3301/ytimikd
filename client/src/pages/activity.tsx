import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import {
  History,
  Trash2,
  ExternalLink,
  X,
  Filter,
  Video,
  PlayCircle,
  CheckCircle2,
  Tv,
  Languages,
  Settings,
  FileVideo,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { PageContainer } from "@/components/ui/page-container";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { ApiError } from "@/lib/api-error";
import type { ActivityLog } from "@shared/schema";

const eventTypeConfig: Record<
  string,
  { labelKey: string; icon: React.ComponentType<React.SVGProps<SVGSVGElement>>; color: string }
> = {
  video_added: { labelKey: "activity.videoAdded", icon: Video, color: "text-blue-500" },
  translation_started: {
    labelKey: "activity.translationStarted",
    icon: PlayCircle,
    color: "text-yellow-500",
  },
  translation_completed: {
    labelKey: "activity.translationCompleted",
    icon: CheckCircle2,
    color: "text-green-500",
  },
  video_deleted: { labelKey: "activity.videoDeleted", icon: FileVideo, color: "text-red-500" },
  schedule_created: {
    labelKey: "activity.scheduleCreated",
    icon: CalendarIcon,
    color: "text-purple-500",
  },
  schedule_updated: {
    labelKey: "activity.scheduleUpdated",
    icon: CalendarIcon,
    color: "text-purple-500",
  },
  channel_added: { labelKey: "activity.channelAdded", icon: Tv, color: "text-cyan-500" },
  channel_updated: { labelKey: "activity.channelUpdated", icon: Tv, color: "text-cyan-500" },
  channel_deleted: { labelKey: "activity.channelDeleted", icon: Tv, color: "text-red-500" },
  language_added: { labelKey: "activity.languageAdded", icon: Languages, color: "text-indigo-500" },
  language_removed: {
    labelKey: "activity.languageRemoved",
    icon: Languages,
    color: "text-red-500",
  },
  settings_updated: {
    labelKey: "activity.settingsUpdated",
    icon: Settings,
    color: "text-gray-500",
  },
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

  const quoted = description.match(/"https?:\/\/[^"]+"/);
  const plain = quoted ? null : description.match(/(https?:\/\/\S+)/);
  const url = quoted?.[1] ?? plain?.[1];
  if (!url) return { text: description };

  let text = description;
  if (quoted) {
    text = text.replace(quoted[0], "");
  } else if (plain) {
    text = text.replace(plain[0], "");
  }

  text = text
    .replace(/\s{2,}/g, " ")
    .replace(/\s*:\s*$/, "")
    .trim();
  return { text, url };
}

const ITEMS_PER_PAGE = 30;

export default function ActivityPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [eventFilter, setEventFilter] = useState<string>("all");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [clearLogDialogOpen, setClearLogDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState<number>(1);

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
        description:
          error instanceof ApiError
            ? error.getMessage()
            : error instanceof Error
              ? error.message
              : "Не удалось очистить лог",
        variant: "destructive",
      });
    },
  });

  const filteredLogs =
    eventFilter === "all" ? logs : logs.filter((log) => log.eventType === eventFilter);

  // Reset to page 1 when filters change
  const prevFilters = useMemo(() => ({ eventFilter, startDate, endDate }), []);
  useEffect(() => {
    if (
      eventFilter !== prevFilters.eventFilter ||
      startDate !== prevFilters.startDate ||
      endDate !== prevFilters.endDate
    ) {
      setCurrentPage(1);
    }
  }, [eventFilter, startDate, endDate, prevFilters]);

  // Pagination
  const totalPages = Math.ceil(filteredLogs.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedLogs = filteredLogs.slice(startIndex, endIndex);

  const hasDateFilter = startDate || endDate;

  return (
    <div className="flex flex-1 flex-col">
      <Header title={t("activity.title")} />
      <PageContainer>
        <div className="mb-4 md:mb-6 lg:mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-heading-3">{t("activity.description")}</p>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setClearLogDialogOpen(true)}
              className="gap-2 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
            >
              <Trash2 className="h-4 w-4" />
              {t("activity.clearLog")}
            </Button>
            <Select value={eventFilter} onValueChange={setEventFilter}>
              <SelectTrigger
                className="w-full sm:w-[180px] h-8 text-xs"
                data-testid="select-filter-event"
              >
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
                  className={cn("h-8 text-xs", !startDate && "text-muted-foreground")}
                >
                  {startDate ? format(startDate, "dd.MM.yyyy", { locale: ru }) : "С"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={setStartDate}
                  locale={ru}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn("h-8 text-xs", !endDate && "text-muted-foreground")}
                >
                  {endDate ? format(endDate, "dd.MM.yyyy", { locale: ru }) : "По"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={setEndDate}
                  locale={ru}
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <div className="p-4 md:p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-5 w-5 rounded" />
                    <Skeleton className="h-5 w-24 rounded" />
                  </div>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <div className="pt-2 border-t">
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : filteredLogs.length === 0 ? (
          <EmptyState
            icon={History}
            title={hasDateFilter ? t("activity.noLogsInRange") : t("activity.noActivity")}
            description={hasDateFilter ? "" : t("activity.noActivityDescription")}
          />
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5">
              {paginatedLogs.map((log) => {
                const config = eventTypeConfig[log.eventType] || {
                  labelKey: log.eventType,
                  icon: History,
                  color: "text-muted-foreground",
                };
                const { text: descriptionText, url } = extractUrlFromDescription(log.description);
                const IconComponent = config.icon;

                return (
                  <Card
                    key={log.id}
                    className="overflow-hidden group flex flex-col border border-border/60 hover:border-border/80 hover:shadow-md transition-all duration-200 relative shadow-sm"
                    data-testid={`card-activity-${log.id}`}
                  >
                    {/* Header section */}
                    <div className="p-4 md:p-5 border-b border-border/20 bg-card flex-1">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <IconComponent className={cn("h-5 w-5 shrink-0", config.color)} />
                          <Badge variant="outline" className="text-xs font-medium">
                            {t(config.labelKey)}
                          </Badge>
                          {url && (
                            <a
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ml-auto flex-shrink-0 inline-flex items-center justify-center rounded-md text-muted-foreground/60 hover:text-primary hover:bg-muted/50 transition-colors min-h-[44px] min-w-[44px] md:h-7 md:w-7"
                              title="Открыть ссылку"
                              aria-label="Открыть ссылку"
                            >
                              <ExternalLink className="h-5 w-5 md:h-4 md:w-4" />
                            </a>
                          )}
                        </div>
                      </div>
                      <p
                        className="text-xs text-muted-foreground/80 line-clamp-2"
                        data-testid="text-activity-description"
                      >
                        {descriptionText}
                      </p>
                    </div>

                    {/* Footer section */}
                    <div className="px-4 py-2 md:px-5 md:py-2.5 border-t border-border/20 bg-muted/30 mt-auto">
                      <p
                        className="text-[10px] md:text-[11px] text-muted-foreground/70 tabular-nums font-medium"
                        data-testid="text-activity-time"
                      >
                        {formatDistanceToNow(new Date(log.createdAt), {
                          addSuffix: true,
                          locale: ru,
                        })}
                      </p>
                    </div>
                  </Card>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 pt-4 border-t border-border/50">
                {/* Mobile: Compact design */}
                <div className="flex flex-col gap-3 sm:hidden">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {startIndex + 1}-{Math.min(endIndex, filteredLogs.length)} из{" "}
                      {filteredLogs.length}
                    </span>
                    <span className="text-xs font-medium text-foreground tabular-nums">
                      {currentPage} / {totalPages}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="flex-1 gap-2 h-9"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      <span className="text-xs">Назад</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="flex-1 gap-2 h-9"
                    >
                      <span className="text-xs">Вперёд</span>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Desktop: Full design */}
                <div className="hidden sm:flex items-center justify-between">
                  <div className="text-sm text-muted-foreground tabular-nums">
                    Показано <span className="font-medium text-foreground">{startIndex + 1}</span>-
                    <span className="font-medium text-foreground">
                      {Math.min(endIndex, filteredLogs.length)}
                    </span>{" "}
                    из <span className="font-medium text-foreground">{filteredLogs.length}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="gap-2 h-9 min-w-[100px]"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      <span className="text-xs">Предыдущая</span>
                    </Button>
                    <div className="flex items-center gap-1 px-2">
                      <span className="text-sm font-medium text-foreground tabular-nums min-w-[60px] text-center">
                        {currentPage}
                      </span>
                      <span className="text-sm text-muted-foreground">из</span>
                      <span className="text-sm font-medium text-foreground tabular-nums min-w-[60px] text-center">
                        {totalPages}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="gap-2 h-9 min-w-[100px]"
                    >
                      <span className="text-xs">Следующая</span>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </>
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
