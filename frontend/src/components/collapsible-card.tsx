import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

interface CollapsibleCardProps {
  header: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  headerClassName?: string;
  contentClassName?: string;
  cardClassName?: string;
}

export function CollapsibleCard({
  header,
  children,
  defaultOpen = false,
  headerClassName,
  contentClassName,
  cardClassName,
}: CollapsibleCardProps) {
  return (
    <Card className={cn("w-full", cardClassName)}>
      <Collapsible defaultOpen={defaultOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className={cn("pb-3 cursor-pointer select-none", headerClassName)}>
            <div className="flex items-center justify-between">
              {header}
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className={cn("space-y-4", contentClassName)}>
            {children}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
