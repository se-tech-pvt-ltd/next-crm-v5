import React, { useEffect, useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export default function UserProfileWizard() {
  const { user, refreshUser } = useAuth() as any;
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [profileImageUrl, setProfileImageUrl] = useState('');
  const [profileImageId, setProfileImageId] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const fileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const shouldOpen = Boolean(user && !((user.isProfileComplete ?? user.is_profile_complete)));
    setOpen(shouldOpen);
    if (user) {
      setFirstName(user.firstName ?? user.first_name ?? '');
      setLastName(user.lastName ?? user.last_name ?? '');
      setPhoneNumber(user.phoneNumber ?? user.phone_number ?? '');
      setProfileImageUrl(user.profileImageUrl ?? user.profile_image_url ?? '');
      setProfileImageId(user.profileImageId ?? user.profile_image_id ?? '');
    }
  }, [user]);

  const handleFile = async (file?: File) => {
    if (!file) return;
    try {
      const { uploadProfilePicture } = await import('@/services/uploads');
      const res = await uploadProfilePicture(file);
      setProfileImageUrl(String(res.fileUrl || ''));
      setProfileImageId(String(res.attachmentId || ''));
      toast({ title: 'Uploaded', description: 'Profile picture uploaded' });
    } catch (err: any) {
      toast({ title: 'Upload failed', description: err?.message || 'Could not upload image', variant: 'destructive' });
    }
  };

  const handleSave = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const UsersService = await import('@/services/users');

      // Password is mandatory
      if (!newPassword || String(newPassword).length < 6) {
        toast({ title: 'Error', description: 'New password is required and must be at least 6 characters', variant: 'destructive' });
        setLoading(false);
        return;
      }
      if (!String(currentPassword || '').trim()) {
        toast({ title: 'Error', description: 'Current password is required', variant: 'destructive' });
        setLoading(false);
        return;
      }

      // Change password first
      try {
        await UsersService.changePassword(String(user.id), currentPassword || undefined, newPassword);
        toast({ title: 'Password changed' });
      } catch (err: any) {
        const msg = err?.data?.message || err?.message || 'Failed to change password';
        toast({ title: 'Error', description: String(msg), variant: 'destructive' });
        setLoading(false);
        return;
      }

      const payload: any = {
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        phoneNumber: phoneNumber || undefined,
      };
      if (profileImageId) payload.profileImageId = profileImageId;
      // Mark profile complete
      payload.isProfileComplete = true;

      await UsersService.updateUser(String(user.id), payload);

      await refreshUser?.();

      toast({ title: 'Profile updated', description: 'Your profile is now complete' });
      setOpen(false);
    } catch (err: any) {
      toast({ title: 'Error', description: err?.message || 'Failed to update profile', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => { /* prevent closing by clicking backdrop until complete */ }}>
      <DialogContent hideClose className="max-w-2xl p-0 sm:rounded-xl shadow-2xl ring-1 ring-primary/10 max-h-[85vh] overflow-y-auto">
        <div className="rounded-lg bg-card text-card-foreground overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-4 border-b">
            <DialogTitle className="text-2xl">Welcome — finish your profile</DialogTitle>
          </DialogHeader>

          <div className="px-6 pb-6">
            <div className="mt-2 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-[120px_1fr] gap-4 items-start">
                <div className="flex flex-col items-center">
                  <div className="w-28 h-28 rounded-full overflow-hidden border bg-muted flex items-center justify-center mb-2">
                    {profileImageUrl ? <img src={profileImageUrl} alt="avatar" className="w-full h-full object-cover" /> : <div className="text-muted-foreground">No image</div>}
                  </div>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleFile(f); }} />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => fileRef.current?.click()}>Upload</Button>
                    <Button size="sm" variant="outline" onClick={() => { setProfileImageUrl(''); setProfileImageId(''); }}>Remove</Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>First name</Label>
                    <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} className="mt-2" />
                  </div>
                  <div>
                    <Label>Last name</Label>
                    <Input value={lastName} onChange={(e) => setLastName(e.target.value)} className="mt-2" />
                  </div>
                  <div className="sm:col-span-2">
                    <Label>Phone number</Label>
                    <Input value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className="mt-2" />
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="text-lg font-semibold mb-2">Change password (required)</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Current password</Label>
                    <Input value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} type="password" className="mt-2" />
                  </div>
                  <div>
                    <Label>New password</Label>
                    <Input value={newPassword} onChange={(e) => setNewPassword(e.target.value)} type="password" className="mt-2" />
                    <div className="text-xs text-muted-foreground mt-1">Password must be at least 6 characters</div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2">
                <Button onClick={handleSave} disabled={loading || !(newPassword && newPassword.length >= 6 && String(currentPassword || '').trim().length > 0)}>
                  {loading ? 'Saving...' : 'Save and continue'}
                </Button>
              </div>

            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
