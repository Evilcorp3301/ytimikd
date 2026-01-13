import { useState } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { GlobalSearch, GlobalSearchTrigger } from "./global-search";

interface HeaderProps {
  title?: string;
}

export function Header({ title }: HeaderProps) {
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
        </div>
      </header>
      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}
