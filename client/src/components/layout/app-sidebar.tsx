import { Link, useLocation } from "wouter";
import { getPath } from "@/lib/paths";
import { useQuery } from "@tanstack/react-query";
import { LayoutList, Calendar, Globe, History, Tv, Plus, Disc3, FolderTree } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/language-provider";
import type { TranslationWithDetails } from "@shared/schema";

const navigationItems = [
  {
    titleKey: "nav.translationQueue",
    url: "/",
    icon: LayoutList,
  },
  {
    titleKey: "nav.history",
    url: "/history",
    icon: History,
  },
  {
    titleKey: "nav.scheduled",
    url: "/scheduled",
    icon: Calendar,
  },
];

const managementItems = [
  {
    titleKey: "nav.channels",
    url: "/channels",
    icon: Tv,
  },
  {
    titleKey: "nav.languages",
    url: "/languages",
    icon: Globe,
  },
  {
    titleKey: "nav.categories",
    url: "/categories",
    icon: FolderTree,
  },
  {
    titleKey: "nav.activityLog",
    url: "/activity",
    icon: History,
  },
];

export function AppSidebar() {
  const [location] = useLocation();
  const { t } = useTranslation();

  const { data: scheduledTranslations = [] } = useQuery<TranslationWithDetails[]>({
    queryKey: ["/api/translations?scheduled=true"],
  });
  const scheduledCount = scheduledTranslations.length;

  return (
    <Sidebar>
      <SidebarHeader className="p-4 border-b border-sidebar-border/50">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-lg">
            <Disc3 className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="flex flex-col">
            <span className="text-heading-2 font-semibold">{t("app.name")}</span>
            <span className="text-hint text-muted-foreground/70">{t("app.tagline")}</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <div className="px-3 pb-1.5 hidden md:block">
            <Link href={getPath("/add-video")}>
              <Button className="w-full gap-2" data-testid="button-add-video-sidebar">
                <Plus className="h-4 w-4" aria-hidden="true" />
                {t("nav.addVideo")}
              </Button>
            </Link>
          </div>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>{t("nav.translations")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => {
                const itemPath = getPath(item.url);
                const isActive = location === itemPath;
                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      data-testid={`nav-${item.titleKey.replace("nav.", "").toLowerCase()}`}
                    >
                      <Link href={itemPath} className="flex items-center gap-2">
                        <item.icon
                          className={cn(
                            "h-4 w-4 shrink-0",
                            isActive ? "text-primary" : "text-muted-foreground/50"
                          )}
                          aria-hidden="true"
                        />
                        <span>{t(item.titleKey)}</span>
                      </Link>
                    </SidebarMenuButton>
                    {item.url === "/scheduled" && scheduledCount > 0 && (
                      <SidebarMenuBadge
                        className="bg-sidebar-accent text-sidebar-accent-foreground"
                        aria-label={`${scheduledCount}`}
                      >
                        {scheduledCount}
                      </SidebarMenuBadge>
                    )}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>{t("nav.management")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {managementItems.map((item) => {
                const itemPath = getPath(item.url);
                const isActive = location === itemPath;
                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      data-testid={`nav-${item.titleKey.replace("nav.", "").toLowerCase()}`}
                    >
                      <Link href={itemPath} className="flex items-center gap-2">
                        <item.icon
                          className={cn(
                            "h-4 w-4 shrink-0",
                            isActive ? "text-primary" : "text-muted-foreground/50"
                          )}
                          aria-hidden="true"
                        />
                        <span>{t(item.titleKey)}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
