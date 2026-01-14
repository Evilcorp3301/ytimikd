import { useState, useMemo } from "react";
import { isEqual } from "lodash";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  MoreVertical,
  ExternalLink,
  Tv,
  Globe,
  Mic,
  FolderTree,
  Hash,
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { PageContainer } from "@/components/ui/page-container";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogBody,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { ApiError } from "@/lib/api-error";
import { useTranslation } from "@/lib/language-provider";
import type {
  Channel,
  DefaultLanguage,
  SubcategoryWithCategory,
  Subcategory,
  CategoryWithSubcategories,
} from "@shared/schema";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";

type ChannelFormValues = {
  name?: string;
  url: string;
  defaultLanguage?: string;
  voiceOverName?: string;
  voiceOverGender?: "male" | "female";
  subcategoryIds?: string[];
};

type ChannelWithStats = Channel & {
  publishedCount: number;
  subcategories: Subcategory[];
};

type GroupedChannels = {
  [language: string]: {
    [subcategoryId: string]: {
      subcategory: SubcategoryWithCategory;
      channels: ChannelWithStats[];
    };
  };
};

export default function ChannelsPage() {
  const { toast } = useToast();
  const { t } = useTranslation();

  const channelFormSchema = z.object({
    name: z.string().optional(),
    url: z.string().url(t("channels.invalidUrl")),
    defaultLanguage: z.string().optional(),
    voiceOverName: z.string().optional(),
    voiceOverGender: z.enum(["male", "female"]).optional(),
    subcategoryIds: z.array(z.string()).optional(),
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingChannel, setEditingChannel] = useState<Channel | null>(null);
  const [deleteChannelId, setDeleteChannelId] = useState<string | null>(null);
  const [originalValues, setOriginalValues] = useState<ChannelFormValues | null>(null);

  const { data: channels = [], isLoading } = useQuery<Channel[]>({
    queryKey: ["/api/channels"],
  });

  const { data: channelStats = {} } = useQuery<Record<string, number>>({
    queryKey: ["/api/channels/stats"],
  });

  const { data: languages = [] } = useQuery<DefaultLanguage[]>({
    queryKey: ["/api/languages"],
  });

  const { data: subcategories = [] } = useQuery<SubcategoryWithCategory[]>({
    queryKey: ["/api/subcategories"],
  });

  const channelSubcategoriesQueries = useQuery({
    queryKey: ["/api/channels/subcategories"],
    queryFn: async () => {
      const results: Record<string, Subcategory[]> = {};
      for (const channel of channels) {
        try {
          const response = await apiRequest("GET", `/api/channels/${channel.id}/subcategories`);
          if (response.ok) {
            results[channel.id] = await response.json();
          }
        } catch (error) {
          console.error(`Failed to load subcategories for channel ${channel.id}:`, error);
        }
      }
      return results;
    },
    enabled: channels.length > 0,
  });

  const channelSubcategoriesMap = channelSubcategoriesQueries.data || {};

  const { data: categories = [] } = useQuery<CategoryWithSubcategories[]>({
    queryKey: ["/api/categories"],
  });

  // Группировка каналов по языкам и подкатегориям
  const groupedChannels = useMemo<GroupedChannels>(() => {
    const grouped: GroupedChannels = {};

    channels.forEach((channel) => {
      const language = channel.defaultLanguage || "Без языка";
      const channelSubcategories = channelSubcategoriesMap[channel.id] || [];
      const publishedCount = channelStats[channel.id] || 0;

      const channelWithStats: ChannelWithStats = {
        ...channel,
        publishedCount,
        subcategories: channelSubcategories,
      };

      if (channelSubcategories.length === 0) {
        // Каналы без подкатегорий
        if (!grouped[language]) {
          grouped[language] = {};
        }
        const noCategoryKey = "__no_category__";
        if (!grouped[language][noCategoryKey]) {
          grouped[language][noCategoryKey] = {
            subcategory: {
              id: noCategoryKey,
              name: "Без подкатегории",
              categoryId: "",
              category: { id: "", name: "" },
            } as SubcategoryWithCategory,
            channels: [],
          };
        }
        grouped[language][noCategoryKey].channels.push(channelWithStats);
      } else {
        // Каналы с подкатегориями
        channelSubcategories.forEach((subcategory) => {
          const subcategoryWithCategory = subcategories.find((s) => s.id === subcategory.id);
          if (subcategoryWithCategory) {
            if (!grouped[language]) {
              grouped[language] = {};
            }
            if (!grouped[language][subcategory.id]) {
              grouped[language][subcategory.id] = {
                subcategory: subcategoryWithCategory,
                channels: [],
              };
            }
            grouped[language][subcategory.id].channels.push(channelWithStats);
          }
        });
      }
    });

    return grouped;
  }, [channels, channelSubcategoriesMap, channelStats, subcategories]);

  const form = useForm<ChannelFormValues>({
    resolver: zodResolver(channelFormSchema),
    defaultValues: {
      name: "",
      url: "",
      defaultLanguage: "",
      voiceOverName: "",
      voiceOverGender: undefined,
      subcategoryIds: [],
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: ChannelFormValues & { subcategoryIds?: string[] }) => {
      const { subcategoryIds, ...channelData } = data;
      const response = await apiRequest("POST", "/api/channels", {
        ...channelData,
        subcategoryIds,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/channels"] });
      queryClient.invalidateQueries({ queryKey: ["/api/channels/subcategories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/channels/stats"] });
      toast({ title: t("common.success"), description: t("channels.channelAdded") });
      handleCloseDialog();
    },
    onError: (error) => {
      toast({
        title: t("common.error"),
        description:
          error instanceof ApiError
            ? error.getMessage()
            : error instanceof Error
              ? error.message
              : t("channels.createFailed"),
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: ChannelFormValues & { id: string; subcategoryIds?: string[] }) => {
      const { subcategoryIds, id, ...channelData } = data;
      const response = await apiRequest("PATCH", `/api/channels/${id}`, {
        ...channelData,
        subcategoryIds,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/channels"] });
      queryClient.invalidateQueries({ queryKey: ["/api/channels/subcategories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/channels/stats"] });
      toast({ title: t("common.success"), description: t("channels.channelUpdated") });
      handleCloseDialog();
    },
    onError: (error) => {
      toast({
        title: t("common.error"),
        description: error instanceof Error ? error.message : t("channels.updateFailed"),
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/channels/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/channels"] });
      queryClient.invalidateQueries({ queryKey: ["/api/channels/stats"] });
      toast({ title: t("common.success"), description: t("channels.channelRemoved") });
      setDeleteChannelId(null);
    },
    onError: (error) => {
      toast({
        title: t("common.error"),
        description: error instanceof Error ? error.message : t("channels.deleteFailed"),
        variant: "destructive",
      });
    },
  });

  const handleOpenCreate = () => {
    setEditingChannel(null);
    const initialValues = {
      name: "",
      url: "",
      defaultLanguage: "",
      voiceOverName: "",
      voiceOverGender: undefined,
      subcategoryIds: [],
    };
    setOriginalValues(initialValues);
    form.reset(initialValues);
    setDialogOpen(true);
  };

  const handleOpenEdit = async (channel: Channel) => {
    setEditingChannel(channel);
    let channelSubcategoryIds: string[] = [];
    try {
      const response = await apiRequest("GET", `/api/channels/${channel.id}/subcategories`);
      if (response.ok) {
        const subcats: Subcategory[] = await response.json();
        channelSubcategoryIds = subcats.map((s) => s.id);
      }
    } catch (error) {
      console.error("Failed to load channel subcategories:", error);
    }
    const initialValues = {
      name: channel.name || "",
      url: channel.url,
      defaultLanguage: channel.defaultLanguage || "",
      voiceOverName: channel.voiceOverName || "",
      voiceOverGender: (channel.voiceOverGender as "male" | "female") || undefined,
      subcategoryIds: channelSubcategoryIds,
    };
    setOriginalValues(initialValues);
    form.reset(initialValues);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingChannel(null);
    setOriginalValues(null);
    form.reset();
  };

  const currentValues = form.watch();
  const isChanged = useMemo(() => {
    if (!originalValues) {
      return currentValues.url.trim().length > 0;
    }
    const normalizedCurrent = {
      ...currentValues,
      subcategoryIds: (currentValues.subcategoryIds || []).sort(),
    };
    const normalizedOriginal = {
      ...originalValues,
      subcategoryIds: (originalValues.subcategoryIds || []).sort(),
    };
    return !isEqual(normalizedCurrent, normalizedOriginal);
  }, [currentValues, originalValues]);

  const onSubmit = (values: ChannelFormValues) => {
    if (!isChanged) {
      return;
    }

    const cleanedValues: {
      url: string;
      name?: string;
      defaultLanguage?: string;
      voiceOverName?: string;
      voiceOverGender?: "male" | "female";
      niche?: string;
    } = {
      url: values.url,
    };

    if (values.name && typeof values.name === "string" && values.name.trim() !== "") {
      cleanedValues.name = values.name.trim();
    }

    if (values.defaultLanguage && values.defaultLanguage.trim() !== "") {
      cleanedValues.defaultLanguage = values.defaultLanguage;
    }
    if (values.voiceOverName && values.voiceOverName.trim() !== "") {
      cleanedValues.voiceOverName = values.voiceOverName.trim();
    }
    if (values.voiceOverGender) {
      cleanedValues.voiceOverGender = values.voiceOverGender;
    }

    const subcategoryIds =
      values.subcategoryIds && values.subcategoryIds.length > 0 ? values.subcategoryIds : undefined;

    if (editingChannel) {
      updateMutation.mutate({ ...cleanedValues, id: editingChannel.id, subcategoryIds });
    } else {
      createMutation.mutate({ ...cleanedValues, subcategoryIds });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  const languageNames = useMemo(() => {
    const map: Record<string, string> = {};
    languages.forEach((lang) => {
      map[lang.code] = lang.name;
    });
    return map;
  }, [languages]);

  return (
    <div className="flex flex-1 flex-col">
      <Header title={t("channels.title")} />
      <PageContainer>
        <div className="mb-4 md:mb-6 lg:mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-heading-3">{t("channels.description")}</p>
          <Button onClick={handleOpenCreate} className="gap-2" data-testid="button-add-channel">
            <Plus className="h-4 w-4" />
            {t("common.add")}
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="p-4">
                <Skeleton className="h-6 w-1/4 mb-3" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </Card>
            ))}
          </div>
        ) : Object.keys(groupedChannels).length === 0 ? (
          <EmptyState
            icon={Tv}
            title={t("channels.noChannels")}
            description={t("channels.noChannelsDescription")}
            action={
              <Button
                onClick={handleOpenCreate}
                className="gap-2"
                data-testid="button-add-first-channel"
              >
                <Plus className="h-4 w-4" />
                {t("channels.addChannel")}
              </Button>
            }
          />
        ) : (
          <Accordion type="multiple" className="space-y-2">
            {Object.entries(groupedChannels)
              .sort(([langA], [langB]) => {
                // Сортируем: сначала языки с названиями, потом "Без языка"
                if (langA === "Без языка") return 1;
                if (langB === "Без языка") return -1;
                return langA.localeCompare(langB);
              })
              .map(([language, subcategoriesMap]) => {
                const languageName = languageNames[language] || language;
                const totalChannels = Object.values(subcategoriesMap).reduce(
                  (sum, group) => sum + group.channels.length,
                  0
                );

                return (
                  <AccordionItem
                    key={language}
                    value={language}
                    className="border border-border/60 rounded-lg px-4 bg-card"
                  >
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-3 w-full">
                        <Globe className="h-5 w-5 text-primary shrink-0" />
                        <div className="flex-1 text-left">
                          <div className="font-semibold text-heading-3">{languageName}</div>
                          <div className="text-sm text-muted-foreground">
                            {Object.keys(subcategoriesMap).length}{" "}
                            {Object.keys(subcategoriesMap).length === 1
                              ? "подкатегория"
                              : Object.keys(subcategoriesMap).length < 5
                                ? "подкатегории"
                                : "подкатегорий"}{" "}
                            • {totalChannels}{" "}
                            {totalChannels === 1
                              ? "канал"
                              : totalChannels < 5
                                ? "канала"
                                : "каналов"}
                          </div>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <Accordion type="multiple" className="space-y-2 mt-2">
                        {Object.entries(subcategoriesMap)
                          .sort(([a], [b]) => {
                            if (a === "__no_category__") return 1;
                            if (b === "__no_category__") return -1;
                            return subcategoriesMap[a].subcategory.name.localeCompare(
                              subcategoriesMap[b].subcategory.name
                            );
                          })
                          .map(
                            ([subcategoryId, { subcategory, channels: subcategoryChannels }]) => (
                              <AccordionItem
                                key={subcategoryId}
                                value={subcategoryId}
                                className="border border-border/40 rounded-lg px-3 bg-muted/30"
                              >
                                <AccordionTrigger className="hover:no-underline py-3">
                                  <div className="flex items-center gap-2 w-full">
                                    <FolderTree className="h-4 w-4 text-muted-foreground shrink-0" />
                                    <div className="flex-1 text-left">
                                      <div className="font-medium text-sm">
                                        {subcategory.category.name} / {subcategory.name}
                                      </div>
                                      <div className="text-xs text-muted-foreground">
                                        {subcategoryChannels.length}{" "}
                                        {subcategoryChannels.length === 1
                                          ? "канал"
                                          : subcategoryChannels.length < 5
                                            ? "канала"
                                            : "каналов"}
                                      </div>
                                    </div>
                                  </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                  <div className="grid gap-2 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 pt-2">
                                    {subcategoryChannels.map((channel) => (
                                      <Card
                                        key={channel.id}
                                        className="p-3 border border-border/60 hover:border-border hover:shadow-md transition-all group"
                                      >
                                        <div className="flex items-start justify-between gap-2 mb-2">
                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                              <Tv className="h-4 w-4 text-primary shrink-0" />
                                              <h3
                                                className="text-sm font-semibold truncate"
                                                title={channel.name || channel.url}
                                              >
                                                {channel.name || channel.url}
                                              </h3>
                                            </div>
                                            <div className="flex items-center gap-1.5 mb-2">
                                              <Hash className="h-3 w-3 text-muted-foreground/60" />
                                              <span
                                                className="text-xs text-muted-foreground/70 font-mono truncate"
                                                title={channel.id}
                                              >
                                                {channel.id.slice(0, 8)}...
                                              </span>
                                            </div>
                                          </div>
                                          <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 shrink-0"
                                              >
                                                <MoreVertical className="h-4 w-4" />
                                              </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                              <DropdownMenuItem
                                                onClick={() => handleOpenEdit(channel)}
                                              >
                                                <Pencil className="h-4 w-4 mr-2" />
                                                Редактировать
                                              </DropdownMenuItem>
                                              <DropdownMenuItem
                                                onClick={() => setDeleteChannelId(channel.id)}
                                                className="text-destructive"
                                              >
                                                <Trash2 className="h-4 w-4 mr-2" />
                                                Удалить
                                              </DropdownMenuItem>
                                            </DropdownMenuContent>
                                          </DropdownMenu>
                                        </div>

                                        <div className="space-y-1.5">
                                          <div className="flex items-center gap-1.5 flex-wrap">
                                            {channel.voiceOverGender && (
                                              <Badge
                                                variant="outline"
                                                className="text-[10px] px-1.5 py-0.5 h-5"
                                              >
                                                <Mic className="h-3 w-3 mr-1" />
                                                {channel.voiceOverGender === "male" ? "М" : "Ж"}
                                              </Badge>
                                            )}
                                            {channel.voiceOverName && (
                                              <Badge
                                                variant="outline"
                                                className="text-[10px] px-1.5 py-0.5 h-5"
                                              >
                                                {channel.voiceOverName}
                                              </Badge>
                                            )}
                                            {channel.publishedCount > 0 && (
                                              <Badge
                                                variant="secondary"
                                                className="text-[10px] px-1.5 py-0.5 h-5 bg-green-500/20 text-green-400 border-0"
                                              >
                                                {channel.publishedCount}{" "}
                                                {channel.publishedCount === 1
                                                  ? "перевод"
                                                  : channel.publishedCount < 5
                                                    ? "перевода"
                                                    : "переводов"}
                                              </Badge>
                                            )}
                                          </div>
                                          {channel.subcategories.length > 0 && (
                                            <div className="flex items-center gap-1 flex-wrap">
                                              <FolderTree className="h-3 w-3 text-muted-foreground/60 shrink-0" />
                                              <span className="text-xs text-muted-foreground/70 line-clamp-1">
                                                {channel.subcategories
                                                  .slice(0, 2)
                                                  .map((s) => s.name)
                                                  .join(", ")}
                                                {channel.subcategories.length > 2 &&
                                                  ` +${channel.subcategories.length - 2}`}
                                              </span>
                                            </div>
                                          )}
                                          <a
                                            href={channel.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                                            onClick={(e) => e.stopPropagation()}
                                          >
                                            <ExternalLink className="h-3 w-3" />
                                            Открыть канал
                                          </a>
                                        </div>
                                      </Card>
                                    ))}
                                  </div>
                                </AccordionContent>
                              </AccordionItem>
                            )
                          )}
                      </Accordion>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
          </Accordion>
        )}

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-md" data-testid="dialog-channel">
            <DialogHeader>
              <DialogTitle>
                {editingChannel ? t("channels.editChannel") : t("channels.addChannel")}
              </DialogTitle>
            </DialogHeader>
            <DialogBody>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("channels.channelName")}</FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t("channels.channelNamePlaceholder")}
                            {...field}
                            data-testid="input-channel-name"
                            autoComplete="organization-title"
                            autoFocus
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("channels.channelUrl")}</FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t("channels.channelUrlPlaceholder")}
                            {...field}
                            data-testid="input-channel-url"
                            autoComplete="url"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="defaultLanguage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("channels.defaultLanguage")}</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-default-language">
                              <SelectValue placeholder={t("channels.selectLanguage")} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {languages.map((lang) => (
                              <SelectItem key={lang.code} value={lang.code}>
                                {lang.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="subcategoryIds"
                    render={({ field }) => {
                      const selectedIds = field.value || [];
                      const selectedCount = selectedIds.length;

                      const getSelectedNames = () => {
                        const names: string[] = [];
                        categories.forEach((cat) => {
                          if (cat.subcategories) {
                            cat.subcategories.forEach((sub) => {
                              if (selectedIds.includes(sub.id)) {
                                names.push(sub.name);
                              }
                            });
                          }
                        });
                        return (
                          names.slice(0, 2).join(", ") +
                          (selectedCount > 2 ? ` +${selectedCount - 2}` : "")
                        );
                      };

                      return (
                        <FormItem>
                          <FormLabel>{t("channels.subcategories")}</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  type="button"
                                  variant="outline"
                                  role="combobox"
                                  className="w-full justify-between text-left font-normal text-sm h-[var(--input-height)]"
                                  data-testid="button-subcategories-select"
                                  name="subcategoryIds"
                                >
                                  {selectedCount > 0 ? (
                                    <span className="truncate">{getSelectedNames()}</span>
                                  ) : (
                                    <span className="text-muted-foreground">
                                      {t("channels.subcategoriesPlaceholder")}
                                    </span>
                                  )}
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent
                              className="w-[calc(100vw-1rem)] sm:w-[400px] p-0"
                              align="start"
                            >
                              <div className="max-h-[300px] overflow-y-auto p-2">
                                {categories.length === 0 ? (
                                  <p className="text-sm text-muted-foreground p-2">
                                    {t("categories.noSubcategories")}
                                  </p>
                                ) : (
                                  categories.map((cat) => {
                                    if (!cat.subcategories || cat.subcategories.length === 0)
                                      return null;
                                    return (
                                      <div key={cat.id} className="mb-4 last:mb-0">
                                        <div className="text-sm font-medium text-muted-foreground/60 mb-2 px-2">
                                          {cat.name}
                                        </div>
                                        {cat.subcategories.map((sub) => {
                                          const checkboxId = `channel-subcategory-${sub.id}`;
                                          return (
                                            <div
                                              key={sub.id}
                                              className="flex items-center space-x-2 p-2 hover:bg-muted/50 rounded-md cursor-pointer"
                                              onClick={() => {
                                                const newValue = selectedIds.includes(sub.id)
                                                  ? selectedIds.filter((id) => id !== sub.id)
                                                  : [...selectedIds, sub.id];
                                                field.onChange(newValue);
                                              }}
                                            >
                                              <Checkbox
                                                id={checkboxId}
                                                checked={selectedIds.includes(sub.id)}
                                                onCheckedChange={() => {
                                                  const newValue = selectedIds.includes(sub.id)
                                                    ? selectedIds.filter((id) => id !== sub.id)
                                                    : [...selectedIds, sub.id];
                                                  field.onChange(newValue);
                                                }}
                                              />
                                              <label
                                                htmlFor={checkboxId}
                                                className="text-sm cursor-pointer flex-1"
                                              >
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
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="voiceOverName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("channels.voiceOverName")}</FormLabel>
                          <FormControl>
                            <Input
                              placeholder={t("channels.voiceOverPlaceholder")}
                              {...field}
                              data-testid="input-voice-name"
                              autoComplete="name"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="voiceOverGender"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("channels.voiceGender")}</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-voice-gender">
                                <SelectValue placeholder={t("channels.selectGender")} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="male">{t("translation.male")}</SelectItem>
                              <SelectItem value="female">{t("translation.female")}</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="ghost" onClick={handleCloseDialog}>
                      {t("common.cancel")}
                    </Button>
                    <Button
                      type="submit"
                      disabled={!isChanged || isPending}
                      data-testid="button-save-channel"
                      autoFocus
                    >
                      {isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {t("common.loading")}
                        </>
                      ) : editingChannel ? (
                        t("common.save")
                      ) : (
                        t("channels.addChannel")
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogBody>
          </DialogContent>
        </Dialog>

        <AlertDialog open={!!deleteChannelId} onOpenChange={() => setDeleteChannelId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("channels.deleteChannel")}</AlertDialogTitle>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteChannelId && deleteMutation.mutate(deleteChannelId)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                data-testid="button-confirm-delete"
                autoFocus
              >
                {deleteMutation.isPending ? t("common.loading") : t("common.delete")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </PageContainer>
    </div>
  );
}
