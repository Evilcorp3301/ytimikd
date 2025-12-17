import { useQuery } from "@tanstack/react-query";
import { BarChart3, TrendingUp, Languages, Tv, Calendar } from "lucide-react";
import { Header } from "@/components/layout/header";
import { PageContainer } from "@/components/ui/page-container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "@/lib/language-provider";

interface StatisticsData {
  totalVideos: number;
  completedVideos: number;
  completedTranslations: number;
  inProgressTranslations: number;
  scheduledCount: number;
  channelCount: number;
  languageCount: number;
}

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
}: {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ElementType;
  trend?: { value: number; positive: boolean };
}) {
  return (
    <Card data-testid={`stat-card-${title.toLowerCase().replace(/\s+/g, "-")}`}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-hint font-medium">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
      </CardHeader>
      <CardContent>
        <div className="text-xl font-semibold tabular-nums" data-testid="text-stat-value">{value}</div>
        {description && (
          <p className="text-hint">{description}</p>
        )}
        {trend && (
          <div className={`mt-1 flex items-center text-xs ${trend.positive ? "text-green-600" : "text-red-600"}`}>
            <TrendingUp className={`mr-1 h-3 w-3 ${!trend.positive && "rotate-180"}`} />
            {trend.value}% from last month
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function StatisticsPage() {
  const { t } = useTranslation();
  const { data: stats, isLoading } = useQuery<StatisticsData>({
    queryKey: ["/api/statistics"],
  });

  const defaultStats: StatisticsData = {
    totalVideos: 0,
    completedVideos: 0,
    completedTranslations: 0,
    inProgressTranslations: 0,
    scheduledCount: 0,
    channelCount: 0,
    languageCount: 0,
  };

  const data = stats || defaultStats;

  return (
    <div className="flex flex-1 flex-col">
      <Header title={t("statistics.title")} />
      <PageContainer>
        <div className="mb-4 md:mb-6 lg:mb-8">
          <p className="text-hint">
            {t("statistics.description")}
          </p>
        </div>

        {isLoading ? (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i}>
                  <CardHeader className="pb-2">
                    <Skeleton className="h-4 w-24" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="mt-1 h-3 w-32" />
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="mt-6 grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <Skeleton className="h-5 w-40" />
                </CardHeader>
                <CardContent className="space-y-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-2 w-full" />
                    </div>
                  ))}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <Skeleton className="h-5 w-40" />
                </CardHeader>
                <CardContent className="space-y-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-2 w-full" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </>
        ) : (
          <>
            <div className="grid gap-4 grid-cols-2 md:grid-cols-2 lg:grid-cols-3">
              <StatCard
                title={t("statistics.totalVideos")}
                value={data.totalVideos}
                description={t("statistics.totalVideosDescription")}
                icon={BarChart3}
              />
              <StatCard
                title={t("statistics.completedVideos")}
                value={data.completedVideos}
                description={t("statistics.completedVideosDescription")}
                icon={TrendingUp}
              />
              <StatCard
                title={t("statistics.completedTranslations")}
                value={data.completedTranslations}
                description={t("statistics.completedTranslationsDescription")}
                icon={TrendingUp}
              />
              <StatCard
                title={t("statistics.inProgressLabel")}
                value={data.inProgressTranslations}
                description={t("statistics.inProgressDescription")}
                icon={Languages}
              />
              <StatCard
                title={t("statistics.scheduledLabel")}
                value={data.scheduledCount}
                description={t("statistics.scheduledDescription")}
                icon={Calendar}
              />
              <StatCard
                title={t("statistics.channelsLabel")}
                value={data.channelCount}
                description={t("statistics.channelsDescription")}
                icon={Tv}
              />
              <StatCard
                title={t("statistics.languagesLabel")}
                value={data.languageCount}
                description={t("statistics.languagesDescription")}
                icon={Languages}
              />
            </div>
          </>
        )}
      </PageContainer>
    </div>
  );
}
