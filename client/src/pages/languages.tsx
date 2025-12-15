import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Languages, GripVertical, Trash2, Loader2, Check, X } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Header } from "@/components/layout/header";
import { PageContainer } from "@/components/ui/page-container";
import { EmptyState } from "@/components/ui/empty-state";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useTranslation } from "@/lib/language-provider";
import type { DefaultLanguage } from "@shared/schema";

const languageFormSchema = z.object({
  code: z.string().min(2, "Language code is required").max(10),
  name: z.string().min(1, "Language name is required"),
  isActive: z.boolean().default(true),
});

type LanguageFormValues = z.infer<typeof languageFormSchema>;

interface SortableLanguageItemProps {
  language: DefaultLanguage;
  onToggle: (id: string, isActive: boolean) => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
  t: (key: string) => string;
}

function SortableLanguageItem({ language, onToggle, onDelete, isDeleting, t }: SortableLanguageItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: language.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-4 p-4 transition-colors hover:bg-muted/50 border-b last:border-b-0"
      data-testid={`row-language-${language.code}`}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab touch-none active:cursor-grabbing"
        aria-label="Drag to reorder"
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </button>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium" data-testid="text-language-name">
            {language.name}
          </span>
          <Badge variant="outline">
            {language.code}
          </Badge>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {language.isActive ? (
          <Badge variant="default" className="gap-1 bg-green-600">
            <Check className="h-3 w-3" />
            {t("common.active")}
          </Badge>
        ) : (
          <Badge variant="secondary" className="gap-1">
            <X className="h-3 w-3" />
            {t("common.inactive")}
          </Badge>
        )}
        <Switch
          checked={language.isActive}
          onCheckedChange={(checked) => onToggle(language.id, checked)}
          data-testid="switch-language-active"
        />
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(language.id)}
          disabled={isDeleting}
          data-testid="button-delete-language"
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    </div>
  );
}

export default function LanguagesPage() {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [dialogOpen, setDialogOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const { data: languages = [], isLoading } = useQuery<DefaultLanguage[]>({
    queryKey: ["/api/languages"],
  });

  const form = useForm<LanguageFormValues>({
    resolver: zodResolver(languageFormSchema),
    defaultValues: {
      code: "",
      name: "",
      isActive: true,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: LanguageFormValues) => {
      const response = await apiRequest("POST", "/api/languages", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/languages"] });
      toast({ title: t("languages.languageAdded"), description: t("languages.languageAddedDescription") });
      setDialogOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: t("common.error"),
        description: error instanceof Error ? error.message : "Failed to add language",
        variant: "destructive",
      });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const response = await apiRequest("PATCH", `/api/languages/${id}`, { isActive });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/languages"] });
    },
    onError: (error) => {
      toast({
        title: t("common.error"),
        description: error instanceof Error ? error.message : "Failed to update language",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/languages/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/languages"] });
      toast({ title: t("languages.languageRemoved"), description: t("languages.languageRemovedDescription") });
    },
    onError: (error) => {
      toast({
        title: t("common.error"),
        description: error instanceof Error ? error.message : "Failed to remove language",
        variant: "destructive",
      });
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async (orderedIds: string[]) => {
      const response = await apiRequest("PUT", "/api/languages/reorder", { orderedIds });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/languages"] });
    },
    onError: (error) => {
      toast({
        title: t("common.error"),
        description: error instanceof Error ? error.message : "Failed to reorder languages",
        variant: "destructive",
      });
    },
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = languages.findIndex((l) => l.id === active.id);
      const newIndex = languages.findIndex((l) => l.id === over.id);
      const newOrder = arrayMove(languages, oldIndex, newIndex);
      const orderedIds = newOrder.map((l) => l.id);
      reorderMutation.mutate(orderedIds);
    }
  };

  const onSubmit = (values: LanguageFormValues) => {
    createMutation.mutate(values);
  };

  const activeCount = languages.filter((l) => l.isActive).length;
  const inactiveCount = languages.filter((l) => !l.isActive).length;

  return (
    <div className="flex flex-1 flex-col">
      <Header title={t("languages.title")} />
      <PageContainer>
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-muted-foreground">
              {t("languages.description")}
            </p>
            {languages.length > 0 && (
              <div className="mt-2 flex gap-4 text-sm">
                <span className="text-green-600 dark:text-green-400">
                  {activeCount} {t("common.active").toLowerCase()}
                </span>
                <span className="text-muted-foreground">
                  {inactiveCount} {t("common.inactive").toLowerCase()}
                </span>
              </div>
            )}
          </div>
          <Button onClick={() => setDialogOpen(true)} className="gap-2" data-testid="button-add-language">
            <Plus className="h-4 w-4" />
            {t("languages.addLanguage")}
          </Button>
        </div>

        {isLoading ? (
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 p-4">
                    <Skeleton className="h-5 w-5" />
                    <div className="flex-1">
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="mt-1 h-4 w-16" />
                    </div>
                    <Skeleton className="h-6 w-10 rounded-full" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : languages.length === 0 ? (
          <EmptyState
            icon={Languages}
            title={t("languages.noLanguages")}
            description={t("languages.noLanguagesDescription")}
            action={
              <Button onClick={() => setDialogOpen(true)} className="gap-2" data-testid="button-add-first-language">
                <Plus className="h-4 w-4" />
                {t("languages.addFirstLanguage")}
              </Button>
            }
          />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>{t("languages.languageList")}</CardTitle>
              <CardDescription>
                {t("languages.languageListDescription")}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={languages.map((l) => l.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {languages.map((language) => (
                    <SortableLanguageItem
                      key={language.id}
                      language={language}
                      onToggle={(id, isActive) => toggleMutation.mutate({ id, isActive })}
                      onDelete={(id) => deleteMutation.mutate(id)}
                      isDeleting={deleteMutation.isPending}
                      t={t}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            </CardContent>
          </Card>
        )}

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-md" data-testid="dialog-add-language">
            <DialogHeader>
              <DialogTitle>{t("languages.addLanguage")}</DialogTitle>
              <DialogDescription>
                {t("languages.description")}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("languages.languageName")}</FormLabel>
                      <FormControl>
                        <Input placeholder={t("languages.languageNamePlaceholder")} {...field} data-testid="input-language-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("languages.languageCode")}</FormLabel>
                      <FormControl>
                        <Input placeholder={t("languages.languageCodePlaceholder")} {...field} data-testid="input-language-code" />
                      </FormControl>
                      <FormDescription>
                        {t("languages.languageCodeDescription")}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <FormLabel>{t("languages.activeByDefault")}</FormLabel>
                        <FormDescription>
                          {t("languages.activeByDefaultDescription")}
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-active-default" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    {t("common.cancel")}
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending} data-testid="button-save-language">
                    {createMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t("common.loading")}
                      </>
                    ) : (
                      t("languages.addLanguage")
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </PageContainer>
    </div>
  );
}
