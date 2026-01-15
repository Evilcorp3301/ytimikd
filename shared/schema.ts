import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const videos = sqliteTable("videos", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  url: text("url").notNull(),
  title: text("title"),
  thumbnailUrl: text("thumbnail_url"),
  duration: integer("duration"), // Длительность видео в секундах
  subcategoryId: text("subcategory_id").references(() => subcategories.id, {
    onDelete: "set null",
  }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  isArchived: integer("is_archived", { mode: "boolean" }).notNull().default(false),
  archivedAt: integer("archived_at", { mode: "timestamp" }),
  archivedReason: text("archived_reason"), // "auto" (completed) | "manual" (cancelled by user)
});

export const videosRelations = relations(videos, ({ many, one }) => ({
  translations: many(translations),
  subcategory: one(subcategories, {
    fields: [videos.subcategoryId],
    references: [subcategories.id],
  }),
}));

export const channels = sqliteTable("channels", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  url: text("url").notNull(),
  defaultLanguage: text("default_language"),
  voiceOverName: text("voice_over_name"),
  voiceOverGender: text("voice_over_gender"),
  niche: text("niche"),
  thumbnailUrl: text("thumbnail_url"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const channelsRelations = relations(channels, ({ many }) => ({
  translations: many(translations),
  subcategories: many(channelSubcategories),
}));

export const translations = sqliteTable("translations", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  videoId: text("video_id")
    .notNull()
    .references(() => videos.id, { onDelete: "cascade" }),
  language: text("language").notNull(),
  status: text("status").default("not_started").notNull(),
  translatedUrl: text("translated_url"),
  channelId: text("channel_id").references(() => channels.id, { onDelete: "set null" }),
  voiceOverName: text("voice_over_name"),
  voiceOverGender: text("voice_over_gender"),
  scheduledDate: integer("scheduled_date", { mode: "timestamp" }),
  publishedDate: integer("published_date", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const translationsRelations = relations(translations, ({ one }) => ({
  video: one(videos, {
    fields: [translations.videoId],
    references: [videos.id],
  }),
  channel: one(channels, {
    fields: [translations.channelId],
    references: [channels.id],
  }),
}));

export const defaultLanguages = sqliteTable("default_languages", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const activityLogs = sqliteTable("activity_logs", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  eventType: text("event_type").notNull(),
  description: text("description").notNull(),
  metadata: text("metadata"), // JSON хранится как text, требует сериализации/десериализации
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const settings = sqliteTable("settings", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  key: text("key").notNull().unique(),
  value: text("value").notNull(), // JSON хранится как text, требует сериализации/десериализации
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const categories = sqliteTable("categories", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  description: text("description"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const categoriesRelations = relations(categories, ({ many }) => ({
  subcategories: many(subcategories),
}));

export const subcategories = sqliteTable("subcategories", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  categoryId: text("category_id")
    .notNull()
    .references(() => categories.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const subcategoriesRelations = relations(subcategories, ({ one, many }) => ({
  category: one(categories, {
    fields: [subcategories.categoryId],
    references: [categories.id],
  }),
  videos: many(videos),
  channels: many(channelSubcategories),
}));

export const channelSubcategories = sqliteTable("channel_subcategories", {
  channelId: text("channel_id")
    .notNull()
    .references(() => channels.id, { onDelete: "cascade" }),
  subcategoryId: text("subcategory_id")
    .notNull()
    .references(() => subcategories.id, { onDelete: "cascade" }),
});

export const channelSubcategoriesRelations = relations(channelSubcategories, ({ one }) => ({
  channel: one(channels, {
    fields: [channelSubcategories.channelId],
    references: [channels.id],
  }),
  subcategory: one(subcategories, {
    fields: [channelSubcategories.subcategoryId],
    references: [subcategories.id],
  }),
}));

export const insertVideoSchema = createInsertSchema(videos).omit({ id: true, createdAt: true });
export const insertChannelSchema = createInsertSchema(channels).omit({ id: true, createdAt: true });
export const insertTranslationSchema = createInsertSchema(translations).omit({
  id: true,
  createdAt: true,
});
export const insertDefaultLanguageSchema = createInsertSchema(defaultLanguages).omit({ id: true });
export const insertActivityLogSchema = createInsertSchema(activityLogs).omit({
  id: true,
  createdAt: true,
});
export const insertSettingsSchema = createInsertSchema(settings).omit({
  id: true,
  updatedAt: true,
});
export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  createdAt: true,
});
export const insertSubcategorySchema = createInsertSchema(subcategories).omit({
  id: true,
  createdAt: true,
});

export type InsertVideo = z.infer<typeof insertVideoSchema>;
export type InsertChannel = z.infer<typeof insertChannelSchema>;
export type InsertTranslation = z.infer<typeof insertTranslationSchema>;
export type InsertDefaultLanguage = z.infer<typeof insertDefaultLanguageSchema>;
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;
export type InsertSettings = z.infer<typeof insertSettingsSchema>;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type InsertSubcategory = z.infer<typeof insertSubcategorySchema>;

export type Video = typeof videos.$inferSelect;
export type Channel = typeof channels.$inferSelect;
export type Translation = typeof translations.$inferSelect;
export type DefaultLanguage = typeof defaultLanguages.$inferSelect;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type Settings = typeof settings.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Subcategory = typeof subcategories.$inferSelect;
export type ChannelSubcategory = typeof channelSubcategories.$inferSelect;

export type VideoWithTranslations = Video & {
  translations: Translation[];
  subcategory?: (Subcategory & { category: Category }) | null;
};

export type CategoryWithSubcategories = Category & {
  subcategories: Subcategory[];
};

export type SubcategoryWithCategory = Subcategory & {
  category: Category;
};

export type TranslationWithDetails = Translation & {
  video?:
    | (Video & {
        subcategory?: (Subcategory & { category: Category }) | null;
      })
    | null;
  channel?: Channel | null;
};

export const translationStatusEnum = z.enum(["not_started", "in_progress", "completed"]);
export type TranslationStatus = z.infer<typeof translationStatusEnum>;

export const voiceOverGenderEnum = z.enum(["male", "female"]);
export type VoiceOverGender = z.infer<typeof voiceOverGenderEnum>;

export const eventTypeEnum = z.enum([
  "video_added",
  "translation_started",
  "translation_completed",
  "video_deleted",
  "schedule_created",
  "schedule_updated",
  "channel_added",
  "channel_updated",
  "channel_deleted",
  "language_added",
  "language_removed",
  "settings_updated",
  "category_added",
  "category_updated",
  "category_deleted",
  "subcategory_added",
  "subcategory_updated",
  "subcategory_deleted",
]);
export type EventType = z.infer<typeof eventTypeEnum>;
