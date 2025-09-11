import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { Settings, LogOut, User, Building, Mail, Shield } from 'lucide-react';

interface UserMenuProps {
  collapsed?: boolean;
}

export function UserMenu({ collapsed = false }: UserMenuProps) {
  const { user, logout } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  if (!user) return null;

  const displayName = typeof user.email === 'string'
    ? (user.email.includes('@') ? user.email.split('@')[0] : user.email)
    : 'User';

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
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {displayName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {getRoleDisplay(user.role)}
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
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-semibold text-lg">{displayName}</h3>
              <Badge className={getRoleColor(user.role)}>
                {getRoleDisplay(user.role)}
              </Badge>
            </div>

            <Separator />

            {/* Profile Details */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Mail className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm text-gray-600">{user.email}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Shield className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-sm font-medium">Role</p>
                  <p className="text-sm text-gray-600">{getRoleDisplay(user.role)}</p>
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

              <div className="flex items-center space-x-3">
                <User className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-sm font-medium">User ID</p>
                  <p className="text-sm text-gray-600 font-mono">{user.id}</p>
                </div>
              </div>
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
