import { Link, useLocation } from "wouter";
import {
  LayoutList,
  Archive,
  Calendar,
  Globe,
  BarChart3,
  History,
  Settings,
  Tv,
  Plus,
  Disc3,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/language-provider";

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
    titleKey: "nav.archive",
    url: "/archive",
    icon: Archive,
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

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Disc3 className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-semibold">{t("app.name")}</span>
            <span className="text-xs text-muted-foreground">{t("app.tagline")}</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <div className="px-3 pb-2">
            <Link href="/add-video">
              <Button className="w-full gap-2" data-testid="button-add-video-sidebar">
                <Plus className="h-4 w-4" />
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
                      <item.icon className="h-4 w-4" />
                      <span>{t(item.titleKey)}</span>
                    </Link>
                  </SidebarMenuButton>
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
                      <item.icon className="h-4 w-4" />
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
