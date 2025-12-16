import { useState, useCallback } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Plus, Video, Loader2 } from "lucide-react";
import { Header } from "@/components/layout/header";
import { PageContainer } from "@/components/ui/page-container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { VideoThumbnail } from "@/components/ui/video-thumbnail";
import { useTranslation } from "@/lib/language-provider";
import { Badge } from "@/components/ui/badge";
import { extractYouTubeVideoId } from "@/lib/youtube";
import type { CategoryWithSubcategories } from "@shared/schema";

const addVideoSchema = z.object({
  url: z.string().url("Please enter a valid YouTube URL").refine(
    (url) => url.includes("youtube.com") || url.includes("youtu.be"),
    "Please enter a valid YouTube URL"
  ),
  title: z.string().optional(),
  thumbnailUrl: z.string().url().optional().or(z.literal("")),
  subcategoryId: z.string().optional(),
});

type AddVideoFormValues = z.infer<typeof addVideoSchema>;

export default function AddVideoPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [previewData, setPreviewData] = useState<{ title?: string; thumbnail?: string; videoId?: string } | null>(null);
  const [isFetchingTitle, setIsFetchingTitle] = useState(false);

  const { data: categories = [] } = useQuery<CategoryWithSubcategories[]>({
    queryKey: ["/api/categories"],
  });

  const form = useForm<AddVideoFormValues>({
    resolver: zodResolver(addVideoSchema),
    defaultValues: {
      url: "",
      title: "",
      thumbnailUrl: "",
      subcategoryId: "",
    },
  });

  const addVideoMutation = useMutation({
    mutationFn: async (data: AddVideoFormValues) => {
      const response = await apiRequest("POST", "/api/videos", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
      toast({
        title: t("addVideo.videoAdded"),
        description: t("addVideo.videoAddedDescription"),
      });
      navigate("/");
    },
    onError: (error) => {
      toast({
        title: t("common.error"),
        description: error instanceof Error ? error.message : "Failed to add video",
        variant: "destructive",
      });
    },
  });

  const handleUrlChange = useCallback(async (url: string) => {
    const videoId = extractYouTubeVideoId(url);
    if (videoId) {
      setPreviewData({
        thumbnail: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
        videoId,
      });
      
      if (!form.getValues("title")) {
        setIsFetchingTitle(true);
        try {
          const response = await apiRequest("GET", `/api/youtube/video-info?videoId=${videoId}`);
          if (response.ok) {
            const data = await response.json();
            if (data.title) {
              form.setValue("title", data.title);
              setPreviewData((prev) => prev ? { ...prev, title: data.title } : { title: data.title });
            }
          }
        } catch (error) {
          console.error("Failed to fetch video title:", error);
        } finally {
          setIsFetchingTitle(false);
        }
      }
    } else {
      setPreviewData(null);
    }
  }, [form]);

  const onSubmit = (values: AddVideoFormValues) => {
    addVideoMutation.mutate(values);
  };

  return (
    <div className="flex flex-1 flex-col">
      <Header title={t("addVideo.title")} />
      <PageContainer>
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="gap-2"
            data-testid="button-back"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("addVideo.backToQueue")}
          </Button>
        </div>

        <div className="mx-auto max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Video className="h-5 w-5" />
                {t("addVideo.videoDetails")}
              </CardTitle>
              <CardDescription>
                {t("addVideo.videoDetailsDescription")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("addVideo.youtubeUrl")}</FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t("addVideo.youtubeUrlPlaceholder")}
                            {...field}
                            onChange={(e) => {
                              field.onChange(e);
                              handleUrlChange(e.target.value);
                            }}
                            data-testid="input-video-url"
                            autoComplete="url"
                          />
                        </FormControl>
                        <FormDescription>
                          {t("addVideo.youtubeUrlDescription")}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {previewData?.thumbnail && (
                    <div className="flex items-center gap-4 rounded-lg border p-4">
                      <VideoThumbnail thumbnailUrl={previewData.thumbnail} size="lg" />
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground">{t("addVideo.videoPreview")}</p>
                        {form.watch("title") && (
                          <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium">{form.watch("title")}</p>
                            {previewData.videoId && (
                              <Badge variant="secondary" className="font-mono">
                                {t("addVideo.videoIdLabel")}: {previewData.videoId}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("addVideo.videoTitle")}</FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t("addVideo.videoTitlePlaceholder")}
                            {...field}
                            data-testid="input-video-title"
                            autoComplete="off"
                          />
                        </FormControl>
                        <FormDescription>
                          {t("addVideo.videoTitleDescription")}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="subcategoryId"
                    render={({ field }) => {
                      const selectedId = field.value;
                      let selectedCategoryName = "";
                      let selectedSubcategoryName = "";
                      
                      for (const cat of categories) {
                        const sub = cat.subcategories?.find((s) => s.id === selectedId);
                        if (sub) {
                          selectedCategoryName = cat.name;
                          selectedSubcategoryName = sub.name;
                          break;
                        }
                      }
                      
                      return (
                        <FormItem>
                          <FormLabel>{t("addVideo.subcategory")}</FormLabel>
                          <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            type="button"
                            variant="outline"
                            role="combobox"
                            className={cn(
                              "w-full justify-between text-left font-normal",
                              !selectedId && "text-muted-foreground"
                            )}
                            data-testid="button-subcategory-select"
                            name="subcategoryId"
                          >
                                  {selectedId && selectedCategoryName
                                    ? `${selectedCategoryName} / ${selectedSubcategoryName}`
                                    : t("addVideo.subcategoryPlaceholder")}
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-[400px] p-0" align="start">
                              <div className="max-h-[300px] overflow-y-auto p-2">
                                {categories.length === 0 ? (
                                  <p className="text-xs text-muted-foreground p-2">
                                    {t("categories.noSubcategories")}
                                  </p>
                                ) : (
                                  categories.map((cat) => {
                                    if (!cat.subcategories || cat.subcategories.length === 0) return null;
                                    return (
                                      <div key={cat.id} className="mb-4 last:mb-0">
                                        <div className="text-xs font-semibold text-muted-foreground mb-2 px-2">
                                          {cat.name}
                                        </div>
                                      {cat.subcategories.map((sub) => {
                                        const checkboxId = `subcategory-${sub.id}`;
                                        return (
                                          <div
                                            key={sub.id}
                                            className="flex items-center space-x-2 p-2 hover:bg-muted/50 rounded-md cursor-pointer"
                                            onClick={() => {
                                              field.onChange(sub.id === selectedId ? "" : sub.id);
                                            }}
                                          >
                                            <Checkbox
                                              id={checkboxId}
                                              checked={selectedId === sub.id}
                                              onCheckedChange={() => {
                                                field.onChange(sub.id === selectedId ? "" : sub.id);
                                              }}
                                            />
                                            <label htmlFor={checkboxId} className="flex-1 text-sm font-normal cursor-pointer">
                                              {sub.name}
                                            </label>
                                          </div>
                                        );
                                      })}
                                      </div>
                                    );
                                  })
                                )}
                              </div>
                            </PopoverContent>
                          </Popover>
                          <FormDescription className="text-xs text-muted-foreground">
                            {t("addVideo.subcategoryDescription")}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />

                  <Button
                    type="submit"
                    className="w-full gap-2"
                    disabled={addVideoMutation.isPending}
                    data-testid="button-submit-video"
                  >
                    {addVideoMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {t("addVideo.adding")}
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4" />
                        {t("addVideo.addToQueue")}
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </PageContainer>
    </div>
  );
}
