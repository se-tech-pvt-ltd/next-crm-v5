import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getConfiguration, setConfiguration } from '@/services/configurations';

export default function WhatsappSection({ toast }: { toast: (v: any) => void }) {
  const { data } = useQuery({ queryKey: ['/api/configurations/whatsapp'], queryFn: () => getConfiguration<any>('whatsapp') });
  const [provider, setProvider] = useState<'meta' | 'twilio'>('meta');
  const [meta, setMeta] = useState({ token: '', phoneNumber: '' });
  const [twilio, setTwilio] = useState({ accountSid: '', authToken: '', phoneNumber: '' });

  useEffect(() => {
    if (data) {
      if (data.provider === 'twilio') {
        setProvider('twilio');
        setTwilio({ accountSid: data.accountSid || '', authToken: data.authToken || '', phoneNumber: data.phoneNumber || '' });
      } else {
        setProvider('meta');
        setMeta({ token: data.token || '', phoneNumber: data.phoneNumber || '' });
      }
    }
  }, [data]);

  const saveMut = useMutation({
    mutationFn: () => setConfiguration('whatsapp', provider === 'twilio' ? { provider, ...twilio } : { provider, ...meta }),
    onSuccess: () => toast({ title: 'Saved', description: 'WhatsApp configuration saved', duration: 2500 }),
  });

  return (
    <div className="space-y-3">
      <div>
        <Label>Provider</Label>
        <Select value={provider} onValueChange={(v) => setProvider(v as any)}>
          <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="meta">Meta Cloud API</SelectItem>
            <SelectItem value="twilio">Twilio</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {provider === 'meta' ? (
        <div className="grid sm:grid-cols-2 gap-2">
          <div>
            <Label>Access token</Label>
            <Input className="mt-1" value={meta.token} onChange={(e) => setMeta((s) => ({ ...s, token: e.target.value }))} />
          </div>
          <div>
            <Label>Phone number</Label>
            <Input className="mt-1" value={meta.phoneNumber} onChange={(e) => setMeta((s) => ({ ...s, phoneNumber: e.target.value }))} />
          </div>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-2">
          <div>
            <Label>Account SID</Label>
            <Input className="mt-1" value={twilio.accountSid} onChange={(e) => setTwilio((s) => ({ ...s, accountSid: e.target.value }))} />
          </div>
          <div>
            <Label>Auth token</Label>
            <Input className="mt-1" value={twilio.authToken} onChange={(e) => setTwilio((s) => ({ ...s, authToken: e.target.value }))} />
          </div>
          <div>
            <Label>Phone number</Label>
            <Input className="mt-1" value={twilio.phoneNumber} onChange={(e) => setTwilio((s) => ({ ...s, phoneNumber: e.target.value }))} />
          </div>
        </div>
      )}
      <div>
        <Button type="button" onClick={() => saveMut.mutate()}>Save settings</Button>
      </div>
    </div>
  );
}
