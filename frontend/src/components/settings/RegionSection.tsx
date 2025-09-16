import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import * as RegionsService from '@/services/regions';
import * as UsersService from '@/services/users';
import * as BranchesService from '@/services/branches';
import { Globe2, Plus } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination } from '@/components/ui/pagination';

export default function RegionSection({ toast }: { toast: (v: any) => void }) {
  const { data: regions = [], refetch } = useQuery({
    queryKey: ['/api/regions'],
    queryFn: async () => RegionsService.listRegions(),
  });

  const { data: users = [] } = useQuery({
    queryKey: ['/api/users'],
    queryFn: async () => UsersService.getUsers(),
  });

  const { data: branches = [] } = useQuery({
    queryKey: ['/api/branches?limit=1000'],
    queryFn: async () => BranchesService.listBranches({ limit: 1000 }),
  });

  const [form, setForm] = useState({ name: '', headId: '' });
  const [modalOpen, setModalOpen] = useState(false);
  const [filters, setFilters] = useState({ name: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState<any | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', headId: '' });

  const createMutation = useMutation({
    mutationFn: () => RegionsService.createRegion({ ...form }),
    onSuccess: async () => {
      setForm({ name: '', headId: '' });
      setModalOpen(false);
      await refetch();
      toast({ title: 'Region created', description: 'New region added', duration: 2500 });
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err?.message || 'Failed to create region';
      toast({ title: 'Error', description: msg, variant: 'destructive', duration: 3000 });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!selected?.id) throw new Error('Missing region id');
      return RegionsService.updateRegion(String(selected.id), { ...editForm });
    },
    onSuccess: async () => {
      setIsEditing(false);
      await refetch();
      toast({ title: 'Region updated', duration: 2000 });
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err?.message || 'Failed to update region';
      toast({ title: 'Error', description: msg, variant: 'destructive', duration: 3000 });
    },
  });

  const filteredItems = (Array.isArray(regions) ? regions : []).filter((r: any) => {
    const nameStr = String(r.regionName || '').toLowerCase();
    const fName = filters.name.toLowerCase();
    return !fName || nameStr.includes(fName);
  });

  React.useEffect(() => { setCurrentPage(1); }, [filters.name]);

  const total = filteredItems.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const hasPrevPage = currentPage > 1;
  const hasNextPage = currentPage < totalPages;
  const start = (currentPage - 1) * pageSize;
  const end = start + pageSize;
  const pageItems = filteredItems.slice(start, end);

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
        </div>
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogTrigger asChild>
            <Button size="icon" className="h-7 w-7 p-0 bg-primary text-white shadow ring-2 ring-primary/40 hover:ring-primary" title="Add Region" type="button">
              <Plus className="w-4 h-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Add Region</DialogTitle>
            </DialogHeader>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="sm:col-span-2">
                <Label>Region Name<span className="text-destructive"> *</span></Label>
                <Input className="mt-1" value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} />
              </div>

              <div className="sm:col-span-2">
                <Label>Region Head</Label>
                <Select value={form.headId} onValueChange={(v) => setForm((s) => ({ ...s, headId: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select region head" /></SelectTrigger>
                  <SelectContent>
                    {users.length === 0 ? (
                      <SelectItem value="" disabled>No users found</SelectItem>
                    ) : (
                      (users as any[])
                        .filter((u: any) => ['regional_manager','admin','super_admin','admin_staff'].includes(u.role))
                        .map((u: any) => (
                          <SelectItem key={u.id} value={u.id}>
                            {(u.firstName || '') + ' ' + (u.lastName || '')} {u.email ? `- ${u.email}` : ''}
                          </SelectItem>
                        ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="col-span-full flex gap-2">
                <Button onClick={() => createMutation.mutate()} disabled={!form.name}>Save</Button>
                <Button variant="outline" onClick={() => { setForm({ name: '', headId: '' }); setModalOpen(false); }}>Cancel</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Separator />

      <div>
        {regions.length === 0 ? (
          <div className="border border-dashed rounded-md p-6 text-center">
            <div className="flex items-center justify-center mb-4">
              <Globe2 className="w-10 h-10 text-muted-foreground" />
            </div>
            <div className="text-lg font-semibold">No regions yet</div>
            <div className="text-sm text-muted-foreground mt-2">Create regions like Pakistan, India, China. Assign region heads and organize branches under them.</div>
            <div className="mt-4 flex items-center justify-center gap-2">
              <Button onClick={() => setModalOpen(true)}>
                <Plus className="w-4 h-4 mr-2" /> Add your first region
              </Button>
              <Button variant="outline" onClick={async () => { await refetch(); }}>Refresh</Button>
            </div>
          </div>
        ) : (
          <div className="overflow-auto">
            <Table className="text-xs">
              <TableHeader>
                <TableRow>
                  <TableHead className="h-8 px-2 text-[11px]">Name</TableHead>
                  <TableHead className="h-8 px-2 text-[11px]">Head</TableHead>
                  <TableHead className="h-8 px-2 text-[11px]">Branches</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(pageItems as any[]).map((r: any) => {
                  const headUser = (users as any[]).find((u: any) => u.id === r.regionHeadId);
                  const headName = headUser ? (`${headUser.firstName || ''} ${headUser.lastName || ''}`.trim() || headUser.email || '-') : '-';
                  const branchCount = (branches as any[]).filter((b: any) => String((b as any).regionId || '') === String(r.id)).length;
                  return (
                    <TableRow key={r.id} className="cursor-pointer hover:bg-gray-50" onClick={() => {
                      setSelected(r);
                      setEditForm({ name: String(r.regionName || ''), headId: String(r.regionHeadId || '') });
                      setIsEditing(false);
                      setDetailOpen(true);
                    }}>
                      <TableCell className="font-medium p-2 text-xs">{r.regionName}</TableCell>
                      <TableCell className="p-2 text-xs">{headName}</TableCell>
                      <TableCell className="p-2 text-xs">{branchCount}</TableCell>
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{selected?.regionName || 'Region'}</span>
              {!isEditing ? (
                <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>Edit</Button>
              ) : null}
            </DialogTitle>
          </DialogHeader>

          {!isEditing ? (
            <div className="grid grid-cols-1 gap-3">
              <div>
                <div className="text-xs text-muted-foreground">Name</div>
                <div className="font-medium">{selected?.regionName || '-'}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Region Head</div>
                <div className="font-medium">{(() => {
                  const headUser = (users as any[]).find((u: any) => u.id === selected?.regionHeadId);
                  return headUser ? ((`${headUser.firstName || ''} ${headUser.lastName || ''}`.trim()) || headUser.email || '-') : '-';
                })()}</div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2">
              <div>
                <Label>Name<span className="text-destructive"> *</span></Label>
                <Input className="mt-1" value={editForm.name} onChange={(e) => setEditForm((s) => ({ ...s, name: e.target.value }))} />
              </div>
              <div>
                <Label>Region Head</Label>
                <Select value={editForm.headId} onValueChange={(v) => setEditForm((s) => ({ ...s, headId: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select region head" /></SelectTrigger>
                  <SelectContent>
                    {users.length === 0 ? (
                      <SelectItem value="" disabled>No users found</SelectItem>
                    ) : (
                      (users as any[])
                        .filter((u: any) => ['regional_manager','admin','super_admin','admin_staff'].includes(u.role))
                        .map((u: any) => (
                          <SelectItem key={u.id} value={u.id}>
                            {(u.firstName || '') + ' ' + (u.lastName || '')} {u.email ? `- ${u.email}` : ''}
                          </SelectItem>
                        ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-full flex gap-2">
                <Button onClick={() => updateMutation.mutate()} disabled={!selected?.id || !editForm.name || updateMutation.isPending}>
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
