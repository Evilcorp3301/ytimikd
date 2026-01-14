import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Loader2 } from "lucide-react";
import { Header } from "@/components/layout/header";
import { PageContainer } from "@/components/ui/page-container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { ApiError } from "@/lib/api-error";
import { useTranslation } from "@/lib/language-provider";
import type { CategoryWithSubcategories } from "@shared/schema";

type AddVideoFormValues = {
  url: string;
  subcategoryId?: string;
};

export default function AddVideoPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { t } = useTranslation();

  const { data: categories = [] } = useQuery<CategoryWithSubcategories[]>({
    queryKey: ["/api/categories"],
  });

  const addVideoSchema = z.object({
    url: z
      .string()
      .min(1, "Введите URL")
      .refine(
        (url) => url.includes("youtube.com") || url.includes("youtu.be"),
        "Введите корректный URL YouTube"
      ),
    subcategoryId: z.string().optional(),
  });

  const form = useForm<AddVideoFormValues>({
    resolver: zodResolver(addVideoSchema),
    defaultValues: {
      url: "",
      subcategoryId: undefined,
    },
  });

  const addVideoMutation = useMutation({
    mutationFn: async (data: AddVideoFormValues) => {
      try {
        const payload: { url: string; subcategoryId?: string } = { url: data.url };
        if (data.subcategoryId) {
          payload.subcategoryId = data.subcategoryId;
        }
        const response = await apiRequest("POST", "/api/videos", payload);
        return response.json();
      } catch (error) {
        // Use structured error handling
        let errorMessage = "Не удалось добавить видео";

        if (error instanceof ApiError) {
          errorMessage = error.getMessage();
        } else if (error instanceof Error) {
          errorMessage = error.message;
        }

        throw new Error(errorMessage);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
      toast({
        title: "Видео добавлено",
        description: "Видео успешно добавлено в очередь",
      });
      navigate("/");
    },
    onError: (error) => {
      const errorMessage =
        error instanceof ApiError
          ? error.getMessage()
          : error instanceof Error
            ? error.message
            : "Не удалось добавить видео";
      // Show error in form field
      form.setError("url", { message: errorMessage });
      // Also show toast notification for better visibility
      toast({
        title: "Ошибка",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: AddVideoFormValues) => {
    addVideoMutation.mutate(values);
  };

  return (
    <div className="flex flex-1 flex-col">
      <Header title={t("addVideo.title")} />
      <PageContainer>
        <div className="mx-auto max-w-md">
          <Card>
            <CardHeader>
              <CardTitle className="text-heading-2">Добавить видео</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>URL YouTube</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="https://youtube.com/watch?v=..."
                            {...field}
                            data-testid="input-video-url"
                            autoComplete="url"
                            autoFocus
                            disabled={addVideoMutation.isPending}
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
                          <FormLabel>Подкатегория</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  type="button"
                                  variant="outline"
                                  role="combobox"
                                  className={cn(
                                    "w-full justify-between text-left font-normal text-sm h-[var(--input-height)]",
                                    !selectedId && "text-muted-foreground"
                                  )}
                                  data-testid="button-subcategory-select"
                                  name="subcategoryId"
                                  disabled={addVideoMutation.isPending}
                                >
                                  {selectedId && selectedCategoryName
                                    ? `${selectedCategoryName} / ${selectedSubcategoryName}`
                                    : "Выберите подкатегорию"}
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
                                    Нет доступных подкатегорий
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
                                          const checkboxId = `subcategory-add-${sub.id}`;
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
                                                  field.onChange(
                                                    sub.id === selectedId ? "" : sub.id
                                                  );
                                                }}
                                              />
                                              <label
                                                htmlFor={checkboxId}
                                                className="flex-1 text-sm cursor-pointer"
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
                          <FormDescription className="text-xs text-muted-foreground">
                            Опционально. Выберите подкатегорию для видео
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
                        Добавление...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4" />
                        Добавить
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
