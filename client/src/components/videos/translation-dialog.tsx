import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { fromZonedTime, toZonedTime } from "date-fns-tz";
import { ru } from "date-fns/locale";
import { CalendarIcon, Clock } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import type { Channel, Translation } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

const translationFormSchema = z.object({
  translatedUrl: z.string().url("Введите корректный URL").optional().or(z.literal("")),
  publishMode: z.enum(["published", "scheduled"]),
  channelId: z.string().optional(),
  voiceOverName: z.string().optional(),
  voiceOverGender: z.enum(["male", "female"]).optional(),
  scheduledDate: z.date().optional(),
  scheduledTime: z.string().optional(),
  status: z.enum(["not_started", "in_progress", "completed"]),
});

type TranslationFormValues = z.infer<typeof translationFormSchema>;
const MOSCOW_TZ = "Europe/Moscow";

interface TranslationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  translation: Translation | null;
  language: string;
  videoTitle?: string;
  videoSubcategoryId?: string;
  onSave: (data: TranslationFormValues) => void;
  isLoading?: boolean;
}

export function TranslationDialog({
  open,
  onOpenChange,
  translation,
  language,
  videoTitle,
  videoSubcategoryId,
  onSave,
  isLoading,
}: TranslationDialogProps) {
  // Fetch channels with filtering by subcategory and language
  const { data: channels = [] } = useQuery<Channel[]>({
    queryKey: ["/api/channels", videoSubcategoryId, language],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (videoSubcategoryId) {
        params.append("subcategoryId", videoSubcategoryId);
      }
      if (language) {
        params.append("language", language);
      }
      const response = await apiRequest("GET", `/api/channels?${params.toString()}`);
      return response.json();
    },
    enabled: open, // Only fetch when dialog is open
  });
  const getTimeFromDate = (date: Date | null | undefined): string => {
    if (!date) return "";
    const d = toZonedTime(new Date(date), MOSCOW_TZ);
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  };

  const form = useForm<TranslationFormValues>({
    resolver: zodResolver(translationFormSchema),
    defaultValues: {
      translatedUrl: translation?.translatedUrl || "",
      publishMode:
        translation?.scheduledDate && new Date(translation.scheduledDate).getTime() > Date.now()
          ? "scheduled"
          : "published",
      channelId: translation?.channelId || "",
      voiceOverName: translation?.voiceOverName || "",
      voiceOverGender: (translation?.voiceOverGender as "male" | "female") || undefined,
      scheduledDate: translation?.scheduledDate ? new Date(translation.scheduledDate) : undefined,
      scheduledTime: getTimeFromDate(translation?.scheduledDate),
      status: (translation?.status as "not_started" | "in_progress" | "completed") || "not_started",
    },
  });

  const [userModifiedVoiceGender, setUserModifiedVoiceGender] = useState(false);
  const [userModifiedVoiceName, setUserModifiedVoiceName] = useState(false);

  useEffect(() => {
    if (open) {
      setUserModifiedVoiceGender(false);
      setUserModifiedVoiceName(false);
      form.reset({
        translatedUrl: translation?.translatedUrl || "",
        publishMode:
          translation?.scheduledDate && new Date(translation.scheduledDate).getTime() > Date.now()
            ? "scheduled"
            : "published",
        channelId: translation?.channelId || "",
        voiceOverName: translation?.voiceOverName || "",
        voiceOverGender: (translation?.voiceOverGender as "male" | "female") || undefined,
        scheduledDate: translation?.scheduledDate ? new Date(translation.scheduledDate) : undefined,
        scheduledTime: getTimeFromDate(translation?.scheduledDate),
        status: (translation?.status as "not_started" | "in_progress" | "completed") || "not_started",
      });
    }
  }, [open, translation]);

  const watchedChannelId = form.watch("channelId");
  const [lastAppliedChannel, setLastAppliedChannel] = useState<string | null>(null);

  useEffect(() => {
    if (watchedChannelId && watchedChannelId !== lastAppliedChannel) {
      const selectedChannel = channels.find(c => c.id === watchedChannelId);
      if (selectedChannel) {
        if (selectedChannel.voiceOverName) {
          form.setValue("voiceOverName", selectedChannel.voiceOverName);
        }
        if (selectedChannel.voiceOverGender) {
          form.setValue("voiceOverGender", selectedChannel.voiceOverGender as "male" | "female");
        }
        setLastAppliedChannel(watchedChannelId);
        setUserModifiedVoiceName(false);
        setUserModifiedVoiceGender(false);
      }
    }
  }, [watchedChannelId, channels, lastAppliedChannel]);

  const handleSubmit = (values: TranslationFormValues) => {
    let finalScheduledDate: Date | null | undefined = values.scheduledDate;

    if (values.publishMode === "published") {
      // Explicitly clear schedule so backend doesn't keep an old future scheduledDate
      finalScheduledDate = null;
    } else {
      const hasScheduleInput = Boolean(values.scheduledDate) || Boolean(values.scheduledTime);
      const baseMsk = values.scheduledDate
        ? toZonedTime(values.scheduledDate, MOSCOW_TZ)
        : toZonedTime(new Date(), MOSCOW_TZ);

      const timeStr = values.scheduledTime || getTimeFromDate(new Date());
      if (!hasScheduleInput) {
        // If user enabled scheduling but didn't pick anything, default to "now" in MSK
        finalScheduledDate = fromZonedTime(baseMsk, MOSCOW_TZ);
      } else {
        const [hours, minutes] = timeStr.split(":").map(Number);
        const mskLocal = new Date(baseMsk);
        mskLocal.setHours(hours, minutes, 0, 0);
        finalScheduledDate = fromZonedTime(mskLocal, MOSCOW_TZ);
      }
    }

    const { scheduledTime, publishMode, ...rest } = values;
    onSave({ ...rest, scheduledDate: finalScheduledDate } as any);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" data-testid="dialog-translation">
        <DialogHeader>
          <DialogTitle data-testid="text-dialog-title">
            Обновить детали перевода
          </DialogTitle>
          <DialogDescription data-testid="text-dialog-description">
            {videoTitle ? `Обновите данные перевода для "${videoTitle}" (${language})` : `Обновите данные перевода (${language})`}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Статус</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-status">
                        <SelectValue placeholder="Выберите статус" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="not_started">Не начато</SelectItem>
                      <SelectItem value="in_progress">В работе</SelectItem>
                      <SelectItem value="completed">Готово</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="translatedUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL переведённого видео</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://youtube.com/watch?v=..."
                      {...field}
                      data-testid="input-translated-url"
                      autoComplete="url"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="publishMode"
              render={({ field }) => {
                const isScheduled = field.value === "scheduled";
                return (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel className="mb-0">Запланировать публикацию</FormLabel>
                      <p className="text-xs text-muted-foreground">
                        Если выключено — считаем, что уже опубликовано (дата/время скрыты)
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={isScheduled}
                        onCheckedChange={(checked) => {
                          const next = checked ? "scheduled" : "published";
                          field.onChange(next);
                          if (next === "published") {
                            form.setValue("scheduledDate", undefined);
                            form.setValue("scheduledTime", "");
                          } else {
                            if (!form.getValues("scheduledDate")) {
                              form.setValue("scheduledDate", new Date());
                            }
                            if (!form.getValues("scheduledTime")) {
                              form.setValue("scheduledTime", getTimeFromDate(new Date()));
                            }
                          }
                        }}
                        data-testid="switch-publish-mode"
                      />
                    </FormControl>
                  </FormItem>
                );
              }}
            />
            <FormField
              control={form.control}
              name="channelId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Канал публикации</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-channel">
                        <SelectValue placeholder="Выберите канал" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {channels.length === 0 ? (
                        <div className="py-6 text-center text-sm text-muted-foreground">
                          <p className="mb-2 font-medium">Нет подходящих каналов</p>
                          <p className="text-xs">
                            {videoSubcategoryId
                              ? `Для подкатегории этого видео не найдено каналов с подходящим языком (${language})`
                              : `Не найдено каналов для языка ${language}`}
                          </p>
                        </div>
                      ) : (
                        channels.map((channel) => (
                          <SelectItem key={channel.id} value={channel.id}>
                            {channel.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {videoSubcategoryId && (
                    <p className="text-xs text-muted-foreground">
                      Показаны только каналы, подходящие для подкатегории видео и языка {language}
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="voiceOverName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Имя озвучки</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Актёр озвучки" 
                        {...field} 
                        onChange={(e) => {
                          setUserModifiedVoiceName(true);
                          field.onChange(e);
                        }}
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
                    <FormLabel>Пол озвучки</FormLabel>
                    <Select 
                      onValueChange={(value) => {
                        setUserModifiedVoiceGender(true);
                        field.onChange(value);
                      }} 
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-voice-gender" className="text-sm leading-snug md:text-xs">
                          <SelectValue placeholder="Выберите" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="male">Мужской</SelectItem>
                        <SelectItem value="female">Женский</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            {form.watch("publishMode") === "scheduled" && (
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="scheduledDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Дата публикации</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className="h-9 w-full justify-start text-left text-sm leading-snug font-normal md:text-xs px-3 py-2"
                              data-testid="button-schedule-date"
                            >
                              <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                              <span className={!field.value ? "text-muted-foreground" : ""}>
                                {field.value ? format(field.value, "dd.MM.yyyy", { locale: ru }) : "Выберите дату"}
                              </span>
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            locale={ru}
                            fromDate={new Date(new Date().getFullYear(), 0, 1)}
                            toDate={new Date(new Date().getFullYear(), 11, 31)}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="scheduledTime"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Время публикации</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Clock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            type="time"
                            className="pl-9"
                            step={300}
                            {...field}
                            data-testid="input-schedule-time"
                            autoComplete="off"
                            lang="ru"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                data-testid="button-cancel"
              >
                Отмена
              </Button>
              <Button type="submit" disabled={isLoading} data-testid="button-save">
                {isLoading ? "Сохранение..." : "Сохранить изменения"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
