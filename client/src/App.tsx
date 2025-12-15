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
import ArchivePage from "@/pages/archive";
import ScheduledPage from "@/pages/scheduled";
import ChannelsPage from "@/pages/channels";
import LanguagesPage from "@/pages/languages";
import StatisticsPage from "@/pages/statistics";
import ActivityPage from "@/pages/activity";
import SettingsPage from "@/pages/settings";

function Router() {
  return (
    <Switch>
      <Route path="/" component={QueuePage} />
      <Route path="/add-video" component={AddVideoPage} />
      <Route path="/archive" component={ArchivePage} />
      <Route path="/scheduled" component={ScheduledPage} />
      <Route path="/channels" component={ChannelsPage} />
      <Route path="/languages" component={LanguagesPage} />
      <Route path="/statistics" component={StatisticsPage} />
      <Route path="/activity" component={ActivityPage} />
      <Route path="/settings" component={SettingsPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const sidebarStyle = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <LanguageProvider>
          <TooltipProvider>
            <SidebarProvider style={sidebarStyle as React.CSSProperties}>
              <div className="flex h-screen w-full">
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
