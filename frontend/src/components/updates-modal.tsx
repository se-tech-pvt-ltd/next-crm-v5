import React from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

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

const updates: UpdateItem[] = [
  {
    id: 'team-privacy',
    title: 'Team privacy settings',
    date: '09.08.2025',
    excerpt: 'Added team-level privacy controls for tasks.',
    body: (
      <div className="space-y-3">
        <p>We\'ve added a new Team Privacy Settings option to give you more control over what tasks are visible at the team level.</p>
        <p>By default, teams can see all tasks assigned to their members across all projects. Now, you can turn this off for more privacy, showing only the tasks created within that specific team.</p>
        <p>This way, you decide whether your team\'s view is wide and collaborative or focused and private.</p>
        <div className="border rounded-md overflow-hidden">
          <div className="px-4 py-2 border-b font-semibold">Team settings</div>
          <div className="p-4 space-y-3">
            <label className="block text-sm text-muted-foreground">Team name</label>
            <input className="w-full h-10 px-3 rounded-md border bg-white" placeholder="Team name" />
            <div className="pt-1">
              <Button className="h-9 px-4">Save</Button>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'number-format',
    title: 'Number format settings',
    date: '09.08.2025',
    excerpt: 'Choose locales and separators for numbers and currency.',
    body: (
      <div className="space-y-3">
        <p>You can now configure number and currency formats per workspace. Choose locale, thousand and decimal separators.</p>
      </div>
    ),
  },
  {
    id: 'faster-loading',
    title: 'Faster web app loading',
    date: '09.08.2025',
    excerpt: 'Startup time improved across pages.',
    body: (
      <div className="space-y-3">
        <p>We\'ve reduced bundle sizes and optimized queries to make navigation snappier.</p>
      </div>
    ),
  },
];

export const UpdatesModal: React.FC<UpdatesModalProps> = ({ open, onOpenChange }) => {
  const [active, setActive] = React.useState(0);

  React.useEffect(() => {
    if (!open) setActive(0);
  }, [open]);

  const next = () => setActive((i) => (i + 1) % updates.length);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent hideClose className="p-0 sm:max-w-4xl md:max-w-5xl w-[96vw] h-[520px] sm:h-[560px] grid grid-rows-[auto_1fr_auto]">
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
        <div className="bg-white px-3 sm:px-5 py-4 overflow-y-auto min-h-0">
          <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-4 min-h-0">
            {/* Left list */}
            <div className="border rounded-md overflow-hidden bg-gray-50 h-full">
              <ScrollArea className="h-full">
                <ul>
                  {updates.map((u, idx) => (
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

            {/* Right panel */}
            <div className="border rounded-md p-4 h-full overflow-auto">
              <h3 className="text-xl font-semibold mb-2">{updates[active].title}</h3>
              <div className="prose prose-sm max-w-none">
                {updates[active].body}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-gray-50 rounded-b-md flex items-center justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
          <Button onClick={next}>Next</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
