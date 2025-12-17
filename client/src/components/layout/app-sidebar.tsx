import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  LayoutList,
  Calendar,
  Globe,
  BarChart3,
  History,
  Settings,
  Tv,
  Plus,
  Disc3,
  FolderTree,
} from "lucide-react";
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
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
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
  {
    titleKey: "nav.statistics",
    url: "/statistics",
    icon: BarChart3,
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
  {
    titleKey: "nav.settings",
    url: "/settings",
    icon: Settings,
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
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Disc3 className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="flex flex-col">
            <span className="text-heading-2">{t("app.name")}</span>
            <span className="text-hint">{t("app.tagline")}</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <div className="px-3 pb-2 hidden md:block">
            <Link href="/add-video">
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
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url}
                    data-testid={`nav-${item.titleKey.replace("nav.", "").toLowerCase()}`}
                  >
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" aria-hidden="true" />
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
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>{t("nav.management")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {managementItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url}
                    data-testid={`nav-${item.titleKey.replace("nav.", "").toLowerCase()}`}
                  >
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" aria-hidden="true" />
                      <span>{t(item.titleKey)}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4">
        <div className="text-xs text-muted-foreground">
          {t("app.version")}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
