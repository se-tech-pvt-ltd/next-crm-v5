import React, { useEffect, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SearchableCombobox } from '@/components/ui/searchable-combobox';
import { Separator } from '@/components/ui/separator';
import * as BranchesService from '@/services/branches';
import * as UsersService from '@/services/users';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Database, Plus } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination } from '@/components/ui/pagination';

export default function UserSection({ toast }: { toast: (v: any) => void }) {
  const { data: users = [], refetch } = useQuery({ queryKey: ['/api/users'], queryFn: () => UsersService.getUsers() });
  const { data: initialBranches = [] } = useQuery({ queryKey: ['/api/branches'], queryFn: () => BranchesService.listBranches(), staleTime: 30000 });

  // Add user dialog state
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ email: '', firstName: '', lastName: '', role: 'counselor', branchId: '' });

  // Filters and pagination
  const [filters, setFilters] = useState<{ query: string; role: string; branchId: string }>({ query: '', role: '', branchId: '' });
  const [branchSearch, setBranchSearch] = useState('');
  const [branchFilterSearch, setBranchFilterSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Detail & edit dialog state
  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState<any | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ firstName: '', lastName: '', role: 'counselor', branchId: '' });
  const [branchEditSearch, setBranchEditSearch] = useState('');

  const create = useMutation({
    mutationFn: () => UsersService.createUser(form),
    onSuccess: async () => {
      await refetch();
      setForm({ email: '', firstName: '', lastName: '', role: 'counselor', branchId: '' });
      setModalOpen(false);
      toast({ title: 'User created', description: 'User added successfully', duration: 2500 });
    },
    onError: (err: any) => {
      const msg = err?.message || err?.data?.message || 'Failed to create user';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!selected?.id) throw new Error('User ID missing');
      const body: any = { ...editForm };
      return UsersService.updateUser(String(selected.id), body);
    },
    onSuccess: async () => {
      setIsEditing(false);
      await refetch();
      toast({ title: 'User updated', duration: 2000 });
    },
    onError: (err: any) => {
      const msg = err?.message || err?.data?.message || 'Failed to update user';
      toast({ title: 'Error', description: msg, variant: 'destructive', duration: 3000 });
    }
  });

  const roleLabel = (r: string) => {
    const map: Record<string,string> = {
      super_admin: 'Super Admin',
      admin: 'Admin',
      regional_manager: 'Regional Manager',
      branch_manager: 'Branch Manager',
      processing: 'Processing',
      counselor: 'Counsellor',
      admission_officer: 'Admission Officer',
      admin_staff: 'Admin Staff',
    };
    return map[r] || (r || '').replace(/_/g, ' ');
  };

  // Derived lists for branch selects (add-dialog and filter)
  const branchList = Array.isArray(initialBranches) ? initialBranches : [];

  // Users filtering
  const filteredUsers = (Array.isArray(users) ? users : []).filter((u: any) => {
    const q = filters.query.trim().toLowerCase();
    const matchesQuery = !q ||
      String(u.firstName || '').toLowerCase().includes(q) ||
      String(u.lastName || '').toLowerCase().includes(q) ||
      String(u.email || '').toLowerCase().includes(q);
    const matchesRole = !filters.role || String(u.role || '') === filters.role;
    const matchesBranch = !filters.branchId || String(u.branchId || '') === filters.branchId;
    return matchesQuery && matchesRole && matchesBranch;
  });
  const sortedUsers = [...filteredUsers].sort((a: any, b: any) => {
    const aDate = new Date(a.createdAt || a.created_at || a.created_on || 0).getTime();
    const bDate = new Date(b.createdAt || b.created_at || b.created_on || 0).getTime();
    return bDate - aDate;
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [filters.query, filters.role, filters.branchId]);

  const total = sortedUsers.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const hasPrevPage = currentPage > 1;
  const hasNextPage = currentPage < totalPages;
  const start = (currentPage - 1) * pageSize;
  const end = start + pageSize;
  const pageItems = sortedUsers.slice(start, end);

  return (
    <div className="space-y-4">
      {/* Toolbar: search + role + branch filter + add button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Input
            placeholder="Search name or email"
            className="h-8 w-56"
            value={filters.query}
            onChange={(e) => setFilters((s) => ({ ...s, query: e.target.value }))}
          />
          <Select value={filters.role} onValueChange={(v) => setFilters((s) => ({ ...s, role: v === '__all__' ? '' : v }))}>
            <SelectTrigger className="h-8 w-44"><SelectValue placeholder="Role" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All roles</SelectItem>
              <SelectItem value="super_admin">Super Admin</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="regional_manager">Regional Manager</SelectItem>
              <SelectItem value="branch_manager">Branch Manager</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="counselor">Counsellor</SelectItem>
              <SelectItem value="admission_officer">Admission Officer</SelectItem>
              <SelectItem value="admin_staff">Admin Staff</SelectItem>
            </SelectContent>
          </Select>
          {(() => {
            const trimmed = branchFilterSearch.trim();
            const { data: searched = [], isFetching } = (function(){
              // eslint-disable-next-line react-hooks/rules-of-hooks
              return useQuery({
                queryKey: ['/api/branches', 'search', trimmed],
                queryFn: () => BranchesService.listBranches({ q: trimmed, limit: 50 }),
                enabled: trimmed.length > 0,
                staleTime: 10_000,
              });
            })();
            const list = trimmed ? searched : branchList;
            const options = (Array.isArray(list) ? list : [])
              .map((b: any) => ({ value: String(b.id), label: String(b.branchName || b.name || b.id) }));
            return (
              <div className="w-56">
                <SearchableCombobox
                  value={filters.branchId}
                  onValueChange={(v) => setFilters((s) => ({ ...s, branchId: v }))}
                  placeholder="Filter by branch"
                  searchPlaceholder="Search branches..."
                  onSearch={setBranchFilterSearch}
                  options={[{ value: '', label: 'All branches' }, ...options]}
                  loading={Boolean((branchFilterSearch.trim().length > 0) && isFetching)}
                />
              </div>
            );
          })()}
        </div>

        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogTrigger asChild>
            <Button size="icon" className="h-7 w-7 p-0 bg-primary text-white shadow ring-2 ring-primary/40 hover:ring-primary" title="Add User" type="button">
              <Plus className="w-4 h-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add User</DialogTitle>
            </DialogHeader>

            <div className="grid sm:grid-cols-3 gap-2">
              <div>
                <Label>Email<span className="text-destructive"> *</span></Label>
                <Input className="mt-1" type="email" value={form.email} onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))} />
              </div>
              <div>
                <Label>First name</Label>
                <Input className="mt-1" value={form.firstName} onChange={(e) => setForm((s) => ({ ...s, firstName: e.target.value }))} />
              </div>
              <div>
                <Label>Last name</Label>
                <Input className="mt-1" value={form.lastName} onChange={(e) => setForm((s) => ({ ...s, lastName: e.target.value }))} />
              </div>
              <div>
                <Label>Role<span className="text-destructive"> *</span></Label>
                <Select value={form.role} onValueChange={(v) => setForm((s) => ({ ...s, role: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select role" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="regional_manager">Regional Manager</SelectItem>
                    <SelectItem value="branch_manager">Branch Manager</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="counselor">Counsellor</SelectItem>
                    <SelectItem value="admission_officer">Admission Officer</SelectItem>
                    <SelectItem value="admin_staff">Admin Staff</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Branch<span className="text-destructive"> *</span></Label>
                {(() => {
                  const trimmed = branchSearch.trim();
                  const { data: searched = [], isFetching } = (function(){
                    // eslint-disable-next-line react-hooks/rules-of-hooks
                    return useQuery({
                      queryKey: ['/api/branches', 'search', trimmed],
                      queryFn: () => BranchesService.listBranches({ q: trimmed, limit: 50 }),
                      enabled: trimmed.length > 0,
                      staleTime: 10_000,
                    });
                  })();
                  const list = trimmed ? searched : initialBranches;
                  const branchOptions = (Array.isArray(list) ? list : [])
                    .map((b: any) => ({ value: String(b.id), label: String(b.branchName || b.name || b.id) }));
                  return (
                    <SearchableCombobox
                      value={form.branchId}
                      onValueChange={(v) => setForm((s) => ({ ...s, branchId: v }))}
                      placeholder="Select branch (required)"
                      searchPlaceholder="Search branches..."
                      onSearch={setBranchSearch}
                      options={branchOptions}
                      loading={Boolean((branchSearch.trim().length > 0) && isFetching)}
                    />
                  );
                })()}
              </div>
              <div className="col-span-full flex gap-2 mt-2">
                <Button type="button" onClick={() => create.mutate()} disabled={!form.email || !form.branchId || !form.role || create.isPending}>
                  {create.isPending ? 'Creating...' : 'Save'}
                </Button>
                <Button type="button" variant="outline" onClick={() => { setForm({ email: '', firstName: '', lastName: '', role: 'counselor', branchId: '' }); setModalOpen(false); }} disabled={create.isPending}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Separator />

      <div>
        {users.length === 0 ? (
          <div className="border border-dashed rounded-md p-6 text-center">
            <div className="flex items-center justify-center mb-4">
              <Database className="w-10 h-10 text-muted-foreground" />
            </div>
            <div className="text-lg font-semibold">No users yet</div>
            <div className="text-sm text-muted-foreground mt-2">You don't have any users created. Click the + button to add your first user.</div>
            <div className="mt-4 flex items-center justify-center gap-2">
              <Button onClick={() => setModalOpen(true)}>
                <Plus className="w-4 h-4 mr-2" /> Add your first user
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
                  <TableHead className="h-8 px-2 text-[11px]">Email</TableHead>
                  <TableHead className="h-8 px-2 text-[11px]">Role</TableHead>
                  <TableHead className="h-8 px-2 text-[11px]">Branch</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(pageItems as any[]).map((u: any) => (
                  <TableRow key={u.id} className="cursor-pointer hover:bg-gray-50" onClick={() => {
                    setSelected(u);
                    setEditForm({
                      firstName: String(u.firstName || ''),
                      lastName: String(u.lastName || ''),
                      role: String(u.role || 'counselor'),
                      branchId: String(u.branchId || ''),
                    });
                    setIsEditing(false);
                    setDetailOpen(true);
                  }}>
                    <TableCell className="p-2 text-xs">{[u.firstName, u.lastName].filter(Boolean).join(' ') || '—'}</TableCell>
                    <TableCell className="p-2 text-xs">{u.email}</TableCell>
                    <TableCell className="p-2 text-xs">{roleLabel(u.role)}</TableCell>
                    <TableCell className="p-2 text-xs">{u.branchId || '—'}</TableCell>
                  </TableRow>
                ))}
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
              <span>{[selected?.firstName, selected?.lastName].filter(Boolean).join(' ') || selected?.email || 'User'}</span>
              {!isEditing ? (
                <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>Edit</Button>
              ) : null}
            </DialogTitle>
          </DialogHeader>

          {!isEditing ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="text-xs text-muted-foreground">Name</div>
                <div className="font-medium">{[selected?.firstName, selected?.lastName].filter(Boolean).join(' ') || '—'}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Email</div>
                <div className="font-medium break-words">{selected?.email || '—'}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Role</div>
                <div className="font-medium">{selected ? roleLabel(selected.role) : '—'}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Branch</div>
                <div className="font-medium">{selected?.branchId || '—'}</div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              <div>
                <Label>First name</Label>
                <Input className="mt-1" value={editForm.firstName} onChange={(e) => setEditForm((s) => ({ ...s, firstName: e.target.value }))} />
              </div>
              <div>
                <Label>Last name</Label>
                <Input className="mt-1" value={editForm.lastName} onChange={(e) => setEditForm((s) => ({ ...s, lastName: e.target.value }))} />
              </div>
              <div>
                <Label>Role<span className="text-destructive"> *</span></Label>
                <Select value={editForm.role} onValueChange={(v) => setEditForm((s) => ({ ...s, role: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select role" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="regional_manager">Regional Manager</SelectItem>
                    <SelectItem value="branch_manager">Branch Manager</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="counselor">Counsellor</SelectItem>
                    <SelectItem value="admission_officer">Admission Officer</SelectItem>
                    <SelectItem value="admin_staff">Admin Staff</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-2 md:col-span-3">
                <Label>Branch<span className="text-destructive"> *</span></Label>
                {(() => {
                  const trimmed = branchEditSearch.trim();
                  const { data: searched = [], isFetching } = (function(){
                    // eslint-disable-next-line react-hooks/rules-of-hooks
                    return useQuery({
                      queryKey: ['/api/branches', 'search', trimmed, 'edit'],
                      queryFn: () => BranchesService.listBranches({ q: trimmed, limit: 50 }),
                      enabled: trimmed.length > 0,
                      staleTime: 10_000,
                    });
                  })();
                  const list = trimmed ? searched : initialBranches;
                  const options = (Array.isArray(list) ? list : [])
                    .map((b: any) => ({ value: String(b.id), label: String(b.branchName || b.name || b.id) }));
                  return (
                    <SearchableCombobox
                      value={editForm.branchId}
                      onValueChange={(v) => setEditForm((s) => ({ ...s, branchId: v }))}
                      placeholder="Select branch (required)"
                      searchPlaceholder="Search branches..."
                      onSearch={setBranchEditSearch}
                      options={options}
                      loading={Boolean((branchEditSearch.trim().length > 0) && isFetching)}
                    />
                  );
                })()}
              </div>
              <div className="col-span-full flex gap-2">
                <Button onClick={() => updateMutation.mutate()} disabled={!selected?.id || !editForm.role || !editForm.branchId || updateMutation.isPending}>
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
