import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Edit2, Trash2, Tv, ExternalLink, Loader2 } from "lucide-react";
import { Header } from "@/components/layout/header";
import { PageContainer } from "@/components/ui/page-container";
import { EmptyState } from "@/components/ui/empty-state";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useTranslation } from "@/lib/language-provider";
import type { Channel, DefaultLanguage } from "@shared/schema";

type ChannelFormValues = {
  name: string;
  url: string;
  defaultLanguage?: string;
  voiceOverName?: string;
  voiceOverGender?: "male" | "female";
  niche?: string;
};

export default function ChannelsPage() {
  const { toast } = useToast();
  const { t } = useTranslation();

  const channelFormSchema = z.object({
    name: z.string().min(1, t("channels.nameRequired")),
    url: z.string().url(t("channels.invalidUrl")),
    defaultLanguage: z.string().optional(),
    voiceOverName: z.string().optional(),
    voiceOverGender: z.enum(["male", "female"]).optional(),
    niche: z.string().optional(),
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingChannel, setEditingChannel] = useState<Channel | null>(null);
  const [deleteChannelId, setDeleteChannelId] = useState<string | null>(null);

  const { data: channels = [], isLoading } = useQuery<Channel[]>({
    queryKey: ["/api/channels"],
  });

  const { data: languages = [] } = useQuery<DefaultLanguage[]>({
    queryKey: ["/api/languages"],
  });

  const form = useForm<ChannelFormValues>({
    resolver: zodResolver(channelFormSchema),
    defaultValues: {
      name: "",
      url: "",
      defaultLanguage: "",
      voiceOverName: "",
      voiceOverGender: undefined,
      niche: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: ChannelFormValues) => {
      const response = await apiRequest("POST", "/api/channels", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/channels"] });
      toast({ title: t("common.success"), description: t("channels.channelAdded") });
      handleCloseDialog();
    },
    onError: (error) => {
      toast({
        title: t("common.error"),
        description: error instanceof Error ? error.message : t("channels.createFailed"),
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: ChannelFormValues & { id: string }) => {
      const response = await apiRequest("PATCH", `/api/channels/${data.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/channels"] });
      toast({ title: t("common.success"), description: t("channels.channelUpdated") });
      handleCloseDialog();
    },
    onError: (error) => {
      toast({
        title: t("common.error"),
        description: error instanceof Error ? error.message : t("channels.updateFailed"),
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/channels/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/channels"] });
      toast({ title: t("common.success"), description: t("channels.channelRemoved") });
      setDeleteChannelId(null);
    },
    onError: (error) => {
      toast({
        title: t("common.error"),
        description: error instanceof Error ? error.message : t("channels.deleteFailed"),
        variant: "destructive",
      });
    },
  });

  const handleOpenCreate = () => {
    setEditingChannel(null);
    form.reset({
      name: "",
      url: "",
      defaultLanguage: "",
      voiceOverName: "",
      voiceOverGender: undefined,
      niche: "",
    });
    setDialogOpen(true);
  };

  const handleOpenEdit = (channel: Channel) => {
    setEditingChannel(channel);
    form.reset({
      name: channel.name,
      url: channel.url,
      defaultLanguage: channel.defaultLanguage || "",
      voiceOverName: channel.voiceOverName || "",
      voiceOverGender: (channel.voiceOverGender as "male" | "female") || undefined,
      niche: channel.niche || "",
    });
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingChannel(null);
    form.reset();
  };

  const onSubmit = (values: ChannelFormValues) => {
    if (editingChannel) {
      updateMutation.mutate({ ...values, id: editingChannel.id });
    } else {
      createMutation.mutate(values);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="flex flex-1 flex-col">
      <Header title={t("channels.title")} />
      <PageContainer>
        <div className="mb-4 md:mb-6 lg:mb-8 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs text-muted-foreground">
              {t("channels.description")}
            </p>
          </div>
          <Button onClick={handleOpenCreate} className="gap-2 w-[30%] min-w-32 sm:w-auto" data-testid="button-add-channel">
            <Plus className="h-4 w-4" />
            {t("common.add")}
          </Button>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="mt-2 h-4 w-3/4" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : channels.length === 0 ? (
          <EmptyState
            icon={Tv}
            title={t("channels.noChannels")}
            description={t("channels.noChannelsDescription")}
            action={
              <Button onClick={handleOpenCreate} className="gap-2" data-testid="button-add-first-channel">
                <Plus className="h-4 w-4" />
                {t("channels.addChannel")}
              </Button>
            }
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
            {channels.map((channel) => (
              <Card key={channel.id} data-testid={`card-channel-${channel.id}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
                        <Tv className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle data-testid="text-channel-name">
                          {channel.name}
                        </CardTitle>
                        <a
                          href={channel.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                        >
                          <ExternalLink className="h-3 w-3" />
                          {t("channels.viewChannel")}
                        </a>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenEdit(channel)}
                        data-testid="button-edit-channel"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteChannelId(channel.id)}
                        data-testid="button-delete-channel"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {channel.defaultLanguage && (
                      <Badge variant="secondary">{channel.defaultLanguage}</Badge>
                    )}
                    {channel.niche && (
                      <Badge variant="outline">{channel.niche}</Badge>
                    )}
                    {channel.voiceOverGender && (
                      <Badge variant="outline" className="capitalize">
                        {channel.voiceOverGender === "male" ? t("translation.male") : t("translation.female")}
                      </Badge>
                    )}
                  </div>
                  {channel.voiceOverName && (
                    <p className="mt-3 text-xs text-muted-foreground">
                      {t("channels.voice")}: {channel.voiceOverName}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-md" data-testid="dialog-channel">
            <DialogHeader>
              <DialogTitle>
                {editingChannel ? t("channels.editChannel") : t("channels.addChannel")}
              </DialogTitle>
              <DialogDescription>
                {editingChannel
                  ? t("channels.updateDescription")
                  : t("channels.description")}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("channels.channelName")}</FormLabel>
                      <FormControl>
                        <Input placeholder={t("channels.channelNamePlaceholder")} {...field} data-testid="input-channel-name" />
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
                      <FormLabel>{t("channels.channelUrl")}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t("channels.channelUrlPlaceholder")}
                          {...field}
                          data-testid="input-channel-url"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="defaultLanguage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("channels.defaultLanguage")}</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-default-language">
                            <SelectValue placeholder={t("channels.selectLanguage")} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {languages.map((lang) => (
                            <SelectItem key={lang.code} value={lang.code}>
                              {lang.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="niche"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("channels.nicheCategory")}</FormLabel>
                      <FormControl>
                        <Input placeholder={t("channels.nichePlaceholder")} {...field} data-testid="input-niche" />
                      </FormControl>
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
                        <FormLabel>{t("channels.voiceOverName")}</FormLabel>
                        <FormControl>
                          <Input placeholder={t("channels.voiceOverPlaceholder")} {...field} data-testid="input-voice-name" />
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
                        <FormLabel>{t("channels.voiceGender")}</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-voice-gender">
                              <SelectValue placeholder={t("channels.selectGender")} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="male">{t("translation.male")}</SelectItem>
                            <SelectItem value="female">{t("translation.female")}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={handleCloseDialog}>
                    {t("common.cancel")}
                  </Button>
                  <Button type="submit" disabled={isPending} data-testid="button-save-channel">
                    {isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t("common.loading")}
                      </>
                    ) : editingChannel ? (
                      t("common.save")
                    ) : (
                      t("channels.addChannel")
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        <AlertDialog open={!!deleteChannelId} onOpenChange={() => setDeleteChannelId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("channels.deleteChannel")}</AlertDialogTitle>
              <AlertDialogDescription>
                {t("channels.deleteConfirmation")}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteChannelId && deleteMutation.mutate(deleteChannelId)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                data-testid="button-confirm-delete"
              >
                {deleteMutation.isPending ? t("common.loading") : t("common.delete")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </PageContainer>
    </div>
  );
}
