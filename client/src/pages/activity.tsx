import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import {
  History,
  Video,
  Languages,
  Calendar,
  Tv,
  Settings,
  Check,
  Plus,
  Trash2,
  Edit2,
  Filter,
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
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/language-provider";
import type { ActivityLog } from "@shared/schema";

const eventTypeConfig: Record<string, { icon: React.ElementType; color: string; labelKey: string }> = {
  video_added: { icon: Plus, color: "text-green-500", labelKey: "activity.videoAdded" },
  translation_started: { icon: Languages, color: "text-blue-500", labelKey: "activity.translationStarted" },
  translation_completed: { icon: Check, color: "text-green-500", labelKey: "activity.translationCompleted" },
  video_archived: { icon: History, color: "text-muted-foreground", labelKey: "activity.videoArchived" },
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
  { value: "video_archived", labelKey: "activity.videoArchived" },
  { value: "schedule_created", labelKey: "activity.scheduleCreated" },
  { value: "schedule_updated", labelKey: "activity.scheduleUpdated" },
  { value: "channel_added", labelKey: "activity.channelAdded" },
  { value: "channel_updated", labelKey: "activity.channelUpdated" },
  { value: "channel_deleted", labelKey: "activity.channelDeleted" },
  { value: "language_added", labelKey: "activity.languageAdded" },
  { value: "language_removed", labelKey: "activity.languageRemoved" },
  { value: "settings_updated", labelKey: "activity.settingsUpdated" },
];

export default function ActivityPage() {
  const { t } = useTranslation();
  const [eventFilter, setEventFilter] = useState<string>("all");

  const { data: logs = [], isLoading } = useQuery<ActivityLog[]>({
    queryKey: ["/api/activity-logs"],
  });

  const filteredLogs = eventFilter === "all"
    ? logs
    : logs.filter((log) => log.eventType === eventFilter);

  return (
    <div className="flex flex-1 flex-col">
      <Header title={t("activity.title")} />
      <PageContainer>
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-muted-foreground">
            {t("activity.description")}
          </p>
          <Select value={eventFilter} onValueChange={setEventFilter}>
            <SelectTrigger className="w-[200px]" data-testid="select-filter-event">
              <Filter className="mr-2 h-4 w-4" />
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
            title={t("activity.noActivity")}
            description={t("activity.noActivityDescription")}
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

                  return (
                    <div
                      key={log.id}
                      className="flex items-start gap-4 p-4 transition-colors hover:bg-muted/50"
                      data-testid={`row-activity-${log.id}`}
                    >
                      <div
                        className={cn(
                          "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-muted",
                          config.color
                        )}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {t(config.labelKey)}
                          </Badge>
                        </div>
                        <p className="mt-1 text-sm" data-testid="text-activity-description">
                          {log.description}
                        </p>
                      </div>
                      <div className="flex-shrink-0 text-right">
                        <p className="text-xs text-muted-foreground" data-testid="text-activity-time">
                          {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true, locale: ru })}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(log.createdAt), "dd.MM.yyyy HH:mm", { locale: ru })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </PageContainer>
    </div>
  );
}
