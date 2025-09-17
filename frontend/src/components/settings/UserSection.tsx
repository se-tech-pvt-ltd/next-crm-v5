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
import * as UserRolesService from '@/services/userRoles';
import * as RegionsService from '@/services/regions';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Database, Plus } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination } from '@/components/ui/pagination';

export default function UserSection({ toast }: { toast: (v: any) => void }) {
  const { data: users = [], refetch } = useQuery({ queryKey: ['/api/users'], queryFn: () => UsersService.getUsers() });
  const { data: initialBranches = [] } = useQuery({ queryKey: ['/api/branches'], queryFn: () => BranchesService.listBranches(), staleTime: 30000 });

  // Branch search hooks will be initialized after state declarations to ensure state variables are defined before use
  // (moved later in the file)

  // Add user dialog state
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ email: '', firstName: '', lastName: '', role: '', branchId: '', department: '', regionId: '', profileImageUrl: '', profileImageId: '' });

  // Load departments from backend
  const { data: departments = [] } = useQuery({ queryKey: ['/api/user-departments'], queryFn: () => UserRolesService.listDepartments(), staleTime: 60_000 });

  // Roles for add dialog
  const { data: rolesForDept = [] } = useQuery({ queryKey: ['/api/user-roles', form.department], queryFn: () => UserRolesService.listRoles(form.department || undefined), enabled: Boolean(form.department), staleTime: 60_000 });

  // Regions list
  const { data: regions = [] } = useQuery({ queryKey: ['/api/regions'], queryFn: () => RegionsService.listRegions(), staleTime: 60_000 });

  // helper for selected department name
  const selectedDeptObj = departments.find((d: any) => String(d.id) === String(form.department));
  const selectedDeptName = String(selectedDeptObj?.departmentName ?? selectedDeptObj?.department_name ?? '').trim();

  // Filters and pagination

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
  const [editForm, setEditForm] = useState({ firstName: '', lastName: '', role: '', branchId: '', department: '', regionId: '' });
  const [branchEditSearch, setBranchEditSearch] = useState('');

  // Roles for edit dialog (depends on editForm, so must be declared after it)
  const { data: rolesForEditDept = [] } = useQuery({ queryKey: ['/api/user-roles', editForm.department], queryFn: () => UserRolesService.listRoles(editForm.department || undefined), enabled: Boolean(editForm.department), staleTime: 60_000 });

  // Branch search hooks (top-level to preserve hook order) — defined after state variables
  const branchFilterTrim = branchFilterSearch.trim();
  const { data: branchFilterSearched = [], isFetching: branchFilterIsFetching } = useQuery({
    queryKey: ['/api/branches', 'search', branchFilterTrim, 'filter'],
    queryFn: () => BranchesService.listBranches({ q: branchFilterTrim, limit: 50 }),
    enabled: branchFilterTrim.length > 0,
    staleTime: 10_000,
  });
  const branchFilterList = branchFilterTrim ? branchFilterSearched : initialBranches;
  const branchFilterOptions = (Array.isArray(branchFilterList) ? branchFilterList : []).map((b: any) => ({ value: String(b.id), label: String(b.branchName || b.name || b.id) }));

  const branchAddTrim = branchSearch.trim();
  const { data: branchAddSearched = [], isFetching: branchAddIsFetching } = useQuery({
    queryKey: ['/api/branches', 'search', branchAddTrim, 'add'],
    queryFn: () => BranchesService.listBranches({ q: branchAddTrim, limit: 50 }),
    enabled: branchAddTrim.length > 0,
    staleTime: 10_000,
  });
  const branchAddList = branchAddTrim ? branchAddSearched : initialBranches;
  const branchAddOptions = (Array.isArray(branchAddList) ? branchAddList : []).map((b: any) => ({ value: String(b.id), label: String(b.branchName || b.name || b.id) }));

  const branchEditTrim = branchEditSearch.trim();
  const { data: branchEditSearched = [], isFetching: branchEditIsFetching } = useQuery({
    queryKey: ['/api/branches', 'search', branchEditTrim, 'edit'],
    queryFn: () => BranchesService.listBranches({ q: branchEditTrim, limit: 50 }),
    enabled: branchEditTrim.length > 0,
    staleTime: 10_000,
  });
  const branchEditList = branchEditTrim ? branchEditSearched : initialBranches;
  const branchEditOptions = (Array.isArray(branchEditList) ? branchEditList : []).map((b: any) => ({ value: String(b.id), label: String(b.branchName || b.name || b.id) }));

  const create = useMutation({
    mutationFn: () => UsersService.createUser(form),
    onSuccess: async () => {
      await refetch();
      setForm({ email: '', firstName: '', lastName: '', role: '', branchId: '', department: '', regionId: '', profileImageUrl: '', profileImageId: '' });
      setModalOpen(false);
      toast({ title: 'User created', description: 'User added successfully', duration: 2500 });
    },
    onError: (err: any) => {
      const status = Number(err?.status || err?.response?.status || 0);
      const raw = String(err?.data?.message || err?.message || '').toLowerCase();
      let msg = 'Failed to create user';
      if (status === 409 || /already exists|duplicate/.test(raw)) {
        msg = 'A user with this email already exists';
      } else if (status === 400) {
        msg = (err?.data?.message || 'Please check the form and try again');
      } else if (status >= 500) {
        msg = 'Server error. Please try again later';
      } else if (err?.data?.message) {
        msg = String(err.data.message);
      }
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    }
  });

  // Auto-adjustments based on selected department
  useEffect(() => {
    const deptObj = departments.find((d: any) => String(d.id) === String(form.department));
    const deptName = String(deptObj?.departmentName ?? deptObj?.department_name ?? '').trim();
    if (deptName === 'Operations') {
      // enforce regional manager role for Operations
      setForm((s) => ({ ...s, role: 'regional_manager' }));
    }
    if (deptName === 'Administration') {
      // clear region/branch for Administration
      setForm((s) => ({ ...s, branchId: '', regionId: '' }));
    }
  }, [form.department, departments]);

  // Client-side check to prevent creating a user with an email that already exists
  const handleCreate = () => {
    const emailTrim = String(form.email || '').trim().toLowerCase();
    if (!emailTrim) {
      toast({ title: 'Error', description: 'Email is required', variant: 'destructive' });
      return;
    }

    const exists = Array.isArray(users) && users.some((u: any) => String(u.email || '').trim().toLowerCase() === emailTrim);
    if (exists) {
      toast({ title: 'Error', description: 'A user with this email already exists', variant: 'destructive' });
      return;
    }

    // Additional validation based on department/role rules
    const deptObj = departments.find((d: any) => String(d.id) === String(form.department));
    const deptName = String(deptObj?.departmentName ?? deptObj?.department_name ?? '').trim();
    if (deptName === 'Administration') {
      // OK, nothing extra required
    } else if (deptName === 'Operations') {
      if (!form.regionId) { toast({ title: 'Error', description: 'Region is required for Operations', variant: 'destructive' }); return; }
    } else if (String(form.role) === 'branch_manager') {
      if (!form.regionId) { toast({ title: 'Error', description: 'Region is required for Branch Manager', variant: 'destructive' }); return; }
      if (!form.branchId) { toast({ title: 'Error', description: 'Branch is required for Branch Manager', variant: 'destructive' }); return; }
    }

    create.mutate();
  };

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
    const first = (u.firstName ?? u.first_name) ?? '';
    const last = (u.lastName ?? u.last_name) ?? '';
    const matchesQuery = !q ||
      String(first).toLowerCase().includes(q) ||
      String(last).toLowerCase().includes(q) ||
      String(u.email || '').toLowerCase().includes(q);
    const matchesRole = !filters.role || String(u.role || '') === filters.role;
    const matchesBranch = !filters.branchId || String((u.branchId ?? u.branch_id) || '') === filters.branchId;
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
          <div className="w-56">
            <SearchableCombobox
              value={filters.branchId}
              onValueChange={(v) => setFilters((s) => ({ ...s, branchId: v }))}
              placeholder="Filter by branch"
              searchPlaceholder="Search branches..."
              onSearch={setBranchFilterSearch}
              options={[{ value: '', label: 'All branches' }, ...branchFilterOptions]}
              loading={Boolean(branchFilterTrim.length > 0 && branchFilterIsFetching)}
            />
          </div>
        </div>

        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogTrigger asChild>
            <Button size="icon" className="h-7 w-7 p-0 bg-primary text-white shadow ring-2 ring-primary/40 hover:ring-primary" title="Add User" type="button">
              <Plus className="w-4 h-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl p-0">
            <div className="rounded-lg bg-card text-card-foreground shadow-lg overflow-hidden">
              <DialogHeader className="px-6 pt-6">
                <DialogTitle className="text-lg">Add User</DialogTitle>
                <div className="mt-1 text-sm text-muted-foreground">Create a new user and assign them to a department with the required region/branch as applicable.</div>
              </DialogHeader>

              <div className="px-6 pb-6">
                <div className="space-y-6">
                  {/* Profile image */}
                  <div>
                    <div className="text-sm font-medium">Profile image</div>
                    <div className="mt-2 flex items-center gap-3">
                      <div className="h-16 w-16 rounded overflow-hidden bg-muted flex items-center justify-center border">
                        {form.profileImageUrl ? (
                          <img src={form.profileImageUrl} alt="preview" className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-xs text-muted-foreground">No photo</span>
                        )}
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          try {
                            const { uploadProfilePicture } = await import('@/services/uploads');
                            const res = await uploadProfilePicture(file);
                            setForm((s) => ({ ...s, profileImageUrl: String(res.fileUrl || ''), profileImageId: String(res.attachmentId || '') }));
                          } catch (err: any) {
                            toast({ title: 'Upload failed', description: err?.message || 'Could not upload image', variant: 'destructive' });
                          }
                        }}
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* User information */}
                  <div>
                    <div className="text-sm font-medium">User information</div>
                    <div className="mt-2 grid sm:grid-cols-3 gap-4">
                      <div className="flex flex-col">
                        <Label>Email<span className="text-destructive"> *</span></Label>
                        <Input className="mt-2" type="email" value={form.email} onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))} />
                      </div>
                      <div className="flex flex-col">
                        <Label>First name</Label>
                        <Input className="mt-2" value={form.firstName} onChange={(e) => setForm((s) => ({ ...s, firstName: e.target.value }))} />
                      </div>
                      <div className="flex flex-col">
                        <Label>Last name</Label>
                        <Input className="mt-2" value={form.lastName} onChange={(e) => setForm((s) => ({ ...s, lastName: e.target.value }))} />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Department & Assignment */}
                  <div>
                    <div className="text-sm font-medium">Department &amp; Assignment</div>
                    <div className="mt-2 grid sm:grid-cols-3 gap-4">
                      <div className="flex flex-col">
                        <Label>Department</Label>
                        <Select value={form.department} onValueChange={(v) => setForm((s) => ({ ...s, department: v, role: '' }))}>
                          <SelectTrigger className="mt-2 h-10"><SelectValue placeholder="Select department" /></SelectTrigger>
                          <SelectContent>
                            {departments.map((d: any) => (
                              <SelectItem key={String(d.id)} value={String(d.id)}>{String(d.departmentName ?? d.department_name ?? d.departmentName)}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex flex-col">
                        <Label>Role<span className="text-destructive"> *</span></Label>
                        <Select value={form.role} onValueChange={(v) => setForm((s) => ({ ...s, role: v }))} disabled={selectedDeptName === 'Operations'}>
                          <SelectTrigger className="mt-2 h-10"><SelectValue placeholder={form.department ? 'PLEASE SELECT' : 'PLEASE SELECT ROLE'} /></SelectTrigger>
                          <SelectContent>
                            {(rolesForDept || []).map((r: any) => (
                              <SelectItem key={String(r.id ?? r.role_name ?? r.roleName)} value={String(r.roleName ?? r.role_name ?? r.id)}>{String(r.roleName ?? r.role_name ?? r.id).replace(/_/g, ' ')}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {(() => {
                        const deptObj = departments.find((d: any) => String(d.id) === String(form.department));
                        const deptName = String(deptObj?.departmentName ?? deptObj?.department_name ?? '').trim();

                        if (deptName === 'Administration') {
                          return null;
                        }

                        if (deptName === 'Operations') {
                          return (
                            <div className="sm:col-span-3">
                              <Label>Region<span className="text-destructive"> *</span></Label>
                              <Select value={form.regionId} onValueChange={(v) => setForm((s) => ({ ...s, regionId: v }))}>
                                <SelectTrigger className="mt-2 h-10"><SelectValue placeholder="Select region" /></SelectTrigger>
                                <SelectContent>
                                  {(Array.isArray(regions) ? regions : []).filter((r: any) => !(r.regionHeadId ?? r.region_head_id)).map((r: any) => (
                                    <SelectItem key={String(r.id)} value={String(r.id)}>{String(r.name ?? r.regionName ?? r.region_name ?? r.name)}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          );
                        }

                        if (String(form.role) === 'branch_manager') {
                          return (
                            <>
                              <div>
                                <Label>Region<span className="text-destructive"> *</span></Label>
                                <Select value={form.regionId} onValueChange={(v) => setForm((s) => ({ ...s, regionId: v, branchId: '' }))}>
                                  <SelectTrigger className="mt-2 h-10"><SelectValue placeholder="Select region" /></SelectTrigger>
                                  <SelectContent>
                                    {(Array.isArray(regions) ? regions : []).map((r: any) => (
                                      <SelectItem key={String(r.id)} value={String(r.id)}>{String(r.name ?? r.regionName ?? r.region_name ?? r.name)}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="sm:col-span-3">
                                <Label>Branch<span className="text-destructive"> *</span></Label>
                                <div className="mt-2">
                                  <SearchableCombobox
                                    value={form.branchId}
                                    onValueChange={(v) => setForm((s) => ({ ...s, branchId: v }))}
                                    placeholder="Select branch (required)"
                                    searchPlaceholder="Search branches..."
                                    onSearch={setBranchSearch}
                                    options={(branchAddList || []).filter((b: any) => !(b.branchHeadId ?? b.branch_head_id) && (!form.regionId || String(b.regionId ?? b.region_id) === String(form.regionId))).map((b: any) => ({ value: String(b.id), label: String(b.branchName || b.name || b.id) }))}
                                    loading={Boolean(branchAddTrim.length > 0 && branchAddIsFetching)}
                                  />
                                </div>
                              </div>
                            </>
                          );
                        }

                        return null;
                      })()}
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-end gap-3">
                  <Button type="button" onClick={() => handleCreate()} disabled={create.isPending || !form.email || !form.role || (function(){
                    const deptObj = departments.find((d: any) => String(d.id) === String(form.department));
                    const deptName = String(deptObj?.departmentName ?? deptObj?.department_name ?? '').trim();
                    if (deptName === 'Administration') return false; // no extra requirement
                    if (deptName === 'Operations') return !form.regionId || !form.role; // need region and role
                    if (String(form.role) === 'branch_manager') return !form.regionId || !form.branchId || !form.role; // need region and branch
                    return false; // others: no branch required
                  })()}>
                  {create.isPending ? 'Creating...' : 'Save'}
                </Button>
                  <Button type="button" variant="outline" onClick={() => { setForm({ email: '', firstName: '', lastName: '', role: '', branchId: '', department: '', regionId: '', profileImageUrl: '', profileImageId: '' }); setModalOpen(false); }} disabled={create.isPending}>
                    Cancel
                  </Button>
                </div>
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
                  <TableHead className="h-8 px-2 text-[11px]">Active</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(pageItems as any[]).map((u: any) => (
                  <TableRow key={u.id} className="cursor-pointer hover:bg-gray-50" onClick={() => {
                    setSelected(u);
                    setEditForm({
                      firstName: String((u.firstName ?? u.first_name) || ''),
                      lastName: String((u.lastName ?? u.last_name) || ''),
                      role: String(u.role || 'counselor'),
                      branchId: String((u.branchId ?? u.branch_id) || ''),
                      department: String(u.department || ''),
                      regionId: String((u.regionId ?? u.region_id) || ''),
                    });
                    setIsEditing(false);
                    setDetailOpen(true);
                  }}>
                    <TableCell className="p-2 text-xs">{[(u.firstName ?? u.first_name), (u.lastName ?? u.last_name)].filter(Boolean).join(' ') || '—'}</TableCell>
                    <TableCell className="p-2 text-xs">{u.email}</TableCell>
                    <TableCell className="p-2 text-xs">{roleLabel(u.role)}</TableCell>
                    <TableCell className="p-2 text-xs">{u.branchName || u.branchId || u.branch_id || '—'}</TableCell>
                    <TableCell className="p-2 text-xs">{(u.isActive ?? u.is_active) ? 'Yes' : 'No'}</TableCell>
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
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{[(selected?.firstName ?? selected?.first_name), (selected?.lastName ?? selected?.last_name)].filter(Boolean).join(' ') || selected?.email || 'User'}</span>
              {!isEditing ? (
                <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>Edit</Button>
              ) : null}
            </DialogTitle>
          </DialogHeader>

          {!isEditing ? (
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={String(selected?.profileImageUrl ?? selected?.profile_image_url ?? '')} alt="profile" />
                  <AvatarFallback>{String((((selected?.firstName ?? selected?.first_name) || ' ')[0] || '') + (((selected?.lastName ?? selected?.last_name) || ' ')[0] || '')).trim().toUpperCase() || (selected?.email || 'U')[0]}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <div className="text-base font-semibold truncate">{[(selected?.firstName ?? selected?.first_name), (selected?.lastName ?? selected?.last_name)].filter(Boolean).join(' ') || selected?.email || 'User'}</div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Badge>{selected ? roleLabel(selected.role) : '—'}</Badge>
                    {selected?.branchName ? <Badge variant="secondary">{String(selected.branchName)}</Badge> : null}
                    {(selected?.branchId ?? selected?.branch_id) && !selected?.branchName ? <Badge variant="secondary">{String(selected?.branchId ?? selected?.branch_id)}</Badge> : null}
                    <Badge variant={(selected?.isActive ?? selected?.is_active) ? 'default' : 'destructive'}>{(selected?.isActive ?? selected?.is_active) ? 'Active' : 'Inactive'}</Badge>
                    <Badge variant={(selected?.isRegistrationEmailSent ?? selected?.is_registration_email_sent) ? 'default' : 'outline'}>Reg Email {(selected?.isRegistrationEmailSent ?? selected?.is_registration_email_sent) ? 'Sent' : 'Not Sent'}</Badge>
                    <Badge variant={(selected?.isProfileComplete ?? selected?.is_profile_complete) ? 'default' : 'outline'}>Profile {(selected?.isProfileComplete ?? selected?.is_profile_complete) ? 'Complete' : 'Incomplete'}</Badge>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div>
                  <div className="text-xs text-muted-foreground">User ID</div>
                  <div className="font-medium break-words">{selected?.email || '—'}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">First name</div>
                  <div className="font-medium">{(selected?.firstName ?? selected?.first_name) || '—'}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Last name</div>
                  <div className="font-medium">{(selected?.lastName ?? selected?.last_name) || '—'}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Role</div>
                  <div className="font-medium">{selected ? roleLabel(selected.role) : '—'}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Branch</div>
                  <div className="font-medium">{selected?.branchName || selected?.branchId || selected?.branch_id || '—'}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Phone number</div>
                  <div className="font-medium">{selected?.phoneNumber || selected?.phone_number || '—'}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Registration email</div>
                  <div className="font-medium">{(selected?.isRegistrationEmailSent ?? selected?.is_registration_email_sent) ? 'Sent' : 'Not sent'}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Profile complete</div>
                  <div className="font-medium">{(selected?.isProfileComplete ?? selected?.is_profile_complete) ? 'Yes' : 'No'}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Active</div>
                  <div className="font-medium">{(selected?.isActive ?? selected?.is_active) ? 'Yes' : 'No'}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Created at</div>
                  <div className="font-medium">{selected?.createdAt || selected?.created_at ? new Date(String(selected?.createdAt || selected?.created_at)).toLocaleString() : '—'}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Updated at</div>
                  <div className="font-medium">{selected?.updatedAt || selected?.updated_at ? new Date(String(selected?.updatedAt || selected?.updated_at)).toLocaleString() : '—'}</div>
                </div>
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
                <Label>Department</Label>
                <Select value={editForm.department} onValueChange={(v) => setEditForm((s) => ({ ...s, department: v, role: '' }))}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select department" /></SelectTrigger>
                  <SelectContent>
                    {departments.map((d: any) => (
                      <SelectItem key={String(d.id)} value={String(d.id)}>{String(d.departmentName ?? d.department_name ?? d.departmentName)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Role<span className="text-destructive"> *</span></Label>
                <Select value={editForm.role} onValueChange={(v) => setEditForm((s) => ({ ...s, role: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder={editForm.department ? 'PLEASE SELECT' : 'PLEASE SELECT ROLE'} /></SelectTrigger>
                  <SelectContent>
                    {(rolesForEditDept || []).map((r: any) => (
                      <SelectItem key={String(r.id ?? r.role_name ?? r.roleName)} value={String(r.roleName ?? r.role_name ?? r.id)}>{String(r.roleName ?? r.role_name ?? r.id).replace(/_/g, ' ')}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {(() => {
                const deptObj = departments.find((d: any) => String(d.id) === String(editForm.department));
                const deptName = String(deptObj?.departmentName ?? deptObj?.department_name ?? '').trim();

                if (deptName === 'Administration') {
                  return null;
                }

                if (deptName === 'Operations') {
                  return (
                    <div className="sm:col-span-2 md:col-span-3">
                      <Label>Region<span className="text-destructive"> *</span></Label>
                      <Select value={editForm.regionId} onValueChange={(v) => setEditForm((s) => ({ ...s, regionId: v }))}>
                        <SelectTrigger className="mt-1"><SelectValue placeholder="Select region" /></SelectTrigger>
                        <SelectContent>
                          {(Array.isArray(regions) ? regions : []).filter((r: any) => !(r.regionHeadId ?? r.region_head_id)).map((r: any) => (
                            <SelectItem key={String(r.id)} value={String(r.id)}>{String(r.name ?? r.regionName ?? r.region_name ?? r.name)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  );
                }

                if (String(editForm.role) === 'branch_manager') {
                  return (
                    <>
                      <div>
                        <Label>Region<span className="text-destructive"> *</span></Label>
                        <Select value={editForm.regionId} onValueChange={(v) => setEditForm((s) => ({ ...s, regionId: v, branchId: '' }))}>
                          <SelectTrigger className="mt-1"><SelectValue placeholder="Select region" /></SelectTrigger>
                          <SelectContent>
                            {(Array.isArray(regions) ? regions : []).map((r: any) => (
                              <SelectItem key={String(r.id)} value={String(r.id)}>{String(r.name ?? r.regionName ?? r.region_name ?? r.name)}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="sm:col-span-2 md:col-span-3">
                        <Label>Branch<span className="text-destructive"> *</span></Label>
                        <SearchableCombobox
                          value={editForm.branchId}
                          onValueChange={(v) => setEditForm((s) => ({ ...s, branchId: v }))}
                          placeholder="Select branch (required)"
                          searchPlaceholder="Search branches..."
                          onSearch={setBranchEditSearch}
                          options={(branchEditList || []).filter((b: any) => !(b.branchHeadId ?? b.branch_head_id) && (!editForm.regionId || String(b.regionId ?? b.region_id) === String(editForm.regionId))).map((b: any) => ({ value: String(b.id), label: String(b.branchName || b.name || b.id) }))}
                          loading={Boolean(branchEditTrim.length > 0 && branchEditIsFetching)}
                        />
                      </div>
                    </>
                  );
                }

                return null;
              })()}
              <div className="col-span-full flex gap-2">
                <Button onClick={() => updateMutation.mutate()} disabled={!selected?.id || !editForm.role || (function(){
                  const deptObj = departments.find((d: any) => String(d.id) === String(editForm.department));
                  const deptName = String(deptObj?.departmentName ?? deptObj?.department_name ?? '').trim();
                  if (deptName === 'Administration') return false;
                  if (deptName === 'Operations') return !editForm.regionId || !editForm.role;
                  if (String(editForm.role) === 'branch_manager') return !editForm.regionId || !editForm.branchId || !editForm.role;
                  return false;
                })() || updateMutation.isPending}>
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
