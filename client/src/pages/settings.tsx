import { useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Save, Loader2 } from "lucide-react";
import { Header } from "@/components/layout/header";
import { PageContainer } from "@/components/ui/page-container";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { ApiError } from "@/lib/api-error";
import { useTranslation } from "@/lib/language-provider";

const settingsFormSchema = z.object({
  // Notification settings (reserved for future use)
  notifyScheduleWarning: z.boolean().optional(),
  notifyPublished: z.boolean().optional(),
  notifyErrors: z.boolean().optional(),
});

type SettingsFormValues = z.infer<typeof settingsFormSchema>;

interface AppSettings {
  notifyScheduleWarning?: boolean;
  notifyPublished?: boolean;
  notifyErrors?: boolean;
}

export default function SettingsPage() {
  const { toast } = useToast();
  const { t } = useTranslation();

  const { data: settings } = useQuery<AppSettings>({
    queryKey: ["/api/settings"],
  });

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: {
      notifyScheduleWarning: false,
      notifyPublished: false,
      notifyErrors: false,
    },
  });

  useEffect(() => {
    if (settings) {
      form.reset({
        notifyScheduleWarning: settings.notifyScheduleWarning ?? false,
        notifyPublished: settings.notifyPublished ?? false,
        notifyErrors: settings.notifyErrors ?? false,
      });
    }
  }, [settings, form]);

  const saveMutation = useMutation({
    mutationFn: async (data: SettingsFormValues) => {
      const response = await apiRequest("PUT", "/api/settings", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({
        title: t("settings.settingsSaved"),
        description: t("settings.settingsSavedDescription"),
      });
    },
    onError: (error) => {
      // Use structured error handling
      let errorMessage = "Не удалось сохранить настройки";

      if (error instanceof ApiError) {
        errorMessage = error.getMessage();

        // Map common validation errors to user-friendly messages
        if (error.isValidationError()) {
          const message = error.getMessage();
          if (message.includes("Expected string")) {
            errorMessage = "Проверьте правильность введённых данных.";
          } else {
            errorMessage = "Неверные данные. Проверьте правильность заполнения полей.";
          }
        } else if (error.isServerError()) {
          errorMessage = "Ошибка сервера. Попробуйте позже.";
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      toast({
        title: t("common.error"),
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: SettingsFormValues) => {
    saveMutation.mutate(values);
  };

  return (
    <div className="flex flex-1 flex-col">
      <Header title={t("settings.title")} />
      <PageContainer>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-heading-2">{t("settings.notifications")}</CardTitle>
                <CardDescription>{t("settings.notificationsDescription")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="notifyScheduleWarning"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>{t("settings.scheduleWarnings")}</FormLabel>
                        <FormDescription>
                          {t("settings.scheduleWarningsDescription")}
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-notify-schedule"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="notifyPublished"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>{t("settings.publicationAlerts")}</FormLabel>
                        <FormDescription>
                          {t("settings.publicationAlertsDescription")}
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-notify-published"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="notifyErrors"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>{t("settings.errorAlerts")}</FormLabel>
                        <FormDescription>{t("settings.errorAlertsDescription")}</FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-notify-errors"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={saveMutation.isPending}
                className="gap-2"
                data-testid="button-save-settings"
              >
                {saveMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t("settings.saving")}
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    {t("settings.saveSettings")}
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </PageContainer>
    </div>
  );
}
