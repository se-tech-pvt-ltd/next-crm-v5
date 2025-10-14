import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as UpdatesService from '@/services/updates';

const formatDate = (d: string | Date) => {
  try {
    const date = d instanceof Date ? d : new Date(d);
    return date.toLocaleDateString();
  } catch { return String(d); }
};

const UpdatesSection: React.FC = () => {
  const queryClient = useQueryClient();
  const { data: updates = [], isFetching } = useQuery({
    queryKey: ['/api/updates'],
    queryFn: UpdatesService.listUpdates,
    staleTime: 30_000,
  });
  const [active, setActive] = React.useState(0);
  const [showForm, setShowForm] = React.useState(false);
  const [subject, setSubject] = React.useState('');
  const [subjectDesc, setSubjectDesc] = React.useState('');
  const [body, setBody] = React.useState('');

  const createMutation = useMutation({
    mutationFn: async () => UpdatesService.createUpdate({ subject, subjectDesc, body }),
    onSuccess: () => {
      setSubject(''); setSubjectDesc(''); setBody(''); setShowForm(false);
      queryClient.invalidateQueries({ queryKey: ['/api/updates'] });
    },
  });

  React.useEffect(() => {
    if (active >= updates.length) setActive(0);
  }, [updates, active]);

  return (
    <div className="bg-white px-0 sm:px-0 py-0 overflow-hidden min-h-0">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm text-gray-600">{updates.length} update{updates.length === 1 ? '' : 's'}</div>
        <Button size="sm" onClick={() => setShowForm(s => !s)}>{showForm ? 'Close' : 'New update'}</Button>
      </div>

      {showForm && (
        <div className="border rounded-md p-3 mb-3 space-y-2">
          <div>
            <label className="block text-sm mb-1">Subject</label>
            <Input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Subject" />
          </div>
          <div>
            <label className="block text-sm mb-1">Subject description</label>
            <Input value={subjectDesc} onChange={e => setSubjectDesc(e.target.value)} placeholder="Short description" />
          </div>
          <div>
            <label className="block text-sm mb-1">Body</label>
            <Textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Details" rows={5} />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={() => { setShowForm(false); }}>Cancel</Button>
            <Button size="sm" onClick={() => createMutation.mutate()} disabled={!subject || !subjectDesc || !body || createMutation.isPending}>Create</Button>
          </div>
        </div>
      )}

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
                    <div className="font-medium text-sm">{u.subject}</div>
                    <div className="text-[11px] text-gray-500 mt-0.5">{formatDate(u.createdOn)}</div>
                    <div className="text-[12px] text-gray-600 mt-1 line-clamp-2">{u.subjectDesc}</div>
                  </button>
                </li>
              ))}
              {(!updates || updates.length === 0) && !isFetching && (
                <li className="px-4 py-6 text-sm text-gray-500">No updates yet.</li>
              )}
            </ul>
          </ScrollArea>
        </div>

        <div className="border rounded-md p-4 h-[360px] overflow-auto min-h-0">
          {updates[active] ? (
            <>
              <h3 className="text-lg font-semibold mb-2">{updates[active].subject}</h3>
              <div className="text-[11px] text-gray-500 mb-2">{formatDate(updates[active].createdOn)}</div>
              <div className="prose prose-sm max-w-none whitespace-pre-wrap">{updates[active].body}</div>
            </>
          ) : (
            <div className="text-sm text-gray-500">Select an update to view details.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UpdatesSection;
