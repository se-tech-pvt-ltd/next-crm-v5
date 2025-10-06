import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { X } from 'lucide-react';
import React from 'react';

interface DetailsDialogLayoutProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  headerLeft?: React.ReactNode;
  headerRight?: React.ReactNode;
  statusBar?: React.ReactNode;
  statusBarWrapperClassName?: string;
  leftContent: React.ReactNode;
  rightContent?: React.ReactNode;
  rightWidth?: string; // e.g. '420px'
  rightWidthClassName?: string; // legacy support e.g. 'w-[420px]'
  contentClassName?: string;
  headerClassName?: string; // e.g. 'bg-primary text-primary-foreground'
  showDefaultClose?: boolean;
  autoHeight?: boolean; // when true, dialog body auto-fits content up to a max height
}

export const DetailsDialogLayout: React.FC<DetailsDialogLayoutProps> = ({
  open,
  onOpenChange,
  title,
  headerLeft,
  headerRight,
  statusBar,
  statusBarWrapperClassName = 'px-4 py-2 bg-gray-50 border-t',
  leftContent,
  rightContent,
  rightWidth,
  rightWidthClassName = 'w-[420px]',
  contentClassName = 'no-not-allowed max-w-6xl w-[95vw] max-h-[90vh] overflow-hidden p-0 rounded-xl shadow-xl',
  headerClassName = 'bg-white',
  showDefaultClose,
  autoHeight = false,
}) => {
  const hasRight = !!rightContent;
  // Determine right pane width (support old prop form like 'w-[420px]')
  const extracted = rightWidthClassName?.match(/\[(.+?)\]/)?.[1];
  const rightPaneWidth = rightWidth || extracted || '420px';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent hideClose className={contentClassName}>
        <DialogTitle className="sr-only">{title}</DialogTitle>
        <div className={`flex flex-col ${autoHeight ? 'max-h-[85vh]' : 'h-[90vh]'} min-h-0 bg-[#EDEDED]`}>
          {/* Header */}
          <div className="sticky top-0 z-20">
            <div className={`px-4 py-3 flex items-center justify-between ${headerClassName}`}>
              <div className="min-w-0 flex-1">{headerLeft}</div>
              <div className="flex items-center gap-2">
                {headerRight}
                {showDefaultClose && (
                  <button
                    type="button"
                    aria-label="Close"
                    onClick={() => onOpenChange(false)}
                    className="rounded-full w-8 h-8 inline-flex items-center justify-center bg-white/80 text-gray-700 hover:bg-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
            {statusBar && (
              <div className={statusBarWrapperClassName}>{statusBar}</div>
            )}
          </div>

          {/* Body */}
          <div className={hasRight ? 'grid flex-1 min-h-0' : `flex flex-col flex-1 min-h-0 ${autoHeight ? '' : 'overflow-hidden'}`} style={hasRight ? { gridTemplateColumns: `1fr ${rightPaneWidth}` } : undefined}>
            <div className="flex flex-col min-h-0">
              <div className={`pt-3 px-4 pb-4 space-y-4 min-h-0 ${autoHeight ? 'overflow-y-visible' : 'flex-1 overflow-y-auto'}`}>
                {leftContent}
              </div>
            </div>
            {hasRight && (
              <div className="border-l bg-white flex flex-col min-h-0" style={{ width: rightPaneWidth }}>
                <div className={`p-4 min-h-0 ${autoHeight ? 'overflow-y-visible' : 'flex-1 overflow-y-auto'}`}>
                  {rightContent}
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
