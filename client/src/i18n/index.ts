import en from "./en.json";
import ru from "./ru.json";

export type Locale = "en" | "ru";

export const translations = {
  en,
  ru,
} as const;

export type TranslationKeys = typeof en;

export function getNestedValue(obj: Record<string, unknown>, path: string): string {
  const keys = path.split(".");
  let current: unknown = obj;
  
  for (const key of keys) {
    if (current && typeof current === "object" && key in current) {
      current = (current as Record<string, unknown>)[key];
    } else {
      return path;
    }
  }
  
  return typeof current === "string" ? current : path;
}
