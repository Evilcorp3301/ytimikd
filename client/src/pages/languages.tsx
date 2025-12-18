import { useMemo, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Languages, Trash2, Loader2, Pencil, MoreVertical } from "lucide-react";
import { Header } from "@/components/layout/header";
import { PageContainer } from "@/components/ui/page-container";
import { EmptyState } from "@/components/ui/empty-state";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
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

type LanguageFormValues = {
  code: string;
  name: string;
  isActive: boolean;
};

interface LanguageItemProps {
  language: DefaultLanguage;
  onToggle: (id: string, isActive: boolean) => void;
  onDelete: (id: string) => void;
  onEdit: (language: DefaultLanguage) => void;
  isDeleting: boolean;
  t: (key: string) => string;
}

function LanguageItem({ language, onToggle, onDelete, onEdit, isDeleting, t }: LanguageItemProps) {
  return (
    <Card 
      className={cn(
        "overflow-hidden group flex flex-col border border-border/60 hover:border-border/80 hover:shadow-md transition-all duration-200 relative shadow-sm",
        !language.isActive && "opacity-70"
      )}
      data-testid={`card-language-${language.code}`}
    >
      {/* Header section */}
      <div className="p-4 md:p-5 border-b border-border/20 bg-card">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-base md:text-heading-3 font-semibold truncate text-foreground" data-testid="text-language-name">
                {language.name}
              </h3>
              <Badge variant="outline" className="shrink-0 text-xs font-mono">
                {language.code}
              </Badge>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 md:h-9 md:w-9 hover:bg-muted/60 transition-colors"
                aria-label="Действия с языком"
              >
                <MoreVertical className="h-5 w-5 md:h-4 md:w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(language)}>
                <Pencil className="h-4 w-4 mr-2" />
                {t("common.edit")}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(language.id)}
                disabled={isDeleting}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {t("common.delete")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Actions section */}
      <div className="p-4 md:p-5 border-t border-border/20 bg-muted/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={cn(
              "text-xs font-medium transition-colors hidden sm:inline",
              language.isActive ? "text-muted-foreground" : "text-muted-foreground/60"
            )}>
              Off
            </span>
            <Switch
              checked={language.isActive}
              onCheckedChange={(checked) => onToggle(language.id, checked)}
              data-testid="switch-language-active"
              aria-label={language.isActive ? t("common.active") : t("common.inactive")}
              className={cn(
                language.isActive 
                  ? "data-[state=checked]:bg-primary" 
                  : "data-[state=unchecked]:bg-muted-foreground/30"
              )}
            />
            <span className={cn(
              "text-xs font-medium transition-colors hidden sm:inline",
              language.isActive ? "text-primary font-semibold" : "text-muted-foreground"
            )}>
              On
            </span>
          </div>
          <Badge 
            variant={language.isActive ? "default" : "secondary"}
            className={cn(
              "text-xs",
              language.isActive ? "bg-primary/10 text-primary border-primary/20" : "bg-muted text-muted-foreground"
            )}
          >
            {language.isActive ? t("common.active") : t("common.inactive")}
          </Badge>
        </div>
      </div>
    </Card>
  );
}

export default function LanguagesPage() {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLanguage, setEditingLanguage] = useState<DefaultLanguage | null>(null);

  const { data: languages = [], isLoading } = useQuery<DefaultLanguage[]>({
    queryKey: ["/api/languages"],
  });

  // Сортируем языки: сначала активные, потом неактивные
  const sortedLanguages = useMemo(() => {
    return [...languages].sort((a, b) => {
      // Сначала по статусу активности (активные выше)
      if (a.isActive !== b.isActive) {
        return a.isActive ? -1 : 1;
      }
      // Если статус одинаковый, сортируем по sortOrder или id
      return (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.id.localeCompare(b.id);
    });
  }, [languages]);

  const languageFormSchema = z.object({
    code: z.string()
      .min(2, t("languages.codeMinLength"))
      .max(10, t("languages.codeMaxLength")),
    name: z.string().min(1, t("languages.nameRequired")),
    isActive: z.boolean().default(true),
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
      // Invalidate queries to refresh the languages list and recalculate counts
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


  const onSubmit = (values: LanguageFormValues) => {
    if (editingLanguage) {
      updateMutation.mutate({ id: editingLanguage.id, data: values });
      return;
    }
    createMutation.mutate(values);
  };

  const { activeCount, inactiveCount } = useMemo(() => {
    return {
      activeCount: sortedLanguages.filter((l) => l.isActive).length,
      inactiveCount: sortedLanguages.filter((l) => !l.isActive).length,
    };
  }, [sortedLanguages]);

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
        <div className="mb-4 md:mb-6 lg:mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-heading-3">
              {t("languages.description")}
            </p>
            {languages.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-3 sm:gap-4 text-xs">
                <span className="text-primary">
                  {activeCount} {t("common.active").toLowerCase()}
                </span>
                <span className="text-muted-foreground">
                  {inactiveCount} {t("common.inactive").toLowerCase()}
                </span>
              </div>
            )}
          </div>
          <Button onClick={openCreateDialog} className="gap-2 w-full sm:w-auto" data-testid="button-add-language">
            <Plus className="h-4 w-4" />
            {t("common.add")}
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <div className="p-4 md:p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-5 w-12 rounded" />
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t">
                    <Skeleton className="h-6 w-16 rounded-full" />
                    <Skeleton className="h-5 w-20 rounded" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : sortedLanguages.length === 0 ? (
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
            {sortedLanguages.map((language) => (
              <LanguageItem
                key={language.id}
                language={language}
                onToggle={(id, isActive) => toggleMutation.mutate({ id, isActive })}
                onDelete={(id) => deleteMutation.mutate(id)}
                onEdit={openEditDialog}
                isDeleting={deleteMutation.isPending}
                t={t}
              />
            ))}
          </div>
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
                        <Input placeholder={t("languages.languageNamePlaceholder")} {...field} data-testid="input-language-name" autoFocus />
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
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-3 space-y-0">
                      <FormLabel className="mb-0">{t("languages.activeByDefault")}</FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "text-xs font-medium transition-colors",
                            field.value ? "text-muted-foreground" : "text-muted-foreground/60"
                          )}>
                            Off
                          </span>
                          <Switch 
                            checked={field.value} 
                            onCheckedChange={field.onChange} 
                            data-testid="switch-active-default"
                            className={cn(
                              field.value 
                                ? "data-[state=checked]:bg-primary" 
                                : "data-[state=unchecked]:bg-muted-foreground/30"
                            )}
                          />
                          <span className={cn(
                            "text-xs font-medium transition-colors",
                            field.value ? "text-primary font-semibold" : "text-muted-foreground"
                          )}>
                            On
                          </span>
                        </div>
                      </FormControl>
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="button" variant="ghost" onClick={() => setDialogOpen(false)}>
                    {t("common.cancel")}
                  </Button>
                  <Button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    data-testid="button-save-language"
                    autoFocus
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
