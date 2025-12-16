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
    completedTranslations: number;
    inProgressTranslations: number;
    scheduledCount: number;
    channelCount: number;
    languageCount: number;
  }>;
}

// In dev we want the app to boot even if Postgres isn't provisioned yet.
// Avoid importing db.ts unless DATABASE_URL is present (it throws otherwise).
const hasDatabaseUrl = Boolean(process.env.DATABASE_URL && process.env.DATABASE_URL.trim().length > 0);

async function createStorage(): Promise<IStorage> {
  if (hasDatabaseUrl) {
    console.log(
      `${new Date().toISOString()} [storage] Using DatabaseStorage (DATABASE_URL present, length=${process.env.DATABASE_URL!.length})`,
    );
    const mod = await import("./storage.database");
    return new mod.DatabaseStorage();
  }
  console.log(`${new Date().toISOString()} [storage] Using MemoryStorage (DATABASE_URL missing/empty)`);
  const mod = await import("./storage.memory");
  return new mod.MemoryStorage();
}

export const storage: IStorage = await createStorage();
