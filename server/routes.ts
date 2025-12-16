import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  insertVideoSchema,
  insertChannelSchema,
  insertTranslationSchema,
  insertDefaultLanguageSchema,
  insertActivityLogSchema,
  type Settings,
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  const coerceDateField = (value: unknown): Date | undefined => {
    if (!value) return undefined;
    if (value instanceof Date) return value;
    if (typeof value === "string" || typeof value === "number") {
      const d = new Date(value);
      return Number.isNaN(d.getTime()) ? undefined : d;
    }
    return undefined;
  };

  // Videos
  app.get("/api/videos", async (req, res) => {
    try {
      const videos = await storage.getVideos();
      res.json(videos);
    } catch (error) {
      console.error("Error fetching videos:", error);
      res.status(500).json({ error: "Failed to fetch videos" });
    }
  });

  app.get("/api/videos/:id", async (req, res) => {
    try {
      const video = await storage.getVideo(req.params.id);
      if (!video) {
        return res.status(404).json({ error: "Video not found" });
      }
      res.json(video);
    } catch (error) {
      console.error("Error fetching video:", error);
      res.status(500).json({ error: "Failed to fetch video" });
    }
  });

  app.post("/api/videos", async (req, res) => {
    try {
      const parsed = insertVideoSchema.parse(req.body);
      const video = await storage.createVideo(parsed);
      
      await storage.createActivityLog({
        eventType: "video_added",
        description: `Видео добавлено: "${video.title || video.url}"`,
        metadata: { videoId: video.id },
      });
      
      // Auto-assign translations from active languages
      const allLanguages = await storage.getDefaultLanguages();
      const activeLanguages = allLanguages.filter(lang => lang.isActive);
      
      for (const language of activeLanguages) {
        await storage.createTranslation({
          videoId: video.id,
          language: language.code,
          status: "not_started",
        });
      }
      
      // Return video with translations
      const videoWithTranslations = await storage.getVideo(video.id);
      res.status(201).json(videoWithTranslations || video);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error creating video:", error);
      res.status(500).json({ error: "Failed to create video" });
    }
  });

  app.patch("/api/videos/:id", async (req, res) => {
    try {
      const parsed = insertVideoSchema.partial().parse(req.body);
      const video = await storage.updateVideo(req.params.id, parsed);
      if (!video) {
        return res.status(404).json({ error: "Video not found" });
      }
      res.json(video);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error updating video:", error);
      res.status(500).json({ error: "Failed to update video" });
    }
  });

  app.post("/api/videos/:id/archive", async (req, res) => {
    try {
      const reasonRaw = (req.body as any)?.reason;
      const reason: "auto" | "manual" = reasonRaw === "auto" ? "auto" : "manual";
      const video = await storage.archiveVideo(req.params.id, reason);
      if (!video) {
        return res.status(404).json({ error: "Video not found" });
      }
      
      await storage.createActivityLog({
        eventType: "video_archived",
        description:
          reason === "auto"
            ? `Видео перенесено в историю (перевод завершён): "${video.title || video.url}"`
            : `Видео архивировано вручную: "${video.title || video.url}"`,
        metadata: { videoId: video.id, reason },
      });
      
      res.json(video);
    } catch (error) {
      console.error("Error archiving video:", error);
      res.status(500).json({ error: "Failed to archive video" });
    }
  });

  app.delete("/api/videos/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteVideo(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Video not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting video:", error);
      res.status(500).json({ error: "Failed to delete video" });
    }
  });

  // Channels
  app.get("/api/channels", async (req, res) => {
    try {
      const channels = await storage.getChannels();
      res.json(channels);
    } catch (error) {
      console.error("Error fetching channels:", error);
      res.status(500).json({ error: "Failed to fetch channels" });
    }
  });

  app.get("/api/channels/:id", async (req, res) => {
    try {
      const channel = await storage.getChannel(req.params.id);
      if (!channel) {
        return res.status(404).json({ error: "Channel not found" });
      }
      res.json(channel);
    } catch (error) {
      console.error("Error fetching channel:", error);
      res.status(500).json({ error: "Failed to fetch channel" });
    }
  });

  app.post("/api/channels", async (req, res) => {
    try {
      const parsed = insertChannelSchema.parse(req.body);
      const channel = await storage.createChannel(parsed);
      
      await storage.createActivityLog({
        eventType: "channel_added",
        description: `Канал добавлен: "${channel.name}"`,
        metadata: { channelId: channel.id },
      });
      
      res.status(201).json(channel);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error creating channel:", error);
      res.status(500).json({ error: "Failed to create channel" });
    }
  });

  app.patch("/api/channels/:id", async (req, res) => {
    try {
      const parsed = insertChannelSchema.partial().parse(req.body);
      const channel = await storage.updateChannel(req.params.id, parsed);
      if (!channel) {
        return res.status(404).json({ error: "Channel not found" });
      }
      
      await storage.createActivityLog({
        eventType: "channel_updated",
        description: `Канал обновлён: "${channel.name}"`,
        metadata: { channelId: channel.id },
      });
      
      res.json(channel);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error updating channel:", error);
      res.status(500).json({ error: "Failed to update channel" });
    }
  });

  app.delete("/api/channels/:id", async (req, res) => {
    try {
      const channel = await storage.getChannel(req.params.id);
      const deleted = await storage.deleteChannel(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Channel not found" });
      }
      
      if (channel) {
        await storage.createActivityLog({
          eventType: "channel_deleted",
          description: `Канал удалён: "${channel.name}"`,
          metadata: { channelId: req.params.id },
        });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting channel:", error);
      res.status(500).json({ error: "Failed to delete channel" });
    }
  });

  // Translations
  app.get("/api/translations", async (req, res) => {
    try {
      const archived = req.query.archived === "true";
      const scheduled = req.query.scheduled === "true";
      const translations = await storage.getTranslations({ archived, scheduled });
      res.json(translations);
    } catch (error) {
      console.error("Error fetching translations:", error);
      res.status(500).json({ error: "Failed to fetch translations" });
    }
  });

  app.get("/api/translations/:id", async (req, res) => {
    try {
      const translation = await storage.getTranslation(req.params.id);
      if (!translation) {
        return res.status(404).json({ error: "Translation not found" });
      }
      res.json(translation);
    } catch (error) {
      console.error("Error fetching translation:", error);
      res.status(500).json({ error: "Failed to fetch translation" });
    }
  });

  app.post("/api/translations", async (req, res) => {
    try {
      const body = { ...(req.body as Record<string, unknown>) };
      if ("scheduledDate" in body) body.scheduledDate = coerceDateField(body.scheduledDate);
      if ("publishedDate" in body) body.publishedDate = coerceDateField(body.publishedDate);
      const parsed = insertTranslationSchema.parse(body);
      const translation = await storage.createTranslation(parsed);
      
      await storage.createActivityLog({
        eventType: "translation_started",
        description: `Перевод начат: ${translation.language}`,
        metadata: { translationId: translation.id, videoId: translation.videoId },
      });
      
      res.status(201).json(translation);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error creating translation:", error);
      res.status(500).json({ error: "Failed to create translation" });
    }
  });

  app.patch("/api/translations/:id", async (req, res) => {
    try {
      const body = { ...(req.body as Record<string, unknown>) };
      if ("scheduledDate" in body) body.scheduledDate = coerceDateField(body.scheduledDate);
      if ("publishedDate" in body) body.publishedDate = coerceDateField(body.publishedDate);
      let parsed = insertTranslationSchema.partial().parse(body);
      const oldTranslation = await storage.getTranslation(req.params.id);

      // If a translation is marked completed, automatically set published time once.
      if (
        parsed.status === "completed" &&
        oldTranslation?.status !== "completed" &&
        !oldTranslation?.publishedDate
      ) {
        parsed = { ...parsed, publishedDate: new Date() };
      }

      const translation = await storage.updateTranslation(req.params.id, parsed);
      if (!translation) {
        return res.status(404).json({ error: "Translation not found" });
      }
      
      if (parsed.status === "completed" && oldTranslation?.status !== "completed") {
        await storage.createActivityLog({
          eventType: "translation_completed",
          description: `Перевод завершён: ${translation.language}`,
          metadata: { translationId: translation.id, videoId: translation.videoId },
        });

        // If all translations for the video are completed, move the video out of the queue automatically.
        const video = await storage.getVideo(translation.videoId);
        if (video && !video.isArchived) {
          const allCompleted = video.translations.length > 0 && video.translations.every((t) => t.status === "completed");
          if (allCompleted) {
            const archived = await storage.archiveVideo(video.id, "auto");
            if (archived) {
              await storage.createActivityLog({
                eventType: "video_archived",
                description: `Видео перенесено в историю (все переводы завершены): "${archived.title || archived.url}"`,
                metadata: { videoId: archived.id, reason: "auto" },
              });
            }
          }
        }
      }
      
      if (parsed.scheduledDate && !oldTranslation?.scheduledDate) {
        await storage.createActivityLog({
          eventType: "schedule_created",
          description: `Запланирована публикация (${translation.language})`,
          metadata: { translationId: translation.id, scheduledDate: parsed.scheduledDate },
        });
      } else if (parsed.scheduledDate && oldTranslation?.scheduledDate) {
        await storage.createActivityLog({
          eventType: "schedule_updated",
          description: `Расписание обновлено (${translation.language})`,
          metadata: { translationId: translation.id, scheduledDate: parsed.scheduledDate },
        });
      }
      
      res.json(translation);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error updating translation:", error);
      res.status(500).json({ error: "Failed to update translation" });
    }
  });

  app.delete("/api/translations/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteTranslation(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Translation not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting translation:", error);
      res.status(500).json({ error: "Failed to delete translation" });
    }
  });

  // Default Languages
  app.get("/api/languages", async (req, res) => {
    try {
      const languages = await storage.getDefaultLanguages();
      res.json(languages);
    } catch (error) {
      console.error("Error fetching languages:", error);
      res.status(500).json({ error: "Failed to fetch languages" });
    }
  });

  app.post("/api/languages", async (req, res) => {
    try {
      const parsed = insertDefaultLanguageSchema.parse(req.body);
      const language = await storage.createDefaultLanguage(parsed);
      
      await storage.createActivityLog({
        eventType: "language_added",
        description: `Язык добавлен: "${language.name}"`,
        metadata: { languageId: language.id, code: language.code },
      });
      
      res.status(201).json(language);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error creating language:", error);
      res.status(500).json({ error: "Failed to create language" });
    }
  });

  app.patch("/api/languages/:id", async (req, res) => {
    try {
      const parsed = insertDefaultLanguageSchema.partial().parse(req.body);
      const language = await storage.updateDefaultLanguage(req.params.id, parsed);
      if (!language) {
        return res.status(404).json({ error: "Language not found" });
      }
      res.json(language);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error updating language:", error);
      res.status(500).json({ error: "Failed to update language" });
    }
  });

  app.delete("/api/languages/:id", async (req, res) => {
    try {
      const language = await storage.getDefaultLanguage(req.params.id);
      const deleted = await storage.deleteDefaultLanguage(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Language not found" });
      }
      
      if (language) {
        await storage.createActivityLog({
          eventType: "language_removed",
          description: `Язык удалён: "${language.name}"`,
          metadata: { languageId: req.params.id, code: language.code },
        });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting language:", error);
      res.status(500).json({ error: "Failed to delete language" });
    }
  });

  app.put("/api/languages/reorder", async (req, res) => {
    try {
      const { orderedIds } = req.body as { orderedIds: string[] };
      if (!orderedIds || !Array.isArray(orderedIds)) {
        return res.status(400).json({ error: "orderedIds array is required" });
      }
      await storage.reorderLanguages(orderedIds);
      const languages = await storage.getDefaultLanguages();
      res.json(languages);
    } catch (error) {
      console.error("Error reordering languages:", error);
      res.status(500).json({ error: "Failed to reorder languages" });
    }
  });

  // Activity Logs
  app.get("/api/activity-logs", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      const logs = await storage.getActivityLogs(limit);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching activity logs:", error);
      res.status(500).json({ error: "Failed to fetch activity logs" });
    }
  });

  // Settings
  app.get("/api/settings", async (req, res) => {
    try {
      const allSettings = await storage.getSettings();
      const settingsObj: Record<string, unknown> = {};
      allSettings.forEach((s) => {
        settingsObj[s.key] = s.value;
      });
      res.json(settingsObj);
    } catch (error) {
      console.error("Error fetching settings:", error);
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });

  app.put("/api/settings", async (req, res) => {
    try {
      const updates = req.body as Record<string, unknown>;
      const results: Settings[] = [];
      
      for (const [key, value] of Object.entries(updates)) {
        const setting = await storage.upsertSetting(key, value);
        results.push(setting);
      }
      
      await storage.createActivityLog({
        eventType: "settings_updated",
        description: "Settings were updated",
        metadata: { keys: Object.keys(updates) },
      });
      
      const settingsObj: Record<string, unknown> = {};
      results.forEach((s) => {
        settingsObj[s.key] = s.value;
      });
      res.json(settingsObj);
    } catch (error) {
      console.error("Error updating settings:", error);
      res.status(500).json({ error: "Failed to update settings" });
    }
  });

  // Statistics
  app.get("/api/statistics", async (req, res) => {
    try {
      const stats = await storage.getStatistics();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching statistics:", error);
      res.status(500).json({ error: "Failed to fetch statistics" });
    }
  });

  // YouTube video info
  app.get("/api/youtube/video-info", async (req, res) => {
    try {
      const { videoId } = req.query;
      if (!videoId || typeof videoId !== "string") {
        return res.status(400).json({ error: "videoId is required" });
      }

      const allSettings = await storage.getSettings();
      const apiKeySetting = allSettings.find((s) => s.key === "youtubeApiKey");
      const apiKey = apiKeySetting?.value as string;

      if (!apiKey) {
        return res.status(400).json({ error: "YouTube API key not configured" });
      }

      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=snippet&key=${apiKey}`
      );

      if (!response.ok) {
        return res.status(response.status).json({ error: "Failed to fetch from YouTube API" });
      }

      const data = await response.json();
      if (!data.items || data.items.length === 0) {
        return res.status(404).json({ error: "Video not found" });
      }

      const video = data.items[0];
      res.json({
        title: video.snippet.title,
        thumbnailUrl: video.snippet.thumbnails?.medium?.url || video.snippet.thumbnails?.default?.url,
      });
    } catch (error) {
      console.error("Error fetching YouTube video info:", error);
      res.status(500).json({ error: "Failed to fetch video info" });
    }
  });

  return httpServer;
}
