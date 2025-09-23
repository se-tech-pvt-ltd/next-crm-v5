import React, { useMemo, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MultiSelect } from '@/components/ui/multi-select';
import { Separator } from '@/components/ui/separator';
import { Drawer, DrawerClose, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import * as RegionsService from '@/services/regions';
import * as UsersService from '@/services/users';
import * as BranchesService from '@/services/branches';
import { Globe2, Plus, ChevronRight, ChevronDown, ChevronUp, MoreHorizontal } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination } from '@/components/ui/pagination';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';

export default function RegionSection({ toast }: { toast: (v: any) => void }) {
  const { data: regions = [], isLoading: regionsLoading, refetch } = useQuery({
    queryKey: ['/api/regions'],
    queryFn: async () => RegionsService.listRegions(),
  });

  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ['/api/users'],
    queryFn: async () => UsersService.getUsers(),
  });

  const { data: branches = [], isLoading: branchesLoading, refetch: refetchBranches } = useQuery({
    queryKey: ['/api/branches?limit=1000'],
    queryFn: async () => BranchesService.listBranches({ limit: 1000 }),
  });

  const [form, setForm] = useState({ name: '', headId: '' });
  const [addOpen, setAddOpen] = useState(false);
  const [filters, setFilters] = useState({ name: '', headId: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const [pendingAssign, setPendingAssign] = useState<Record<string, string[]>>({});
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [inlineEditId, setInlineEditId] = useState<string | null>(null);
  const [inlineForm, setInlineForm] = useState<{ name: string; headId: string }>({ name: '', headId: '' });
  const [branchHeadDraft, setBranchHeadDraft] = useState<Record<string, string>>({});
  const [updatingBranchId, setUpdatingBranchId] = useState<string | null>(null);
  const [removingBranchId, setRemovingBranchId] = useState<string | null>(null);
  const [fadeOutBranchId, setFadeOutBranchId] = useState<string | null>(null);
  const [sort, setSort] = useState<{ by: 'name' | 'head' | 'branches'; dir: 'asc' | 'desc' }>({ by: 'name', dir: 'asc' });

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };


  const createMutation = useMutation({
    mutationFn: () => RegionsService.createRegion({ ...form }),
    onSuccess: async () => {
      setForm({ name: '', headId: '' });
      setAddOpen(false);
      await refetch();
      toast({ title: 'Region created', description: 'New region added', duration: 2500 });
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err?.message || 'Failed to create region';
      toast({ title: 'Error', description: msg, variant: 'destructive', duration: 3000 });
    },
  });


  const inlineUpdateMutation = useMutation({
    mutationFn: async ({ id, name, headId }: { id: string; name: string; headId: string }) => {
      return RegionsService.updateRegion(id, { name, headId: headId || undefined });
    },
    onSuccess: async () => {
      setInlineEditId(null);
      await refetch();
      toast({ title: 'Saved', duration: 1500 });
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err?.message || 'Failed to save changes';
      toast({ title: 'Error', description: msg, variant: 'destructive', duration: 3000 });
    },
  });

  const bulkHeadMutation = useMutation({
    mutationFn: async ({ headId }: { headId: string | null }) => {
      const updates = Array.from(selectedIds).map((id) =>
        RegionsService.updateRegion(id, { name: String((regions as any[]).find((r: any) => String(r.id) === id)?.regionName || ''), headId: headId || undefined })
      );
      return Promise.all(updates);
    },
    onSuccess: async () => {
      await refetch();
      toast({ title: 'Bulk update applied', duration: 2000 });
      setSelectedIds(new Set());
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err?.message || 'Failed to apply bulk action';
      toast({ title: 'Error', description: msg, variant: 'destructive', duration: 3000 });
    },
  });

  const bulkAssignMutation = useMutation({
    mutationFn: async ({ branchIds, regionId }: { branchIds: string[]; regionId: string }) => {
      const selectedBranches = (branches as any[]).filter((x: any) => branchIds.includes(String(x.id)));
      if (selectedBranches.length !== branchIds.length) throw new Error('Some branches not found');
      return Promise.all(
        selectedBranches.map((b: any) =>
          BranchesService.updateBranch(String(b.id), {
            name: String(b.branchName || b.name || ''),
            city: String(b.city || ''),
            country: String(b.country || ''),
            address: String(b.address || ''),
            officialPhone: String(b.officialPhone || ''),
            officialEmail: String(b.officialEmail || ''),
            managerId: b.branchHeadId || b.managerId || null,
            regionId,
          })
        )
      );
    },
    onSuccess: async (_res, vars) => {
      await Promise.all([refetch(), refetchBranches()]);
      setPendingAssign((s) => ({ ...s, [String(vars.regionId)]: [] }));
      toast({ title: 'Branches added to region', duration: 2000 });
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err?.message || 'Failed to add branches to region';
      toast({ title: 'Error', description: msg, variant: 'destructive', duration: 3000 });
    },
  });

  const updateBranchHeadMutation = useMutation({
    mutationFn: async ({ branchId, userId }: { branchId: string; userId: string }) => {
      const b: any = (branches as any[]).find((x: any) => String(x.id) === String(branchId));
      if (!b) throw new Error('Branch not found');
      return BranchesService.updateBranch(String(b.id), {
        name: String(b.branchName || b.name || ''),
        city: String(b.city || ''),
        country: String(b.country || ''),
        address: String(b.address || ''),
        officialPhone: String(b.officialPhone || ''),
        officialEmail: String(b.officialEmail || ''),
        managerId: userId,
        regionId: String(b.regionId || ''),
      });
    },
    onMutate: async (vars) => {
      setUpdatingBranchId(vars.branchId);
    },
    onSuccess: async () => {
      await Promise.all([refetch(), refetchBranches()]);
      toast({ title: 'Branch head updated', duration: 1500 });
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err?.message || 'Failed to update branch head';
      toast({ title: 'Error', description: msg, variant: 'destructive', duration: 3000 });
    },
    onSettled: () => {
      setUpdatingBranchId(null);
    }
  });

  const removeBranchFromRegion = useMutation({
    mutationFn: async ({ branchId }: { branchId: string }) => {
      const b: any = (branches as any[]).find((x: any) => String(x.id) === String(branchId));
      if (!b) throw new Error('Branch not found');
      return BranchesService.updateBranch(String(b.id), {
        name: String(b.branchName || b.name || ''),
        city: String(b.city || ''),
        country: String(b.country || ''),
        address: String(b.address || ''),
        officialPhone: String(b.officialPhone || ''),
        officialEmail: String(b.officialEmail || ''),
        managerId: b.branchHeadId || b.managerId || null,
        regionId: null,
      });
    },
    onMutate: async ({ branchId }) => {
      setRemovingBranchId(branchId);
      setTimeout(() => setFadeOutBranchId(branchId), 250);
    },
    onSuccess: async () => {
      await Promise.all([refetch(), refetchBranches()]);
      toast({ title: 'Branch removed from region', duration: 1500 });
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err?.message || 'Failed to remove branch';
      toast({ title: 'Error', description: msg, variant: 'destructive', duration: 3000 });
    },
    onSettled: () => {
      setRemovingBranchId(null);
      setFadeOutBranchId(null);
    }
  });

  const eligibleHeads = useMemo(() => {
    const regionHeadIds = new Set((regions as any[]).map((r: any) => r.regionHeadId).filter(Boolean));
    const branchHeadIds = new Set((branches as any[]).map((b: any) => b.branchHeadId).filter(Boolean));
    return (users as any[])
      .filter((u: any) => ['regional_manager', 'admin', 'super_admin', 'admin_staff'].includes(u.role))
      .filter((u: any) => !regionHeadIds.has(u.id) && !branchHeadIds.has(u.id));
  }, [regions, branches, users]);

  const branchHeadOptionsForEdit = (branch: any) => {
    const currentHeadId = branch.branchHeadId || branch.managerId || null;
    const regionHeadIds = new Set((regions as any[]).map((r: any) => r.regionHeadId).filter(Boolean));
    const branchHeadIdsOther = new Set((branches as any[])
      .filter((b: any) => String(b.id) !== String(branch.id))
      .map((b: any) => b.branchHeadId)
      .filter(Boolean));
    return (users as any[])
      .filter((u: any) => ['branch_manager','regional_manager','admin','super_admin','admin_staff'].includes(u.role))
      .filter((u: any) => !regionHeadIds.has(u.id) && (!branchHeadIdsOther.has(u.id) || String(u.id) === String(currentHeadId || '')));
  };

  const headOptionsForEdit = (currentHeadId: string | undefined) => {
    const regionHeadIdsOther = new Set((regions as any[])
      .filter((r: any) => String(r.regionHeadId || '') !== String(currentHeadId || ''))
      .map((r: any) => r.regionHeadId)
      .filter(Boolean));
    const branchHeadIds = new Set((branches as any[]).map((b: any) => b.branchHeadId).filter(Boolean));
    return (users as any[])
      .filter((u: any) => ['regional_manager', 'admin', 'super_admin', 'admin_staff'].includes(u.role))
      .filter((u: any) => !branchHeadIds.has(u.id) && (!regionHeadIdsOther.has(u.id) || String(u.id) === String(currentHeadId || '')));
  };

  const filtered = useMemo(() => {
    const nameQ = filters.name.toLowerCase();
    const headId = filters.headId;
    let items = (Array.isArray(regions) ? regions : []).filter((r: any) => {
      const nameStr = String(r.regionName || '').toLowerCase();
      const matchName = !nameQ || nameStr.includes(nameQ);
      const matchHead = !headId || String(r.regionHeadId || '') === String(headId);
      return matchName && matchHead;
    });

    items = items.map((r: any) => ({
      ...r,
      _branchCount: (branches as any[]).filter((b: any) => String((b as any).regionId || '') === String(r.id)).length,
      _headName: (() => {
        const headUser = (users as any[]).find((u: any) => u.id === r.regionHeadId);
        return headUser ? ((`${headUser.firstName || ''} ${headUser.lastName || ''}`.trim()) || headUser.email || '-') : '-';
      })(),
    }));

    items.sort((a: any, b: any) => {
      const dir = sort.dir === 'asc' ? 1 : -1;
      if (sort.by === 'name') return a.regionName.localeCompare(b.regionName) * dir;
      if (sort.by === 'head') return String(a._headName).localeCompare(String(b._headName)) * dir;
      return (a._branchCount - b._branchCount) * dir;
    });

    return items;
  }, [regions, branches, users, filters, sort]);

  React.useEffect(() => { setCurrentPage(1); }, [filters.name, filters.headId]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const hasPrevPage = currentPage > 1;
  const hasNextPage = currentPage < totalPages;
  const start = (currentPage - 1) * pageSize;
  const end = start + pageSize;
  const pageItems = filtered.slice(start, end);

  const allPageSelected = useMemo(() => {
    if (!regions || regions.length === 0) return false;
    const pageIds = pageItems.map((r: any) => String(r.id));
    return pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id));
  }, [regions, pageItems, selectedIds]);

  const selectAllOnPage = () => {
    const pageIds = pageItems.map((r: any) => String(r.id));
    const every = pageIds.every((id) => selectedIds.has(id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (every) pageIds.forEach((id) => next.delete(id));
      else pageIds.forEach((id) => next.add(id));
      return next;
    });
  };

  const SortButton: React.FC<{ active: boolean; dir: 'asc' | 'desc' }> = ({ active, dir }) => (
    <span className="inline-flex items-center ml-1 text-muted-foreground">
      {active ? (dir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />) : null}
    </span>
  );

  const toolbar = (
    <div className="sticky top-0 z-10 -mx-4 px-4 py-2 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Input
            placeholder="Search name"
            className="h-8 w-44"
            value={filters.name}
            onChange={(e) => setFilters((s) => ({ ...s, name: e.target.value }))}
          />
          <Select value={filters.headId || '__all__'} onValueChange={(v) => setFilters((s) => ({ ...s, headId: v === '__all__' ? '' : v }))}>
            <SelectTrigger className="h-8 w-52 text-xs"><SelectValue placeholder="Filter by head" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All heads</SelectItem>
              {(users as any[]).map((u: any) => (
                <SelectItem key={u.id} value={String(u.id)}>
                  {(`${u.firstName || ''} ${u.lastName || ''}`.trim()) || u.email || '-'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Drawer open={addOpen} onOpenChange={setAddOpen}>
          <DrawerTrigger asChild>
            <Button size="sm" className="h-8 bg-[#223E7D] text-white hover:bg-[#1e366e]" title="Add Region" type="button">
              <Plus className="w-4 h-4 mr-2" /> Add Region
            </Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Add Region</DrawerTitle>
            </DrawerHeader>
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="sm:col-span-2">
                <Label>Region Name<span className="text-destructive"> *</span></Label>
                <Input className="mt-1" value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} />
              </div>
              <div className="sm:col-span-2">
                <Label>Region Head</Label>
                <Select value={form.headId} onValueChange={(v) => setForm((s) => ({ ...s, headId: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select region head" /></SelectTrigger>
                  <SelectContent>
                    {eligibleHeads.length === 0 ? (
                      <SelectItem value="__no_eligible__" disabled>No eligible users</SelectItem>
                    ) : (
                      eligibleHeads.map((u: any) => (
                        <SelectItem key={u.id} value={String(u.id)}>
                          {(u.firstName || '') + ' ' + (u.lastName || '')} {u.email ? `- ${u.email}` : ''}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DrawerFooter>
              <div className="flex gap-2">
                <Button onClick={() => createMutation.mutate()} disabled={!form.name || createMutation.isPending}>
                  {createMutation.isPending ? 'Saving...' : 'Save'}
                </Button>
                <DrawerClose asChild>
                  <Button variant="outline" onClick={() => setForm({ name: '', headId: '' })}>Cancel</Button>
                </DrawerClose>
              </div>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      </div>

      {selectedIds.size > 0 ? (
        <div className="mt-2 rounded-md border bg-muted/40 px-2 py-2 flex items-center gap-2 text-xs">
          <div className="font-medium">{selectedIds.size} selected</div>
          <div className="flex items-center gap-2">
            <Select onValueChange={(v) => bulkHeadMutation.mutate({ headId: v })}>
              <SelectTrigger className="h-7 w-56 text-xs"><SelectValue placeholder="Assign head to selected" /></SelectTrigger>
              <SelectContent>
                {eligibleHeads.map((u: any) => (
                  <SelectItem key={u.id} value={String(u.id)}>
                    {(u.firstName || '') + ' ' + (u.lastName || '')} {u.email ? `- ${u.email}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" variant="outline" onClick={() => bulkHeadMutation.mutate({ headId: null })} disabled={bulkHeadMutation.isPending}>
              Clear head
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setSelectedIds(new Set())}>Cancel</Button>
          </div>
        </div>
      ) : null}
    </div>
  );

  const loadingState = (
    <div className="space-y-3">
      <Skeleton className="h-8 w-full" />
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="grid grid-cols-12 gap-2">
            <Skeleton className="col-span-1 h-6" />
            <Skeleton className="col-span-5 h-6" />
            <Skeleton className="col-span-3 h-6" />
            <Skeleton className="col-span-3 h-6" />
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {toolbar}
      <Separator />

      {(regionsLoading || usersLoading || branchesLoading) ? (
        loadingState
      ) : (
        <div>
          {filtered.length === 0 ? (
            <div className="border border-dashed rounded-md p-6 text-center">
              <div className="flex items-center justify-center mb-4">
                <Globe2 className="w-10 h-10 text-muted-foreground" />
              </div>
              <div className="text-lg font-semibold">No regions found</div>
              <div className="text-sm text-muted-foreground mt-2">Create regions like Pakistan, India, UAE. Assign region heads and organize branches under them.</div>
              <div className="mt-4 flex items-center justify-center gap-2">
                <Button onClick={() => setAddOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" /> Add your first region
                </Button>
                <Button variant="outline" onClick={async () => { await refetch(); }}>Refresh</Button>
              </div>
            </div>
          ) : (
            <div className="overflow-auto">
              {/* Desktop table */}
              <div className="hidden sm:block">
                <Table className="text-xs">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="h-8 px-2 w-8">
                        <Checkbox checked={allPageSelected} onCheckedChange={selectAllOnPage} />
                      </TableHead>
                      <TableHead className="h-8 px-2 text-[11px] cursor-pointer select-none" onClick={() => setSort((s) => ({ by: 'name', dir: s.by === 'name' && s.dir === 'asc' ? 'desc' : 'asc' }))}>
                        <div className="inline-flex items-center">Name <SortButton active={sort.by === 'name'} dir={sort.dir} /></div>
                      </TableHead>
                      <TableHead className="h-8 px-2 text-[11px] cursor-pointer select-none" onClick={() => setSort((s) => ({ by: 'head', dir: s.by === 'head' && s.dir === 'asc' ? 'desc' : 'asc' }))}>
                        <div className="inline-flex items-center">Head <SortButton active={sort.by === 'head'} dir={sort.dir} /></div>
                      </TableHead>
                      <TableHead className="h-8 px-2 text-[11px] cursor-pointer select-none" onClick={() => setSort((s) => ({ by: 'branches', dir: s.by === 'branches' && s.dir === 'asc' ? 'desc' : 'asc' }))}>
                        <div className="inline-flex items-center">Branches <SortButton active={sort.by === 'branches'} dir={sort.dir} /></div>
                      </TableHead>
                      <TableHead className="h-8 px-2 text-[11px] text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(pageItems as any[]).map((r: any) => {
                      const headUser = (users as any[]).find((u: any) => u.id === r.regionHeadId);
                      const headName = headUser ? ((`${headUser.firstName || ''} ${headUser.lastName || ''}`.trim()) || headUser.email || '-') : '-';
                      const regionBranches = (branches as any[]).filter((b: any) => String((b as any).regionId || '') === String(r.id));
                      const branchCount = regionBranches.length;
                      const isOpen = expanded.has(String(r.id));
                      const idStr = String(r.id);

                      return (
                        <React.Fragment key={r.id}>
                          <TableRow className="hover:bg-muted/30">
                            <TableCell className="p-2 align-top">
                              <Checkbox checked={selectedIds.has(idStr)} onCheckedChange={() => toggleSelect(idStr)} />
                            </TableCell>

                            {/* Name cell */}
                            <TableCell className="font-medium p-2 text-xs align-middle">
                              {inlineEditId === idStr ? (
                                <Input
                                  autoFocus
                                  value={inlineForm.name}
                                  onChange={(e) => setInlineForm((s) => ({ ...s, name: e.target.value }))}
                                  className="h-7"
                                />
                              ) : (
                                <button className="text-left w-full" onClick={() => { setInlineEditId(idStr); setInlineForm({ name: String(r.regionName || ''), headId: String(r.regionHeadId || '') }); }}>
                                  {r.regionName}
                                </button>
                              )}
                            </TableCell>

                            {/* Head cell */}
                            <TableCell className="p-2 text-xs align-middle">
                              {inlineEditId === idStr ? (
                                <Select value={inlineForm.headId} onValueChange={(v) => setInlineForm((s) => ({ ...s, headId: v }))}>
                                  <SelectTrigger className="h-7 text-xs"><SelectValue placeholder="Select head" /></SelectTrigger>
                                  <SelectContent>
                                    {headOptionsForEdit(r.regionHeadId).map((u: any) => (
                                      <SelectItem key={u.id} value={String(u.id)}>
                                        {(u.firstName || '') + ' ' + (u.lastName || '')} {u.email ? `- ${u.email}` : ''}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              ) : (
                                <span>{headName}</span>
                              )}
                            </TableCell>

                            {/* Branches */}
                            <TableCell className="p-2 text-xs align-middle">
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                className="h-7 px-2"
                                aria-label={isOpen ? 'Collapse' : 'Expand'}
                                aria-expanded={isOpen}
                                onClick={(e) => { e.stopPropagation(); toggleExpand(String(r.id)); }}
                              >
                                {branchCount}
                                {isOpen ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />}
                              </Button>
                            </TableCell>

                            {/* Actions */}
                            <TableCell className="p-2 text-xs text-right align-middle">
                              {inlineEditId === idStr ? (
                                <div className="inline-flex gap-2">
                                  <Button size="sm" className="h-7" disabled={!inlineForm.name || inlineUpdateMutation.isPending} onClick={() => inlineUpdateMutation.mutate({ id: idStr, name: inlineForm.name, headId: inlineForm.headId })}>
                                    {inlineUpdateMutation.isPending ? 'Saving...' : 'Save'}
                                  </Button>
                                  <Button size="sm" variant="outline" className="h-7" onClick={() => setInlineEditId(null)}>Cancel</Button>
                                </div>
                              ) : (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button size="icon" variant="ghost" className="h-7 w-7"><MoreHorizontal className="w-4 h-4" /></Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="text-xs">
                                    <DropdownMenuItem onClick={() => { setInlineEditId(idStr); setInlineForm({ name: String(r.regionName || ''), headId: String(r.regionHeadId || '') }); }}>Edit</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => toggleExpand(String(r.id))}>{isOpen ? 'Collapse' : 'Expand'} branches</DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              )}
                            </TableCell>
                          </TableRow>

                          {isOpen ? (
                            <TableRow>
                              <TableCell colSpan={5} className="p-0 bg-muted/20">
                                <div className="p-2 space-y-2">
                                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 rounded-md border bg-gradient-to-r from-muted/40 via-background to-background">
                                    <div className="flex items-center gap-2 min-w-[220px]">
                                      <div className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary">+</div>
                                      <div>
                                        <div className="text-xs font-semibold">Add branch to this region</div>
                                        <div className="text-[11px] text-muted-foreground">Select one or more unassigned branches</div>
                                      </div>
                                    </div>
                                    <div className="flex-1" />
                                    {(() => {
                                      const unassigned = (branches as any[]).filter((b: any) => !b.regionId);
                                      const options = unassigned.map((b: any) => ({ value: String(b.id), label: `${b.branchName || b.name || '-' }${b.city ? `, ${b.city}` : ''}` }));
                                      const selected = pendingAssign[String(r.id)] || [];
                                      return (
                                        <div className="flex items-center gap-2">
                                          <MultiSelect
                                            value={selected}
                                            onValueChange={(vals) => setPendingAssign((s) => ({ ...s, [String(r.id)]: vals }))}
                                            options={options}
                                            placeholder={unassigned.length === 0 ? 'No unassigned branches' : 'Choose branches...'}
                                            className="h-8 min-h-8 w-[320px] text-xs"
                                          />
                                          <Button
                                            size="sm"
                                            className="h-8"
                                            onClick={() => {
                                              if (selected.length === 0) return;
                                              bulkAssignMutation.mutate({ branchIds: selected, regionId: String(r.id) });
                                            }}
                                            disabled={selected.length === 0 || bulkAssignMutation.isPending}
                                          >
                                            {bulkAssignMutation.isPending ? 'Adding…' : `Add${selected.length > 0 ? ` ${selected.length}` : ''}`}
                                          </Button>
                                        </div>
                                      );
                                    })()}
                                  </div>

                                  {branchCount === 0 ? (
                                    <div className="text-xs text-muted-foreground px-2 py-1">No branches in this region.</div>
                                  ) : (
                                    <Table className="text-xs">
                                      <TableHeader>
                                        <TableRow>
                                          <TableHead className="h-7 px-2 text-[11px]">Branch</TableHead>
                                          <TableHead className="h-7 px-2 text-[11px]">City</TableHead>
                                          <TableHead className="h-7 px-2 text-[11px]">Country</TableHead>
                                          <TableHead className="h-7 px-2 text-[11px]">Head</TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {regionBranches.map((b: any) => {
                                          const currentHeadId = String(b.branchHeadId || b.managerId || '');
                                          const options = branchHeadOptionsForEdit(b);
                                          return (
                                            <TableRow key={b.id} className={(removingBranchId === String(b.id) ? 'line-through text-muted-foreground' : '') + ' ' + (fadeOutBranchId === String(b.id) ? 'opacity-0 transition-opacity duration-500' : '')}>
                                              <TableCell className="p-2 text-xs">
                                                <div className="flex items-center gap-1">
                                                  <Button
                                                    type="button"
                                                    size="icon"
                                                    variant="destructive"
                                                    className="h-6 w-6 -ml-1"
                                                    title="Remove from region"
                                                    aria-label="Remove from region"
                                                    onClick={() => removeBranchFromRegion.mutate({ branchId: String(b.id) })}
                                                    disabled={removingBranchId === String(b.id) || removeBranchFromRegion.isPending}
                                                  >
                                                    —
                                                  </Button>
                                                  <span>{b.branchName || b.name || '-'}</span>
                                                </div>
                                              </TableCell>
                                              <TableCell className="p-2 text-xs">{b.city || '-'}</TableCell>
                                              <TableCell className="p-2 text-xs">{b.country || '-'}</TableCell>
                                              <TableCell className="p-2 text-xs">
                                                {options.length === 0 ? (
                                                  <span className="text-muted-foreground">No eligible users</span>
                                                ) : (
                                                  <Select
                                                    value={branchHeadDraft[String(b.id)] ?? currentHeadId}
                                                    onValueChange={(v) => {
                                                      setBranchHeadDraft((s) => ({ ...s, [String(b.id)]: v }));
                                                      updateBranchHeadMutation.mutate({ branchId: String(b.id), userId: v });
                                                    }}
                                                    disabled={updatingBranchId === String(b.id)}
                                                  >
                                                    <SelectTrigger className="h-7 text-xs w-48">
                                                      {(() => {
                                                        const sel = String((branchHeadDraft[String(b.id)] ?? currentHeadId) || '');
                                                        const u = (users as any[]).find((x: any) => String(x.id) === sel);
                                                        const label = u ? ([u.firstName, u.lastName].filter(Boolean).join(' ') || u.email || '-') : 'Select head';
                                                        return <span className="truncate text-left w-full">{label}</span>;
                                                      })()}
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                      {options.map((u: any) => (
                                                        <SelectItem key={u.id} value={String(u.id)}>
                                                          {(u.firstName || '') + ' ' + (u.lastName || '')} {u.email ? `- ${u.email}` : ''}
                                                        </SelectItem>
                                                      ))}
                                                    </SelectContent>
                                                  </Select>
                                                )}
                                              </TableCell>
                                            </TableRow>
                                          );
                                        })}
                                      </TableBody>
                                    </Table>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ) : null}
                        </React.Fragment>
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

              {/* Mobile cards */}
              <div className="sm:hidden space-y-2">
                {(pageItems as any[]).map((r: any) => {
                  const headUser = (users as any[]).find((u: any) => u.id === r.regionHeadId);
                  const headName = headUser ? ((`${headUser.firstName || ''} ${headUser.lastName || ''}`.trim()) || headUser.email || '-') : '-';
                  const regionBranches = (branches as any[]).filter((b: any) => String((b as any).regionId || '') === String(r.id));
                  const idStr = String(r.id);
                  return (
                    <div key={r.id} className="rounded-md border p-3 bg-card text-card-foreground">
                      <div className="flex items-start gap-2">
                        <Checkbox checked={selectedIds.has(idStr)} onCheckedChange={() => toggleSelect(idStr)} />
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold truncate">{r.regionName}</div>
                          <div className="text-xs text-muted-foreground truncate">Head: {headName}</div>
                          <div className="text-xs text-muted-foreground">Branches: {regionBranches.length}</div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="icon" variant="ghost" className="h-8 w-8"><MoreHorizontal className="w-4 h-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="text-xs">
                            <DropdownMenuItem onClick={() => { setInlineEditId(idStr); setInlineForm({ name: String(r.regionName || ''), headId: String(r.regionHeadId || '') }); }}>Edit</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  );
                })}

                {total > pageSize && (
                  <div className="mt-4 pt-2 border-t">
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
            </div>
          )}
        </div>
      )}

    </div>
  );
}
