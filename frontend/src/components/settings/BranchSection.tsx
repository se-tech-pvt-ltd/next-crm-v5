import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import * as BranchesService from '@/services/branches';

export default function BranchSection({ toast }: { toast: (v: any) => void }) {
  const { data: branches = [], refetch } = useQuery({
    queryKey: ['/api/configurations/branches'],
    queryFn: async () => BranchesService.listBranches(),
  });

  const [form, setForm] = useState({
    name: '',
    city: '',
    country: '',
    address: '',
    officialPhone: '',
    officialEmail: '',
    branchHead: '',
    code: '',
    status: 'active',
  });

  const [modalOpen, setModalOpen] = useState(false);

  const createMutation = useMutation({
    mutationFn: () => BranchesService.createBranch({ ...form }),
    onSuccess: async () => {
      setForm({ name: '', city: '', country: '', address: '', officialPhone: '', officialEmail: '', branchHead: '', code: '', status: 'active' });
      setModalOpen(false);
      await refetch();
      toast({ title: 'Branch created', description: 'New branch added', duration: 2500 });
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">Existing branches</div>
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogTrigger asChild>
            <Button type="button">Add new branch</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add Branch</DialogTitle>
            </DialogHeader>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              <div>
                <Label>Branch Name</Label>
                <Input className="mt-1" value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} />
              </div>

              <div>
                <Label>City</Label>
                <Input className="mt-1" value={form.city} onChange={(e) => setForm((s) => ({ ...s, city: e.target.value }))} />
              </div>

              <div>
                <Label>Country</Label>
                <Input className="mt-1" value={form.country} onChange={(e) => setForm((s) => ({ ...s, country: e.target.value }))} />
              </div>

              <div>
                <Label>Address</Label>
                <Input className="mt-1" value={form.address} onChange={(e) => setForm((s) => ({ ...s, address: e.target.value }))} />
              </div>

              <div>
                <Label>Official Phone</Label>
                <Input className="mt-1" value={form.officialPhone} onChange={(e) => setForm((s) => ({ ...s, officialPhone: e.target.value }))} inputMode="tel" autoComplete="tel" />
              </div>

              <div>
                <Label>Official Email</Label>
                <Input className="mt-1" value={form.officialEmail} onChange={(e) => setForm((s) => ({ ...s, officialEmail: e.target.value }))} type="email" autoComplete="off" />
              </div>

              <div>
                <Label>Branch Head</Label>
                <Input className="mt-1" value={form.branchHead} onChange={(e) => setForm((s) => ({ ...s, branchHead: e.target.value }))} />
              </div>

              <div>
                <Label>Code</Label>
                <Input className="mt-1" value={form.code} onChange={(e) => setForm((s) => ({ ...s, code: e.target.value }))} />
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

              <div className="col-span-full flex gap-2">
                <Button onClick={() => createMutation.mutate()} disabled={!form.name}>Save</Button>
                <Button variant="outline" onClick={() => { setForm({ name: '', city: '', country: '', address: '', officialPhone: '', officialEmail: '', branchHead: '', code: '', status: 'active' }); setModalOpen(false); }}>Cancel</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div>
        <Button type="button" onClick={() => createMutation.mutate()} disabled={!form.name}>
          Add branch
        </Button>
      </div>

      <Separator />

      <div>
        <div className="text-sm font-medium mb-2">Existing branches</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
          {branches.map((b: any) => (
            <div key={b.id} className="border rounded-md p-2 text-sm">
              <div className="font-semibold">{b.name} <span className="text-muted-foreground">({b.code})</span></div>
              <div className="text-xs text-muted-foreground">{[b.city, b.country].filter(Boolean).join(', ')} {b.address ? `• ${b.address}` : ''}</div>
              <div className="text-xs text-muted-foreground mt-1">Phone: {b.officialPhone || '-'} • Email: {b.officialEmail || '-'}</div>
              <div className="text-xs text-muted-foreground mt-1">Head: {b.branchHead || '-'}</div>
            </div>
          ))}
          {branches.length === 0 && <div className="text-xs text-muted-foreground">No branches yet</div>}
        </div>
      </div>
    </div>
  );
}
