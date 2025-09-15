import React, { useState, useEffect, useRef } from 'react';
import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { getConfiguration, setConfiguration, testSmtp } from '@/services/configurations';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function SmtpSection({ toast }: { toast: (v: any) => void }) {
  const { data } = useQuery({ queryKey: ['/api/configurations/smtp'], queryFn: () => getConfiguration<any>('smtp') });
  const [form, setForm] = useState({ host: '', port: 587, secure: false, user: '', pass: '', fromEmail: '' });
  const { user } = useAuth();

  useEffect(() => {
    if (data) {
      setForm({
        host: data.host || '',
        port: typeof data.port === 'number' ? data.port : parseInt(data.port || '587'),
        secure: !!data.secure,
        user: data.user || '',
        pass: data.pass || '',
        fromEmail: data.fromEmail || '',
      });
    }
  }, [data]);

  const [editing, setEditing] = useState(false);
  const originalRef = useRef<any>(null);

  const saveMut = useMutation({
    mutationFn: () => setConfiguration('smtp', form),
    onSuccess: () => {
      toast({ title: 'Saved', description: 'SMTP configuration saved', duration: 2500 });
      setEditing(false);
      // update original snapshot
      originalRef.current = { ...form };
    }
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [testEmailInput, setTestEmailInput] = useState<string>('');
  const [logs, setLogs] = useState<string[]>([]);
  const [isTesting, setIsTesting] = useState(false);
  const logsRef = useRef<HTMLDivElement | null>(null);

  const appendLog = (msg: string) => {
    setLogs((l) => [...l, `${new Date().toLocaleTimeString()}: ${msg}`]);
    // scroll after state updates
    setTimeout(() => {
      if (logsRef.current) logsRef.current.scrollTop = logsRef.current.scrollHeight;
    }, 50);
  };

  const isEmailValid = (s?: string) => !!s && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

  const runTest = async () => {
    if (!isEmailValid(testEmailInput)) {
      appendLog('Invalid test email address');
      return;
    }
    setLogs([]);
    setIsTesting(true);
    try {
      appendLog('Starting SMTP test...');
      appendLog('Verifying configuration...');
      // call backend
      const res = await testSmtp(testEmailInput, form);
      appendLog('SMTP verification and send complete.');
      if (res && res.messageId) appendLog(`MessageId: ${res.messageId}`);
      if (res && (res as any).envelope) appendLog(`Envelope: ${JSON.stringify((res as any).envelope)}`);
      if (res && (res as any).accepted) appendLog(`Accepted: ${JSON.stringify((res as any).accepted)}`);
      if (res && (res as any).rejected) appendLog(`Rejected: ${JSON.stringify((res as any).rejected)}`);
      if (res && (res as any).pending) appendLog(`Pending: ${JSON.stringify((res as any).pending)}`);
      if (res && (res as any).response) appendLog(`Response: ${String((res as any).response)}`);
      if (res && (res as any).message) appendLog(String((res as any).message));
      appendLog('Test succeeded');
    } catch (err: any) {
      appendLog(`Test failed: ${err?.message || String(err)}`);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <>
      <div className="grid sm:grid-cols-2 gap-2">
        <div>
          <Label>Host</Label>
          <Input className="mt-1" value={form.host} onChange={(e) => setForm((s) => ({ ...s, host: e.target.value }))} />
        </div>
        <div>
          <Label>Port</Label>
          <Input className="mt-1" type="number" value={form.port} onChange={(e) => setForm((s) => ({ ...s, port: Number(e.target.value) }))} />
        </div>
        <div className="flex items-center gap-2 mt-1">
          <Switch checked={form.secure} onCheckedChange={(v) => setForm((s) => ({ ...s, secure: !!v }))} />
          <Label>Use TLS/SSL</Label>
        </div>
        <div>
          <Label>Username</Label>
          <Input className="mt-1" value={form.user} onChange={(e) => setForm((s) => ({ ...s, user: e.target.value }))} />
        </div>
        <div>
          <Label>Password</Label>
          <Input className="mt-1" type="password" value={form.pass} onChange={(e) => setForm((s) => ({ ...s, pass: e.target.value }))} />
        </div>
        <div>
          <Label>From email</Label>
          <Input className="mt-1" type="email" value={form.fromEmail} onChange={(e) => setForm((s) => ({ ...s, fromEmail: e.target.value }))} />
        </div>

        <div className="col-span-full flex items-center gap-2">
          <Button type="button" onClick={() => saveMut.mutate()} disabled={!form.host || !form.port || !form.user || !form.fromEmail}>Save settings</Button>

          <Dialog open={modalOpen} onOpenChange={setModalOpen}>
            <DialogTrigger asChild>
              <Button type="button" variant="outline">Test Configuration</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Test SMTP configuration</DialogTitle>
              </DialogHeader>

              <div className="grid gap-2">
                <div>
                  <Label>Recipient email</Label>
                  <Input className="mt-1" type="email" value={testEmailInput} onChange={(e) => setTestEmailInput(e.target.value)} placeholder={user?.email || 'name@example.com'} />
                </div>

                <div className="flex gap-2">
                  <Button type="button" onClick={runTest} disabled={isTesting || !isEmailValid(testEmailInput)}>{isTesting ? 'Running…' : 'Execute test'}</Button>
                  <Button type="button" variant="outline" onClick={() => { setLogs([]); setTestEmailInput(''); }}>Reset</Button>
                </div>

                <div className="mt-2">
                  <div className="text-xs text-muted-foreground mb-1">Logs</div>
                  <div ref={logsRef} className="h-48 border rounded p-2 bg-black/5 overflow-auto text-xs font-mono">
                    {logs.length === 0 ? <div className="text-muted-foreground">No logs yet</div> : (
                      <ScrollArea className="h-full">
                        <div className="space-y-1">
                          {logs.map((l, i) => <div key={i}>{l}</div>)}
                        </div>
                      </ScrollArea>
                    )}
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </>
  );
}
