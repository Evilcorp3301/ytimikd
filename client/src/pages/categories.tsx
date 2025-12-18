import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Pencil, Trash2, Loader2, MoreVertical, FolderTree, Video, Tv } from "lucide-react";
import { Header } from "@/components/layout/header";
import { PageContainer } from "@/components/ui/page-container";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
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
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useTranslation } from "@/lib/language-provider";
import type { CategoryWithSubcategories, SubcategoryWithCategory } from "@shared/schema";

type CategoryFormValues = {
  name: string;
  description?: string;
};

type SubcategoryFormValues = {
  categoryId: string;
  name: string;
  description?: string;
};

export default function CategoriesPage() {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [subcategoryDialogOpen, setSubcategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryWithSubcategories | null>(null);
  const [editingSubcategory, setEditingSubcategory] = useState<SubcategoryWithCategory | null>(null);
  const [deleteCategoryId, setDeleteCategoryId] = useState<string | null>(null);
  const [deleteSubcategoryId, setDeleteSubcategoryId] = useState<string | null>(null);

  const { data: categories = [], isLoading } = useQuery<CategoryWithSubcategories[]>({
    queryKey: ["/api/categories"],
  });

  const { data: categoryStats = {} } = useQuery<Record<string, { videosCount: number; channelsCount: number }>>({
    queryKey: ["/api/categories/stats"],
  });

  const categoryFormSchema = z.object({
    name: z.string().min(1, t("categories.categoryNameRequired")),
    description: z.string().optional(),
  });

  const subcategoryFormSchema = z.object({
    categoryId: z.string().min(1, t("categories.categoryRequired")),
    name: z.string().min(1, t("categories.subcategoryNameRequired")),
    description: z.string().optional(),
  });

  const categoryForm = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const subcategoryForm = useForm<SubcategoryFormValues>({
    resolver: zodResolver(subcategoryFormSchema),
    defaultValues: {
      categoryId: "",
      name: "",
      description: "",
    },
  });

  const selectedCategoryId = subcategoryForm.watch("categoryId");

  const { data: existingSubcategories = [] } = useQuery<SubcategoryWithCategory[]>({
    queryKey: ["/api/subcategories", selectedCategoryId],
    queryFn: async () => {
      const url = selectedCategoryId 
        ? `/api/subcategories?categoryId=${encodeURIComponent(selectedCategoryId)}`
        : "/api/subcategories";
      const response = await apiRequest("GET", url);
      return response.json();
    },
    enabled: !!selectedCategoryId && subcategoryDialogOpen,
  });

  const createCategoryMutation = useMutation({
    mutationFn: async (data: CategoryFormValues) => {
      const response = await apiRequest("POST", "/api/categories", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({ title: t("categories.categoryAdded"), description: t("common.success") });
      setCategoryDialogOpen(false);
      setEditingCategory(null);
      categoryForm.reset();
    },
    onError: (error) => {
      toast({
        title: t("common.error"),
        description: error instanceof Error ? error.message : "Failed to add category",
        variant: "destructive",
      });
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CategoryFormValues> }) => {
      const response = await apiRequest("PATCH", `/api/categories/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({ title: t("categories.categoryUpdated"), description: t("common.savedDescription") });
      setCategoryDialogOpen(false);
      setEditingCategory(null);
      categoryForm.reset();
    },
    onError: (error) => {
      toast({
        title: t("common.error"),
        description: error instanceof Error ? error.message : "Failed to update category",
        variant: "destructive",
      });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({ title: t("categories.categoryDeleted"), description: t("common.success") });
      setDeleteCategoryId(null);
    },
    onError: (error) => {
      toast({
        title: t("common.error"),
        description: error instanceof Error ? error.message : "Failed to delete category",
        variant: "destructive",
      });
    },
  });

  const createSubcategoryMutation = useMutation({
    mutationFn: async (data: SubcategoryFormValues) => {
      const response = await apiRequest("POST", "/api/subcategories", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/subcategories"] });
      toast({ title: t("categories.subcategoryAdded"), description: t("common.success") });
      setSubcategoryDialogOpen(false);
      setEditingSubcategory(null);
      subcategoryForm.reset();
    },
    onError: (error) => {
      toast({
        title: t("common.error"),
        description: error instanceof Error ? error.message : "Failed to add subcategory",
        variant: "destructive",
      });
    },
  });

  const updateSubcategoryMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<SubcategoryFormValues> }) => {
      const response = await apiRequest("PATCH", `/api/subcategories/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/subcategories"] });
      toast({ title: t("categories.subcategoryUpdated"), description: t("common.savedDescription") });
      setSubcategoryDialogOpen(false);
      setEditingSubcategory(null);
      subcategoryForm.reset();
    },
    onError: (error) => {
      toast({
        title: t("common.error"),
        description: error instanceof Error ? error.message : "Failed to update subcategory",
        variant: "destructive",
      });
    },
  });

  const deleteSubcategoryMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/subcategories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/subcategories"] });
      toast({ title: t("categories.subcategoryDeleted"), description: t("common.success") });
      setDeleteSubcategoryId(null);
    },
    onError: (error) => {
      toast({
        title: t("common.error"),
        description: error instanceof Error ? error.message : "Failed to delete subcategory",
        variant: "destructive",
      });
    },
  });

  const handleOpenCategoryDialog = (category?: CategoryWithSubcategories) => {
    if (category) {
      setEditingCategory(category);
      categoryForm.reset({
        name: category.name,
        description: category.description || "",
      });
    } else {
      setEditingCategory(null);
      categoryForm.reset();
    }
    setCategoryDialogOpen(true);
  };

  const handleOpenSubcategoryDialog = (categoryId?: string, subcategory?: SubcategoryWithCategory) => {
    if (subcategory) {
      setEditingSubcategory(subcategory);
      subcategoryForm.reset({
        categoryId: subcategory.categoryId,
        name: subcategory.name,
        description: subcategory.description || "",
      });
    } else {
      setEditingSubcategory(null);
      subcategoryForm.reset({
        categoryId: categoryId || "",
        name: "",
        description: "",
      });
    }
    setSubcategoryDialogOpen(true);
  };

  const handleCloseCategoryDialog = () => {
    setCategoryDialogOpen(false);
    setEditingCategory(null);
    categoryForm.reset();
  };

  const handleCloseSubcategoryDialog = () => {
    setSubcategoryDialogOpen(false);
    setEditingSubcategory(null);
    subcategoryForm.reset();
  };

  const onCategorySubmit = (values: CategoryFormValues) => {
    if (editingCategory) {
      updateCategoryMutation.mutate({ id: editingCategory.id, data: values });
      return;
    }
    createCategoryMutation.mutate(values);
  };

  const onSubcategorySubmit = (values: SubcategoryFormValues) => {
    if (editingSubcategory) {
      updateSubcategoryMutation.mutate({ id: editingSubcategory.id, data: values });
      return;
    }
    createSubcategoryMutation.mutate(values);
  };

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col">
        <Header title={t("categories.title")} />
        <PageContainer>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <div className="p-4 md:p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-5 w-5 rounded" />
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-5 w-12 rounded" />
                  </div>
                  <Skeleton className="h-4 w-full" />
                  <div className="pt-2 border-t space-y-2">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </PageContainer>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <Header title={t("categories.title")} />
      <PageContainer>
        <div className="mb-4 md:mb-6 lg:mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-heading-3">
            {t("categories.description")}
          </p>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                className="gap-2"
                data-testid="button-add-category"
              >
                <Plus className="h-4 w-4" />
                {t("common.add")}
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleOpenCategoryDialog()}>
                <Plus className="h-4 w-4" />
                <span>Добавить категорию</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleOpenSubcategoryDialog()}>
                <Plus className="h-4 w-4" />
                <span>Добавить подкатегорию</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {categories.length === 0 ? (
          <EmptyState
            icon={FolderTree}
            title={t("categories.noCategories")}
            description={t("categories.noCategoriesDescription")}
            action={
              <Button onClick={() => handleOpenCategoryDialog()} data-testid="button-add-first-category">
                <Plus className="h-4 w-4 mr-2" />
                {t("categories.addCategory")}
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
            {categories.map((category) => {
              const stats = categoryStats[category.id] || { videosCount: 0, channelsCount: 0 };
              
              return (
                <Card 
                  key={category.id} 
                  className="overflow-hidden group flex flex-col border border-border/60 hover:border-border/80 hover:shadow-md transition-all duration-200 relative shadow-sm"
                  data-testid={`card-category-${category.id}`}
                >
                  {/* Header section */}
                  <div className="p-4 md:p-5 border-b border-border/20 bg-card">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <FolderTree className="h-5 w-5 text-primary shrink-0" />
                          <h3 className="text-base md:text-heading-3 font-semibold truncate text-foreground" data-testid="text-category-name">
                            {category.name}
                          </h3>
                          {category.subcategories.length > 0 && (
                            <Badge variant="outline" className="shrink-0 text-xs">
                              {category.subcategories.length}
                            </Badge>
                          )}
                        </div>
                        {category.description && (
                          <p className="text-xs text-muted-foreground/70 line-clamp-2" data-testid="text-category-description">
                            {category.description}
                          </p>
                        )}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 md:h-9 md:w-9 hover:bg-muted/60 transition-colors"
                            aria-label="Действия с категорией"
                          >
                            <MoreVertical className="h-5 w-5 md:h-4 md:w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleOpenSubcategoryDialog(category.id)}>
                            <Plus className="h-4 w-4" />
                            <span>Добавить подкатегорию</span>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleOpenCategoryDialog(category)}>
                            <Pencil className="h-4 w-4" />
                            <span>Редактировать</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setDeleteCategoryId(category.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span>Удалить</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Stats badges */}
                    {(stats.videosCount > 0 || stats.channelsCount > 0) && (
                      <div className="flex flex-wrap items-center gap-2">
                        {stats.videosCount > 0 && (
                          <Badge variant="secondary" className="text-xs h-6">
                            <Video className="h-3 w-3 mr-1" />
                            {stats.videosCount} {stats.videosCount === 1 ? "видео" : stats.videosCount < 5 ? "видео" : "видео"}
                          </Badge>
                        )}
                        {stats.channelsCount > 0 && (
                          <Badge variant="secondary" className="text-xs h-6">
                            <Tv className="h-3 w-3 mr-1" />
                            {stats.channelsCount} {stats.channelsCount === 1 ? "канал" : stats.channelsCount < 5 ? "канала" : "каналов"}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Subcategories section */}
                  {category.subcategories.length > 0 && (
                    <div className="p-4 md:p-5 border-t border-border/20 bg-muted/30 flex-1">
                      <div className="space-y-1.5">
                        {category.subcategories.map((subcategory) => (
                          <div
                            key={subcategory.id}
                            className="flex items-center justify-between gap-2 py-2 px-2 rounded-md hover:bg-muted/50 transition-colors group/sub"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{subcategory.name}</p>
                              {subcategory.description && (
                                <p className="text-xs text-muted-foreground/60 truncate mt-0.5">
                                  {subcategory.description}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover/sub:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 hover:bg-muted/60"
                                onClick={() => handleOpenSubcategoryDialog(undefined, {
                                  ...subcategory,
                                  category: category as any,
                                })}
                                data-testid={`button-edit-subcategory-${subcategory.id}`}
                                aria-label="Редактировать подкатегорию"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => setDeleteSubcategoryId(subcategory.id)}
                                data-testid={`button-delete-subcategory-${subcategory.id}`}
                                aria-label="Удалить подкатегорию"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Empty state for subcategories */}
                  {category.subcategories.length === 0 && (
                    <div className="p-4 md:p-5 border-t border-border/20 bg-muted/30 flex-1 flex items-center justify-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full gap-2 text-muted-foreground hover:text-foreground"
                        onClick={() => handleOpenSubcategoryDialog(category.id)}
                      >
                        <Plus className="h-4 w-4" />
                        <span className="text-xs">Добавить подкатегорию</span>
                      </Button>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}

        {/* Category Dialog */}
        <Dialog open={categoryDialogOpen} onOpenChange={handleCloseCategoryDialog}>
          <DialogContent className="sm:max-w-md" data-testid="dialog-category">
            <DialogHeader>
              <DialogTitle>
                {editingCategory ? t("categories.editCategory") : t("categories.addCategory")}
              </DialogTitle>
            </DialogHeader>
            <Form {...categoryForm}>
              <form onSubmit={categoryForm.handleSubmit(onCategorySubmit)} className="space-y-4">
                <FormField
                  control={categoryForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("categories.categoryName")}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t("categories.categoryNamePlaceholder")}
                          {...field}
                          data-testid="input-category-name"
                          autoFocus
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={categoryForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("categories.categoryDescription")}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t("categories.categoryDescriptionPlaceholder")}
                          {...field}
                          data-testid="input-category-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleCloseCategoryDialog}
                    data-testid="button-cancel"
                  >
                    {t("common.cancel")}
                  </Button>
                  <Button
                    type="submit"
                    disabled={createCategoryMutation.isPending || updateCategoryMutation.isPending}
                    data-testid="button-save"
                    autoFocus
                  >
                    {(createCategoryMutation.isPending || updateCategoryMutation.isPending) && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {t("common.save")}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Subcategory Dialog */}
        <Dialog open={subcategoryDialogOpen} onOpenChange={handleCloseSubcategoryDialog}>
          <DialogContent className="sm:max-w-md" data-testid="dialog-subcategory">
            <DialogHeader>
              <DialogTitle>
                {editingSubcategory ? t("categories.editSubcategory") : t("categories.addSubcategory")}
              </DialogTitle>
            </DialogHeader>
            <Form {...subcategoryForm}>
              <form onSubmit={subcategoryForm.handleSubmit(onSubcategorySubmit)} className="space-y-4">
                <FormField
                  control={subcategoryForm.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("categories.categoryName")}</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!!editingSubcategory}>
                        <FormControl>
                          <SelectTrigger data-testid="select-category">
                            <SelectValue placeholder={t("categories.categoryNamePlaceholder")} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={subcategoryForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("categories.subcategoryName")}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t("categories.subcategoryNamePlaceholder")}
                          {...field}
                          data-testid="input-subcategory-name"
                          autoFocus
                        />
                      </FormControl>
                      {selectedCategoryId && existingSubcategories.length > 0 && (
                        <div className="mt-2 rounded border border-border/30 bg-muted/30 p-2">
                          <p className="text-xs font-medium text-muted-foreground/70 mb-1.5">
                            Существующие подкатегории:
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {existingSubcategories.map((sub) => (
                              <span
                                key={sub.id}
                                className="inline-flex items-center rounded border border-border/30 bg-background px-[var(--space-2)] py-[var(--space-1)] text-xs text-muted-foreground/60"
                              >
                                {sub.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={subcategoryForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("categories.subcategoryDescription")}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t("categories.subcategoryDescriptionPlaceholder")}
                          {...field}
                          data-testid="input-subcategory-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleCloseSubcategoryDialog}
                    data-testid="button-cancel"
                  >
                    {t("common.cancel")}
                  </Button>
                  <Button
                    type="submit"
                    disabled={createSubcategoryMutation.isPending || updateSubcategoryMutation.isPending}
                    data-testid="button-save"
                    autoFocus
                  >
                    {(createSubcategoryMutation.isPending || updateSubcategoryMutation.isPending) && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {t("common.save")}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Delete Category Confirmation */}
        <AlertDialog open={!!deleteCategoryId} onOpenChange={() => setDeleteCategoryId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("categories.deleteCategory")}</AlertDialogTitle>
              <AlertDialogDescription>
                {deleteCategoryId && categoryStats[deleteCategoryId] && 
                 (categoryStats[deleteCategoryId].videosCount > 0 || categoryStats[deleteCategoryId].channelsCount > 0) ? (
                  <div className="space-y-2">
                    <p className="text-error">
                      Внимание! Эта категория используется:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      {categoryStats[deleteCategoryId].videosCount > 0 && (
                        <li>{categoryStats[deleteCategoryId].videosCount} видео связаны с этой категорией</li>
                      )}
                      {categoryStats[deleteCategoryId].channelsCount > 0 && (
                        <li>{categoryStats[deleteCategoryId].channelsCount} каналов связаны с этой категорией</li>
                      )}
                    </ul>
                    <p className="text-sm mt-2">
                      При удалении категории все связи будут потеряны. Вы уверены?
                    </p>
                  </div>
                ) : (
                  t("categories.deleteCategoryConfirmation")
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteCategoryId && deleteCategoryMutation.mutate(deleteCategoryId)}
                data-testid="button-confirm-delete-category"
                className={deleteCategoryId && categoryStats[deleteCategoryId] && 
                          (categoryStats[deleteCategoryId].videosCount > 0 || categoryStats[deleteCategoryId].channelsCount > 0)
                          ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" 
                          : ""}
              >
                {deleteCategoryMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("common.loading")}
                  </>
                ) : (
                  t("common.delete")
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Delete Subcategory Confirmation */}
        <AlertDialog open={!!deleteSubcategoryId} onOpenChange={() => setDeleteSubcategoryId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("categories.deleteSubcategory")}</AlertDialogTitle>
              <AlertDialogDescription>
                {t("categories.deleteSubcategoryConfirmation")}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteSubcategoryId && deleteSubcategoryMutation.mutate(deleteSubcategoryId)}
                data-testid="button-confirm-delete-subcategory"
              >
                {deleteSubcategoryMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("common.loading")}
                  </>
                ) : (
                  t("common.delete")
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </PageContainer>
    </div>
  );
}
