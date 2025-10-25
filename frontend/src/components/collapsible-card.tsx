import React, { useEffect, useState } from "react";
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
  persistKey?: string; // when provided, remember open/close in localStorage
  lockedOpen?: boolean; // when true, panel is always open and not collapsible
  lockedClosed?: boolean; // when true, panel is always closed and not expandable
  alwaysStartClosed?: boolean; // when true, ignore persisted state and start closed on first mount
}

export function CollapsibleCard({
  header,
  children,
  defaultOpen = false,
  headerClassName,
  contentClassName,
  cardClassName,
  persistKey,
  lockedOpen = false,
  lockedClosed = false,
  alwaysStartClosed = false,
}: CollapsibleCardProps) {
  const [open, setOpen] = useState<boolean>(() => {
    if (lockedOpen) return true;
    if (lockedClosed) return false;
    if (alwaysStartClosed) return false;
    if (!persistKey) return defaultOpen;
    if (typeof window === "undefined") return defaultOpen;
    try {
      const stored = localStorage.getItem(persistKey);
      if (stored === "1") return true;
      if (stored === "0") return false;
      return defaultOpen;
    } catch {
      return defaultOpen;
    }
  });

  // When the key changes (navigating to another lead), re-read persisted state
  useEffect(() => {
    if (lockedOpen) {
      setOpen(true);
      return;
    }
    if (lockedClosed) {
      setOpen(false);
      return;
    }
    if (alwaysStartClosed) {
      setOpen(false);
      return;
    }
    if (!persistKey) return;
    try {
      const stored = localStorage.getItem(persistKey);
      if (stored === "1") setOpen(true);
      else if (stored === "0") setOpen(false);
      else setOpen(defaultOpen);
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [persistKey, lockedOpen, lockedClosed, alwaysStartClosed]);

  useEffect(() => {
    if (lockedOpen || lockedClosed || alwaysStartClosed) return;
    if (!persistKey) return;
    try {
      localStorage.setItem(persistKey, open ? "1" : "0");
    } catch {}
  }, [open, persistKey, lockedOpen, lockedClosed, alwaysStartClosed]);

  if (lockedOpen) {
    return (
      <Card className={cn("w-full", cardClassName)}>
        <CardHeader className={cn("pb-3", headerClassName)}>
          <div className="flex items-center justify-between">
            {header}
          </div>
        </CardHeader>
        <CardContent className={cn("space-y-4", contentClassName)}>
          {children}
        </CardContent>
      </Card>
    );
  }

  if (lockedClosed) {
    return (
      <Card className={cn("w-full", cardClassName)}>
        <CardHeader className={cn("pb-3 select-none", headerClassName)}>
          <div className="flex items-center justify-between">
            {header}
          </div>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className={cn("w-full", cardClassName)}>
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader
            role="button"
            aria-expanded={open}
            onClick={() => setOpen(prev => !prev)}
            className={cn("pb-3 cursor-pointer select-none", headerClassName)}
          >
            <div className="flex items-center justify-between">
              {header}
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div style={{ display: open ? 'block' : 'none' }} aria-hidden={!open}>
            <CardContent className={cn("space-y-4", contentClassName)}>
              {children}
            </CardContent>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
