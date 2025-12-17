import type {
  Video,
  Channel,
  Translation,
  DefaultLanguage,
  ActivityLog,
  Settings,
  Category,
  Subcategory,
  InsertVideo,
  InsertChannel,
  InsertTranslation,
  InsertDefaultLanguage,
  InsertActivityLog,
  InsertSettings,
  InsertCategory,
  InsertSubcategory,
  VideoWithTranslations,
  TranslationWithDetails,
  CategoryWithSubcategories,
  SubcategoryWithCategory,
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
  getChannels(filters?: { subcategoryId?: string; language?: string }): Promise<Channel[]>;
  getChannel(id: string): Promise<Channel | undefined>;
  createChannel(channel: InsertChannel, subcategoryIds?: string[]): Promise<Channel>;
  updateChannel(id: string, channel: Partial<InsertChannel>, subcategoryIds?: string[]): Promise<Channel | undefined>;
  deleteChannel(id: string): Promise<boolean>;

  // Translations
  getTranslations(filters?: { archived?: boolean; scheduled?: boolean; channelId?: string }): Promise<TranslationWithDetails[]>;
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
  getActivityLogs(limit?: number, filters?: { startDate?: Date; endDate?: Date }): Promise<ActivityLog[]>;
  createActivityLog(log: InsertActivityLog): Promise<ActivityLog>;
  deleteActivityLogs(filters?: { startDate?: Date; endDate?: Date }): Promise<number>;

  // Settings
  getSettings(): Promise<Settings[]>;
  getSetting(key: string): Promise<Settings | undefined>;
  upsertSetting(key: string, value: unknown): Promise<Settings>;

  // Categories
  getCategories(): Promise<CategoryWithSubcategories[]>;
  getCategory(id: string): Promise<CategoryWithSubcategories | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: string, category: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: string): Promise<boolean>;

  // Search
  search(query: string): Promise<{
    videos: VideoWithTranslations[];
    channels: Channel[];
  }>;

  // Subcategories
  getSubcategories(categoryId?: string): Promise<SubcategoryWithCategory[]>;
  getSubcategory(id: string): Promise<SubcategoryWithCategory | undefined>;
  createSubcategory(subcategory: InsertSubcategory): Promise<Subcategory>;
  updateSubcategory(id: string, subcategory: Partial<InsertSubcategory>): Promise<Subcategory | undefined>;
  deleteSubcategory(id: string): Promise<boolean>;

  // Channel Subcategories (many-to-many)
  getChannelSubcategories(channelId: string): Promise<Subcategory[]>;
  setChannelSubcategories(channelId: string, subcategoryIds: string[]): Promise<void>;

  // Statistics
  getStatistics(): Promise<{
    totalVideos: number;
    completedVideos: number;
    completedTranslations: number;
    inProgressTranslations: number;
    scheduledCount: number;
    channelCount: number;
    languageCount: number;
  }>;
  getCategoryStats(): Promise<Record<string, { videosCount: number; channelsCount: number }>>;
}

// Database is required for this application
if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.trim().length) {
  throw new Error(
    "DATABASE_URL environment variable is required. Please set it in your .env file."
  );
}

import { DatabaseStorage } from "./storage.database";
console.log(
  `${new Date().toISOString()} [storage] Using DatabaseStorage (DATABASE_URL present, length=${process.env.DATABASE_URL!.length})`,
);

export const storage: IStorage = new DatabaseStorage();
