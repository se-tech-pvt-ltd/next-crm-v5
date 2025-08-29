import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
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
  defaultOpen = true,
  headerClassName,
  contentClassName,
  cardClassName,
}: CollapsibleCardProps) {
  return (
    <Card className={cn("w-full", cardClassName)}>
      <Collapsible defaultOpen={defaultOpen}>
        <CardHeader className={cn("pb-3", headerClassName)}>
          <div className="flex items-center justify-between">
            {header}
            <CollapsibleTrigger className="ml-2 inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted">
              <ChevronDown className="h-4 w-4 transition-transform duration-200 data-[state=open]:rotate-180" />
            </CollapsibleTrigger>
          </div>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className={cn("space-y-4", contentClassName)}>
            {children}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
