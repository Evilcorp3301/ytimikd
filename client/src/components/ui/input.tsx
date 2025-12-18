import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    // h-9 to match icon buttons and default buttons.
    return (
      <input
        type={type}
        className={cn(
          // Compact on mobile + desktop; iOS gets 16px override (see .ios-input-text in index.css) to avoid auto-zoom.
          "ios-input-text flex h-[var(--input-height)] w-full rounded-[var(--radius-md)] border border-input bg-background px-3 py-2 text-body leading-snug ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-sm placeholder-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-ring/50 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
