import React from 'react';
import DOMPurify from 'dompurify';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RichTextEditor, isHtmlContentEmpty } from '@/components/ui/rich-text-editor';
import { useToast } from '@/hooks/use-toast';
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
  const { toast } = useToast();
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
    mutationFn: async () => {
      const sanitizedBody = DOMPurify.sanitize(body, { ADD_ATTR: ['data-attachment-id'] });
      const tmp = document.createElement('div');
      tmp.innerHTML = sanitizedBody;
      const ids = Array.from(tmp.querySelectorAll('img'))
        .map((img) => (img.getAttribute('data-attachment-id') || '').trim())
        .filter((v, i, a) => v.length > 0 && a.indexOf(v) === i);
      return UpdatesService.createUpdate({
        subject: subject.trim(),
        subjectDesc: subjectDesc.trim(),
        body: sanitizedBody,
        imageIds: ids,
      });
    },
    onSuccess: () => {
      setSubject(''); setSubjectDesc(''); setBody(''); setShowForm(false);
      queryClient.invalidateQueries({ queryKey: ['/api/updates'] });
      toast({ title: 'Update created', description: 'New update published successfully.' });
    },
    onError: (error: any) => {
      const message = error?.message || 'Failed to create update';
      toast({ title: 'Could not create update', description: message, variant: 'destructive' });
    },
  });

  React.useEffect(() => {
    if (active >= updates.length) setActive(0);
  }, [updates, active]);

  const UPLOAD_API_BASE = 'https://sales.crm-setech.cloud/api';
  const ASSET_BASE = 'https://sales.crm-setech.cloud';

  const rewriteImageSrcs = React.useCallback((html: string) => {
    try {
      const container = document.createElement('div');
      container.innerHTML = html || '';
      const imgs = Array.from(container.querySelectorAll('img'));
      const uploadBase = UPLOAD_API_BASE.replace(/\/$/, '');
      const assetBase = ASSET_BASE.replace(/\/$/, '');
      const assetDomain = assetBase.replace(/\/api\/?$/, '');
      for (const img of imgs) {
        const src = img.getAttribute('src') || '';
        if (/^https?:\/\//i.test(src)) continue;
        let abs = src;
        if (src.startsWith('/api/uploads')) {
          abs = `${assetDomain}${src.replace(/^\/api/, '')}`;
        } else if (src.startsWith('/uploads')) {
          abs = `${assetDomain}${src}`;
        } else if (src.startsWith('/api/')) {
          // other api paths -> keep domain but keep api
          abs = `${assetDomain}${src}`;
        } else if (src.startsWith('/')) {
          abs = `${uploadBase}${src}`;
        } else {
          abs = `${uploadBase}/${src}`;
        }
        img.setAttribute('src', abs);
      }
      return container.innerHTML;
    } catch { return html; }
  }, []);

  const sanitizedActiveBody = React.useMemo(() => {
    const clean = DOMPurify.sanitize(updates[active]?.body ?? '');
    return rewriteImageSrcs(clean);
  }, [updates, active, rewriteImageSrcs]);

  const canSubmit = React.useMemo(() => subject.trim().length > 0 && subjectDesc.trim().length > 0 && !isHtmlContentEmpty(body), [subject, subjectDesc, body]);

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
            <RichTextEditor value={body} onChange={setBody} placeholder="Details" disabled={createMutation.isPending} assetBaseApiUrl={API_BASE} uploadBaseApiUrl={API_BASE} />
          </div>
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setShowForm(false);
                setSubject('');
                setSubjectDesc('');
                setBody('');
              }}
              disabled={createMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => createMutation.mutate()}
              disabled={!canSubmit || createMutation.isPending}
            >
              Create
            </Button>
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
              {isHtmlContentEmpty(sanitizedActiveBody) ? (
                <div className="text-sm text-gray-500">No details provided.</div>
              ) : (
                <div className="prose prose-sm max-w-none break-words" dangerouslySetInnerHTML={{ __html: sanitizedActiveBody }} />
              )}
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
