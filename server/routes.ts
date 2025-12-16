import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { Readable } from "stream";
import {
  insertVideoSchema,
  insertChannelSchema,
  insertTranslationSchema,
  insertDefaultLanguageSchema,
  insertActivityLogSchema,
  insertCategorySchema,
  insertSubcategorySchema,
  type Settings,
} from "@shared/schema";
import { 
  extractYouTubeVideoId, 
  fetchYouTubeVideoMetadata,
  extractYouTubeChannelIdentifier,
  fetchYouTubeChannelMetadata,
} from "./youtube";
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
      let parsed = insertVideoSchema.parse(req.body);
      
      // Auto-fetch metadata if title or thumbnailUrl is missing
      const needsMetadata = !parsed.title || !parsed.thumbnailUrl;
      if (needsMetadata) {
        const videoId = extractYouTubeVideoId(parsed.url);
        if (videoId) {
          // Try to get YouTube API key
          const allSettings = await storage.getSettings();
          const apiKeySetting = allSettings.find((s) => s.key === "youtubeApiKey");
          const apiKey = apiKeySetting?.value as string | undefined;
          
          if (apiKey) {
            const metadata = await fetchYouTubeVideoMetadata(videoId, apiKey);
            if (metadata) {
              // Fill in missing fields
              if (!parsed.title) {
                parsed = { ...parsed, title: metadata.title };
              }
              if (!parsed.thumbnailUrl) {
                parsed = { ...parsed, thumbnailUrl: metadata.thumbnailUrl };
              }
            } else {
              // Fallback to default thumbnail URL if API call failed
              if (!parsed.thumbnailUrl) {
                parsed = { ...parsed, thumbnailUrl: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` };
              }
            }
          } else {
            // No API key, use default thumbnail
            if (!parsed.thumbnailUrl) {
              parsed = { ...parsed, thumbnailUrl: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` };
            }
          }
        }
      }
      
      // subcategoryId is already included in parsed (insertVideoSchema handles it)
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
      const subcategoryId = typeof req.query.subcategoryId === "string" ? req.query.subcategoryId : undefined;
      const language = typeof req.query.language === "string" ? req.query.language : undefined;
      const channels = await storage.getChannels({ subcategoryId, language });
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

  app.get("/api/channels/:id/subcategories", async (req, res) => {
    try {
      const subcategories = await storage.getChannelSubcategories(req.params.id);
      res.json(subcategories);
    } catch (error) {
      console.error("Error fetching channel subcategories:", error);
      res.status(500).json({ error: "Failed to fetch channel subcategories" });
    }
  });

  app.post("/api/channels", async (req, res) => {
    try {
      // Extract and validate URL first
      const bodyUrl = typeof req.body?.url === "string" ? req.body.url : null;
      if (!bodyUrl) {
        return res.status(400).json({ error: "URL is required" });
      }
      
      // Extract name from body (if provided) - handle both string and undefined
      let channelName: string | undefined = undefined;
      if (req.body?.name !== undefined && req.body?.name !== null) {
        if (typeof req.body.name === "string" && req.body.name.trim() !== "") {
          channelName = req.body.name.trim();
        }
      }
      
      // Auto-fetch channel name if missing
      if (!channelName) {
        const channelIdentifier = extractYouTubeChannelIdentifier(bodyUrl);
        
        if (channelIdentifier) {
          // Try to get YouTube API key
          const allSettings = await storage.getSettings();
          const apiKeySetting = allSettings.find((s) => s.key === "youtubeApiKey");
          const apiKey = apiKeySetting?.value as string | undefined;
          
          if (apiKey) {
            const metadata = await fetchYouTubeChannelMetadata(channelIdentifier, apiKey);
            if (metadata && metadata.name) {
              channelName = metadata.name;
            }
          }
        }
        
        // Fallback: if name is still missing, use a default based on URL
        if (!channelName) {
          try {
            const url = new URL(bodyUrl);
            const pathParts = url.pathname.split("/").filter(Boolean);
            const lastPart = pathParts[pathParts.length - 1];
            channelName = lastPart || "Unnamed Channel";
          } catch (urlError) {
            channelName = "Unnamed Channel";
          }
        }
      }
      
      // Explicitly build data object without spreading req.body to avoid any array issues
      const dataForValidation: any = {
        url: bodyUrl,
        name: channelName, // Always a non-empty string at this point
      };
      
      // Add optional fields only if they exist and are valid
      if (req.body?.defaultLanguage && typeof req.body.defaultLanguage === "string") {
        dataForValidation.defaultLanguage = req.body.defaultLanguage;
      }
      if (req.body?.voiceOverName && typeof req.body.voiceOverName === "string") {
        dataForValidation.voiceOverName = req.body.voiceOverName;
      }
      if (req.body?.voiceOverGender && typeof req.body.voiceOverGender === "string") {
        dataForValidation.voiceOverGender = req.body.voiceOverGender;
      }
      if (req.body?.niche && typeof req.body.niche === "string") {
        dataForValidation.niche = req.body.niche;
      }
      
      // Parse with full schema
      const parsed = insertChannelSchema.parse(dataForValidation);
      
      // Extract subcategoryIds if provided
      const subcategoryIds = Array.isArray(req.body?.subcategoryIds) 
        ? req.body.subcategoryIds.filter((id: unknown) => typeof id === "string")
        : undefined;
      
      const channel = await storage.createChannel(parsed, subcategoryIds);
      
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
      const scheduledDateExplicitlyCleared = "scheduledDate" in body && (body as any).scheduledDate === null;
      if ("scheduledDate" in body) body.scheduledDate = coerceDateField(body.scheduledDate);
      if ("publishedDate" in body) body.publishedDate = coerceDateField(body.publishedDate);
      let parsed = insertTranslationSchema.partial().parse(body) as any;
      const oldTranslation = await storage.getTranslation(req.params.id);

      // If user provides translatedUrl, it means the video is already published.
      // Auto-fix status. For scheduled publications: keep scheduledDate and don't set publishedDate yet.
      const hasTranslatedUrl = typeof parsed.translatedUrl === "string" && parsed.translatedUrl.length > 0;
      if (hasTranslatedUrl) {
        const effectiveScheduled =
          (scheduledDateExplicitlyCleared ? undefined : (parsed.scheduledDate as Date | null | undefined)) ??
          (oldTranslation?.scheduledDate ? new Date(oldTranslation.scheduledDate) : undefined);
        const now = new Date();
        const scheduledInFuture = Boolean(effectiveScheduled && effectiveScheduled.getTime() > now.getTime());

        parsed = {
          ...parsed,
          status: "completed",
          // Preserve explicitly provided publishedDate, otherwise fill it when it's actually published.
          publishedDate: parsed.publishedDate || oldTranslation?.publishedDate || (scheduledInFuture ? null : now),
          // If it is scheduled in the future, keep schedule so it appears in "План".
          scheduledDate: scheduledInFuture ? (effectiveScheduled as Date) : null,
        };
      }

      // If a translation is marked completed, automatically set published time once.
      if (
        parsed.status === "completed" &&
        oldTranslation?.status !== "completed" &&
        !oldTranslation?.publishedDate &&
        // Don't auto-mark published if it is explicitly scheduled in the future.
        !(
          parsed.scheduledDate &&
          parsed.scheduledDate instanceof Date &&
          parsed.scheduledDate.getTime() > Date.now()
        )
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
          // Don't auto-archive if any translation is scheduled (e.g. prepared but planned to publish later).
          // scheduledDate being set means it should still appear in "План" and not be moved to history yet.
          const allCompletedAndNotScheduled =
            video.translations.length > 0 &&
            video.translations.every((t) => t.status === "completed" && (t.scheduledDate === null || t.scheduledDate === undefined));
          if (allCompletedAndNotScheduled) {
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

  // Categories
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  });

  app.get("/api/categories/stats", async (req, res) => {
    try {
      const stats = await storage.getCategoryStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching category stats:", error);
      res.status(500).json({ error: "Failed to fetch category stats" });
    }
  });

  app.get("/api/categories/:id", async (req, res) => {
    try {
      const category = await storage.getCategory(req.params.id);
      if (!category) {
        return res.status(404).json({ error: "Category not found" });
      }
      res.json(category);
    } catch (error) {
      console.error("Error fetching category:", error);
      res.status(500).json({ error: "Failed to fetch category" });
    }
  });

  app.post("/api/categories", async (req, res) => {
    try {
      const parsed = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(parsed);
      
      await storage.createActivityLog({
        eventType: "category_added",
        description: `Категория добавлена: "${category.name}"`,
        metadata: { categoryId: category.id },
      });
      
      res.status(201).json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error creating category:", error);
      res.status(500).json({ error: "Failed to create category" });
    }
  });

  app.patch("/api/categories/:id", async (req, res) => {
    try {
      const parsed = insertCategorySchema.partial().parse(req.body);
      const category = await storage.updateCategory(req.params.id, parsed);
      if (!category) {
        return res.status(404).json({ error: "Category not found" });
      }
      
      await storage.createActivityLog({
        eventType: "category_updated",
        description: `Категория обновлена: "${category.name}"`,
        metadata: { categoryId: category.id },
      });
      
      res.json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error updating category:", error);
      res.status(500).json({ error: "Failed to update category" });
    }
  });

  app.delete("/api/categories/:id", async (req, res) => {
    try {
      const category = await storage.getCategory(req.params.id);
      const deleted = await storage.deleteCategory(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Category not found" });
      }
      
      if (category) {
        await storage.createActivityLog({
          eventType: "category_deleted",
          description: `Категория удалена: "${category.name}"`,
          metadata: { categoryId: req.params.id },
        });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting category:", error);
      res.status(500).json({ error: "Failed to delete category" });
    }
  });

  // Subcategories
  app.get("/api/subcategories", async (req, res) => {
    try {
      const categoryId = typeof req.query.categoryId === "string" ? req.query.categoryId : undefined;
      const subcategories = await storage.getSubcategories(categoryId);
      res.json(subcategories);
    } catch (error) {
      console.error("Error fetching subcategories:", error);
      res.status(500).json({ error: "Failed to fetch subcategories" });
    }
  });

  app.get("/api/subcategories/:id", async (req, res) => {
    try {
      const subcategory = await storage.getSubcategory(req.params.id);
      if (!subcategory) {
        return res.status(404).json({ error: "Subcategory not found" });
      }
      res.json(subcategory);
    } catch (error) {
      console.error("Error fetching subcategory:", error);
      res.status(500).json({ error: "Failed to fetch subcategory" });
    }
  });

  app.post("/api/subcategories", async (req, res) => {
    try {
      const parsed = insertSubcategorySchema.parse(req.body);
      const subcategory = await storage.createSubcategory(parsed);
      
      await storage.createActivityLog({
        eventType: "subcategory_added",
        description: `Подкатегория добавлена: "${subcategory.name}"`,
        metadata: { subcategoryId: subcategory.id, categoryId: subcategory.categoryId },
      });
      
      res.status(201).json(subcategory);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error creating subcategory:", error);
      res.status(500).json({ error: "Failed to create subcategory" });
    }
  });

  app.patch("/api/subcategories/:id", async (req, res) => {
    try {
      const parsed = insertSubcategorySchema.partial().parse(req.body);
      const subcategory = await storage.updateSubcategory(req.params.id, parsed);
      if (!subcategory) {
        return res.status(404).json({ error: "Subcategory not found" });
      }
      
      await storage.createActivityLog({
        eventType: "subcategory_updated",
        description: `Подкатегория обновлена: "${subcategory.name}"`,
        metadata: { subcategoryId: subcategory.id },
      });
      
      res.json(subcategory);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error updating subcategory:", error);
      res.status(500).json({ error: "Failed to update subcategory" });
    }
  });

  app.delete("/api/subcategories/:id", async (req, res) => {
    try {
      const subcategory = await storage.getSubcategory(req.params.id);
      const deleted = await storage.deleteSubcategory(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Subcategory not found" });
      }
      
      if (subcategory) {
        await storage.createActivityLog({
          eventType: "subcategory_deleted",
          description: `Подкатегория удалена: "${subcategory.name}"`,
          metadata: { subcategoryId: req.params.id },
        });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting subcategory:", error);
      res.status(500).json({ error: "Failed to delete subcategory" });
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
        description: "Настройки обновлены",
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

      const metadata = await fetchYouTubeVideoMetadata(videoId, apiKey);
      if (!metadata) {
        return res.status(404).json({ error: "Video not found or failed to fetch metadata" });
      }

      res.json(metadata);
    } catch (error) {
      console.error("Error fetching YouTube video info:", error);
      res.status(500).json({ error: "Failed to fetch video info" });
    }
  });

  // Download best available YouTube thumbnail (maxres -> sd -> hq -> mq)
  app.get("/api/youtube/thumbnail", async (req, res) => {
    try {
      const { videoId } = req.query;
      if (!videoId || typeof videoId !== "string") {
        return res.status(400).json({ error: "videoId is required" });
      }

      const candidates = [
        `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
        `https://img.youtube.com/vi/${videoId}/sddefault.jpg`,
        `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
        `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
      ];

      let found: Response | null = null;
      for (const url of candidates) {
        const r = await fetch(url);
        if (r.ok) {
          found = r;
          break;
        }
      }

      if (!found) {
        return res.status(404).json({ error: "Thumbnail not found" });
      }

      const contentType = found.headers.get("content-type") || "image/jpeg";
      res.setHeader("Content-Type", contentType);
      res.setHeader("Content-Disposition", `attachment; filename="thumbnail_${videoId}.jpg"`);
      res.setHeader("Cache-Control", "public, max-age=3600");

      if (!found.body) {
        const buf = Buffer.from(await found.arrayBuffer());
        return res.status(200).send(buf);
      }

      const nodeStream = Readable.fromWeb(found.body as any);
      nodeStream.on("error", () => res.end());
      nodeStream.pipe(res);
    } catch (error) {
      console.error("Error downloading thumbnail:", error);
      res.status(500).json({ error: "Failed to download thumbnail" });
    }
  });

  // Search
  app.get("/api/search", async (req, res) => {
    try {
      const query = typeof req.query.q === "string" ? req.query.q : "";
      if (!query || query.trim().length === 0) {
        return res.json({ videos: [], channels: [] });
      }
      const results = await storage.search(query);
      res.json(results);
    } catch (error) {
      console.error("Error searching:", error);
      res.status(500).json({ error: "Failed to search" });
    }
  });

  return httpServer;
}
