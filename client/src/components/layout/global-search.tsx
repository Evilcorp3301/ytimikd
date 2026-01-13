import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Search, Video, Tv, Loader2, FileSearch } from "lucide-react";
import {
  CommandDialog,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import type { VideoWithTranslations, Channel } from "@shared/schema";
import { extractYouTubeVideoId } from "@/lib/youtube";

interface SearchResults {
  videos: VideoWithTranslations[];
  channels: Channel[];
}

interface GlobalSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GlobalSearch({ open, onOpenChange }: GlobalSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [thumbnailErrors, setThumbnailErrors] = useState<Set<string>>(new Set());
  const [, setLocation] = useLocation();

  // Debounce search query with 300ms delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: results, isLoading } = useQuery<SearchResults>({
    queryKey: ["/api/search", debouncedQuery],
    queryFn: async () => {
      const response = await apiRequest(
        "GET",
        `/api/search?q=${encodeURIComponent(debouncedQuery.trim())}`
      );
      return response.json();
    },
    enabled: open && debouncedQuery.trim().length > 0,
    staleTime: 5000, // Cache results for 5 seconds
  });

  const handleSelectVideo = (videoId: string) => {
    onOpenChange(false);
    setSearchQuery("");
    setLocation("/");
    // Scroll to video (would need to implement scroll-to-element logic)
    setTimeout(() => {
      const element = document.querySelector(`[data-testid="card-video-${videoId}"]`);
      element?.scrollIntoView({ behavior: "smooth", block: "center" });
      // Highlight temporarily
      element?.classList.add("ring-2", "ring-primary", "ring-offset-2");
      setTimeout(() => {
        element?.classList.remove("ring-2", "ring-primary", "ring-offset-2");
      }, 2000);
    }, 100);
  };

  const handleSelectChannel = (channelId: string) => {
    onOpenChange(false);
    setSearchQuery("");
    setLocation("/channels");
    // Scroll to channel card after navigation
    setTimeout(() => {
      const element = document.querySelector(`[data-testid="card-channel-${channelId}"]`);
      element?.scrollIntoView({ behavior: "smooth", block: "center" });
      // Highlight temporarily
      element?.classList.add("ring-2", "ring-primary", "ring-offset-2");
      setTimeout(() => {
        element?.classList.remove("ring-2", "ring-primary", "ring-offset-2");
      }, 2000);
    }, 100);
  };

  const getVideoThumbnail = (url: string) => {
    const videoId = extractYouTubeVideoId(url);
    return videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : null;
  };

  useEffect(() => {
    if (!open) {
      setSearchQuery("");
      setDebouncedQuery("");
    }
  }, [open]);

  return (
    <>
      <CommandDialog open={open} onOpenChange={onOpenChange}>
        <CommandInput
          placeholder="Поиск видео и каналов..."
          value={searchQuery}
          onValueChange={setSearchQuery}
        />
        <CommandList>
          {/* Состояние: загрузка */}
          {isLoading && debouncedQuery.trim().length > 0 && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">Поиск...</p>
            </div>
          )}

          {/* Состояние: ничего не введено (idle) */}
          {!isLoading && debouncedQuery.trim().length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <Search className="h-8 w-8 text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground text-center">
                Начните вводить запрос для поиска видео и каналов
              </p>
            </div>
          )}

          {/* Состояние: ничего не найдено (empty result) */}
          {!isLoading &&
            debouncedQuery.trim().length > 0 &&
            results &&
            results.videos.length === 0 &&
            results.channels.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 px-4">
                <FileSearch className="h-8 w-8 text-muted-foreground/50 mb-3" />
                <p className="text-sm font-medium text-foreground mb-1">Ничего не найдено</p>
                <p className="text-xs text-muted-foreground text-center">
                  Попробуйте изменить запрос или использовать другие ключевые слова
                </p>
              </div>
            )}
          {!isLoading && results && results.videos.length > 0 && (
            <CommandGroup heading="Видео">
              {results.videos.map((video) => (
                <CommandItem
                  key={video.id}
                  value={`video-${video.id}`}
                  onSelect={() => handleSelectVideo(video.id)}
                  className="flex items-center gap-3 px-3 py-3"
                >
                  {getVideoThumbnail(video.url) && !thumbnailErrors.has(video.id) ? (
                    <img
                      src={getVideoThumbnail(video.url)!}
                      alt={video.title || "Video thumbnail"}
                      className="h-12 w-20 rounded object-cover"
                      width={80}
                      height={48}
                      loading="lazy"
                      onError={() => setThumbnailErrors((prev) => new Set(prev).add(video.id))}
                    />
                  ) : (
                    <div className="flex h-12 w-20 items-center justify-center rounded bg-muted">
                      <Video className="h-6 w-6 text-muted-foreground/60" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="truncate text-heading-3">{video.title || video.url}</div>
                    {video.subcategory && (
                      <div className="text-xs text-muted-foreground truncate">
                        {video.subcategory.category.name} / {video.subcategory.name}
                      </div>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          {!isLoading && results && results.channels.length > 0 && (
            <CommandGroup heading="Каналы">
              {results.channels.map((channel) => (
                <CommandItem
                  key={channel.id}
                  value={`channel-${channel.id}`}
                  onSelect={() => handleSelectChannel(channel.id)}
                  className="flex items-center gap-3 px-3 py-3"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <Tv className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="truncate text-heading-3">{channel.name || channel.url}</div>
                    <div className="text-xs text-muted-foreground truncate">{channel.url}</div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}

interface GlobalSearchTriggerProps {
  onOpenChange: (open: boolean) => void;
}

export function GlobalSearchTrigger({ onOpenChange }: GlobalSearchTriggerProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => onOpenChange(true)}
      data-testid="button-global-search"
      aria-label="Поиск"
    >
      <Search className="h-4 w-4" aria-hidden="true" />
    </Button>
  );
}
