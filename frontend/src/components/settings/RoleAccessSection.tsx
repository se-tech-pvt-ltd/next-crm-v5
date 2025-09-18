import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import * as UserAccessService from '@/services/userAccess';
import * as UserRolesService from '@/services/userRoles';
import { v4 as uuidv4 } from 'uuid';

export default function RoleAccessSection({ toast }: { toast: (v: any) => void }) {
  const { data: accessList = [], refetch } = useQuery({ queryKey: ['/api/user-access'], queryFn: () => UserAccessService.listUserAccess() });
  const { data: roles = [] } = useQuery({ queryKey: ['/api/user-roles'], queryFn: () => UserRolesService.listRoles(), staleTime: 60_000 });
  const { data: departments = [] } = useQuery({ queryKey: ['/api/user-departments'], queryFn: () => UserRolesService.listDepartments(), staleTime: 60_000 });

  const [activeDept, setActiveDept] = useState<string | 'all'>('all');
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<any | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({ moduleName: '', roleId: '', viewLevel: '', canCreate: false, canEdit: false });
  const [editingId, setEditingId] = useState<string | null>(null);

  const createMut = useMutation({ mutationFn: (data: any) => UserAccessService.createUserAccess(data), onSuccess: async () => { setFormOpen(false); setForm({ moduleName: '', roleId: '', viewLevel: '', canCreate: false, canEdit: false }); await refetch(); toast({ title: 'Saved', duration: 2000 }); }, onError: (err: any) => { toast({ title: 'Error', description: err?.message || 'Failed', variant: 'destructive' }); } });
  const updateMut = useMutation({ mutationFn: ({ id, data }: any) => UserAccessService.updateUserAccess(id, data), onSuccess: async () => { setFormOpen(false); setEditingId(null); await refetch(); toast({ title: 'Updated', duration: 2000 }); }, onError: (err: any) => { toast({ title: 'Error', description: err?.message || 'Failed', variant: 'destructive' }); } });
  const deleteMut = useMutation({ mutationFn: (id: string) => UserAccessService.deleteUserAccess(id), onSuccess: async () => { await refetch(); toast({ title: 'Deleted', duration: 2000 }); } });

  function openRoleModal(role: any) {
    setSelectedRole(role);
    setRoleModalOpen(true);
    setFormOpen(false);
    setEditingId(null);
  }

  function openAddForRole() {
    setEditingId(null);
    setForm({ moduleName: '', roleId: selectedRole?.id || '', viewLevel: '', canCreate: false, canEdit: false });
    setFormOpen(true);
  }

  function openEdit(item: any) {
    setEditingId(item.id);
    setForm({ moduleName: item.moduleName || '', roleId: item.roleId || '', viewLevel: item.viewLevel || '', canCreate: Boolean(item.canCreate), canEdit: Boolean(item.canEdit) });
    setFormOpen(true);
  }

  const filteredRoles = (roles as any[]).filter((r: any) => activeDept === 'all' ? true : String(r.departmentId) === String(activeDept));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-lg font-semibold">Role access control</div>
      </div>

      <div className="flex flex-col gap-4">
        {(departments as any[]).map((d: any) => {
          const deptRoles = (roles as any[]).filter((r: any) => String(r.departmentId) === String(d.id));
          return (
            <div key={d.id} className="w-full bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
              <div className="px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md">
                <div className="text-lg font-semibold">{d.departmentName || d.id}</div>
              </div>
              <div className="border-t">
                <Table className="text-xs">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="h-9 px-3 text-[12px] uppercase tracking-wide text-gray-600">Role</TableHead>
                      <TableHead className="h-9 px-3 text-[12px] uppercase tracking-wide text-gray-600 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deptRoles.length === 0 ? (
                      <TableRow><TableCell colSpan={2} className="py-2 px-3 text-sm text-muted-foreground">No roles</TableCell></TableRow>
                    ) : deptRoles.map((r: any) => (
                      <TableRow key={r.id} className="hover:bg-gray-50/40">
                        <TableCell className="py-1 px-3 text-sm font-medium">{r.roleName}</TableCell>
                        <TableCell className="py-1 px-3 text-sm text-right"><Button size="sm" variant="ghost" className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded-md hover:shadow-md" onClick={() => openRoleModal(r)}>View access</Button></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          );
        })}

      </div>

      <Dialog open={roleModalOpen} onOpenChange={(o) => { setRoleModalOpen(o); if (!o) { setSelectedRole(null); setFormOpen(false); setEditingId(null); } }}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Access: {selectedRole?.roleName || ''}</span>
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={openAddForRole}>+ Add</Button>
                <Button size="sm" variant="outline" onClick={() => { setRoleModalOpen(false); }}>Close</Button>
              </div>
            </DialogTitle>
          </DialogHeader>

          {formOpen ? (
            <div className="p-4 border rounded mb-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <Label>Module name</Label>
                  <Input value={form.moduleName} onChange={(e) => setForm((s) => ({ ...s, moduleName: e.target.value }))} />
                </div>
                <div>
                  <Label>View level</Label>
                  <Input value={form.viewLevel} onChange={(e) => setForm((s) => ({ ...s, viewLevel: e.target.value }))} />
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2"><Checkbox checked={form.canCreate} onCheckedChange={(v: any) => setForm((s) => ({ ...s, canCreate: Boolean(v) }))} /> <span className="text-sm">Can create</span></div>
                  <div className="flex items-center gap-2"><Checkbox checked={form.canEdit} onCheckedChange={(v: any) => setForm((s) => ({ ...s, canEdit: Boolean(v) }))} /> <span className="text-sm">Can edit</span></div>
                </div>
                <div className="col-span-full flex gap-2 justify-end">
                  <Button onClick={() => {
                    if (!form.moduleName || !selectedRole?.id) { toast({ title: 'Module and role required', variant: 'destructive' }); return; }
                    const payload = { id: editingId || uuidv4(), moduleName: form.moduleName, roleId: selectedRole.id, viewLevel: form.viewLevel || '', canCreate: form.canCreate ? 1 : 0, canEdit: form.canEdit ? 1 : 0 };
                    if (editingId) updateMut.mutate({ id: editingId, data: payload }); else createMut.mutate(payload);
                  }}>Save</Button>
                  <Button variant="outline" onClick={() => { setFormOpen(false); setEditingId(null); }}>Cancel</Button>
                </div>
              </div>
            </div>
          ) : null}

          <div className="overflow-auto">
            <Table className="text-xs">
              <TableHeader>
                <TableRow>
                  <TableHead className="h-9 px-3 text-[12px] uppercase tracking-wide text-gray-600">Module</TableHead>
                  <TableHead className="h-9 px-3 text-[12px] uppercase tracking-wide text-gray-600">View Level</TableHead>
                  <TableHead className="h-9 px-3 text-[12px] uppercase tracking-wide text-gray-600">Create</TableHead>
                  <TableHead className="h-9 px-3 text-[12px] uppercase tracking-wide text-gray-600">Edit</TableHead>
                  <TableHead className="h-9 px-3 text-[12px] uppercase tracking-wide text-gray-600">Created</TableHead>
                  <TableHead className="h-9 px-3 text-[12px] uppercase tracking-wide text-gray-600 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {((accessList as any[]).filter((a: any) => String(a.roleId) === String(selectedRole?.id))).map((a: any) => (
                  <TableRow key={a.id} className="hover:bg-gray-50/40">
                    <TableCell className="py-1 px-3 text-sm">{a.moduleName}</TableCell>
                    <TableCell className="py-1 px-3 text-sm">{a.viewLevel}</TableCell>
                    <TableCell className="py-1 px-3 text-sm">{a.canCreate ? 'Yes' : 'No'}</TableCell>
                    <TableCell className="py-1 px-3 text-sm">{a.canEdit ? 'Yes' : 'No'}</TableCell>
                    <TableCell className="py-1 px-3 text-sm">{a.createdOn ? new Date(a.createdOn).toLocaleString() : ''}</TableCell>
                    <TableCell className="py-1 px-3 text-sm text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button size="icon" variant="ghost" onClick={() => openEdit(a)}>Edit</Button>
                        <Button size="icon" variant="outline" onClick={() => { if (confirm('Delete access?')) deleteMut.mutate(a.id); }}>Delete</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
