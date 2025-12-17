import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Calendar,
  BarChart3,
  Settings,
  History,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/language-provider";

const navItems = [
  { href: "/", icon: LayoutDashboard, labelKey: "nav.translationQueue", shortKey: "queue" },
  { href: "/history", icon: History, labelKey: "nav.history", shortKey: "history" },
  { href: "/scheduled", icon: Calendar, labelKey: "nav.scheduled", shortKey: "scheduled" },
  { href: "/statistics", icon: BarChart3, labelKey: "nav.statistics", shortKey: "stats" },
  { href: "/settings", icon: Settings, labelKey: "nav.settings", shortKey: "settings" },
];

export function MobileNav() {
  const [location] = useLocation();
  const { t } = useTranslation();

  const getShortLabel = (item: typeof navItems[0]) => {
    return t(`mobileNav.${item.shortKey}`);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t bg-background md:hidden focus-within:outline-none">
      {navItems.map((item) => {
        const isActive = location === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center gap-1 px-3 py-2 text-hint transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md",
              isActive
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
            data-testid={`mobile-nav-${item.shortKey}`}
            aria-label={t(item.labelKey)}
          >
            <item.icon className="h-5 w-5" aria-hidden="true" />
            <span>{getShortLabel(item)}</span>
          </Link>
        );
      })}
    </nav>
  );
}
