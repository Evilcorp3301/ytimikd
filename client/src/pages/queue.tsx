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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useTranslation } from "@/lib/language-provider";
import type { VideoWithTranslations, Channel, Translation } from "@shared/schema";

export default function QueuePage() {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [deleteVideoId, setDeleteVideoId] = useState<string | null>(null);
  const [editVideoId, setEditVideoId] = useState<string | null>(null);
  const [selectedTranslation, setSelectedTranslation] = useState<{
    videoId: string;
    language: string;
    translation: Translation | null;
    videoTitle?: string;
  } | null>(null);

  const { data: videos = [], isLoading: videosLoading } = useQuery<VideoWithTranslations[]>({
    queryKey: ["/api/videos"],
  });

  const { data: channels = [] } = useQuery<Channel[]>({
    queryKey: ["/api/channels"],
  });

  const autoArchiveMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("POST", `/api/videos/${id}/archive`, { reason: "auto" });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
    },
  });

  useEffect(() => {
    videos.forEach((video) => {
      if (video.isArchived) return;
      if (video.translations.length === 0) return;
      
      // Don't auto-archive videos that have scheduled translations (they should remain visible in "План").
      const hasScheduled = video.translations.some((t) => Boolean(t.scheduledDate));
      if (hasScheduled) return;

      const allCompleted = video.translations.every((t) => t.status === "completed");
      if (allCompleted) {
        autoArchiveMutation.mutate(video.id);
      }
    });
  }, [videos]);

  const updateTranslationMutation = useMutation({
    mutationFn: async (data: { id: string; updates: Record<string, unknown> }) => {
      const response = await apiRequest("PATCH", `/api/translations/${data.id}`, data.updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
      queryClient.invalidateQueries({ queryKey: ["/api/translations"] });
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
      queryClient.invalidateQueries({ queryKey: ["/api/translations"] });
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

  const archiveVideoMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("POST", `/api/videos/${id}/archive`, { reason: "manual" });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
      toast({ title: t("queue.videoArchived"), description: t("queue.videoArchivedDescription") });
      setDeleteVideoId(null);
    },
    onError: (error) => {
      toast({
        title: t("common.error"),
        description: error instanceof Error ? error.message : "Не удалось архивировать видео",
        variant: "destructive",
      });
    },
  });

  const filteredVideos = videos.filter((video) => {
    if (video.isArchived) return false;
    const allCompleted = video.translations.length > 0 && video.translations.every((t) => t.status === "completed");
    if (allCompleted) return false;
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
        {/* Description (left) + primary action (right) on one line for a clean, aligned header block */}
        <div className="mb-4 md:mb-6 lg:mb-8 flex items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">{t("queue.description")}</p>
          <Link href="/add-video">
            <Button className="gap-2 w-[30%] min-w-32 sm:w-auto" data-testid="button-add-video">
              <Plus className="h-4 w-4" />
              {t("nav.addVideo")}
            </Button>
          </Link>
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
                <Button className="gap-2" data-testid="button-add-first-video">
                  <Plus className="h-4 w-4" />
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
        channels={channels}
        onSave={handleSaveTranslation}
        isLoading={updateTranslationMutation.isPending || createTranslationMutation.isPending}
      />

      <AlertDialog open={!!deleteVideoId} onOpenChange={() => setDeleteVideoId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("queue.archiveVideo")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("queue.archiveConfirmation")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteVideoId && archiveVideoMutation.mutate(deleteVideoId)}
              data-testid="button-confirm-archive"
            >
              {archiveVideoMutation.isPending ? t("queue.archiving") : t("nav.archive")}
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
