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
import * as RegionsService from '@/services/regions';
import * as BranchEmpService from '@/services/branchEmps';
import { Database, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination } from '@/components/ui/pagination';

export default function BranchSection({ toast }: { toast: (v: any) => void }) {
  const { data: branches = [], refetch } = useQuery({
    queryKey: ['/api/configurations/branches'],
    queryFn: async () => BranchesService.listBranches(),
  });

  const { data: users = [] } = useQuery({
    queryKey: ['/api/users'],
    queryFn: async () => UsersService.getUsers(),
  });

  const { data: regions = [] } = useQuery({
    queryKey: ['/api/regions'],
    queryFn: async () => RegionsService.listRegions(),
  });

  const [form, setForm] = useState({
    name: '',
    city: '',
    country: '',
    address: '',
    officialPhone: '',
    officialEmail: '',
    managerId: '',
    regionId: '',
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [filters, setFilters] = useState({ name: '', country: '', city: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;
  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState<any | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', city: '', country: '', address: '', officialPhone: '', officialEmail: '', managerId: '', regionId: '' });

  // Branch employees and expand/collapse state
  const { data: branchEmps = [] } = useQuery({ queryKey: ['/api/branch-emps'], queryFn: () => BranchEmpService.listBranchEmps(), staleTime: 30000 });
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

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

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!selected?.id) throw new Error('Missing branch id');
      return BranchesService.updateBranch(String(selected.id), { ...editForm });
    },
    onSuccess: async () => {
      setIsEditing(false);
      await refetch();
      toast({ title: 'Branch updated', duration: 2000 });
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err?.message || 'Failed to update branch';
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

  React.useEffect(() => {
    setCurrentPage(1);
  }, [filters.name, filters.country, filters.city]);

  const total = filteredBranches.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const hasPrevPage = currentPage > 1;
  const hasNextPage = currentPage < totalPages;
  const start = (currentPage - 1) * pageSize;
  const end = start + pageSize;
  const pageItems = filteredBranches.slice(start, end);

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
                    {(() => {
                      const regionHeadIds = new Set((regions as any[]).map((r: any) => r.regionHeadId).filter(Boolean));
                      const branchHeadIds = new Set((branches as any[]).map((b: any) => b.branchHeadId).filter(Boolean));
                      const available = (users as any[])
                        .filter((u: any) => u.role === 'branch_manager' || u.role === 'admin_staff')
                        .filter((u: any) => !regionHeadIds.has(u.id) && !branchHeadIds.has(u.id));
                      return available.length === 0 ? (
                        <SelectItem value="__no_eligible__" disabled>No eligible users</SelectItem>
                      ) : (
                        available.map((u: any) => (
                          <SelectItem key={u.id} value={u.id}>
                            {(u.firstName || '') + ' ' + (u.lastName || '')} {u.email ? `- ${u.email}` : ''}
                          </SelectItem>
                        ))
                      );
                    })()}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Region</Label>
                <Select value={form.regionId} onValueChange={(v) => setForm((s) => ({ ...s, regionId: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select region" /></SelectTrigger>
                  <SelectContent>
                    {regions.length === 0 ? (
                      <SelectItem value="__no_regions__" disabled>No regions found</SelectItem>
                    ) : (
                      (regions as any[]).map((r: any) => (
                        <SelectItem key={r.id} value={r.id}>{r.regionName}</SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>


              <div className="col-span-full flex gap-2">
                <Button
                  onClick={() => createMutation.mutate()}
                  disabled={![form.name, form.city, form.country, form.address, form.officialPhone, form.officialEmail].every(Boolean)}
                >
                  Save
                </Button>
                <Button variant="outline" onClick={() => { setForm({ name: '', city: '', country: '', address: '', officialPhone: '', officialEmail: '', managerId: '', regionId: '' }); setModalOpen(false); }}>Cancel</Button>
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
            <Table className="text-xs">
              <TableHeader>
                <TableRow>
                  <TableHead className="h-8 px-2 text-[11px]">Name</TableHead>
                  <TableHead className="h-8 px-2 text-[11px]">Region</TableHead>
                  <TableHead className="h-8 px-2 text-[11px]">Country</TableHead>
                  <TableHead className="h-8 px-2 text-[11px]">City</TableHead>
                  <TableHead className="h-8 px-2 text-[11px]">Official Phone</TableHead>
                  <TableHead className="h-8 px-2 text-[11px]">Official Email</TableHead>
                  <TableHead className="h-8 px-2 text-[11px]">Head</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(pageItems as any[]).map((b: any) => {
                  const headUser = (users as any[]).find((u: any) => u.id === (b.branchHeadId || b.managerId));
                  const headName = headUser ? (`${headUser.firstName || ''} ${headUser.lastName || ''}`.trim() || headUser.email || '-') : '-';
                  return (
                    <TableRow key={b.id} className="cursor-pointer hover:bg-gray-50" onClick={() => {
                      setSelected(b);
                      setEditForm({
                        name: String(b.branchName || b.name || ''),
                        city: String(b.city || ''),
                        country: String(b.country || ''),
                        address: String(b.address || ''),
                        officialPhone: String(b.officialPhone || ''),
                        officialEmail: String(b.officialEmail || ''),
                        managerId: String(b.branchHeadId || b.managerId || ''),
                        regionId: String((b as any).regionId || ''),
                      });
                      setIsEditing(false);
                      setDetailOpen(true);
                    }}>
                      <TableCell className="font-medium p-2 text-xs">{b.branchName || b.name || '-'}</TableCell>
                      <TableCell className="p-2 text-xs">{(() => {
                        const r = (regions as any[]).find((x: any) => x.id === (b as any).regionId);
                        return r?.regionName || '-';
                      })()}</TableCell>
                      <TableCell className="p-2 text-xs">{b.country || '-'}</TableCell>
                      <TableCell className="p-2 text-xs">{b.city || '-'}</TableCell>
                      <TableCell className="p-2 text-xs">{b.officialPhone || '-'}</TableCell>
                      <TableCell className="p-2 text-xs max-w-[240px] truncate" title={b.officialEmail || ''}>{b.officialEmail || '-'}</TableCell>
                      <TableCell className="p-2 text-xs">{headName}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            {total > pageSize && (
              <div className="mt-4 pt-4 border-t">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  hasNextPage={hasNextPage}
                  hasPrevPage={hasPrevPage}
                />
              </div>
            )}
          </div>
        )}
      </div>

      <Dialog open={detailOpen} onOpenChange={(o) => { setDetailOpen(o); if (!o) { setSelected(null); setIsEditing(false); } }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{selected?.branchName || selected?.name || 'Branch'}</span>
              {!isEditing ? (
                <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>Edit</Button>
              ) : null}
            </DialogTitle>
          </DialogHeader>

          {!isEditing ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="text-xs text-muted-foreground">Name</div>
                <div className="font-medium">{selected?.branchName || selected?.name || '-'}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Country</div>
                <div className="font-medium">{selected?.country || '-'}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">City</div>
                <div className="font-medium">{selected?.city || '-'}</div>
              </div>
              <div className="sm:col-span-2">
                <div className="text-xs text-muted-foreground">Address</div>
                <div className="font-medium break-words">{selected?.address || '-'}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Official Phone</div>
                <div className="font-medium">{selected?.officialPhone || '-'}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Official Email</div>
                <div className="font-medium truncate" title={selected?.officialEmail || ''}>{selected?.officialEmail || '-'}</div>
              </div>
              <div className="sm:col-span-2">
                <div className="text-xs text-muted-foreground">Branch Head</div>
                <div className="font-medium">{(() => {
                  const headUser = (users as any[]).find((u: any) => u.id === (selected?.branchHeadId || selected?.managerId));
                  return headUser ? ((`${headUser.firstName || ''} ${headUser.lastName || ''}`.trim()) || headUser.email || '-') : '-';
                })()}</div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              <div>
                <Label>Name<span className="text-destructive"> *</span></Label>
                <Input className="mt-1" value={editForm.name} onChange={(e) => setEditForm((s) => ({ ...s, name: e.target.value }))} />
              </div>
              <div>
                <Label>Country<span className="text-destructive"> *</span></Label>
                <Input className="mt-1" value={editForm.country} onChange={(e) => setEditForm((s) => ({ ...s, country: e.target.value }))} />
              </div>
              <div>
                <Label>City<span className="text-destructive"> *</span></Label>
                <Input className="mt-1" value={editForm.city} onChange={(e) => setEditForm((s) => ({ ...s, city: e.target.value }))} />
              </div>
              <div className="sm:col-span-2 md:col-span-3">
                <Label>Address<span className="text-destructive"> *</span></Label>
                <Input className="mt-1" value={editForm.address} onChange={(e) => setEditForm((s) => ({ ...s, address: e.target.value }))} />
              </div>
              <div>
                <Label>Official Phone<span className="text-destructive"> *</span></Label>
                <Input className="mt-1" value={editForm.officialPhone} onChange={(e) => setEditForm((s) => ({ ...s, officialPhone: e.target.value }))} />
              </div>
              <div>
                <Label>Official Email<span className="text-destructive"> *</span></Label>
                <Input className="mt-1" type="email" value={editForm.officialEmail} onChange={(e) => setEditForm((s) => ({ ...s, officialEmail: e.target.value }))} />
              </div>
              <div className="sm:col-span-2 md:col-span-3">
                <Label>Branch Head</Label>
                <Select value={editForm.managerId} onValueChange={(v) => setEditForm((s) => ({ ...s, managerId: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select branch head" /></SelectTrigger>
                  <SelectContent>
                    {(() => {
                      const regionHeadIds = new Set((regions as any[]).map((r: any) => r.regionHeadId).filter(Boolean));
                      const branchHeadIdsOther = new Set((branches as any[]).filter((b: any) => String(b.id) !== String(selected?.id)).map((b: any) => b.branchHeadId).filter(Boolean));
                      const available = (users as any[])
                        .filter((u: any) => ['branch_manager','regional_manager','admin','super_admin','admin_staff'].includes(u.role))
                        .filter((u: any) => !regionHeadIds.has(u.id) && (!branchHeadIdsOther.has(u.id) || String(u.id) === String(selected?.branchHeadId || selected?.managerId)));
                      return available.length === 0 ? (
                        <SelectItem value="__no_eligible__" disabled>No eligible users</SelectItem>
                      ) : (
                        available.map((u: any) => (
                          <SelectItem key={u.id} value={u.id}>
                            {(u.firstName || '') + ' ' + (u.lastName || '')} {u.email ? `- ${u.email}` : ''}
                          </SelectItem>
                        ))
                      );
                    })()}
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-2 md:col-span-3">
                <Label>Region</Label>
                <Select value={editForm.regionId} onValueChange={(v) => setEditForm((s) => ({ ...s, regionId: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select region" /></SelectTrigger>
                  <SelectContent>
                    {regions.length === 0 ? (
                      <SelectItem value="__no_regions__" disabled>No regions found</SelectItem>
                    ) : (
                      (regions as any[]).map((r: any) => (
                        <SelectItem key={r.id} value={r.id}>{r.regionName}</SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-full flex gap-2">
                <Button
                  onClick={() => updateMutation.mutate()}
                  disabled={!selected?.id || ![editForm.name, editForm.city, editForm.country, editForm.address, editForm.officialPhone, editForm.officialEmail].every(Boolean) || updateMutation.isPending}
                >
                  {updateMutation.isPending ? 'Saving...' : 'Save changes'}
                </Button>
                <Button variant="outline" onClick={() => { setIsEditing(false); }} disabled={updateMutation.isPending}>Cancel</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
