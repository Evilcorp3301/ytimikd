import { useState } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useTheme } from "@/lib/theme-provider";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { GlobalSearch, GlobalSearchTrigger } from "./global-search";

interface HeaderProps {
  title?: string;
}

export function Header({ title }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-50 flex h-14 items-center justify-between gap-4 border-b bg-background px-4">
        <div className="flex items-center gap-3">
          <SidebarTrigger data-testid="button-sidebar-toggle" />
          {title && (
            <h1 className="text-heading-1" data-testid="text-page-title">
              {title}
            </h1>
          )}
        </div>
        <div className="flex items-center gap-2">
          <GlobalSearchTrigger onOpenChange={setSearchOpen} />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                data-testid="button-theme-toggle"
                aria-label="Переключить тему"
              >
                {theme === "light" ? (
                  <Moon className="h-4 w-4" />
                ) : (
                  <Sun className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {theme === "light" ? "Тёмная тема" : "Светлая тема"}
            </TooltipContent>
          </Tooltip>
        </div>
      </header>
      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}
