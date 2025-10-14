import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';

interface UpdateItem {
  id: string;
  title: string;
  date: string; // ISO or human readable
  excerpt: string;
  body: React.ReactNode;
}

const updates: UpdateItem[] = [
  {
    id: 'team-privacy',
    title: 'Team privacy settings',
    date: '09.08.2025',
    excerpt: 'Added team-level privacy controls for tasks.',
    body: (
      <div className="space-y-3">
        <p>We've added a new Team Privacy Settings option to give you more control over what tasks are visible at the team level.</p>
        <p>By default, teams can see all tasks assigned to their members across all projects. Now, you can turn this off for more privacy, showing only the tasks created within that specific team.</p>
        <p>This way, you decide whether your team's view is wide and collaborative or focused and private.</p>
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
        <p>We've reduced bundle sizes and optimized queries to make navigation snappier.</p>
      </div>
    ),
  },
];

const UpdatesSection: React.FC = () => {
  const [active, setActive] = React.useState(0);

  const next = () => setActive((i) => (i + 1) % updates.length);

  return (
    <div className="bg-white px-0 sm:px-0 py-0 overflow-hidden min-h-0">
      <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-4 min-h-0">
        <div className="border rounded-md overflow-hidden bg-gray-50 h-[360px]">
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
                    <div className="text-[12px] text-gray-600 mt-1 line-clamp-2">{u.excerpt}</div>
                  </button>
                </li>
              ))}
            </ul>
          </ScrollArea>
        </div>

        <div className="border rounded-md p-4 h-[360px] overflow-auto min-h-0">
          <h3 className="text-lg font-semibold mb-2">{updates[active].title}</h3>
          <div className="text-[11px] text-gray-500 mb-2">{updates[active].date}</div>
          <div className="prose prose-sm max-w-none">
            {updates[active].body}
          </div>
          <div className="pt-3">
            <Button size="sm" onClick={next}>Next</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpdatesSection;
