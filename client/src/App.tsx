import { useEffect } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/lib/theme-provider";
import { LanguageProvider } from "@/lib/language-provider";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import NotFound from "@/pages/not-found";
import QueuePage from "@/pages/queue";
import AddVideoPage from "@/pages/add-video";
import HistoryPage from "@/pages/history";
import ScheduledPage from "@/pages/scheduled";
import ChannelsPage from "@/pages/channels";
import LanguagesPage from "@/pages/languages";
import CategoriesPage from "@/pages/categories";
import ActivityPage from "@/pages/activity";
import SettingsPage from "@/pages/settings";
import InfoPage from "@/pages/info";

/**
 * Audit-only utility: Detects ?forceMobile=1 query parameter
 * Used for testing mobile layout without DevTools or window resizing.
 * Does not affect normal user experience.
 */
function isForcedMobile(): boolean {
  if (typeof window === "undefined") return false;
  const params = new URLSearchParams(window.location.search);
  return params.get("forceMobile") === "1";
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={QueuePage} />
      <Route path="/add-video" component={AddVideoPage} />
      <Route path="/history" component={HistoryPage} />
      <Route path="/scheduled" component={ScheduledPage} />
      <Route path="/channels" component={ChannelsPage} />
      <Route path="/languages" component={LanguagesPage} />
      <Route path="/categories" component={CategoriesPage} />
      <Route path="/activity" component={ActivityPage} />
      <Route path="/settings" component={SettingsPage} />
      <Route path="/info" component={InfoPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const sidebarStyle = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  // Audit-only: Force mobile layout when ?forceMobile=1 is present
  const forcedMobile = isForcedMobile();

  // Apply data-layout attribute to body for CSS targeting
  useEffect(() => {
    if (forcedMobile) {
      document.body.setAttribute("data-layout", "mobile");
      return () => {
        document.body.removeAttribute("data-layout");
      };
    }
  }, [forcedMobile]);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <LanguageProvider>
          <TooltipProvider>
            <SidebarProvider style={sidebarStyle as React.CSSProperties}>
              <div
                className="flex h-screen w-full overflow-x-hidden"
                data-layout={forcedMobile ? "mobile" : undefined}
              >
                <div className="hidden md:block">
                  <AppSidebar />
                </div>
                <main className="flex flex-1 flex-col overflow-auto">
                  <Router />
                </main>
                <MobileNav />
              </div>
            </SidebarProvider>
            <Toaster />
          </TooltipProvider>
        </LanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
