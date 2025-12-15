import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Search, Filter, ExternalLink, Archive as ArchiveIcon } from "lucide-react";
import { Header } from "@/components/layout/header";
import { PageContainer } from "@/components/ui/page-container";
import { EmptyState } from "@/components/ui/empty-state";
import { VideoThumbnail } from "@/components/ui/video-thumbnail";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "@/lib/language-provider";
import type { TranslationWithDetails, Channel, DefaultLanguage } from "@shared/schema";

export default function ArchivePage() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [languageFilter, setLanguageFilter] = useState<string>("all");
  const [channelFilter, setChannelFilter] = useState<string>("all");

  const { data: translations = [], isLoading } = useQuery<TranslationWithDetails[]>({
    queryKey: ["/api/translations?archived=true"],
  });

  const { data: channels = [] } = useQuery<Channel[]>({
    queryKey: ["/api/channels"],
  });

  const { data: languages = [] } = useQuery<DefaultLanguage[]>({
    queryKey: ["/api/languages"],
  });

  const filteredTranslations = translations.filter((t) => {
    const matchesSearch =
      !searchQuery ||
      t.video?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.video?.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.translatedUrl?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesLanguage = languageFilter === "all" || t.language === languageFilter;
    const matchesChannel = channelFilter === "all" || t.channelId === channelFilter;

    return matchesSearch && matchesLanguage && matchesChannel;
  });

  const getVideoThumbnail = (url?: string) => {
    if (!url) return null;
    const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/)?.[1];
    return videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : null;
  };

  return (
    <div className="flex flex-1 flex-col">
      <Header title={t("archive.title")} />
      <PageContainer>
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t("queue.searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              data-testid="input-search-archive"
            />
          </div>
          <div className="flex gap-2">
            <Select value={languageFilter} onValueChange={setLanguageFilter}>
              <SelectTrigger className="w-[140px]" data-testid="select-filter-language">
                <SelectValue placeholder={t("archive.languagePlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("common.all")} {t("nav.languages")}</SelectItem>
                {languages.map((lang) => (
                  <SelectItem key={lang.code} value={lang.code}>
                    {lang.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={channelFilter} onValueChange={setChannelFilter}>
              <SelectTrigger className="w-[160px]" data-testid="select-filter-channel">
                <SelectValue placeholder={t("archive.channelPlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("common.all")} {t("nav.channels")}</SelectItem>
                {channels.map((channel) => (
                  <SelectItem key={channel.id} value={channel.id}>
                    {channel.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoading ? (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("archive.video")}</TableHead>
                  <TableHead>{t("archive.language")}</TableHead>
                  <TableHead>{t("archive.channel")}</TableHead>
                  <TableHead>{t("archive.voiceOver")}</TableHead>
                  <TableHead>{t("archive.published")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-10 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        ) : filteredTranslations.length === 0 ? (
          <EmptyState
            icon={ArchiveIcon}
            title={t("archive.noVideos")}
            description={t("archive.noVideosDescription")}
          />
        ) : (
          <>
            <div className="hidden md:block">
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("archive.originalVideo")}</TableHead>
                      <TableHead>{t("archive.language")}</TableHead>
                      <TableHead>{t("archive.translatedVideo")}</TableHead>
                      <TableHead>{t("archive.channel")}</TableHead>
                      <TableHead>{t("archive.voiceOver")}</TableHead>
                      <TableHead>{t("archive.published")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTranslations.map((translation) => (
                      <TableRow key={translation.id} data-testid={`row-translation-${translation.id}`}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <VideoThumbnail
                              thumbnailUrl={getVideoThumbnail(translation.video?.url)}
                              size="sm"
                            />
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium max-w-[200px]">
                                {translation.video?.title || t("archive.untitled")}
                              </p>
                              <a
                                href={translation.video?.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                              >
                                <ExternalLink className="h-3 w-3" />
                                {t("archive.viewOriginal")}
                              </a>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{translation.language}</Badge>
                        </TableCell>
                        <TableCell>
                          {translation.translatedUrl ? (
                            <a
                              href={translation.translatedUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-sm text-primary hover:underline"
                            >
                              <ExternalLink className="h-3 w-3" />
                              {t("archive.viewTranslation")}
                            </a>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {translation.channel?.name || (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p>{translation.voiceOverName || "-"}</p>
                            {translation.voiceOverGender && (
                              <p className="text-xs text-muted-foreground capitalize">
                                {translation.voiceOverGender}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {translation.publishedDate ? (
                            format(new Date(translation.publishedDate), "MMM d, yyyy")
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </div>

            <div className="md:hidden space-y-4">
              {filteredTranslations.map((translation) => (
                <Card key={translation.id} className="p-4" data-testid={`card-translation-${translation.id}`}>
                  <div className="flex gap-3">
                    <VideoThumbnail
                      thumbnailUrl={getVideoThumbnail(translation.video?.url)}
                      size="sm"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{translation.video?.title || t("archive.untitled")}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary">{translation.language}</Badge>
                        {translation.channel?.name && (
                          <span className="text-xs text-muted-foreground">{translation.channel.name}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {translation.voiceOverName || t("archive.noVoiceOver")}
                    </span>
                    <span className="text-muted-foreground">
                      {translation.publishedDate
                        ? format(new Date(translation.publishedDate), "MMM d, yyyy")
                        : "-"}
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}
      </PageContainer>
    </div>
  );
}
