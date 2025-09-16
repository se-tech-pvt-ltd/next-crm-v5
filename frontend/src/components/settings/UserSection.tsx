import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SearchableCombobox } from '@/components/ui/searchable-combobox';
import { Separator } from '@/components/ui/separator';
import * as BranchesService from '@/services/branches';
import * as UsersService from '@/services/users';

export default function UserSection({ toast }: { toast: (v: any) => void }) {
  const { data: users = [], refetch } = useQuery({ queryKey: ['/api/users'], queryFn: () => UsersService.getUsers() });
  const { data: branches = [] } = useQuery({ queryKey: ['/api/configurations/branches'], queryFn: () => BranchesService.listBranches() });
  const [form, setForm] = useState({ email: '', firstName: '', lastName: '', role: 'counselor', branchId: '' });
  const create = useMutation({
    mutationFn: () => UsersService.createUser(form),
    onSuccess: async () => { await refetch(); setForm({ email: '', firstName: '', lastName: '', role: 'counselor', branchId: '' }); toast({ title: 'User created', description: 'User added successfully', duration: 2500 }); },
    onError: (err: any) => {
      const msg = err?.message || err?.data?.message || 'Failed to create user';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    }
  });
  const invite = useMutation({
    mutationFn: () => UsersService.inviteUser(form),
    onSuccess: async () => { await refetch(); toast({ title: 'Invite sent', description: 'Invitation recorded', duration: 2500 }); },
    onError: (err: any) => {
      const msg = err?.message || err?.data?.message || 'Failed to invite user';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    }
  });

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-3 gap-2">
        <div>
          <Label>Email</Label>
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
          <Label>Role</Label>
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
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Branch<span className="text-destructive"> *</span></Label>
          <Select value={form.branchId} onValueChange={(v) => setForm((s) => ({ ...s, branchId: v }))}>
            <SelectTrigger className="mt-1"><SelectValue placeholder="Select branch (required)" /></SelectTrigger>
            <SelectContent>
              {branches.map((b: any) => {
                const assignedTo = (users as any[]).find((u: any) => u.branchId === b.id);
                const displayName = b.branchName || b.name || b.id;
                return (
                  <SelectItem key={b.id} value={b.id} disabled={!!assignedTo}>
                    {displayName}{assignedTo ? ' — Assigned' : ''}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex gap-2">
        <Button type="button" onClick={() => create.mutate()} disabled={!form.email || !form.branchId}>Create user</Button>
        <Button type="button" variant="outline" onClick={() => invite.mutate()} disabled={!form.email || !form.branchId}>Invite user</Button>
      </div>
      <Separator />
      <div>
        <div className="text-sm font-medium mb-2">Existing users</div>
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground">
                <th className="py-1 pr-2">Name</th>
                <th className="py-1 pr-2">Email</th>
                <th className="py-1 pr-2">Role</th>
                <th className="py-1 pr-2">Branch</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u: any) => (
                <tr key={u.id} className="border-t">
                  <td className="py-1 pr-2">{[u.firstName, u.lastName].filter(Boolean).join(' ') || '—'}</td>
                  <td className="py-1 pr-2">{u.email}</td>
                  <td className="py-1 pr-2">{(() => {
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
                    return map[u.role] || (u.role || '').replace(/_/g, ' ');
                  })()}</td>
                  <td className="py-1 pr-2">{u.branchId || '—'}</td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr><td className="text-xs text-muted-foreground py-2" colSpan={4}>No users found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
