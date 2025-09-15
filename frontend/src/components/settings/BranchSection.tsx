import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import * as BranchesService from '@/services/branches';
import * as UsersService from '@/services/users';
import { Database, Plus } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function BranchSection({ toast }: { toast: (v: any) => void }) {
  const { data: branches = [], refetch } = useQuery({
    queryKey: ['/api/configurations/branches'],
    queryFn: async () => BranchesService.listBranches(),
  });

  const { data: users = [] } = useQuery({
    queryKey: ['/api/users'],
    queryFn: async () => UsersService.getUsers(),
  });

  const [form, setForm] = useState({
    name: '',
    city: '',
    country: '',
    address: '',
    officialPhone: '',
    officialEmail: '',
    managerId: '',
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [filters, setFilters] = useState({ name: '', country: '', city: '' });

  const createMutation = useMutation({
    mutationFn: () => BranchesService.createBranch({ ...form }),
    onSuccess: async () => {
      setForm({ name: '', city: '', country: '', address: '', officialPhone: '', officialEmail: '', managerId: '' });
      setModalOpen(false);
      await refetch();
      toast({ title: 'Branch created', description: 'New branch added', duration: 2500 });
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err?.message || 'Failed to create branch';
      toast({ title: 'Error', description: msg, variant: 'destructive', duration: 3000 });
    },
  });

  const filteredBranches = (Array.isArray(branches) ? branches : []).filter((b: any) => {
    const nameStr = String(b.branchName || b.name || '').toLowerCase();
    const countryStr = String(b.country || '').toLowerCase();
    const cityStr = String(b.city || '').toLowerCase();
    const fName = filters.name.toLowerCase();
    const fCountry = filters.country.toLowerCase();
    const fCity = filters.city.toLowerCase();
    return (
      (!fName || nameStr.includes(fName)) &&
      (!fCountry || countryStr.includes(fCountry)) &&
      (!fCity || cityStr.includes(fCity))
    );
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Input
            placeholder="Search name"
            className="h-8 w-40"
            value={filters.name}
            onChange={(e) => setFilters((s) => ({ ...s, name: e.target.value }))}
          />
          <Input
            placeholder="Country"
            className="h-8 w-32"
            value={filters.country}
            onChange={(e) => setFilters((s) => ({ ...s, country: e.target.value }))}
          />
          <Input
            placeholder="City"
            className="h-8 w-32"
            value={filters.city}
            onChange={(e) => setFilters((s) => ({ ...s, city: e.target.value }))}
          />
        </div>
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogTrigger asChild>
            <Button size="icon" className="h-7 w-7 p-0 bg-primary text-white shadow ring-2 ring-primary/40 hover:ring-primary" title="Add Branch" type="button">
              <Plus className="w-4 h-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add Branch</DialogTitle>
            </DialogHeader>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              <div>
                <Label>Branch Name<span className="text-destructive"> *</span></Label>
                <Input className="mt-1" value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} />
              </div>

              <div>
                <Label>Country<span className="text-destructive"> *</span></Label>
                <Input className="mt-1" value={form.country} onChange={(e) => setForm((s) => ({ ...s, country: e.target.value }))} />
              </div>

              <div>
                <Label>City<span className="text-destructive"> *</span></Label>
                <Input className="mt-1" value={form.city} onChange={(e) => setForm((s) => ({ ...s, city: e.target.value }))} />
              </div>

              <div>
                <Label>Address<span className="text-destructive"> *</span></Label>
                <Input className="mt-1" value={form.address} onChange={(e) => setForm((s) => ({ ...s, address: e.target.value }))} />
              </div>

              <div>
                <Label>Official Phone<span className="text-destructive"> *</span></Label>
                <Input className="mt-1" value={form.officialPhone} onChange={(e) => setForm((s) => ({ ...s, officialPhone: e.target.value }))} inputMode="tel" autoComplete="tel" />
              </div>

              <div>
                <Label>Official Email<span className="text-destructive"> *</span></Label>
                <Input className="mt-1" value={form.officialEmail} onChange={(e) => setForm((s) => ({ ...s, officialEmail: e.target.value }))} type="email" autoComplete="off" />
              </div>

              <div>
                <Label>Branch Head</Label>
                <Select value={form.managerId} onValueChange={(v) => setForm((s) => ({ ...s, managerId: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select branch head" /></SelectTrigger>
                  <SelectContent>
                    {users.length === 0 ? (
                      <SelectItem value="" disabled>No users found</SelectItem>
                    ) : (
                      users
                        .filter((u: any) => u.role === 'branch_manager' || u.role === 'admin_staff')
                        .map((u: any) => (
                          <SelectItem key={u.id} value={u.id}>
                            {(u.firstName || '') + ' ' + (u.lastName || '')} {u.email ? `- ${u.email}` : ''}
                          </SelectItem>
                        ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div>
              </div>


              <div className="col-span-full flex gap-2">
                <Button
                  onClick={() => createMutation.mutate()}
                  disabled={![form.name, form.city, form.country, form.address, form.officialPhone, form.officialEmail].every(Boolean)}
                >
                  Save
                </Button>
                <Button variant="outline" onClick={() => { setForm({ name: '', city: '', country: '', address: '', officialPhone: '', officialEmail: '', managerId: '' }); setModalOpen(false); }}>Cancel</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Separator />

      <div>
        {branches.length === 0 ? (
          <div className="border border-dashed rounded-md p-6 text-center">
            <div className="flex items-center justify-center mb-4">
              <Database className="w-10 h-10 text-muted-foreground" />
            </div>
            <div className="text-lg font-semibold">No branches yet</div>
            <div className="text-sm text-muted-foreground mt-2">You don't have any branches created. Create a branch to manage locations and assign branch managers.</div>
            <div className="mt-4 flex items-center justify-center gap-2">
              <Button onClick={() => setModalOpen(true)}>
                <Plus className="w-4 h-4 mr-2" /> Add your first branch
              </Button>
              <Button variant="outline" onClick={async () => { await refetch(); }}>
                Refresh
              </Button>
            </div>
          </div>
        ) : (
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>Official Phone</TableHead>
                  <TableHead>Official Email</TableHead>
                  <TableHead>Head</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(filteredBranches as any[]).map((b: any) => {
                  const headUser = (users as any[]).find((u: any) => u.id === (b.branchHeadId || b.managerId));
                  const headName = headUser ? (`${headUser.firstName || ''} ${headUser.lastName || ''}`.trim() || headUser.email || '-') : '-';
                  return (
                    <TableRow key={b.id}>
                      <TableCell className="font-medium">{b.branchName || b.name || '-'}</TableCell>
                      <TableCell>{b.country || '-'}</TableCell>
                      <TableCell>{b.city || '-'}</TableCell>
                      <TableCell>{b.officialPhone || '-'}</TableCell>
                      <TableCell className="max-w-[240px] truncate" title={b.officialEmail || ''}>{b.officialEmail || '-'}</TableCell>
                      <TableCell>{headName}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
