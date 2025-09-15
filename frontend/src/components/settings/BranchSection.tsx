import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import * as BranchesService from '@/services/branches';

export default function BranchSection({ toast }: { toast: (v: any) => void }) {
  const { data: branches = [], refetch } = useQuery({
    queryKey: ['/api/configurations/branches'],
    queryFn: async () => BranchesService.listBranches(),
  });

  const [form, setForm] = useState({ name: '', code: '', city: '', address: '', managerId: '', status: 'active' });
  const createMutation = useMutation({
    mutationFn: () => BranchesService.createBranch({ ...form }),
    onSuccess: async () => {
      setForm({ name: '', code: '', city: '', address: '', managerId: '', status: 'active' });
      await refetch();
      toast({ title: 'Branch created', description: 'New branch added', duration: 2500 });
    },
  });

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-3 gap-2">
        <div>
          <Label>Name</Label>
          <Input className="mt-1" value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} />
        </div>
        <div>
          <Label>Code</Label>
          <Input className="mt-1" value={form.code} onChange={(e) => setForm((s) => ({ ...s, code: e.target.value }))} />
        </div>
        <div>
          <Label>City</Label>
          <Input className="mt-1" value={form.city} onChange={(e) => setForm((s) => ({ ...s, city: e.target.value }))} />
        </div>
        <div>
          <Label>Address</Label>
          <Input className="mt-1" value={form.address} onChange={(e) => setForm((s) => ({ ...s, address: e.target.value }))} />
        </div>
        <div>
          <Label>Manager ID</Label>
          <Input className="mt-1" value={form.managerId} onChange={(e) => setForm((s) => ({ ...s, managerId: e.target.value }))} />
        </div>
        <div>
          <Label>Status</Label>
          <Select value={form.status} onValueChange={(v) => setForm((s) => ({ ...s, status: v }))}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Button type="button" onClick={() => createMutation.mutate()} disabled={!form.name || !form.code}>
          Add branch
        </Button>
      </div>

      <Separator />

      <div>
        <div className="text-sm font-medium mb-2">Existing branches</div>
        <div className="grid sm:grid-cols-2 gap-2">
          {branches.map((b: any) => (
            <div key={b.id} className="border rounded-md p-2 text-sm">
              <div className="font-semibold">{b.name} <span className="text-muted-foreground">({b.code})</span></div>
              <div className="text-xs text-muted-foreground">{b.city || ''} {b.address ? `• ${b.address}` : ''}</div>
            </div>
          ))}
          {branches.length === 0 && <div className="text-xs text-muted-foreground">No branches yet</div>}
        </div>
      </div>
    </div>
  );
}
