import { useMutation } from "@tanstack/react-query";
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
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useTranslation } from "@/lib/language-provider";

type AddVideoFormValues = {
  url: string;
};

export default function AddVideoPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { t } = useTranslation();

  const addVideoSchema = z.object({
    url: z.string().min(1, "Введите URL").refine(
      (url) => url.includes("youtube.com") || url.includes("youtu.be"),
      "Введите корректный URL YouTube"
    ),
  });

  const form = useForm<AddVideoFormValues>({
    resolver: zodResolver(addVideoSchema),
    defaultValues: {
      url: "",
    },
  });

  const addVideoMutation = useMutation({
    mutationFn: async (data: AddVideoFormValues) => {
      const response = await apiRequest("POST", "/api/videos", data);
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: "Ошибка сервера" }));
        throw new Error(error.error || "Не удалось добавить видео");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
      toast({
        title: "Видео добавлено",
      });
      navigate("/");
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : "Не удалось добавить видео";
      form.setError("url", { message: errorMessage });
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
              <CardTitle className="text-heading-2">
                Добавить видео
              </CardTitle>
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
