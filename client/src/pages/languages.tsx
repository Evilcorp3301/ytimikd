import { useMemo, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Languages, GripVertical, Trash2, Loader2, Pencil } from "lucide-react";
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
  onEdit: (language: DefaultLanguage) => void;
  isDeleting: boolean;
  t: (key: string) => string;
}

function SortableLanguageItem({ language, onToggle, onDelete, onEdit, isDeleting, t }: SortableLanguageItemProps) {
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
      className={
        "grid grid-cols-[auto_1fr_auto] items-center gap-3 p-4 transition-colors border-b last:border-b-0 hover:bg-muted/50" +
        (language.isActive ? "" : " opacity-70")
      }
      data-testid={`row-language-${language.code}`}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab touch-none active:cursor-grabbing rounded-sm p-1 -m-1"
        aria-label="Drag to reorder"
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </button>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span
            className={
              "h-2 w-2 rounded-full" +
              (language.isActive ? " bg-green-500" : " bg-muted-foreground/50")
            }
            aria-hidden="true"
          />
          <span className="truncate font-medium" data-testid="text-language-name">
            {language.name}
          </span>
          <span className="shrink-0 rounded border px-2 py-0.5 text-xs text-muted-foreground">
            {language.code}
          </span>
        </div>
      </div>
      <div className="flex items-center justify-end gap-2">
        <Switch
          checked={language.isActive}
          onCheckedChange={(checked) => onToggle(language.id, checked)}
          data-testid="switch-language-active"
          aria-label={language.isActive ? t("common.active") : t("common.inactive")}
        />
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onEdit(language)}
          data-testid="button-edit-language"
          aria-label={t("common.edit")}
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(language.id)}
          disabled={isDeleting}
          data-testid="button-delete-language"
          aria-label={t("common.delete")}
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
  const [editingLanguage, setEditingLanguage] = useState<DefaultLanguage | null>(null);

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
      setEditingLanguage(null);
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

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<LanguageFormValues> }) => {
      const response = await apiRequest("PATCH", `/api/languages/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/languages"] });
      toast({ title: t("common.saved"), description: t("common.savedDescription") });
      setDialogOpen(false);
      setEditingLanguage(null);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: t("common.error"),
        description: error instanceof Error ? error.message : "Failed to update language",
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
    if (editingLanguage) {
      updateMutation.mutate({ id: editingLanguage.id, data: values });
      return;
    }
    createMutation.mutate(values);
  };

  const { activeCount, inactiveCount } = useMemo(() => {
    return {
      activeCount: languages.filter((l) => l.isActive).length,
      inactiveCount: languages.filter((l) => !l.isActive).length,
    };
  }, [languages]);

  const dialogMode = editingLanguage ? "edit" : "create";

  const openCreateDialog = () => {
    setEditingLanguage(null);
    form.reset({ name: "", code: "", isActive: true });
    setDialogOpen(true);
  };

  const openEditDialog = (language: DefaultLanguage) => {
    setEditingLanguage(language);
    form.reset({ name: language.name, code: language.code, isActive: language.isActive });
    setDialogOpen(true);
  };

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
          <Button onClick={openCreateDialog} className="gap-2" data-testid="button-add-language">
            <Plus className="h-4 w-4" />
            {t("languages.addLanguage")}
          </Button>
        </div>

        {isLoading ? (
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="grid grid-cols-[auto_1fr_auto] items-center gap-3 p-4">
                    <Skeleton className="h-5 w-5" />
                    <div className="min-w-0">
                      <Skeleton className="h-5 w-40" />
                      <Skeleton className="mt-2 h-4 w-20" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-6 w-10 rounded-full" />
                      <Skeleton className="h-9 w-9 rounded-md" />
                    </div>
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
              <Button onClick={openCreateDialog} className="gap-2" data-testid="button-add-first-language">
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
                      onEdit={openEditDialog}
                      isDeleting={deleteMutation.isPending}
                      t={t}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            </CardContent>
          </Card>
        )}

        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) setEditingLanguage(null);
          }}
        >
          <DialogContent className="sm:max-w-md" data-testid="dialog-add-language">
            <DialogHeader>
              <DialogTitle>
                {dialogMode === "edit" ? t("common.edit") : t("languages.addLanguage")}
              </DialogTitle>
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
                  <Button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    data-testid="button-save-language"
                  >
                    {createMutation.isPending || updateMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t("common.loading")}
                      </>
                    ) : (
                      dialogMode === "edit" ? t("common.save") : t("languages.addLanguage")
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
