import { useQuery } from "@tanstack/react-query";
import { LayoutList, Clock, Calendar, AlertTriangle, ArrowRight, BarChart3 } from "lucide-react";
import { Link } from "wouter";
import { Header } from "@/components/layout/header";
import { PageContainer } from "@/components/ui/page-container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/language-provider";
import type { VideoWithTranslations, TranslationWithDetails } from "@shared/schema";

interface MetricCardProps {
  title: string;
  value: number;
  description?: string;
  icon: React.ElementType;
  variant?: "default" | "warning" | "danger";
  linkTo?: string;
  linkLabel?: string;
}

function MetricCard({
  title,
  value,
  description,
  icon: Icon,
  variant = "default",
  linkTo,
  linkLabel,
}: MetricCardProps) {
  const variantStyles = {
    default: "border-border",
    warning: "border-orange-200 dark:border-orange-800",
    danger: "border-red-200 dark:border-red-800",
  };

  return (
    <Card className={cn("transition-all hover:shadow-md", variantStyles[variant])}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-hint font-medium opacity-80">{title}</CardTitle>
        <Icon
          className={cn(
            "h-4 w-4",
            variant === "warning" && "text-orange-600 dark:text-orange-400",
            variant === "danger" && "text-red-600 dark:text-red-400",
            variant === "default" && "text-muted-foreground/60"
          )}
          aria-hidden="true"
        />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold mb-1 tabular-nums" data-testid={`metric-value-${title.toLowerCase().replace(/\s+/g, "-")}`}>
          {value}
        </div>
        {description && <p className="text-hint text-sm mb-3 opacity-75">{description}</p>}
        {linkTo && linkLabel && (
          <Link href={linkTo}>
            <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs">
              {linkLabel}
              <ArrowRight className="h-3 w-3" aria-hidden="true" />
            </Button>
          </Link>
        )}
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { t } = useTranslation();

  // Получаем все видео
  const { data: videos = [], isLoading: videosLoading } = useQuery<VideoWithTranslations[]>({
    queryKey: ["/api/videos"],
  });

  // Получаем запланированные переводы
  const { data: scheduledTranslations = [], isLoading: scheduledLoading } = useQuery<TranslationWithDetails[]>({
    queryKey: ["/api/translations?scheduled=true"],
  });

  // Вычисляем метрики
  const videosInQueue = videos.filter((video) => {
    const allCompleted = video.translations.length > 0 && video.translations.every((t) => t.status === "completed");
    return !allCompleted;
  }).length;

  const translationsInProgress = videos.reduce((count, video) => {
    return count + video.translations.filter((t) => t.status === "in_progress").length;
  }, 0);

  const scheduledCount = scheduledTranslations.filter((t) => {
    if (!t.scheduledDate) return false;
    const scheduled = new Date(t.scheduledDate);
    return scheduled.getTime() > Date.now();
  }).length;

  // Просроченные переводы: запланированные, но время уже прошло и нет translatedUrl
  const overdueCount = scheduledTranslations.filter((t) => {
    if (!t.scheduledDate || t.translatedUrl) return false;
    const scheduled = new Date(t.scheduledDate);
    return scheduled.getTime() <= Date.now();
  }).length;

  const isLoading = videosLoading || scheduledLoading;

  return (
    <div className="flex flex-1 flex-col">
      <Header title={t("nav.dashboard")} />
      <PageContainer>
        <div className="mb-4 md:mb-6 lg:mb-8">
          <p className="text-hint">
            Ключевые метрики и статус работы над переводами
          </p>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-32" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16 mb-2" />
                  <Skeleton className="h-3 w-24" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              title="Видео в очереди"
              value={videosInQueue}
              description="Требуют работы над переводами"
              icon={LayoutList}
              linkTo="/queue"
              linkLabel="Открыть очередь"
            />
            <MetricCard
              title="Переводы в работе"
              value={translationsInProgress}
              description="Активно переводятся"
              icon={Clock}
              linkTo="/queue"
              linkLabel="Просмотреть"
            />
            <MetricCard
              title="Запланированные публикации"
              value={scheduledCount}
              description="Ожидают публикации"
              icon={Calendar}
              variant="default"
              linkTo="/scheduled"
              linkLabel="Открыть план"
            />
            <MetricCard
              title="Просроченные переводы"
              value={overdueCount}
              description="Требуют внимания"
              icon={AlertTriangle}
              variant={overdueCount > 0 ? "danger" : "default"}
              linkTo="/scheduled"
              linkLabel="Проверить"
            />
          </div>
        )}

        {/* Дополнительная информация */}
        {!isLoading && (
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-heading-2">Быстрые действия</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href="/queue">
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <LayoutList className="h-4 w-4" aria-hidden="true" />
                    Перейти к очереди переводов
                  </Button>
                </Link>
                <Link href="/scheduled">
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <Calendar className="h-4 w-4" aria-hidden="true" />
                    Просмотреть запланированные публикации
                  </Button>
                </Link>
                <Link href="/statistics">
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <BarChart3 className="h-4 w-4" aria-hidden="true" />
                    Открыть статистику
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-heading-2">Статус системы</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-body">Всего видео</span>
                  <Badge variant="secondary">{videos.length}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-body">Всего переводов</span>
                  <Badge variant="secondary">
                    {videos.reduce((sum, v) => sum + v.translations.length, 0)}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-body">Завершено переводов</span>
                  <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700">
                    {videos.reduce((sum, v) => sum + v.translations.filter((t) => t.status === "completed").length, 0)}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </PageContainer>
    </div>
  );
}

