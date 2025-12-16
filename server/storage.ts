import { eq, desc, and, isNotNull, sql } from "drizzle-orm";
import { db } from "./db";
import {
  videos,
  channels,
  translations,
  defaultLanguages,
  activityLogs,
  settings,
  type Video,
  type Channel,
  type Translation,
  type DefaultLanguage,
  type ActivityLog,
  type Settings,
  type InsertVideo,
  type InsertChannel,
  type InsertTranslation,
  type InsertDefaultLanguage,
  type InsertActivityLog,
  type InsertSettings,
  type VideoWithTranslations,
  type TranslationWithDetails,
} from "@shared/schema";

export interface IStorage {
  // Videos
  getVideos(): Promise<VideoWithTranslations[]>;
  getVideo(id: string): Promise<VideoWithTranslations | undefined>;
  createVideo(video: InsertVideo): Promise<Video>;
  updateVideo(id: string, video: Partial<InsertVideo>): Promise<Video | undefined>;
  deleteVideo(id: string): Promise<boolean>;
  archiveVideo(id: string, reason?: "auto" | "manual"): Promise<Video | undefined>;

  // Channels
  getChannels(): Promise<Channel[]>;
  getChannel(id: string): Promise<Channel | undefined>;
  createChannel(channel: InsertChannel): Promise<Channel>;
  updateChannel(id: string, channel: Partial<InsertChannel>): Promise<Channel | undefined>;
  deleteChannel(id: string): Promise<boolean>;

  // Translations
  getTranslations(filters?: { archived?: boolean; scheduled?: boolean }): Promise<TranslationWithDetails[]>;
  getTranslation(id: string): Promise<TranslationWithDetails | undefined>;
  createTranslation(translation: InsertTranslation): Promise<Translation>;
  updateTranslation(id: string, translation: Partial<InsertTranslation>): Promise<Translation | undefined>;
  deleteTranslation(id: string): Promise<boolean>;

  // Default Languages
  getDefaultLanguages(): Promise<DefaultLanguage[]>;
  getDefaultLanguage(id: string): Promise<DefaultLanguage | undefined>;
  createDefaultLanguage(language: InsertDefaultLanguage): Promise<DefaultLanguage>;
  updateDefaultLanguage(id: string, language: Partial<InsertDefaultLanguage>): Promise<DefaultLanguage | undefined>;
  deleteDefaultLanguage(id: string): Promise<boolean>;
  reorderLanguages(orderedIds: string[]): Promise<void>;

  // Activity Logs
  getActivityLogs(limit?: number): Promise<ActivityLog[]>;
  createActivityLog(log: InsertActivityLog): Promise<ActivityLog>;

  // Settings
  getSettings(): Promise<Settings[]>;
  getSetting(key: string): Promise<Settings | undefined>;
  upsertSetting(key: string, value: unknown): Promise<Settings>;

  // Statistics
  getStatistics(): Promise<{
    totalVideos: number;
    completedTranslations: number;
    inProgressTranslations: number;
    scheduledCount: number;
    channelCount: number;
    languageCount: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // Videos
  async getVideos(): Promise<VideoWithTranslations[]> {
    const result = await db.query.videos.findMany({
      with: { translations: true },
      orderBy: [desc(videos.createdAt)],
    });
    return result;
  }

  async getVideo(id: string): Promise<VideoWithTranslations | undefined> {
    const result = await db.query.videos.findFirst({
      where: eq(videos.id, id),
      with: { translations: true },
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
  async getChannels(): Promise<Channel[]> {
    return db.query.channels.findMany({
      orderBy: [desc(channels.createdAt)],
    });
  }

  async getChannel(id: string): Promise<Channel | undefined> {
    return db.query.channels.findFirst({
      where: eq(channels.id, id),
    });
  }

  async createChannel(channel: InsertChannel): Promise<Channel> {
    const [result] = await db.insert(channels).values(channel).returning();
    return result;
  }

  async updateChannel(id: string, channel: Partial<InsertChannel>): Promise<Channel | undefined> {
    const [result] = await db.update(channels).set(channel).where(eq(channels.id, id)).returning();
    return result;
  }

  async deleteChannel(id: string): Promise<boolean> {
    const result = await db.delete(channels).where(eq(channels.id, id)).returning();
    return result.length > 0;
  }

  // Translations
  async getTranslations(filters?: { archived?: boolean; scheduled?: boolean }): Promise<TranslationWithDetails[]> {
    const result = await db.query.translations.findMany({
      with: { video: true, channel: true },
      orderBy: [desc(translations.createdAt)],
    });

    let filtered = result;
    
    if (filters?.archived) {
      filtered = filtered.filter(t => t.video?.isArchived === true);
    } else if (filters?.archived === false) {
      filtered = filtered.filter(t => t.video?.isArchived === false);
    }
    
    if (filters?.scheduled) {
      filtered = filtered.filter(t => t.scheduledDate !== null);
    }

    return filtered;
  }

  async getTranslation(id: string): Promise<TranslationWithDetails | undefined> {
    const result = await db.query.translations.findFirst({
      where: eq(translations.id, id),
      with: { video: true, channel: true },
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

  async updateDefaultLanguage(id: string, language: Partial<InsertDefaultLanguage>): Promise<DefaultLanguage | undefined> {
    const [result] = await db.update(defaultLanguages).set(language).where(eq(defaultLanguages.id, id)).returning();
    return result;
  }

  async deleteDefaultLanguage(id: string): Promise<boolean> {
    const result = await db.delete(defaultLanguages).where(eq(defaultLanguages.id, id)).returning();
    return result.length > 0;
  }

  async reorderLanguages(orderedIds: string[]): Promise<void> {
    for (let i = 0; i < orderedIds.length; i++) {
      await db.update(defaultLanguages)
        .set({ sortOrder: i })
        .where(eq(defaultLanguages.id, orderedIds[i]));
    }
  }

  // Activity Logs
  async getActivityLogs(limit = 100): Promise<ActivityLog[]> {
    return db.query.activityLogs.findMany({
      orderBy: [desc(activityLogs.createdAt)],
      limit,
    });
  }

  async createActivityLog(log: InsertActivityLog): Promise<ActivityLog> {
    const [result] = await db.insert(activityLogs).values(log).returning();
    return result;
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
}

export const storage = new DatabaseStorage();
