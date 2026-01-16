import { createContext, useContext, useState, ReactNode } from "react";
import { translations, getNestedValue, type Locale } from "@/i18n";

type LanguageContextType = {
  locale: Locale;
  t: (key: string, params?: Record<string, string | number>) => string;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  // UI language support removed: the app is Russian-only.
  const [locale] = useState<Locale>("ru");

  const t = (key: string, params?: Record<string, string | number>): string => {
    let value = getNestedValue(translations[locale] as Record<string, unknown>, key);

    if (params) {
      Object.entries(params).forEach(([paramKey, paramValue]) => {
        value = value.replace(`{${paramKey}}`, String(paramValue));
      });
    }

    return value;
  };

  return <LanguageContext.Provider value={{ locale, t }}>{children}</LanguageContext.Provider>;
}

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useTranslation must be used within a LanguageProvider");
  }
  return { t: context.t, locale: context.locale };
}
