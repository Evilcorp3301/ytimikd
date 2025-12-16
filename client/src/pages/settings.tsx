import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Settings as SettingsIcon,
  Moon,
  Sun,
  Bell,
  Youtube,
  MessageCircle,
  Save,
  Loader2,
  Eye,
  EyeOff,
  Info,
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { PageContainer } from "@/components/ui/page-container";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTheme } from "@/lib/theme-provider";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useTranslation } from "@/lib/language-provider";

const settingsFormSchema = z.object({
  youtubeApiKey: z.string().optional(),
  telegramBotToken: z.string().optional(),
  telegramChatId: z.string().optional(),
  notifyScheduleWarning: z.boolean(),
  notifyPublished: z.boolean(),
  notifyErrors: z.boolean(),
});

type SettingsFormValues = z.infer<typeof settingsFormSchema>;

interface AppSettings {
  youtubeApiKey?: string;
  telegramBotToken?: string;
  telegramChatId?: string;
  notifyScheduleWarning: boolean;
  notifyPublished: boolean;
  notifyErrors: boolean;
}

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [showApiKey, setShowApiKey] = useState(false);
  const [showBotToken, setShowBotToken] = useState(false);

  const { data: settings, isLoading } = useQuery<AppSettings>({
    queryKey: ["/api/settings"],
  });

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: {
      youtubeApiKey: "",
      telegramBotToken: "",
      telegramChatId: "",
      notifyScheduleWarning: true,
      notifyPublished: true,
      notifyErrors: true,
    },
  });

  useEffect(() => {
    if (settings) {
      form.reset({
        youtubeApiKey: settings.youtubeApiKey || "",
        telegramBotToken: settings.telegramBotToken || "",
        telegramChatId: settings.telegramChatId || "",
        notifyScheduleWarning: settings.notifyScheduleWarning ?? true,
        notifyPublished: settings.notifyPublished ?? true,
        notifyErrors: settings.notifyErrors ?? true,
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
      toast({
        title: t("common.error"),
        description: error instanceof Error ? error.message : "Не удалось сохранить настройки",
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
                <CardTitle className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <Sun className="h-5 w-5" />
                  {t("settings.appearance")}
                </CardTitle>
                <CardDescription>
                  {t("settings.appearanceDescription")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>{t("settings.theme")}</Label>
                    <p className="text-xs text-muted-foreground">
                      {t("settings.themeDescription")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant={theme === "light" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setTheme("light")}
                      className="gap-2"
                      data-testid="button-theme-light"
                    >
                      <Sun className="h-4 w-4" />
                      {t("settings.light")}
                    </Button>
                    <Button
                      type="button"
                      variant={theme === "dark" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setTheme("dark")}
                      className="gap-2"
                      data-testid="button-theme-dark"
                    >
                      <Moon className="h-4 w-4" />
                      {t("settings.dark")}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Accordion type="single" collapsible className="space-y-4">
              <AccordionItem value="youtube" className="border rounded-lg px-4">
                <AccordionTrigger className="py-4" data-testid="accordion-youtube">
                  <div className="flex items-center gap-3">
                    <Youtube className="h-5 w-5 text-red-500" />
                    <div className="text-left">
                      <p className="font-medium">{t("settings.youtubeIntegration")}</p>
                      <p className="text-xs text-muted-foreground font-normal">
                        {t("settings.youtubeIntegrationDescription")}
                      </p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-4">
                  <div className="space-y-4">
                    <div className="rounded-lg bg-muted p-4 text-xs">
                      <div className="flex items-start gap-2">
                        <Info className="h-4 w-4 mt-0.5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Как получить YouTube API ключ:</p>
                          <ol className="mt-2 list-decimal list-inside space-y-1 text-muted-foreground">
                            <li>Откройте Google Cloud Console</li>
                            <li>Создайте новый проект или выберите существующий</li>
                            <li>Включите YouTube Data API v3</li>
                            <li>Создайте учётные данные (API key)</li>
                            <li>Скопируйте ключ и вставьте ниже</li>
                          </ol>
                        </div>
                      </div>
                    </div>
                    <FormField
                      control={form.control}
                      name="youtubeApiKey"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("settings.youtubeApiKey")}</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                type={showApiKey ? "text" : "password"}
                                placeholder={t("settings.youtubeApiKeyPlaceholder")}
                                {...field}
                                data-testid="input-youtube-api-key"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-0 top-0"
                                onClick={() => setShowApiKey(!showApiKey)}
                              >
                                {showApiKey ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="telegram" className="border rounded-lg px-4">
                <AccordionTrigger className="py-4" data-testid="accordion-telegram">
                  <div className="flex items-center gap-3">
                    <MessageCircle className="h-5 w-5 text-blue-500" />
                    <div className="text-left">
                      <p className="font-medium">{t("settings.telegramIntegration")}</p>
                      <p className="text-xs text-muted-foreground font-normal">
                        {t("settings.telegramIntegrationDescription")}
                      </p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-4">
                  <div className="space-y-4">
                    <div className="rounded-lg bg-muted p-4 text-xs">
                      <div className="flex items-start gap-2">
                        <Info className="h-4 w-4 mt-0.5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Как настроить уведомления в Telegram:</p>
                          <ol className="mt-2 list-decimal list-inside space-y-1 text-muted-foreground">
                            <li>Напишите @BotFather в Telegram</li>
                            <li>Создайте бота командой /newbot</li>
                            <li>Скопируйте токен бота и вставьте ниже</li>
                            <li>Откройте чат со своим ботом</li>
                            <li>Узнайте chat_id через @userinfobot (или любым способом)</li>
                          </ol>
                        </div>
                      </div>
                    </div>
                    <FormField
                      control={form.control}
                      name="telegramBotToken"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("settings.telegramBotToken")}</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                type={showBotToken ? "text" : "password"}
                                placeholder={t("settings.telegramBotTokenPlaceholder")}
                                {...field}
                                data-testid="input-telegram-token"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-0 top-0"
                                onClick={() => setShowBotToken(!showBotToken)}
                              >
                                {showBotToken ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="telegramChatId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("settings.telegramChatId")}</FormLabel>
                          <FormControl>
                            <Input
                              placeholder={t("settings.telegramChatIdPlaceholder")}
                              {...field}
                              data-testid="input-telegram-chat-id"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            <Card>
              <CardHeader>
                <CardTitle className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <Bell className="h-5 w-5" />
                  {t("settings.notifications")}
                </CardTitle>
                <CardDescription>
                  {t("settings.notificationsDescription")}
                </CardDescription>
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
                        <FormDescription>
                          {t("settings.errorAlertsDescription")}
                        </FormDescription>
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
