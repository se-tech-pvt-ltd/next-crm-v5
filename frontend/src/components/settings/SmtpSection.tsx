import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { getConfiguration, setConfiguration, testSmtp } from '@/services/configurations';
import { useAuth } from '@/contexts/AuthContext';

export default function SmtpSection({ toast }: { toast: (v: any) => void }) {
  const { data } = useQuery({ queryKey: ['/api/configurations/smtp'], queryFn: () => getConfiguration<any>('smtp') });
  const [form, setForm] = useState({ host: '', port: 587, secure: false, user: '', pass: '', fromEmail: '' });
  const { user } = useAuth();
  const [testEmail, setTestEmail] = useState<string>('');

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

  useEffect(() => {
    const candidate = (user?.email && String(user.email)) || (data?.fromEmail && String(data.fromEmail)) || '';
    setTestEmail((prev) => prev || candidate);
  }, [data, user]);

  const saveMut = useMutation({ mutationFn: () => setConfiguration('smtp', form), onSuccess: () => toast({ title: 'Saved', description: 'SMTP configuration saved', duration: 2500 }) });

  const isEmailValid = (s?: string) => !!s && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
  const testMut = useMutation({
    mutationFn: async () => {
      return await testSmtp(testEmail, form);
    },
    onSuccess: () => toast({ title: 'Test email sent', description: `Sent to ${testEmail}`, duration: 3000 }),
    onError: (err: any) => toast({ title: 'Failed to send', description: err?.message || 'Unknown error', duration: 3500, variant: 'destructive' }),
  });

  return (
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
      <div>
        <Label>Send test to</Label>
        <Input className="mt-1" type="email" value={testEmail} onChange={(e) => setTestEmail(e.target.value)} placeholder="name@example.com" />
      </div>
      <div className="col-span-full flex items-center gap-2">
        <Button type="button" onClick={() => saveMut.mutate()} disabled={!form.host || !form.port || !form.user || !form.fromEmail}>Save settings</Button>
        <Button type="button" variant="outline" onClick={() => testMut.mutate()} disabled={!isEmailValid(testEmail) || !form.host || !form.port || !form.user || !form.fromEmail || testMut.isPending}>
          {testMut.isPending ? 'Sending…' : 'Send test email'}
        </Button>
      </div>
    </div>
  );
}
