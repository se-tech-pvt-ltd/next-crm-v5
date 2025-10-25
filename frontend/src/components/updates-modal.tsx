import React from 'react';
import DOMPurify from 'dompurify';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import * as UpdatesService from '@/services/updates';
import { useQuery } from '@tanstack/react-query';

interface UpdateItem {
  id: string;
  title: string;
  date: string; // ISO or human readable
  excerpt: string;
  body: React.ReactNode;
}

interface UpdatesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const formatDate = (d: string | Date) => {
  try {
    const date = d instanceof Date ? d : new Date(d);
    return date.toLocaleDateString();
  } catch {
    return String(d);
  }
};

function mapUpdate(u: any): UpdateItem {
  const sanitizedBody = DOMPurify.sanitize(u.body || '', { ADD_ATTR: ['data-attachment-id'] });
  return {
    id: u.id,
    title: u.subject || '',
    date: u.createdOn ? formatDate(u.createdOn) : '',
    excerpt: u.subjectDesc || '',
    body: (<div className="prose prose-sm max-w-none break-words" dangerouslySetInnerHTML={{ __html: sanitizedBody }} />),
  };
}

export const UpdatesModal: React.FC<UpdatesModalProps> = ({ open, onOpenChange }) => {
  const [active, setActive] = React.useState(0);

  const { data: fetched = [], isFetching } = useQuery({
    queryKey: ['/api/updates'],
    queryFn: UpdatesService.listUpdates,
    enabled: open,
    staleTime: 30_000,
  });

  const items = Array.isArray(fetched) ? fetched.map(mapUpdate) : [];

  React.useEffect(() => {
    if (!open) setActive(0);
  }, [open]);

  const next = () => setActive((i) => (i + 1) % (items.length || 1));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent hideClose className="p-0 sm:max-w-4xl md:max-w-6xl w-[92vw] h-[460px] sm:h-[500px] grid grid-rows-[auto_1fr_auto]">
        <DialogTitle className="sr-only">Latest Updates</DialogTitle>
        {/* Top bar */}
        <div className="bg-[#223E7D] text-white px-5 py-3 rounded-t-md flex items-center justify-between">
          <div className="text-lg sm:text-xl font-semibold">Latest Updates</div>
          <button
            aria-label="Close"
            onClick={() => onOpenChange(false)}
            className="h-8 w-8 rounded-full bg-white/15 hover:bg-white/25 grid place-items-center"
          >
            <span className="sr-only">Close</span>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" className="text-white">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="bg-white px-3 sm:px-5 py-4 overflow-hidden min-h-0 h-full">
          <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-4 min-h-0 h-full">
            {/* Left list (fixed column with its own scroll) */}
            <div className="border rounded-md overflow-hidden bg-gray-50 h-full">
              <ScrollArea className="h-full">
                <ul>
                  {items.length === 0 && !isFetching && (
                    <li className="px-4 py-6 text-sm text-gray-500">No updates yet.</li>
                  )}
                  {items.map((u, idx) => (
                    <li key={u.id}>
                      <button
                        onClick={() => setActive(idx)}
                        className={`w-full text-left px-4 py-3 border-b last:border-b-0 ${idx === active ? 'bg-white shadow-inner' : 'hover:bg-white/60'}`}
                        aria-current={idx === active ? 'true' : undefined}
                      >
                        <div className="font-medium text-sm">{u.title}</div>
                        <div className="text-[11px] text-gray-500 mt-0.5">{u.date}</div>
                      </button>
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            </div>

            {/* Right panel (independent scroll) */}
            <div className="border rounded-md p-4 h-full overflow-auto min-h-0">
              {items[active] ? (
                <>
                  <h3 className="text-xl font-semibold mb-2">{items[active].title}</h3>
                  <div className="prose prose-sm max-w-none">{items[active].body}</div>
                </>
              ) : (
                <div className="text-sm text-gray-500">Select an update to view details.</div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-gray-50 rounded-b-md flex items-center justify-end gap-3">
          <Button onClick={next}>Next</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
