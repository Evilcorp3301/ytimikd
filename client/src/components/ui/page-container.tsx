import { cn } from "@/lib/utils";

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function PageContainer({ children, className }: PageContainerProps) {
  return (
    <div className={cn("flex-1 overflow-auto p-[var(--spacing-4)] md:p-[var(--spacing-6)] lg:p-[var(--spacing-8)] pb-20 md:pb-[var(--spacing-8)]", className)}>
      <div className="mx-auto max-w-7xl">
        {children}
      </div>
    </div>
  );
}
