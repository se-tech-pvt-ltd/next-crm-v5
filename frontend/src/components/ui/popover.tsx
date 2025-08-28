import * as React from "react"
import * as PopoverPrimitive from "@radix-ui/react-popover"

import { cn } from "@/lib/utils"

const Popover = PopoverPrimitive.Root

const PopoverTrigger = PopoverPrimitive.Trigger

const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(({ className, align = "center", sideOffset = 4, ...props }, ref) => {
  const contentRef = React.useRef<HTMLDivElement>(null);

  // Combine refs
  const combinedRef = React.useCallback((node: HTMLDivElement | null) => {
    contentRef.current = node;
    if (typeof ref === 'function') {
      ref(node);
    } else if (ref) {
      ref.current = node;
    }
  }, [ref]);

  // Ensure wheel events work in popover content
  React.useEffect(() => {
    const content = contentRef.current;
    if (!content) return;

    const handleWheel = (e: WheelEvent) => {
      // Find scrollable child elements
      const scrollableElements = content.querySelectorAll('[style*="overflow-y-auto"], [class*="overflow-y-auto"]');

      // If there are scrollable elements, let them handle the wheel event
      if (scrollableElements.length > 0) {
        e.stopPropagation();
      }
    };

    content.addEventListener('wheel', handleWheel, { passive: true });
    return () => content.removeEventListener('wheel', handleWheel);
  }, []);

  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        ref={combinedRef}
        align={align}
        sideOffset={sideOffset}
        className={cn(
          "z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-[--radix-popover-content-transform-origin]",
          className
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
  )
})
PopoverContent.displayName = PopoverPrimitive.Content.displayName

export { Popover, PopoverTrigger, PopoverContent }
