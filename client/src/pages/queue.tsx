import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Plus, Video, Search } from "lucide-react";
import { Header } from "@/components/layout/header";
import { PageContainer } from "@/components/ui/page-container";
import { VideoCard } from "@/components/videos/video-card";
import { TranslationDialog } from "@/components/videos/translation-dialog";
import { EditVideoDialog } from "@/components/videos/edit-video-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { getPath } from "@/lib/paths";
import { VideoCardSkeleton } from "@/components/ui/loading-skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { ApiError } from "@/lib/api-error";
import { useTranslation } from "@/lib/language-provider";
import type { VideoWithTranslations, Translation, CategoryWithSubcategories } from "@shared/schema";

export default function QueuePage() {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [deleteVideoId, setDeleteVideoId] = useState<string | null>(null);
  const [editVideoId, setEditVideoId] = useState<string | null>(null);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("all");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [selectedTranslation, setSelectedTranslation] = useState<{
    videoId: string;
    language: string;
    translation: Translation | null;
    videoTitle?: string;
    videoSubcategoryId?: string;
  } | null>(null);

  const {
    data: videos = [],
    isLoading: videosLoading,
    error: videosError,
    refetch: refetchVideos,
  } = useQuery<VideoWithTranslations[]>({
    queryKey: ["/api/videos"],
    // Use cached data while refetching for smoother UX
    placeholderData: (previousData) => previousData,
  });

  const { data: categories = [] } = useQuery<CategoryWithSubcategories[]>({
    queryKey: ["/api/categories"],
  });

  // Auto-focus search input on mount (desktop only)
  useEffect(() => {
    // Only auto-focus on desktop to avoid opening keyboard on mobile
    if (window.innerWidth >= 768 && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  const updateTranslationMutation = useMutation({
    mutationFn: async (data: { id: string; updates: Record<string, unknown> }) => {
      try {
        const response = await apiRequest("PATCH", `/api/translations/${data.id}`, data.updates);
        return response.json();
      } catch (error) {
        // Use structured error handling
        let errorMessage = "Не удалось обновить перевод";

        if (error instanceof ApiError) {
          errorMessage = error.getMessage();

          // Map common validation errors to user-friendly messages
          if (error.isValidationError()) {
            const data = error.data as Record<string, unknown>;
            if (Array.isArray(data.error)) {
              const firstError = data.error[0] as { message?: string; path?: string[] };
              if (firstError?.message) {
                const message = firstError.message;
                if (
                  (message.includes("uuid") || message.includes("Invalid")) &&
                  firstError.path?.includes("channelId")
                ) {
                  errorMessage = "Выберите канал для публикации";
                } else {
                  errorMessage = message;
                }
              }
            }
          }
        } else if (error instanceof Error) {
          errorMessage = error.message;
        }

        throw new Error(errorMessage);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
      // Invalidate all translation queries (including scheduled page with filters)
      queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey[0];
          return typeof key === "string" && key.startsWith("/api/translations");
        },
      });
      toast({
        title: t("translation.translationUpdated"),
        description: t("translation.translationUpdatedDescription"),
      });
      setSelectedTranslation(null);
    },
    onError: (error) => {
      toast({
        title: t("common.error"),
        description:
          error instanceof ApiError
            ? error.getMessage()
            : error instanceof Error
              ? error.message
              : "Не удалось обновить перевод",
        variant: "destructive",
      });
    },
  });

  const createTranslationMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const response = await apiRequest("POST", "/api/translations", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
      // Invalidate all translation queries (including scheduled page with filters)
      queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey[0];
          return typeof key === "string" && key.startsWith("/api/translations");
        },
      });
      toast({
        title: t("translation.translationUpdated"),
        description: t("translation.translationUpdatedDescription"),
      });
      setSelectedTranslation(null);
    },
    onError: (error) => {
      toast({
        title: t("common.error"),
        description:
          error instanceof ApiError
            ? error.getMessage()
            : error instanceof Error
              ? error.message
              : "Не удалось создать перевод",
        variant: "destructive",
      });
    },
  });

  const deleteVideoMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/videos/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
      toast({ title: t("queue.videoDeleted"), description: t("queue.videoDeletedDescription") });
      setDeleteVideoId(null);
    },
    onError: (error) => {
      toast({
        title: t("common.error"),
        description:
          error instanceof ApiError
            ? error.getMessage()
            : error instanceof Error
              ? error.message
              : "Не удалось удалить видео",
        variant: "destructive",
      });
    },
  });

  const filteredVideos = videos.filter((video) => {
    // Filter out videos with all translations completed (they should be in history)
    const allCompleted =
      video.translations.length > 0 && video.translations.every((t) => t.status === "completed");
    if (allCompleted) return false;

    // Filter by search query (title)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      const title = video.title?.toLowerCase() || "";
      if (!title.includes(query)) return false;
    }

    // Filter by category/subcategory
    if (selectedCategoryFilter !== "all") {
      // If filter starts with "cat_", it's a category filter
      if (selectedCategoryFilter.startsWith("cat_")) {
        const categoryId = selectedCategoryFilter.replace("cat_", "");
        if (video.subcategory?.categoryId !== categoryId) return false;
      } else {
        // Otherwise it's a subcategory filter
        if (video.subcategoryId !== selectedCategoryFilter) return false;
      }
    }

    // Filter by status
    if (selectedStatusFilter !== "all") {
      const now = new Date();
      const hasStatus = video.translations.some((t) => {
        if (selectedStatusFilter === "scheduled") {
          // Check if translation is scheduled (has scheduledDate in future)
          if (t.scheduledDate) {
            const scheduled = new Date(t.scheduledDate);
            return scheduled.getTime() > now.getTime();
          }
          return false;
        }
        return t.status === selectedStatusFilter;
      });
      if (!hasStatus) return false;
    }

    return true;
  });

  const handleLanguageClick = (videoId: string, language: string) => {
    const video = videos.find((v) => v.id === videoId);
    const translation = video?.translations.find((t) => t.language === language) || null;
    setSelectedTranslation({
      videoId,
      language,
      translation,
      videoTitle: video?.title || undefined,
      videoSubcategoryId: video?.subcategoryId || undefined,
    });
  };

  const handleSaveTranslation = async (data: Record<string, unknown>) => {
    if (!selectedTranslation) return;

    if (selectedTranslation.translation) {
      updateTranslationMutation.mutate({
        id: selectedTranslation.translation.id,
        updates: data,
      });
    } else {
      createTranslationMutation.mutate({
        videoId: selectedTranslation.videoId,
        language: selectedTranslation.language,
        ...data,
      });
    }
  };

  return (
    <div className="flex flex-1 flex-col">
      <Header title={t("queue.title")} />
      <PageContainer>
        {/* Search bar */}
        <div className="mb-4 md:mb-5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground/70" />
            <Input
              ref={searchInputRef}
              type="text"
              placeholder="Поиск по названию видео..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-full border-border/70 focus-visible:border-primary/50 bg-card"
              data-testid="input-search-video"
            />
          </div>
        </div>

        {/* Description (left) + filters + primary action (right) on one line for a clean, aligned header block */}
        <div className="mb-4 md:mb-6 lg:mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-heading-3 text-foreground/90">{t("queue.description")}</p>
          <div className="flex flex-wrap items-center gap-2.5">
            <Select value={selectedStatusFilter} onValueChange={setSelectedStatusFilter}>
              <SelectTrigger
                className="w-full sm:w-[180px] flex-shrink-0"
                data-testid="select-status-filter"
              >
                <SelectValue placeholder="Все статусы" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все статусы</SelectItem>
                <SelectItem value="scheduled">📅 Запланировано</SelectItem>
                <SelectItem value="in_progress">◐ В работе</SelectItem>
                <SelectItem value="not_started">○ Не начато</SelectItem>
                <SelectItem value="completed">✓ Готово</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedCategoryFilter} onValueChange={setSelectedCategoryFilter}>
              <SelectTrigger
                className="w-full sm:w-[200px] flex-shrink-0"
                data-testid="select-category-filter"
              >
                <SelectValue placeholder="Все категории" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все категории</SelectItem>
                {categories.map((cat) => {
                  if (!cat.subcategories || cat.subcategories.length === 0) return null;
                  return (
                    <SelectGroup key={cat.id}>
                      <SelectLabel>{cat.name}</SelectLabel>
                      <SelectItem value={`cat_${cat.id}`}>{cat.name} (все)</SelectItem>
                      {cat.subcategories.map((sub) => (
                        <SelectItem key={sub.id} value={sub.id}>
                          {sub.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  );
                })}
              </SelectContent>
            </Select>
            <Link href={getPath("/add-video")} className="w-full sm:w-auto">
              <Button
                className="gap-2 w-full sm:w-auto flex-shrink-0"
                data-testid="button-add-video"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                {t("nav.addVideo")}
              </Button>
            </Link>
          </div>
        </div>

        {videosError ? (
          <ErrorState
            title={t("common.error")}
            description={
              videosError instanceof Error ? videosError.message : "Не удалось загрузить видео"
            }
            onRetry={() => refetchVideos()}
            retryLabel={t("common.retry")}
          />
        ) : videosLoading && videos.length === 0 ? (
          <div className="grid gap-3 md:gap-4 grid-cols-1 md:grid-cols-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <VideoCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredVideos.length === 0 ? (
          <EmptyState
            icon={Video}
            title={t("queue.noVideos")}
            description={t("queue.noVideosDescription")}
            action={
              <Link href={getPath("/add-video")}>
                <Button size="lg" className="gap-2" data-testid="button-add-first-video">
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  {t("queue.addFirstVideo")}
                </Button>
              </Link>
            }
          />
        ) : (
          <div className="grid gap-3 md:gap-4 grid-cols-1 md:grid-cols-2">
            {filteredVideos.map((video) => (
              <VideoCard
                key={video.id}
                video={video}
                onLanguageClick={handleLanguageClick}
                onDelete={(id) => setDeleteVideoId(id)}
                onEdit={(id) => setEditVideoId(id)}
              />
            ))}
          </div>
        )}
      </PageContainer>

      <TranslationDialog
        open={!!selectedTranslation}
        onOpenChange={(open) => !open && setSelectedTranslation(null)}
        translation={selectedTranslation?.translation || null}
        language={selectedTranslation?.language || ""}
        videoTitle={selectedTranslation?.videoTitle}
        videoSubcategoryId={selectedTranslation?.videoSubcategoryId}
        onSave={handleSaveTranslation}
        isLoading={updateTranslationMutation.isPending || createTranslationMutation.isPending}
      />

      <AlertDialog open={!!deleteVideoId} onOpenChange={() => setDeleteVideoId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("queue.deleteVideo")}</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteVideoId && deleteVideoMutation.mutate(deleteVideoId)}
              data-testid="button-confirm-delete"
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              autoFocus
            >
              {deleteVideoMutation.isPending ? t("queue.deleting") : t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <EditVideoDialog
        video={videos.find((v) => v.id === editVideoId) || null}
        open={!!editVideoId}
        onOpenChange={(open) => !open && setEditVideoId(null)}
      />
    </div>
  );
}
