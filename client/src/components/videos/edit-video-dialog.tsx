import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Loader2, Save, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useTranslation } from "@/lib/language-provider";
import type { VideoWithTranslations, CategoryWithSubcategories } from "@shared/schema";

const editVideoSchema = z.object({
  title: z.string().min(1, "Название обязательно"),
  url: z.string().url("Введите корректный URL"),
  subcategoryId: z.string().optional(),
});

type EditVideoFormValues = z.infer<typeof editVideoSchema>;

interface EditVideoDialogProps {
  video: VideoWithTranslations | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditVideoDialog({ video, open, onOpenChange }: EditVideoDialogProps) {
  const { toast } = useToast();
  const { t } = useTranslation();

  const { data: categories = [] } = useQuery<CategoryWithSubcategories[]>({
    queryKey: ["/api/categories"],
  });

  const form = useForm<EditVideoFormValues>({
    resolver: zodResolver(editVideoSchema),
    defaultValues: {
      title: "",
      url: "",
      subcategoryId: "",
    },
  });

  useEffect(() => {
    if (video) {
      form.reset({
        title: video.title || "",
        url: video.url || "",
        subcategoryId: video.subcategoryId || "",
      });
    }
  }, [video, form]);

  const updateMutation = useMutation({
    mutationFn: async (data: EditVideoFormValues) => {
      const updateData = {
        ...data,
        subcategoryId: data.subcategoryId || null,
      };
      const response = await apiRequest("PATCH", `/api/videos/${video?.id}`, updateData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
      toast({
        title: "Видео обновлено",
        description: "Изменения сохранены успешно",
      });
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: t("common.error"),
        description: error instanceof Error ? error.message : "Не удалось обновить видео",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: EditVideoFormValues) => {
    updateMutation.mutate(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Редактировать видео</DialogTitle>
          <DialogDescription>
            Измените название или URL видео
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Название</FormLabel>
                  <FormControl>
                    <Input placeholder="Название видео" {...field} />
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
                  <FormLabel>URL</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="https://youtube.com/watch?v=..." 
                      {...field}
                      autoComplete="url"
                    />
                  </FormControl>
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
                              "w-full justify-between text-left font-normal text-xs",
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
                                    const checkboxId = `subcategory-edit-${sub.id}`;
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
                                        <label htmlFor={checkboxId} className="flex-1 text-xs font-normal cursor-pointer">
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
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Отмена
              </Button>
              <Button type="submit" disabled={updateMutation.isPending} className="gap-2">
                {updateMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Сохранение...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Сохранить
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
