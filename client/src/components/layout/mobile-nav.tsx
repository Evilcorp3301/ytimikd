import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Calendar,
  History,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/language-provider";

const navItems = [
  { href: "/", icon: LayoutDashboard, labelKey: "nav.translationQueue", shortKey: "queue" },
  { href: "/history", icon: History, labelKey: "nav.history", shortKey: "history" },
  { href: "/scheduled", icon: Calendar, labelKey: "nav.scheduled", shortKey: "scheduled" },
];

export function MobileNav() {
  const [location] = useLocation();
  const { t } = useTranslation();

  const getShortLabel = (item: typeof navItems[0]) => {
    return t(`mobileNav.${item.shortKey}`);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-12 items-center justify-around border-t bg-background md:hidden focus-within:outline-none">
      {navItems.map((item) => {
        const isActive = location === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center gap-1 px-2 py-2 min-w-0 flex-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md min-h-[44px]",
              isActive
                ? "text-primary font-medium"
                : "text-muted-foreground/60 hover:text-foreground/80"
            )}
            data-testid={`mobile-nav-${item.shortKey}`}
            aria-label={t(item.labelKey)}
          >
            <item.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
            <span className="text-[10px] leading-tight truncate w-full text-center">{getShortLabel(item)}</span>
          </Link>
        );
      })}
    </nav>
  );
}
