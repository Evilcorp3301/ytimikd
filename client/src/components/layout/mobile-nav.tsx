import * as React from "react";
import { Link, useLocation } from "wouter";
import { LayoutDashboard, Calendar, History } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/language-provider";
import { getPath } from "@/lib/paths";

const navItems = [
  { href: "/", icon: LayoutDashboard, labelKey: "nav.translationQueue", shortKey: "queue" },
  { href: "/history", icon: History, labelKey: "nav.history", shortKey: "history" },
  { href: "/scheduled", icon: Calendar, labelKey: "nav.scheduled", shortKey: "scheduled" },
];

function useIsMobileOrForced() {
  const [location] = useLocation();
  const [isMobileByWidth, setIsMobileByWidth] = React.useState(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth < 768;
  });

  // Check URL parameter from location (wouter tracks this)
  const checkForceMobile = React.useCallback(() => {
    if (typeof window === "undefined") return false;
    const params = new URLSearchParams(window.location.search);
    return params.get("forceMobile") === "1";
  }, []);

  const [isForcedMobile, setIsForcedMobile] = React.useState(checkForceMobile);

  // Update forced mobile state when location changes
  React.useEffect(() => {
    setIsForcedMobile(checkForceMobile());
  }, [location, checkForceMobile]);

  // Use matchMedia for efficient width detection (no resize listener needed)
  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const mql = window.matchMedia("(max-width: 767px)");
    const handleChange = (e: MediaQueryListEvent) => {
      setIsMobileByWidth(e.matches);
    };

    // Set initial value
    setIsMobileByWidth(mql.matches);

    // Listen to media query changes (more efficient than resize)
    mql.addEventListener("change", handleChange);

    return () => {
      mql.removeEventListener("change", handleChange);
    };
  }, []);

  // Check data-layout attribute (only when needed)
  const [hasDataLayout, setHasDataLayout] = React.useState(() => {
    if (typeof window === "undefined") return false;
    return (
      document.body.getAttribute("data-layout") === "mobile" ||
      document.querySelector('[data-layout="mobile"]') !== null
    );
  });

  React.useEffect(() => {
    const bodyObserver = new MutationObserver(() => {
      const hasLayout =
        document.body.getAttribute("data-layout") === "mobile" ||
        document.querySelector('[data-layout="mobile"]') !== null;
      setHasDataLayout(hasLayout);
    });

    bodyObserver.observe(document.body, { attributes: true, attributeFilter: ["data-layout"] });

    const parent = document.querySelector("[data-layout]");
    if (parent) {
      bodyObserver.observe(parent, { attributes: true, attributeFilter: ["data-layout"] });
    }

    return () => {
      bodyObserver.disconnect();
    };
  }, []);

  // Priority: forceMobile > data-layout > screen width
  return isForcedMobile || hasDataLayout || isMobileByWidth;
}

export function MobileNav() {
  const [location] = useLocation();
  const { t } = useTranslation();
  const isMobile = useIsMobileOrForced();

  const getShortLabel = (item: (typeof navItems)[0]) => {
    return t(`mobileNav.${item.shortKey}`);
  };

  // Show on mobile (< 768px) via Tailwind md:hidden
  // If isMobile is true (forceMobile), show regardless of screen size by not applying md:hidden
  return (
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 flex h-12 items-center justify-around border-t bg-background focus-within:outline-none",
        // Hide on desktop (>= 768px) unless forceMobile is active
        !isMobile && "md:hidden"
      )}
    >
      {navItems.map((item) => {
        const itemPath = getPath(item.href);
        const isActive = location === itemPath;
        return (
          <Link
            key={item.href}
            href={itemPath}
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
            <span className="text-[10px] leading-tight truncate w-full text-center">
              {getShortLabel(item)}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
