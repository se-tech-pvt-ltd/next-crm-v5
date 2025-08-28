import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      "peer h-5 w-5 shrink-0 rounded-md border-2 border-slate-300 shadow-sm ring-offset-background transition-all duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 hover:border-primary/60 hover:shadow-md",
      "data-[state=checked]:bg-gradient-to-br data-[state=checked]:from-primary data-[state=checked]:to-primary/80 data-[state=checked]:border-primary data-[state=checked]:text-primary-foreground data-[state=checked]:shadow-lg data-[state=checked]:shadow-primary/25",
      "data-[state=indeterminate]:bg-gradient-to-br data-[state=indeterminate]:from-primary data-[state=indeterminate]:to-primary/80 data-[state=indeterminate]:border-primary data-[state=indeterminate]:text-primary-foreground",
      className
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator
      className={cn("flex items-center justify-center text-current transform transition-transform duration-150 ease-in-out")}
    >
      <Check className="h-3.5 w-3.5 stroke-[3] drop-shadow-sm" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
))
Checkbox.displayName = CheckboxPrimitive.Root.displayName

export { Checkbox }
