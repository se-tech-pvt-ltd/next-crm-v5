import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
console.log('[component] loaded: frontend/src/components/user-menu.tsx');
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { Settings, LogOut, User, Edit2, Save, X, Upload } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';

interface UserMenuProps {
  collapsed?: boolean;
}

export function UserMenu({ collapsed = false }: UserMenuProps) {
  const { user, logout, refreshUser } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [profileImageUrl, setProfileImageUrl] = useState('');
  const [profileImageId, setProfileImageId] = useState('');
  const fileRef = useRef<HTMLInputElement | null>(null);
  const { toast } = useToast();

  if (!user) return null;

  const safeToken = () => { try { return localStorage.getItem('auth_token'); } catch { return null; } };
  const parseJwt = (t: string | null) => {
    if (!t) return {} as any;
    try {
      const p = t.split('.')[1];
      const b64 = p.replace(/-/g, '+').replace(/_/g, '/');
      const pad = b64.length % 4;
      const b64p = b64 + (pad ? '='.repeat(4 - pad) : '');
      const json = decodeURIComponent(atob(b64p).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
      return JSON.parse(json) || {};
    } catch { return {} as any; }
  };
  const payload: any = parseJwt(safeToken());

  const firstNameSrc = (user as any)?.firstName ?? (user as any)?.first_name ?? payload?.first_name ?? payload?.firstName ?? payload?.user?.first_name ?? payload?.user?.firstName ?? '';
  const lastNameSrc = (user as any)?.lastName ?? (user as any)?.last_name ?? payload?.last_name ?? payload?.lastName ?? payload?.user?.last_name ?? payload?.user?.lastName ?? '';
  const emailStr = String((user as any)?.email ?? payload?.email ?? payload?.user?.email ?? '');
  const displayName = `${firstNameSrc} ${lastNameSrc}`.trim() || (emailStr.includes('@') ? emailStr.split('@')[0] : emailStr) || 'User';
  const phoneStr = String((user as any)?.phoneNumber ?? (user as any)?.phone_number ?? (user as any)?.phone ?? payload?.phone ?? payload?.phone_number ?? payload?.user?.phone ?? payload?.user?.phone_number ?? '');
  const profileImageUrlSrc = String((user as any)?.profileImageUrl ?? (user as any)?.profile_image_url ?? payload?.profile_image_url ?? payload?.profileImageUrl ?? payload?.user?.profile_image_url ?? payload?.user?.profileImageUrl ?? '');
  const roleRaw = String((user as any)?.role ?? payload?.role ?? payload?.role_name ?? payload?.user?.role ?? '');

  const getRoleDisplay = (role: string) => {
    switch (role) {
      case 'admin_staff':
        return 'Admin Staff';
      case 'branch_manager':
        return 'Branch Manager';
      case 'counselor':
        return 'Counselor';
      default:
        return role;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin_staff':
        return 'bg-red-100 text-red-800';
      case 'branch_manager':
        return 'bg-blue-100 text-blue-800';
      case 'counselor':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleLogout = () => { logout(); };

  const openProfile = () => {
    setIsProfileOpen(true);
    setIsEditing(false);
    setFirstName(firstNameSrc);
    setLastName(lastNameSrc);
    setPhoneNumber(phoneStr);
    setProfileImageUrl(profileImageUrlSrc);
    setProfileImageId('');
  };

  const handleUpload = async (file: File) => {
    try {
      const { uploadProfilePicture } = await import('@/services/uploads');
      const res = await uploadProfilePicture(file);
      const newUrl = String(res.fileUrl || '');
      const newId = String(res.attachmentId || '');
      setProfileImageUrl(newUrl);
      setProfileImageId(newId);
      try {
        const UsersService = await import('@/services/users');
        await UsersService.updateUser(String((user as any).id), { profileImageId: newId });
        await refreshUser?.();
      } catch {}
      toast({ title: 'Uploaded', description: 'Profile picture updated' });
    } catch (err: any) {
      toast({ title: 'Upload failed', description: err?.message || 'Could not upload image', variant: 'destructive' });
    }
  };

  const handleSave = async () => {
    try {
      const UsersService = await import('@/services/users');
      const payload: any = {
        firstName: firstName?.trim(),
        lastName: lastName?.trim(),
        phoneNumber: phoneNumber?.trim(),
      };
      if (profileImageId) payload.profileImageId = profileImageId;
      await UsersService.updateUser(String((user as any).id), payload);
      await refreshUser?.();
      toast({ title: 'Profile updated' });
      setIsEditing(false);
    } catch (err: any) {
      toast({ title: 'Update failed', description: err?.message || 'Could not update profile', variant: 'destructive' });
    }
  };

  return (
    <>
      <div className="mt-auto pt-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className={`w-full h-auto p-2 ${collapsed ? 'justify-center' : 'justify-start p-3'}`}>
              {collapsed ? (
                <div className="relative group">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                    {displayName} - {getRoleDisplay((user as any).role)}
                  </div>
                </div>
              ) : (
                <div className="flex items-center space-x-3 w-full">
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-blue-600 flex items-center justify-center">
                    {profileImageUrlSrc ? (
                      <img src={profileImageUrlSrc} alt="avatar" className="w-full h-full object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                    ) : (
                      <User className="w-4 h-4 text-white" />
                    )}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-gray-900 truncate">{displayName}</p>
                    <p className="text-xs text-gray-500">{getRoleDisplay(roleRaw || (user as any).role)}</p>
                  </div>
                  <Settings className="w-4 h-4 text-gray-400" />
                </div>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={() => { try { const { useModalManager } = require('@/contexts/ModalManagerContext'); const { openModal } = useModalManager(); openModal(() => openProfile()); } catch { openProfile(); } }}>
              <User className="w-4 h-4 mr-2" />
              View Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Log Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
        <DialogContent hideClose className="no-not-allowed p-0 sm:max-w-lg md:max-w-2xl w-[92vw] overflow-hidden">
          <div className="bg-gradient-to-r from-primary/15 via-accent/10 to-transparent px-6 py-5 border-b flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-primary/20 flex items-center justify-center ring-2 ring-primary/40">
                {profileImageUrl ? (
                  <img src={profileImageUrl || profileImageUrlSrc} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-6 h-6 text-primary" />
                )}
              </div>
              <div>
                <div className="text-lg font-semibold">{displayName}</div>
                <Badge className={getRoleColor(roleRaw || (user as any).role)}>{getRoleDisplay(roleRaw || (user as any).role)}</Badge>
              </div>
            </div>
            {isEditing ? (
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
                  <X className="w-4 h-4 mr-1" />Cancel
                </Button>
                <Button size="sm" onClick={handleSave}>
                  <Save className="w-4 h-4 mr-1" />Save
                </Button>
              </div>
            ) : (
              <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                <Edit2 className="w-4 h-4 mr-1" />Edit
              </Button>
            )}
          </div>

          <div className="p-6 grid md:grid-cols-[220px_1fr] gap-6">
            <div className="space-y-4">
              <div className="relative w-40 h-40 rounded-full overflow-hidden border bg-muted mx-auto md:mx-0">
                <Avatar className="w-full h-full">
                  <AvatarImage src={profileImageUrl || profileImageUrlSrc} alt={displayName} />
                  <AvatarFallback>{(displayName || 'U').slice(0,2).toUpperCase()}</AvatarFallback>
                </Avatar>
                {isEditing && (
                  <div className="absolute inset-x-0 bottom-0 bg-black/60 text-white text-xs py-2 flex items-center justify-center gap-2">
                    <Upload className="w-3.5 h-3.5" />
                    <button className="underline" onClick={() => fileRef.current?.click()}>Change</button>
                    <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); }} />
                  </div>
                )}
              </div>
              {isEditing && profileImageUrl && (
                <Button variant="ghost" size="sm" onClick={() => { setProfileImageUrl(''); setProfileImageId(''); }}>Remove</Button>
              )}

              <div className="hidden md:block">
                <div className="text-xs text-muted-foreground mb-1">Email</div>
                <div className="text-sm break-all">{emailStr || '-'}</div>
              </div>
            </div>

            <div className="space-y-5">
              {!isEditing ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-muted-foreground">Name</div>
                    <div className="text-sm">{`${firstNameSrc} ${lastNameSrc}`.trim() || displayName}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Phone</div>
                    <div className="text-sm">{phoneStr || 'Not set'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Role</div>
                    <div className="text-sm">{getRoleDisplay(roleRaw || (user as any).role || 'Unknown')}</div>
                  </div>
                  {(user as any).branch && (
                    <div className="sm:col-span-2">
                      <div className="text-xs text-muted-foreground">Branch</div>
                      <div className="text-sm">
                        {(user as any).branch === 'branch_alpha' ? 'Branch Alpha - New York, NY' :
                         (user as any).branch === 'branch_beta' ? 'Branch Beta - Los Angeles, CA' :
                         (user as any).branch === 'branch_gamma' ? 'Branch Gamma - Chicago, IL' :
                         (user as any).branch}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="firstName">First name</Label>
                    <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First name" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="lastName">Last name</Label>
                    <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last name" />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="phone">Phone number</Label>
                    <Input id="phone" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="+1234567890" />
                  </div>
                </div>
              )}

              <Separator />

              <div className="flex flex-col sm:flex-row gap-3 justify-end">
                <Button variant="outline" onClick={() => setIsProfileOpen(false)}>Close</Button>
                {!isEditing ? (
                  <Button onClick={() => setIsEditing(true)} variant="secondary"><Edit2 className="w-4 h-4 mr-2" />Edit</Button>
                ) : (
                  <Button onClick={handleSave}><Save className="w-4 h-4 mr-2" />Save changes</Button>
                )}
                <Button onClick={handleLogout} variant="destructive">
                  <LogOut className="w-4 h-4 mr-2" /> Log Out
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
