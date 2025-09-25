import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
console.log('[component] loaded: frontend/src/components/user-menu.tsx');
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { Settings, LogOut, User, Edit2, Save, X, Upload, Mail, Phone, Shield, Building2 } from 'lucide-react';
import { useLocation } from 'wouter';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';

interface UserMenuProps {
  collapsed?: boolean;
  fullWidth?: boolean;
}

export function UserMenu({ collapsed = false, fullWidth = true }: UserMenuProps) {
  const { user, logout, refreshUser } = useAuth();
  const [, setLocation] = useLocation();
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

  const handleLogout = () => { logout(); try { setLocation('/login'); } catch {} };

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
      <div className={fullWidth ? "mt-auto pt-2" : ""}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size={fullWidth ? undefined : 'icon'}
              className={`${fullWidth ? 'w-full p-2 h-auto' : 'w-9 h-9 p-0 rounded-full border border-gray-200 hover:bg-gray-50'} ${collapsed ? 'justify-center' : 'justify-start p-3'}`}
            >
              {collapsed ? (
                <div className="relative group">
                  <div className="w-7 h-7 rounded-full overflow-hidden bg-blue-600 flex items-center justify-center">
                    {profileImageUrlSrc ? (
                      <img src={profileImageUrlSrc} alt="avatar" className="w-full h-full object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                    ) : (
                      <span className="text-xs font-semibold text-white">{(displayName || 'U').slice(0,2).toUpperCase()}</span>
                    )}
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
        <DialogContent hideClose className="no-not-allowed p-0 sm:max-w-xl md:max-w-3xl w-[94vw] overflow-hidden rounded-2xl">
          <DialogTitle className="sr-only">User Profile</DialogTitle>

          {/* Cover */}
          <div className="relative">
            <div className="h-28 bg-gradient-to-r from-[#223E7D] via-blue-600 to-accent" />
            <button
              aria-label="Close"
              onClick={() => setIsProfileOpen(false)}
              className="absolute right-3 top-3 h-8 w-8 rounded-full bg-white/20 hover:bg-white/30 text-white grid place-items-center"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="absolute -bottom-10 left-6">
              <div className="relative w-20 h-20 rounded-full ring-4 ring-white shadow-xl overflow-hidden bg-white">
                <Avatar className="w-full h-full">
                  <AvatarImage src={profileImageUrl || profileImageUrlSrc} alt={displayName} />
                  <AvatarFallback>{(displayName || 'U').slice(0,2).toUpperCase()}</AvatarFallback>
                </Avatar>
                {isEditing && (
                  <div className="absolute inset-x-0 bottom-0 bg-black/60 text-white text-[11px] py-1 flex items-center justify-center gap-1">
                    <Upload className="w-3 h-3" />
                    <button className="underline" onClick={() => fileRef.current?.click()}>Change</button>
                    <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); }} />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="px-6 pt-14 pb-6 grid md:grid-cols-[260px_1fr] gap-6">
            {/* Left card */}
            <div className="bg-white rounded-xl border shadow-sm p-4 h-max">
              <div className="mb-3">
                <div className="text-lg font-semibold leading-tight">{displayName}</div>
                <div className="mt-1"><Badge className={getRoleColor(roleRaw || (user as any).role)}>{getRoleDisplay(roleRaw || (user as any).role)}</Badge></div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-600"><Mail className="w-4 h-4" /> <span className="break-all">{emailStr || '-'}</span></div>
                <div className="flex items-center gap-2 text-gray-600"><Phone className="w-4 h-4" /> <span>{phoneStr || 'Not set'}</span></div>
                <div className="flex items-center gap-2 text-gray-600"><Shield className="w-4 h-4" /> <span>{getRoleDisplay(roleRaw || (user as any).role || 'Unknown')}</span></div>
                {(user as any).branch && (
                  <div className="flex items-center gap-2 text-gray-600"><Building2 className="w-4 h-4" />
                    <span>
                      {(user as any).branch === 'branch_alpha' ? 'Branch Alpha - New York, NY' :
                       (user as any).branch === 'branch_beta' ? 'Branch Beta - Los Angeles, CA' :
                       (user as any).branch === 'branch_gamma' ? 'Branch Gamma - Chicago, IL' :
                       (user as any).branch}
                    </span>
                  </div>
                )}
              </div>
              {isEditing && profileImageUrl && (
                <div className="mt-3">
                  <Button variant="ghost" size="sm" onClick={() => { setProfileImageUrl(''); setProfileImageId(''); }}>Remove photo</Button>
                </div>
              )}
            </div>

            {/* Right panel */}
            <div className="bg-white rounded-xl border shadow-sm p-5 space-y-5">
              <div className="flex items-center justify-between">
                <div className="text-base font-semibold">Profile details</div>
                {!isEditing ? (
                  <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                    <Edit2 className="w-4 h-4 mr-1" />Edit
                  </Button>
                ) : (
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
                      <X className="w-4 h-4 mr-1" />Cancel
                    </Button>
                    <Button size="sm" onClick={handleSave}>
                      <Save className="w-4 h-4 mr-1" />Save
                    </Button>
                  </div>
                )}
              </div>

              {!isEditing ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-muted/40">
                    <div className="text-xs text-muted-foreground">Name</div>
                    <div className="text-sm font-medium">{`${firstNameSrc} ${lastNameSrc}`.trim() || displayName}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/40">
                    <div className="text-xs text-muted-foreground">Phone</div>
                    <div className="text-sm font-medium">{phoneStr || 'Not set'}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/40">
                    <div className="text-xs text-muted-foreground">Role</div>
                    <div className="text-sm font-medium">{getRoleDisplay(roleRaw || (user as any).role || 'Unknown')}</div>
                  </div>
                  {(user as any).branch && (
                    <div className="p-3 rounded-lg bg-muted/40 sm:col-span-2">
                      <div className="text-xs text-muted-foreground">Branch</div>
                      <div className="text-sm font-medium">
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

            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
