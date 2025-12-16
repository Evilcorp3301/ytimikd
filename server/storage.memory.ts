import type { IStorage } from "./storage";
import type {
  ActivityLog,
  Channel,
  DefaultLanguage,
  Category,
  Subcategory,
  InsertActivityLog,
  InsertChannel,
  InsertDefaultLanguage,
  InsertTranslation,
  InsertVideo,
  InsertCategory,
  InsertSubcategory,
  Settings,
  Translation,
  TranslationWithDetails,
  Video,
  VideoWithTranslations,
  CategoryWithSubcategories,
  SubcategoryWithCategory,
} from "@shared/schema";

function uuid(): string {
  return crypto.randomUUID();
}

function byCreatedAtDesc<T extends { createdAt: Date }>(a: T, b: T) {
  return b.createdAt.getTime() - a.createdAt.getTime();
}

export class MemoryStorage implements IStorage {
  private videos: Video[] = [];
  private channels: Channel[] = [];
  private translations: Translation[] = [];
  private defaultLanguages: DefaultLanguage[] = [];
  private activityLogs: ActivityLog[] = [];
  private settings: Settings[] = [];
  private categories: Category[] = [];
  private subcategories: Subcategory[] = [];
  private channelSubcategories: Array<{ channelId: string; subcategoryId: string }> = [];

  // Videos
  async getVideos(): Promise<VideoWithTranslations[]> {
    const vids = [...this.videos].sort(byCreatedAtDesc);
    return vids.map((v) => ({
      ...v,
      translations: this.translations.filter((t) => t.videoId === v.id),
    }));
  }

  async getVideo(id: string): Promise<VideoWithTranslations | undefined> {
    const v = this.videos.find((x) => x.id === id);
    if (!v) return undefined;
    return { ...v, translations: this.translations.filter((t) => t.videoId === v.id) };
  }

  async createVideo(video: InsertVideo): Promise<Video> {
    const v: Video = {
      id: uuid(),
      url: video.url,
      title: video.title ?? null,
      thumbnailUrl: (video as any).thumbnailUrl ?? null,
      subcategoryId: (video as any).subcategoryId ?? null,
      createdAt: new Date(),
      isArchived: false,
      archivedAt: null,
      archivedReason: null,
    };
    this.videos.unshift(v);
    return v;
  }

  async updateVideo(id: string, video: Partial<InsertVideo>): Promise<Video | undefined> {
    const idx = this.videos.findIndex((x) => x.id === id);
    if (idx === -1) return undefined;
    const current = this.videos[idx];
    const updated: Video = {
      ...current,
      ...video,
    } as any;
    this.videos[idx] = updated;
    return updated;
  }

  async deleteVideo(id: string): Promise<boolean> {
    const before = this.videos.length;
    this.videos = this.videos.filter((v) => v.id !== id);
    // cascade delete translations
    this.translations = this.translations.filter((t) => t.videoId !== id);
    return this.videos.length !== before;
  }

  async archiveVideo(id: string, reason: "auto" | "manual" = "manual"): Promise<Video | undefined> {
    const v = await this.getVideo(id);
    if (!v) return undefined;
    const updated = await this.updateVideo(id, {
      isArchived: true as any,
      archivedAt: new Date() as any,
      archivedReason: reason as any,
    });
    return updated;
  }

  // Channels
  async getChannels(filters?: { subcategoryId?: string; language?: string }): Promise<Channel[]> {
    let result = [...this.channels].sort(byCreatedAtDesc);
    
    if (filters?.subcategoryId) {
      const channelIds = this.channelSubcategories
        .filter((cs) => cs.subcategoryId === filters.subcategoryId)
        .map((cs) => cs.channelId);
      result = result.filter((c) => channelIds.includes(c.id));
    }
    
    if (filters?.language) {
      result = result.filter((c) => c.defaultLanguage === filters.language);
    }
    
    return result;
  }

  async getChannel(id: string): Promise<Channel | undefined> {
    return this.channels.find((c) => c.id === id);
  }

  async createChannel(channel: InsertChannel, subcategoryIds?: string[]): Promise<Channel> {
    const c: Channel = {
      id: uuid(),
      name: channel.name,
      url: channel.url,
      defaultLanguage: (channel as any).defaultLanguage ?? null,
      voiceOverName: (channel as any).voiceOverName ?? null,
      voiceOverGender: (channel as any).voiceOverGender ?? null,
      niche: (channel as any).niche ?? null,
      createdAt: new Date(),
    };
    this.channels.unshift(c);
    
    if (subcategoryIds && subcategoryIds.length > 0) {
      await this.setChannelSubcategories(c.id, subcategoryIds);
    }
    
    return c;
  }

  async updateChannel(id: string, channel: Partial<InsertChannel>, subcategoryIds?: string[]): Promise<Channel | undefined> {
    const idx = this.channels.findIndex((x) => x.id === id);
    if (idx === -1) return undefined;
    const current = this.channels[idx];
    const updated: Channel = { ...current, ...channel } as any;
    this.channels[idx] = updated;
    
    if (subcategoryIds !== undefined) {
      await this.setChannelSubcategories(id, subcategoryIds);
    }
    
    return updated;
  }

  async deleteChannel(id: string): Promise<boolean> {
    const before = this.channels.length;
    this.channels = this.channels.filter((c) => c.id !== id);
    // do not cascade delete translations; keep channelId dangling like DB would allow if deleted? (DB has FK nullable)
    this.translations = this.translations.map((t) => (t.channelId === id ? ({ ...t, channelId: null } as any) : t));
    // Delete channel subcategories
    this.channelSubcategories = this.channelSubcategories.filter((cs) => cs.channelId !== id);
    return this.channels.length !== before;
  }

  // Translations
  async getTranslations(filters?: { archived?: boolean; scheduled?: boolean }): Promise<TranslationWithDetails[]> {
    const all: TranslationWithDetails[] = [...this.translations]
      .sort(byCreatedAtDesc)
      .map((t) => ({
        ...t,
        video: this.videos.find((v) => v.id === t.videoId) ?? null,
        channel: t.channelId ? this.channels.find((c) => c.id === t.channelId) ?? null : null,
      }));

    let filtered = all;
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
    const t = this.translations.find((x) => x.id === id);
    if (!t) return undefined;
    return {
      ...t,
      video: this.videos.find((v) => v.id === t.videoId) ?? null,
      channel: t.channelId ? this.channels.find((c) => c.id === t.channelId) ?? null : null,
    };
  }

  async createTranslation(translation: InsertTranslation): Promise<Translation> {
    const t: Translation = {
      id: uuid(),
      videoId: translation.videoId,
      language: translation.language,
      status: (translation as any).status ?? "not_started",
      translatedUrl: (translation as any).translatedUrl ?? null,
      channelId: (translation as any).channelId ?? null,
      voiceOverName: (translation as any).voiceOverName ?? null,
      voiceOverGender: (translation as any).voiceOverGender ?? null,
      scheduledDate: (translation as any).scheduledDate ?? null,
      publishedDate: (translation as any).publishedDate ?? null,
      createdAt: new Date(),
    };
    this.translations.unshift(t);
    return t;
  }

  async updateTranslation(id: string, translation: Partial<InsertTranslation>): Promise<Translation | undefined> {
    const idx = this.translations.findIndex((x) => x.id === id);
    if (idx === -1) return undefined;
    const current = this.translations[idx];
    const updated: Translation = { ...current, ...translation } as any;
    this.translations[idx] = updated;
    return updated;
  }

  async deleteTranslation(id: string): Promise<boolean> {
    const before = this.translations.length;
    this.translations = this.translations.filter((t) => t.id !== id);
    return this.translations.length !== before;
  }

  // Default Languages
  async getDefaultLanguages(): Promise<DefaultLanguage[]> {
    return [...this.defaultLanguages].sort((a, b) => a.sortOrder - b.sortOrder);
  }

  async getDefaultLanguage(id: string): Promise<DefaultLanguage | undefined> {
    return this.defaultLanguages.find((l) => l.id === id);
  }

  async createDefaultLanguage(language: InsertDefaultLanguage): Promise<DefaultLanguage> {
    const l: DefaultLanguage = {
      id: uuid(),
      code: language.code,
      name: language.name,
      isActive: language.isActive ?? true,
      sortOrder: language.sortOrder ?? this.defaultLanguages.length,
    };
    this.defaultLanguages.push(l);
    return l;
  }

  async updateDefaultLanguage(
    id: string,
    language: Partial<InsertDefaultLanguage>,
  ): Promise<DefaultLanguage | undefined> {
    const idx = this.defaultLanguages.findIndex((x) => x.id === id);
    if (idx === -1) return undefined;
    const current = this.defaultLanguages[idx];
    const updated: DefaultLanguage = { ...current, ...language } as any;
    this.defaultLanguages[idx] = updated;
    return updated;
  }

  async deleteDefaultLanguage(id: string): Promise<boolean> {
    const before = this.defaultLanguages.length;
    this.defaultLanguages = this.defaultLanguages.filter((l) => l.id !== id);
    return this.defaultLanguages.length !== before;
  }

  async reorderLanguages(orderedIds: string[]): Promise<void> {
    const order = new Map<string, number>();
    orderedIds.forEach((id, i) => order.set(id, i));
    this.defaultLanguages = this.defaultLanguages.map((l) => ({
      ...l,
      sortOrder: order.has(l.id) ? (order.get(l.id) as number) : l.sortOrder,
    }));
  }

  // Activity Logs
  async getActivityLogs(limit = 100): Promise<ActivityLog[]> {
    return [...this.activityLogs].sort(byCreatedAtDesc).slice(0, limit);
  }

  async createActivityLog(log: InsertActivityLog): Promise<ActivityLog> {
    const entry: ActivityLog = {
      id: uuid(),
      eventType: log.eventType,
      description: log.description,
      metadata: (log as any).metadata ?? null,
      createdAt: new Date(),
    };
    this.activityLogs.unshift(entry);
    return entry;
  }

  // Settings
  async getSettings(): Promise<Settings[]> {
    return [...this.settings];
  }

  async getSetting(key: string): Promise<Settings | undefined> {
    return this.settings.find((s) => s.key === key);
  }

  async upsertSetting(key: string, value: unknown): Promise<Settings> {
    const existingIdx = this.settings.findIndex((s) => s.key === key);
    if (existingIdx !== -1) {
      const updated: Settings = {
        ...this.settings[existingIdx],
        value,
        updatedAt: new Date(),
      };
      this.settings[existingIdx] = updated;
      return updated;
    }

    const s: Settings = {
      id: uuid(),
      key,
      value: value as any,
      updatedAt: new Date(),
    };
    this.settings.push(s);
    return s;
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
    const totalVideos = this.videos.length;
    const completedTranslations = this.translations.filter((t) => t.status === "completed").length;
    const inProgressTranslations = this.translations.filter((t) => t.status === "in_progress").length;
    const scheduledCount = this.translations.filter((t) => t.scheduledDate !== null).length;
    const channelCount = this.channels.length;
    const languageCount = this.defaultLanguages.filter((l) => l.isActive).length;
    return {
      totalVideos,
      completedTranslations,
      inProgressTranslations,
      scheduledCount,
      channelCount,
      languageCount,
    };
  }

  // Categories
  async getCategories(): Promise<CategoryWithSubcategories[]> {
    return this.categories.map((cat) => ({
      ...cat,
      subcategories: this.subcategories
        .filter((sub) => sub.categoryId === cat.id)
        .sort((a, b) => a.sortOrder - b.sortOrder || b.createdAt.getTime() - a.createdAt.getTime()),
    }));
  }

  async getCategory(id: string): Promise<CategoryWithSubcategories | undefined> {
    const cat = this.categories.find((c) => c.id === id);
    if (!cat) return undefined;
    return {
      ...cat,
      subcategories: this.subcategories
        .filter((sub) => sub.categoryId === id)
        .sort((a, b) => a.sortOrder - b.sortOrder || b.createdAt.getTime() - a.createdAt.getTime()),
    };
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const c: Category = {
      id: uuid(),
      name: category.name,
      description: category.description ?? null,
      sortOrder: category.sortOrder ?? 0,
      createdAt: new Date(),
    };
    this.categories.push(c);
    return c;
  }

  async updateCategory(id: string, category: Partial<InsertCategory>): Promise<Category | undefined> {
    const idx = this.categories.findIndex((c) => c.id === id);
    if (idx === -1) return undefined;
    const updated: Category = { ...this.categories[idx], ...category } as any;
    this.categories[idx] = updated;
    return updated;
  }

  async deleteCategory(id: string): Promise<boolean> {
    const before = this.categories.length;
    this.categories = this.categories.filter((c) => c.id !== id);
    // Cascade delete subcategories
    this.subcategories = this.subcategories.filter((sub) => sub.categoryId !== id);
    return this.categories.length !== before;
  }

  // Subcategories
  async getSubcategories(categoryId?: string): Promise<SubcategoryWithCategory[]> {
    let subs = [...this.subcategories];
    if (categoryId) {
      subs = subs.filter((sub) => sub.categoryId === categoryId);
    }
    return subs
      .sort((a, b) => a.sortOrder - b.sortOrder || b.createdAt.getTime() - a.createdAt.getTime())
      .map((sub) => {
        const category = this.categories.find((c) => c.id === sub.categoryId);
        return {
          ...sub,
          category: category!,
        };
      });
  }

  async getSubcategory(id: string): Promise<SubcategoryWithCategory | undefined> {
    const sub = this.subcategories.find((s) => s.id === id);
    if (!sub) return undefined;
    const category = this.categories.find((c) => c.id === sub.categoryId);
    return {
      ...sub,
      category: category!,
    };
  }

  async createSubcategory(subcategory: InsertSubcategory): Promise<Subcategory> {
    const s: Subcategory = {
      id: uuid(),
      categoryId: subcategory.categoryId,
      name: subcategory.name,
      description: subcategory.description ?? null,
      sortOrder: subcategory.sortOrder ?? 0,
      createdAt: new Date(),
    };
    this.subcategories.push(s);
    return s;
  }

  async updateSubcategory(id: string, subcategory: Partial<InsertSubcategory>): Promise<Subcategory | undefined> {
    const idx = this.subcategories.findIndex((s) => s.id === id);
    if (idx === -1) return undefined;
    const updated: Subcategory = { ...this.subcategories[idx], ...subcategory } as any;
    this.subcategories[idx] = updated;
    return updated;
  }

  async deleteSubcategory(id: string): Promise<boolean> {
    const before = this.subcategories.length;
    this.subcategories = this.subcategories.filter((s) => s.id !== id);
    // Cascade delete channel subcategories
    this.channelSubcategories = this.channelSubcategories.filter((cs) => cs.subcategoryId !== id);
    return this.subcategories.length !== before;
  }

  // Channel Subcategories (many-to-many)
  async getChannelSubcategories(channelId: string): Promise<Subcategory[]> {
    const subIds = this.channelSubcategories
      .filter((cs) => cs.channelId === channelId)
      .map((cs) => cs.subcategoryId);
    return this.subcategories.filter((sub) => subIds.includes(sub.id));
  }

  async setChannelSubcategories(channelId: string, subcategoryIds: string[]): Promise<void> {
    // Delete existing relations
    this.channelSubcategories = this.channelSubcategories.filter((cs) => cs.channelId !== channelId);
    // Add new relations
    subcategoryIds.forEach((subId) => {
      this.channelSubcategories.push({ channelId, subcategoryId: subId });
    });
  }
}


