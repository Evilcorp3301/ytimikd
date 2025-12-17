import { eq, desc, asc, isNotNull, sql, and, inArray, or, like, ilike } from "drizzle-orm";
import { db } from "./db";
import {
  videos,
  channels,
  translations,
  defaultLanguages,
  activityLogs,
  settings,
  categories,
  subcategories,
  channelSubcategories,
  type Video,
  type Channel,
  type Translation,
  type DefaultLanguage,
  type ActivityLog,
  type Settings,
  type Category,
  type Subcategory,
  type InsertVideo,
  type InsertChannel,
  type InsertTranslation,
  type InsertDefaultLanguage,
  type InsertActivityLog,
  type InsertCategory,
  type InsertSubcategory,
  type VideoWithTranslations,
  type TranslationWithDetails,
  type CategoryWithSubcategories,
  type SubcategoryWithCategory,
} from "@shared/schema";
import type { IStorage } from "./storage";

export class DatabaseStorage implements IStorage {
  // Videos
  async getVideos(): Promise<VideoWithTranslations[]> {
    const result = await db.query.videos.findMany({
      with: { 
        translations: true,
        subcategory: {
          with: {
            category: true,
          },
        },
      },
      orderBy: [desc(videos.createdAt)],
    });
    return result;
  }

  async getVideo(id: string): Promise<VideoWithTranslations | undefined> {
    const result = await db.query.videos.findFirst({
      where: eq(videos.id, id),
      with: { 
        translations: true,
        subcategory: {
          with: {
            category: true,
          },
        },
      },
    });
    return result;
  }

  async createVideo(video: InsertVideo): Promise<Video> {
    const [result] = await db.insert(videos).values(video).returning();
    return result;
  }

  async updateVideo(id: string, video: Partial<InsertVideo>): Promise<Video | undefined> {
    const [result] = await db.update(videos).set(video).where(eq(videos.id, id)).returning();
    return result;
  }

  async deleteVideo(id: string): Promise<boolean> {
    const result = await db.delete(videos).where(eq(videos.id, id)).returning();
    return result.length > 0;
  }

  async archiveVideo(id: string, reason: "auto" | "manual" = "manual"): Promise<Video | undefined> {
    const [result] = await db
      .update(videos)
      .set({ isArchived: true, archivedAt: new Date(), archivedReason: reason })
      .where(eq(videos.id, id))
      .returning();
    return result;
  }

  // Channels
  async getChannels(filters?: { subcategoryId?: string; language?: string }): Promise<Channel[]> {
    if (filters?.subcategoryId) {
      // Filter by subcategory using join
      const conditions = [eq(channelSubcategories.subcategoryId, filters.subcategoryId)];
      if (filters.language) {
        conditions.push(eq(channels.defaultLanguage, filters.language));
      }
      const whereClause = conditions.length > 1 ? and(...conditions) : conditions[0];
      const channelsWithSubcategory = await db
        .selectDistinct({ channel: channels })
        .from(channels)
        .innerJoin(channelSubcategories, eq(channels.id, channelSubcategories.channelId))
        .where(whereClause)
        .orderBy(desc(channels.createdAt));
      return channelsWithSubcategory.map((c) => c.channel);
    }
    
    if (filters?.language) {
      return db.query.channels.findMany({
        where: eq(channels.defaultLanguage, filters.language),
        orderBy: [desc(channels.createdAt)],
      });
    }
    
    return db.query.channels.findMany({
      orderBy: [desc(channels.createdAt)],
    });
  }

  async getChannel(id: string): Promise<Channel | undefined> {
    return db.query.channels.findFirst({
      where: eq(channels.id, id),
    });
  }

  async createChannel(channel: InsertChannel, subcategoryIds?: string[]): Promise<Channel> {
    const [result] = await db.insert(channels).values(channel).returning();
    
    if (subcategoryIds && subcategoryIds.length > 0) {
      await this.setChannelSubcategories(result.id, subcategoryIds);
    }
    
    return result;
  }

  async updateChannel(id: string, channel: Partial<InsertChannel>, subcategoryIds?: string[]): Promise<Channel | undefined> {
    const [result] = await db.update(channels).set(channel).where(eq(channels.id, id)).returning();
    
    if (result && subcategoryIds !== undefined) {
      await this.setChannelSubcategories(id, subcategoryIds);
    }
    
    return result;
  }

  async deleteChannel(id: string): Promise<boolean> {
    const result = await db.delete(channels).where(eq(channels.id, id)).returning();
    return result.length > 0;
  }

  // Translations
  async getTranslations(filters?: { archived?: boolean; scheduled?: boolean }): Promise<TranslationWithDetails[]> {
    const result = await db.query.translations.findMany({
      with: { 
        video: {
          with: {
            subcategory: {
              with: {
                category: true,
              },
            },
          },
        }, 
        channel: true 
      },
      orderBy: [desc(translations.createdAt)],
    });

    let filtered = result;

    if (filters?.archived) {
      filtered = filtered.filter((t) => t.video?.isArchived === true);
    } else if (filters?.archived === false) {
      filtered = filtered.filter((t) => t.video?.isArchived === false);
    }

    if (filters?.scheduled) {
      filtered = filtered.filter((t) => t.scheduledDate !== null);
    }

    return filtered;
  }

  async getTranslation(id: string): Promise<TranslationWithDetails | undefined> {
    const result = await db.query.translations.findFirst({
      where: eq(translations.id, id),
      with: { 
        video: {
          with: {
            subcategory: {
              with: {
                category: true,
              },
            },
          },
        }, 
        channel: true 
      },
    });
    return result;
  }

  async createTranslation(translation: InsertTranslation): Promise<Translation> {
    const [result] = await db.insert(translations).values(translation).returning();
    return result;
  }

  async updateTranslation(id: string, translation: Partial<InsertTranslation>): Promise<Translation | undefined> {
    const [result] = await db.update(translations).set(translation).where(eq(translations.id, id)).returning();
    return result;
  }

  async deleteTranslation(id: string): Promise<boolean> {
    const result = await db.delete(translations).where(eq(translations.id, id)).returning();
    return result.length > 0;
  }

  // Default Languages
  async getDefaultLanguages(): Promise<DefaultLanguage[]> {
    return db.query.defaultLanguages.findMany({
      orderBy: [defaultLanguages.sortOrder],
    });
  }

  async getDefaultLanguage(id: string): Promise<DefaultLanguage | undefined> {
    return db.query.defaultLanguages.findFirst({
      where: eq(defaultLanguages.id, id),
    });
  }

  async createDefaultLanguage(language: InsertDefaultLanguage): Promise<DefaultLanguage> {
    const [result] = await db.insert(defaultLanguages).values(language).returning();
    return result;
  }

  async updateDefaultLanguage(
    id: string,
    language: Partial<InsertDefaultLanguage>,
  ): Promise<DefaultLanguage | undefined> {
    const [result] = await db
      .update(defaultLanguages)
      .set(language)
      .where(eq(defaultLanguages.id, id))
      .returning();
    return result;
  }

  async deleteDefaultLanguage(id: string): Promise<boolean> {
    const result = await db.delete(defaultLanguages).where(eq(defaultLanguages.id, id)).returning();
    return result.length > 0;
  }

  async reorderLanguages(orderedIds: string[]): Promise<void> {
    for (let i = 0; i < orderedIds.length; i++) {
      await db.update(defaultLanguages).set({ sortOrder: i }).where(eq(defaultLanguages.id, orderedIds[i]));
    }
  }

  // Activity Logs
  async getActivityLogs(limit = 100, filters?: { startDate?: Date; endDate?: Date }): Promise<ActivityLog[]> {
    const conditions = [];
    
    if (filters?.startDate) {
      conditions.push(sql`${activityLogs.createdAt} >= ${filters.startDate}`);
    }
    if (filters?.endDate) {
      // Add one day to endDate to include the entire end date
      const endDatePlusOne = new Date(filters.endDate);
      endDatePlusOne.setDate(endDatePlusOne.getDate() + 1);
      conditions.push(sql`${activityLogs.createdAt} < ${endDatePlusOne}`);
    }
    
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    
    return db.query.activityLogs.findMany({
      where: whereClause,
      orderBy: [desc(activityLogs.createdAt)],
      limit,
    });
  }

  async createActivityLog(log: InsertActivityLog): Promise<ActivityLog> {
    const [result] = await db.insert(activityLogs).values(log).returning();
    return result;
  }

  async deleteActivityLogs(filters?: { startDate?: Date; endDate?: Date }): Promise<number> {
    const conditions = [];
    
    if (filters?.startDate) {
      conditions.push(sql`${activityLogs.createdAt} >= ${filters.startDate}`);
    }
    if (filters?.endDate) {
      // Add one day to endDate to include the entire end date
      const endDatePlusOne = new Date(filters.endDate);
      endDatePlusOne.setDate(endDatePlusOne.getDate() + 1);
      conditions.push(sql`${activityLogs.createdAt} < ${endDatePlusOne}`);
    }
    
    // If no filters, delete all logs
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    
    const result = await db.delete(activityLogs).where(whereClause || sql`1=1`).returning();
    return result.length;
  }

  // Settings
  async getSettings(): Promise<Settings[]> {
    return db.query.settings.findMany();
  }

  async getSetting(key: string): Promise<Settings | undefined> {
    return db.query.settings.findFirst({
      where: eq(settings.key, key),
    });
  }

  async upsertSetting(key: string, value: unknown): Promise<Settings> {
    const existing = await this.getSetting(key);
    if (existing) {
      const [result] = await db
        .update(settings)
        .set({ value, updatedAt: new Date() })
        .where(eq(settings.key, key))
        .returning();
      return result;
    }
    const [result] = await db.insert(settings).values({ key, value }).returning();
    return result;
  }

  // Statistics
  async getStatistics(): Promise<{
    totalVideos: number;
    completedTranslations: number;
    inProgressTranslations: number;
    scheduledCount: number;
    channelCount: number;
    languageCount: number;
  }> {
    const [videoCount] = await db.select({ count: sql<number>`count(*)` }).from(videos);
    const [completedCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(translations)
      .where(eq(translations.status, "completed"));
    const [inProgressCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(translations)
      .where(eq(translations.status, "in_progress"));
    const [scheduledCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(translations)
      .where(isNotNull(translations.scheduledDate));
    const [channelCountResult] = await db.select({ count: sql<number>`count(*)` }).from(channels);
    const [languageCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(defaultLanguages)
      .where(eq(defaultLanguages.isActive, true));

    return {
      totalVideos: Number(videoCount.count),
      completedTranslations: Number(completedCount.count),
      inProgressTranslations: Number(inProgressCount.count),
      scheduledCount: Number(scheduledCount.count),
      channelCount: Number(channelCountResult.count),
      languageCount: Number(languageCount.count),
    };
  }

  // Categories
  async getCategories(): Promise<CategoryWithSubcategories[]> {
    return db.query.categories.findMany({
      with: { subcategories: true },
      orderBy: [categories.sortOrder, desc(categories.createdAt)],
    });
  }

  async getCategory(id: string): Promise<CategoryWithSubcategories | undefined> {
    return db.query.categories.findFirst({
      where: eq(categories.id, id),
      with: { subcategories: true },
    });
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [result] = await db.insert(categories).values(category).returning();
    return result;
  }

  async updateCategory(id: string, category: Partial<InsertCategory>): Promise<Category | undefined> {
    const [result] = await db.update(categories).set(category).where(eq(categories.id, id)).returning();
    return result;
  }

  async deleteCategory(id: string): Promise<boolean> {
    const result = await db.delete(categories).where(eq(categories.id, id)).returning();
    return result.length > 0;
  }

  // Subcategories
  async getSubcategories(categoryId?: string): Promise<SubcategoryWithCategory[]> {
    if (categoryId) {
      // When filtering by categoryId, sort alphabetically for better UX in selection lists
      const result = await db.query.subcategories.findMany({
        where: eq(subcategories.categoryId, categoryId),
        with: { category: true },
        orderBy: [subcategories.sortOrder, desc(subcategories.createdAt)],
      });
      // Sort by name alphabetically
      return result.sort((a, b) => a.name.localeCompare(b.name, "ru"));
    }
    return db.query.subcategories.findMany({
      with: { category: true },
      orderBy: [subcategories.sortOrder, desc(subcategories.createdAt)],
    });
  }

  async getSubcategory(id: string): Promise<SubcategoryWithCategory | undefined> {
    return db.query.subcategories.findFirst({
      where: eq(subcategories.id, id),
      with: { category: true },
    });
  }

  async createSubcategory(subcategory: InsertSubcategory): Promise<Subcategory> {
    const [result] = await db.insert(subcategories).values(subcategory).returning();
    return result;
  }

  async updateSubcategory(id: string, subcategory: Partial<InsertSubcategory>): Promise<Subcategory | undefined> {
    const [result] = await db.update(subcategories).set(subcategory).where(eq(subcategories.id, id)).returning();
    return result;
  }

  async deleteSubcategory(id: string): Promise<boolean> {
    const result = await db.delete(subcategories).where(eq(subcategories.id, id)).returning();
    return result.length > 0;
  }

  // Channel Subcategories (many-to-many)
  async getChannelSubcategories(channelId: string): Promise<Subcategory[]> {
    const result = await db
      .select({ subcategory: subcategories })
      .from(channelSubcategories)
      .innerJoin(subcategories, eq(channelSubcategories.subcategoryId, subcategories.id))
      .where(eq(channelSubcategories.channelId, channelId));
    return result.map((r) => r.subcategory);
  }

  async setChannelSubcategories(channelId: string, subcategoryIds: string[]): Promise<void> {
    // Delete existing relations
    await db.delete(channelSubcategories).where(eq(channelSubcategories.channelId, channelId));
    
    // Insert new relations
    if (subcategoryIds.length > 0) {
      await db.insert(channelSubcategories).values(
        subcategoryIds.map((subId) => ({
          channelId,
          subcategoryId: subId,
        }))
      );
    }
  }

  // Search
  async search(query: string): Promise<{
    videos: VideoWithTranslations[];
    channels: Channel[];
  }> {
    if (!query || query.trim().length === 0) {
      return { videos: [], channels: [] };
    }

    const searchPattern = `%${query.trim()}%`;

    // Search videos using SQL template with relations
    // We need to use a manual query for complex WHERE conditions
    const videoConditions = or(
      sql`${videos.url} ILIKE ${searchPattern}`,
      sql`${videos.id}::text ILIKE ${searchPattern}`,
      sql`COALESCE(${videos.title}, '') ILIKE ${searchPattern}`
    );

    // Get matching video IDs first
    const matchingVideoIds = await db
      .select({ id: videos.id })
      .from(videos)
      .where(videoConditions)
      .limit(20)
      .orderBy(desc(videos.createdAt));

    const videoIds = matchingVideoIds.map((v) => v.id);

    // Then fetch full video data with relations
    const videoResults = videoIds.length > 0
      ? await db.query.videos.findMany({
          where: inArray(videos.id, videoIds),
          with: {
            translations: true,
            subcategory: {
              with: {
                category: true,
              },
            },
          },
          orderBy: [desc(videos.createdAt)],
        })
      : [];

    // Search channels using SQL template
    const channelConditions = or(
      sql`${channels.url} ILIKE ${searchPattern}`,
      sql`${channels.id}::text ILIKE ${searchPattern}`,
      sql`COALESCE(${channels.name}, '') ILIKE ${searchPattern}`
    );

    // Get matching channel IDs first
    const matchingChannelIds = await db
      .select({ id: channels.id })
      .from(channels)
      .where(channelConditions)
      .limit(20)
      .orderBy(desc(channels.createdAt));

    const channelIds = matchingChannelIds.map((c) => c.id);

    // Then fetch full channel data
    const channelResults = channelIds.length > 0
      ? await db.query.channels.findMany({
          where: inArray(channels.id, channelIds),
          orderBy: [desc(channels.createdAt)],
        })
      : [];

    return {
      videos: videoResults,
      channels: channelResults,
    };
  }

  // Category Statistics
  async getCategoryStats(): Promise<Record<string, { videosCount: number; channelsCount: number }>> {
    // Get all categories
    const allCategories = await db.query.categories.findMany();
    const stats: Record<string, { videosCount: number; channelsCount: number }> = {};

    for (const category of allCategories) {
      // Get all subcategories for this category
      const categorySubcategories = await db.query.subcategories.findMany({
        where: eq(subcategories.categoryId, category.id),
      });
      const subcategoryIds = categorySubcategories.map((s) => s.id);

      if (subcategoryIds.length === 0) {
        stats[category.id] = { videosCount: 0, channelsCount: 0 };
        continue;
      }

      // Count videos with these subcategories
      const [videoCountResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(videos)
        .where(inArray(videos.subcategoryId, subcategoryIds));

      // Count channels with these subcategories (via channel_subcategories)
      const [channelCountResult] = await db
        .select({ count: sql<number>`count(distinct ${channelSubcategories.channelId})` })
        .from(channelSubcategories)
        .where(inArray(channelSubcategories.subcategoryId, subcategoryIds));

      stats[category.id] = {
        videosCount: Number(videoCountResult.count),
        channelsCount: Number(channelCountResult.count),
      };
    }

    return stats;
  }
}


