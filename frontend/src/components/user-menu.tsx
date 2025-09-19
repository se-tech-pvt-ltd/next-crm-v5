import { useState } from 'react';
import { Button } from '@/components/ui/button';
console.log('[component] loaded: frontend/src/components/user-menu.tsx');
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { Settings, LogOut, User, Building, Mail, Shield, Phone } from 'lucide-react';

interface UserMenuProps {
  collapsed?: boolean;
}

export function UserMenu({ collapsed = false }: UserMenuProps) {
  const { user, logout } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

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

  const firstName = (user as any)?.firstName ?? (user as any)?.first_name ?? payload?.first_name ?? payload?.firstName ?? payload?.user?.first_name ?? payload?.user?.firstName ?? '';
  const lastName = (user as any)?.lastName ?? (user as any)?.last_name ?? payload?.last_name ?? payload?.lastName ?? payload?.user?.last_name ?? payload?.user?.lastName ?? '';
  const fullName = `${firstName} ${lastName}`.trim();
  const emailStr = String((user as any)?.email ?? payload?.email ?? payload?.user?.email ?? '');
  const displayName = fullName || (emailStr.includes('@') ? emailStr.split('@')[0] : emailStr) || 'User';
  const phoneStr = String((user as any)?.phoneNumber ?? (user as any)?.phone_number ?? (user as any)?.phone ?? payload?.phone ?? payload?.phone_number ?? payload?.user?.phone ?? payload?.user?.phone_number ?? '');
  const profileImageUrl = String((user as any)?.profileImageUrl ?? (user as any)?.profile_image_url ?? payload?.profile_image_url ?? payload?.profileImageUrl ?? payload?.user?.profile_image_url ?? payload?.user?.profileImageUrl ?? '');
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

  const handleLogout = () => {
    logout();
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
                  {/* Tooltip for collapsed state */}
                  <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                    {displayName} - {getRoleDisplay(user.role)}
                  </div>
                </div>
              ) : (
                <div className="flex items-center space-x-3 w-full">
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-blue-600 flex items-center justify-center">
                    {profileImageUrl ? (
                      <img src={profileImageUrl} alt="avatar" className="w-full h-full object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                    ) : (
                      <User className="w-4 h-4 text-white" />
                    )}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {displayName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {getRoleDisplay(roleRaw || user.role)}
                    </p>
                  </div>
                  <Settings className="w-4 h-4 text-gray-400" />
                </div>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={() => { try { const { useModalManager } = require('@/contexts/ModalManagerContext'); const { openModal } = useModalManager(); openModal(() => setIsProfileOpen(true)); } catch { setIsProfileOpen(true); } }}>
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

      {/* User Profile Modal */}
      <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>User Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {/* Profile Header */}
            <div className="text-center">
              <div className="w-16 h-16 rounded-full overflow-hidden bg-blue-600 flex items-center justify-center mx-auto mb-4">
                {profileImageUrl ? (
                  <img src={profileImageUrl} alt="avatar" className="w-full h-full object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                ) : (
                  <User className="w-8 h-8 text-white" />
                )}
              </div>
              <h3 className="font-semibold text-lg">{displayName}</h3>
              <Badge className={getRoleColor(roleRaw || user.role)}>
                {getRoleDisplay(roleRaw || user.role)}
              </Badge>
            </div>

            <Separator />

            {/* Profile Details */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <User className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-sm font-medium">Name</p>
                  <p className="text-sm text-gray-600">{fullName || displayName}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Mail className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm text-gray-600">{emailStr || '-'}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Shield className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-sm font-medium">Role</p>
                  <p className="text-sm text-gray-600">{getRoleDisplay(roleRaw || user.role || 'Unknown')}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Phone className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-sm font-medium">Phone</p>
                  <p className="text-sm text-gray-600">{phoneStr || 'Not set'}</p>
                </div>
              </div>

              {user.branch && (
                <div className="flex items-center space-x-3">
                  <Building className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium">Branch</p>
                    <p className="text-sm text-gray-600">
                      {user.branch === 'branch_alpha' ? 'Branch Alpha - New York, NY' :
                       user.branch === 'branch_beta' ? 'Branch Beta - Los Angeles, CA' :
                       user.branch === 'branch_gamma' ? 'Branch Gamma - Chicago, IL' :
                       user.branch}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Actions */}
            <div className="flex space-x-3">
              <Button variant="outline" onClick={() => setIsProfileOpen(false)} className="flex-1">
                Close
              </Button>
              <Button onClick={handleLogout} variant="destructive" className="flex-1">
                <LogOut className="w-4 h-4 mr-2" />
                Log Out
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
