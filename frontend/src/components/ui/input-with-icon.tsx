import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface InputWithIconProps extends React.ComponentProps<typeof Input> {
  leftIcon?: React.ReactNode;
  rightAdornment?: React.ReactNode;
  containerClassName?: string;
}

export const InputWithIcon = React.forwardRef<HTMLInputElement, InputWithIconProps>(
  ({ leftIcon, rightAdornment, className, containerClassName, ...props }, ref) => {
    const hasLeft = Boolean(leftIcon);
    const hasRight = Boolean(rightAdornment);

    return (
      <div className={cn("relative", containerClassName)}>
        {hasLeft && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true">
            {leftIcon}
          </span>
        )}
        <Input
          ref={ref}
          className={cn(
            hasLeft && "pl-10",
            hasRight && "pr-12",
            className
          )}
          {...props}
        />
        {hasRight && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2" >{rightAdornment}</span>
        )}
      </div>
    );
  }
);
InputWithIcon.displayName = "InputWithIcon";
