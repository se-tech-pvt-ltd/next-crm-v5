import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import * as BranchesService from '@/services/branches';
import * as UsersService from '@/services/users';
import * as BranchEmpService from '@/services/branchEmps';
import { Plus, Trash2 } from 'lucide-react';

export default function BranchEmpSection({ toast }: { toast: (v: any) => void }) {
  const { data: branchEmps = [], refetch } = useQuery({ queryKey: ['/api/branch-emps'], queryFn: () => BranchEmpService.listBranchEmps() });
  const { data: branches = [] } = useQuery({ queryKey: ['/api/branches'], queryFn: () => BranchesService.listBranches() });
  const { data: users = [] } = useQuery({ queryKey: ['/api/users'], queryFn: () => UsersService.getUsers() });

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ branchId: '', userId: '' });

  const createMutation = useMutation({
    mutationFn: () => BranchEmpService.createBranchEmp(form),
    onSuccess: async () => {
      setForm({ branchId: '', userId: '' });
      setModalOpen(false);
      await refetch();
      toast({ title: 'Mapping created', description: 'Branch employee mapping created' });
    },
    onError: (err: any) => {
      toast({ title: 'Error', description: err?.message || 'Failed to create mapping', variant: 'destructive' });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => BranchEmpService.deleteBranchEmp(id),
    onSuccess: async () => { await refetch(); toast({ title: 'Deleted' }); },
    onError: (err: any) => toast({ title: 'Error', description: err?.message || 'Failed to delete', variant: 'destructive' })
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="text-lg font-semibold flex items-center gap-2"><Plus className="w-4 h-4" /> Branch Employees</div>
        </div>
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogTrigger asChild>
            <Button size="icon" className="h-8 w-8 p-0"><Plus className="w-4 h-4" /></Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create mapping</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 gap-2">
              <div>
                <Label>Branch</Label>
                <Select value={form.branchId} onValueChange={(v) => setForm((s) => ({ ...s, branchId: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select branch" /></SelectTrigger>
                  <SelectContent>
                    {branches.map((b: any) => <SelectItem key={b.id} value={b.id}>{b.branchName ?? b.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>User</Label>
                <Select value={form.userId} onValueChange={(v) => setForm((s) => ({ ...s, userId: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select user" /></SelectTrigger>
                  <SelectContent>
                    {users.map((u: any) => <SelectItem key={u.id} value={u.id}>{(u.firstName || '') + ' ' + (u.lastName || '')} {u.email ? ` - ${u.email}` : ''}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-end gap-2 mt-2">
                <Button onClick={() => createMutation.mutate()} disabled={!form.branchId || !form.userId || createMutation.isPending}>{createMutation.isPending ? 'Saving...' : 'Save'}</Button>
                <Button variant="outline" onClick={() => setModalOpen(false)} disabled={createMutation.isPending}>Cancel</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Branch</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(branchEmps as any[]).map((m: any) => {
              const u = users.find((x: any) => x.id === (m.userId ?? m.user_id));
              const b = branches.find((x: any) => x.id === (m.branchId ?? m.branch_id));
              return (
                <TableRow key={m.id}>
                  <TableCell>{u ? ((u.firstName || '') + ' ' + (u.lastName || '')) : '—'}</TableCell>
                  <TableCell>{u ? u.email : '—'}</TableCell>
                  <TableCell>{b ? (b.branchName ?? b.name) : (m.branchId ?? m.branch_id)}</TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm" onClick={() => deleteMutation.mutate(String(m.id))}><Trash2 className="w-4 h-4" /></Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
