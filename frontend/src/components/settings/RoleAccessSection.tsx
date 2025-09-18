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

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ moduleName: '', roleId: '', viewLevel: '', canCreate: false, canEdit: false });
  const [editingId, setEditingId] = useState<string | null>(null);

  const createMut = useMutation({ mutationFn: (data: any) => UserAccessService.createUserAccess(data), onSuccess: async () => { setModalOpen(false); setForm({ moduleName: '', roleId: '', viewLevel: '', canCreate: false, canEdit: false }); await refetch(); toast({ title: 'Saved', duration: 2000 }); }, onError: (err: any) => { toast({ title: 'Error', description: err?.message || 'Failed', variant: 'destructive' }); } });
  const updateMut = useMutation({ mutationFn: ({ id, data }: any) => UserAccessService.updateUserAccess(id, data), onSuccess: async () => { setModalOpen(false); setEditingId(null); await refetch(); toast({ title: 'Updated', duration: 2000 }); }, onError: (err: any) => { toast({ title: 'Error', description: err?.message || 'Failed', variant: 'destructive' }); } });
  const deleteMut = useMutation({ mutationFn: (id: string) => UserAccessService.deleteUserAccess(id), onSuccess: async () => { await refetch(); toast({ title: 'Deleted', duration: 2000 }); } });

  function openCreate() { setEditingId(null); setForm({ moduleName: '', roleId: '', viewLevel: '', canCreate: false, canEdit: false }); setModalOpen(true); }
  function openEdit(item: any) { setEditingId(item.id); setForm({ moduleName: item.moduleName || '', roleId: item.roleId || '', viewLevel: item.viewLevel || '', canCreate: Boolean(item.canCreate), canEdit: Boolean(item.canEdit) }); setModalOpen(true); }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">Role access control</div>
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate}><span className="mr-2">+</span> Add</Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit access' : 'Add access'}</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <Label>Module name</Label>
                <Input value={form.moduleName} onChange={(e) => setForm((s) => ({ ...s, moduleName: e.target.value }))} />
              </div>
              <div>
                <Label>Role</Label>
                <Select value={form.roleId} onValueChange={(v) => setForm((s) => ({ ...s, roleId: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select role" /></SelectTrigger>
                  <SelectContent>
                    {(roles as any[]).map((r: any) => <SelectItem key={r.id} value={r.id}>{r.roleName}</SelectItem>)}
                  </SelectContent>
                </Select>
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
                  if (!form.moduleName || !form.roleId) { toast({ title: 'Module and role required', variant: 'destructive' }); return; }
                  const payload = { id: editingId || uuidv4(), moduleName: form.moduleName, roleId: form.roleId, viewLevel: form.viewLevel || '', canCreate: form.canCreate ? 1 : 0, canEdit: form.canEdit ? 1 : 0 };
                  if (editingId) updateMut.mutate({ id: editingId, data: payload }); else createMut.mutate(payload);
                }}>Save</Button>
                <Button variant="outline" onClick={() => { setModalOpen(false); setEditingId(null); }}>Cancel</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="overflow-auto">
        <Table className="text-xs">
          <TableHeader>
            <TableRow>
              <TableHead className="h-8 px-2 text-[11px]">Module</TableHead>
              <TableHead className="h-8 px-2 text-[11px]">Role</TableHead>
              <TableHead className="h-8 px-2 text-[11px]">View Level</TableHead>
              <TableHead className="h-8 px-2 text-[11px]">Create</TableHead>
              <TableHead className="h-8 px-2 text-[11px]">Edit</TableHead>
              <TableHead className="h-8 px-2 text-[11px]">Created</TableHead>
              <TableHead className="h-8 px-2 text-[11px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(accessList as any[]).map((a: any) => {
              const role = (roles as any[]).find((r: any) => String(r.id) === String(a.roleId));
              return (
                <TableRow key={a.id} className="hover:bg-gray-50">
                  <TableCell className="p-2 text-xs">{a.moduleName}</TableCell>
                  <TableCell className="p-2 text-xs">{role?.roleName || a.roleId}</TableCell>
                  <TableCell className="p-2 text-xs">{a.viewLevel}</TableCell>
                  <TableCell className="p-2 text-xs">{a.canCreate ? 'Yes' : 'No'}</TableCell>
                  <TableCell className="p-2 text-xs">{a.canEdit ? 'Yes' : 'No'}</TableCell>
                  <TableCell className="p-2 text-xs">{a.createdOn ? new Date(a.createdOn).toLocaleString() : ''}</TableCell>
                  <TableCell className="p-2 text-xs text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(a)}>Edit</Button>
                      <Button size="icon" variant="outline" onClick={() => { if (confirm('Delete access?')) deleteMut.mutate(a.id); }}>Delete</Button>
                    </div>
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
