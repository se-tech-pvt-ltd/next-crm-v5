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

  React.useEffect(() => {
    setCurrentPage(1);
  }, [filters.query, filters.role, filters.branchId]);

  const total = filteredUsers.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const hasPrevPage = currentPage > 1;
  const hasNextPage = currentPage < totalPages;
  const start = (currentPage - 1) * pageSize;
  const end = start + pageSize;
  const pageItems = filteredUsers.slice(start, end);

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
          <Select value={filters.role} onValueChange={(v) => setFilters((s) => ({ ...s, role: v }))}>
            <SelectTrigger className="h-8 w-44"><SelectValue placeholder="Role" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">All roles</SelectItem>
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
                  <TableRow key={u.id}>
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
    </div>
  );
}
