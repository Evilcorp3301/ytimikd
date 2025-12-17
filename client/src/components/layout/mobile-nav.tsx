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
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t bg-background md:hidden">
      {navItems.map((item) => {
        const isActive = location === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center gap-1 px-3 py-2 text-xs transition-colors",
              isActive
                ? "text-primary"
                : "text-muted-foreground"
            )}
            data-testid={`mobile-nav-${item.shortKey}`}
          >
            <item.icon className="h-5 w-5" />
            <span>{getShortLabel(item)}</span>
          </Link>
        );
      })}
    </nav>
  );
}
