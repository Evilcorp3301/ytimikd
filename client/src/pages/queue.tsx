import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Plus, Video } from "lucide-react";
import { Header } from "@/components/layout/header";
import { PageContainer } from "@/components/ui/page-container";
import { VideoCard } from "@/components/videos/video-card";
import { TranslationDialog } from "@/components/videos/translation-dialog";
import { EditVideoDialog } from "@/components/videos/edit-video-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { VideoCardSkeleton } from "@/components/ui/loading-skeleton";
import { Button } from "@/components/ui/button";
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
import { useTranslation } from "@/lib/language-provider";
import type { VideoWithTranslations, Channel, Translation, CategoryWithSubcategories } from "@shared/schema";

export default function QueuePage() {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [deleteVideoId, setDeleteVideoId] = useState<string | null>(null);
  const [editVideoId, setEditVideoId] = useState<string | null>(null);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("all");
  const [selectedTranslation, setSelectedTranslation] = useState<{
    videoId: string;
    language: string;
    translation: Translation | null;
    videoTitle?: string;
    videoSubcategoryId?: string;
  } | null>(null);

  const { data: videos = [], isLoading: videosLoading } = useQuery<VideoWithTranslations[]>({
    queryKey: ["/api/videos"],
  });

  const { data: channels = [] } = useQuery<Channel[]>({
    queryKey: ["/api/channels"],
  });

  const { data: categories = [] } = useQuery<CategoryWithSubcategories[]>({
    queryKey: ["/api/categories"],
  });


  const updateTranslationMutation = useMutation({
    mutationFn: async (data: { id: string; updates: Record<string, unknown> }) => {
      const response = await apiRequest("PATCH", `/api/translations/${data.id}`, data.updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
      // Invalidate all translation queries (including scheduled page with filters)
      queryClient.invalidateQueries({ predicate: (query) => {
        const key = query.queryKey[0];
        return typeof key === "string" && key.startsWith("/api/translations");
      }});
      toast({ title: t("translation.translationUpdated"), description: t("translation.translationUpdatedDescription") });
      setSelectedTranslation(null);
    },
    onError: (error) => {
      toast({
        title: t("common.error"),
        description: error instanceof Error ? error.message : "Не удалось обновить перевод",
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
      queryClient.invalidateQueries({ predicate: (query) => {
        const key = query.queryKey[0];
        return typeof key === "string" && key.startsWith("/api/translations");
      }});
      toast({ title: t("translation.translationUpdated"), description: t("translation.translationUpdatedDescription") });
      setSelectedTranslation(null);
    },
    onError: (error) => {
      toast({
        title: t("common.error"),
        description: error instanceof Error ? error.message : "Не удалось создать перевод",
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
        description: error instanceof Error ? error.message : "Не удалось удалить видео",
        variant: "destructive",
      });
    },
  });

  const filteredVideos = videos.filter((video) => {
    // Filter out videos with all translations completed (they should be in history)
    const allCompleted = video.translations.length > 0 && video.translations.every((t) => t.status === "completed");
    if (allCompleted) return false;
    
    // Filter by category/subcategory
    if (selectedCategoryFilter !== "all") {
      // If filter starts with "cat_", it's a category filter
      if (selectedCategoryFilter.startsWith("cat_")) {
        const categoryId = selectedCategoryFilter.replace("cat_", "");
        return video.subcategory?.categoryId === categoryId;
      }
      // Otherwise it's a subcategory filter
      return video.subcategoryId === selectedCategoryFilter;
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
        {/* Description (left) + filters + primary action (right) on one line for a clean, aligned header block */}
        <div className="mb-4 md:mb-6 lg:mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-heading-3">{t("queue.description")}</p>
          <div className="flex items-center gap-2">
            <Select value={selectedCategoryFilter} onValueChange={setSelectedCategoryFilter}>
              <SelectTrigger className="w-[200px]" data-testid="select-category-filter">
                <SelectValue placeholder="Все категории" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все категории</SelectItem>
                {categories.map((cat) => {
                  if (!cat.subcategories || cat.subcategories.length === 0) return null;
                  return (
                    <SelectGroup key={cat.id}>
                      <SelectLabel>{cat.name}</SelectLabel>
                      <SelectItem value={`cat_${cat.id}`}>
                        {cat.name} (все)
                      </SelectItem>
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
            <Link href="/add-video">
              <Button className="gap-2" data-testid="button-add-video">
                <Plus className="h-4 w-4" aria-hidden="true" />
                {t("nav.addVideo")}
              </Button>
            </Link>
          </div>
        </div>

        {videosLoading ? (
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <VideoCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredVideos.length === 0 ? (
          <EmptyState
            icon={Video}
            title={t("queue.noVideos")}
            description={t("queue.noVideosDescription")}
            action={
              <Link href="/add-video">
                <Button size="lg" className="gap-2" data-testid="button-add-first-video">
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  {t("queue.addFirstVideo")}
                </Button>
              </Link>
            }
          />
        ) : (
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
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
