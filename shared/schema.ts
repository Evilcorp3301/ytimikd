import { sql } from "drizzle-orm";
import { pgTable, text, uuid, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const videos = pgTable("videos", {
  id: uuid("id").primaryKey().defaultRandom(),
  url: text("url").notNull(),
  title: text("title"),
  thumbnailUrl: text("thumbnail_url"),
  subcategoryId: uuid("subcategory_id").references(() => subcategories.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  isArchived: boolean("is_archived").default(false).notNull(),
  archivedAt: timestamp("archived_at"),
  archivedReason: text("archived_reason"), // "auto" (completed) | "manual" (cancelled by user)
});

export const videosRelations = relations(videos, ({ many, one }) => ({
  translations: many(translations),
  subcategory: one(subcategories, {
    fields: [videos.subcategoryId],
    references: [subcategories.id],
  }),
}));

export const channels = pgTable("channels", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  url: text("url").notNull(),
  defaultLanguage: text("default_language"),
  voiceOverName: text("voice_over_name"),
  voiceOverGender: text("voice_over_gender"),
  niche: text("niche"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const channelsRelations = relations(channels, ({ many }) => ({
  translations: many(translations),
  subcategories: many(channelSubcategories),
}));

export const translations = pgTable("translations", {
  id: uuid("id").primaryKey().defaultRandom(),
  videoId: uuid("video_id").notNull().references(() => videos.id, { onDelete: "cascade" }),
  language: text("language").notNull(),
  status: text("status").default("not_started").notNull(),
  translatedUrl: text("translated_url"),
  channelId: uuid("channel_id").references(() => channels.id),
  voiceOverName: text("voice_over_name"),
  voiceOverGender: text("voice_over_gender"),
  scheduledDate: timestamp("scheduled_date"),
  publishedDate: timestamp("published_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
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

export const defaultLanguages = pgTable("default_languages", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
});

export const activityLogs = pgTable("activity_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventType: text("event_type").notNull(),
  description: text("description").notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const settings = pgTable("settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: text("key").notNull().unique(),
  value: jsonb("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const categoriesRelations = relations(categories, ({ many }) => ({
  subcategories: many(subcategories),
}));

export const subcategories = pgTable("subcategories", {
  id: uuid("id").primaryKey().defaultRandom(),
  categoryId: uuid("category_id").notNull().references(() => categories.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const subcategoriesRelations = relations(subcategories, ({ one, many }) => ({
  category: one(categories, {
    fields: [subcategories.categoryId],
    references: [categories.id],
  }),
  videos: many(videos),
  channels: many(channelSubcategories),
}));

export const channelSubcategories = pgTable("channel_subcategories", {
  channelId: uuid("channel_id").notNull().references(() => channels.id, { onDelete: "cascade" }),
  subcategoryId: uuid("subcategory_id").notNull().references(() => subcategories.id, { onDelete: "cascade" }),
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
export const insertTranslationSchema = createInsertSchema(translations).omit({ id: true, createdAt: true });
export const insertDefaultLanguageSchema = createInsertSchema(defaultLanguages).omit({ id: true });
export const insertActivityLogSchema = createInsertSchema(activityLogs).omit({ id: true, createdAt: true });
export const insertSettingsSchema = createInsertSchema(settings).omit({ id: true, updatedAt: true });
export const insertCategorySchema = createInsertSchema(categories).omit({ id: true, createdAt: true });
export const insertSubcategorySchema = createInsertSchema(subcategories).omit({ id: true, createdAt: true });

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
  video?: (Video & {
    subcategory?: (Subcategory & { category: Category }) | null;
  }) | null;
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
  "video_archived",
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
