import { useState, useRef } from 'react';
import { Layout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { DobPicker } from '@/components/ui/dob-picker';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { HelpTooltip } from '@/components/help-tooltip';
import { Plus, X, Save, Settings as SettingsIcon, Users, Edit3, Building, Upload, Image } from 'lucide-react';
import { queryClient } from '@/lib/queryClient';

interface DropdownOption {
  id: string;
  value: string;
  label: string;
}

interface DropdownConfig {
  // Lead fields
  leadStatuses: DropdownOption[];
  leadSources: DropdownOption[];
  leadExpectations: DropdownOption[];
  leadTypes: DropdownOption[];
  leadLostReasons: DropdownOption[];
  
  // Student fields
  studentStatuses: DropdownOption[];
  nationalities: DropdownOption[];
  englishProficiency: DropdownOption[];
  budgetRanges: DropdownOption[];
  
  // Application fields
  applicationStatuses: DropdownOption[];
  degreeTypes: DropdownOption[];
  intakeSemesters: DropdownOption[];
  
  // Admission fields
  admissionDecisions: DropdownOption[];
  visaStatuses: DropdownOption[];
  
  // Shared fields
  countries: DropdownOption[];
  programs: DropdownOption[];
}

export default function Settings() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('fields');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState('counselor');
  const [newUserBranch, setNewUserBranch] = useState('');
  const [newUserProfileImageUrl, setNewUserProfileImageUrl] = useState('');
  const [newUserDateOfBirth, setNewUserDateOfBirth] = useState('');
  const [newUserDepartment, setNewUserDepartment] = useState('');
  const [newUserPhone, setNewUserPhone] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Edit user state
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editUserData, setEditUserData] = useState({
    email: '',
    role: '',
    branch: '',
    phone: '',
    dateOfBirth: '',
    department: '',
    profileImageUrl: ''
  });
  const [isEditUploading, setIsEditUploading] = useState(false);
  const editFileInputRef = useRef<HTMLInputElement>(null);
  
  // User data state
  const [users, setUsers] = useState([
    {
      id: 'admin1',
      name: 'Admin User',
      email: 'admin@studybridge.com',
      role: 'admin_staff',
      branch: 'branch_alpha',
      phone: '+1 (555) 123-4567',
      department: 'administration',
      dateOfBirth: '1985-03-15',
      profileImageUrl: ''
    },
    {
      id: 'manager1',
      name: 'Sarah Johnson',
      email: 'manager@studybridge.com',
      role: 'branch_manager',
      branch: 'branch_alpha',
      phone: '+1 (555) 234-5678',
      department: 'operations',
      dateOfBirth: '1982-07-22',
      profileImageUrl: ''
    },
    {
      id: 'counselor1',
      name: 'John Counselor',
      email: 'counselor@studybridge.com',
      role: 'counselor',
      branch: 'branch_beta',
      phone: '+1 (555) 345-6789',
      department: 'counseling',
      dateOfBirth: '1990-11-08',
      profileImageUrl: ''
    }
  ]);
  


  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Error",
        description: "Please select an image file.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "Image file must be less than 5MB.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    
    try {
      const { uploadProfilePicture } = await import('@/services/uploads');
      const result = await uploadProfilePicture(file);

      if (result.success && result.fileUrl) {
        setNewUserProfileImageUrl(result.fileUrl);
        toast({
          title: "Success",
          description: "Profile picture uploaded successfully.",
        });
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Error",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleEditFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Error",
        description: "Please select an image file.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "Image file must be less than 5MB.",
        variant: "destructive",
      });
      return;
    }

    setIsEditUploading(true);
    
    try {
      const { uploadProfilePicture } = await import('@/services/uploads');
      const result = await uploadProfilePicture(file);

      if (result.success && result.fileUrl) {
        // Update local state
        setEditUserData(prev => ({ ...prev, profileImageUrl: result.fileUrl }));

        // Also save to database immediately
        try {
          const { updateUser } = await import('@/services/users');
          await updateUser(editingUserId, { profileImageUrl: result.fileUrl });

          // Invalidate users cache to refresh profile images everywhere
          queryClient.invalidateQueries({ queryKey: ['/api/users'] });

          toast({
            title: "Success",
            description: "Profile picture uploaded and saved successfully.",
          });
        } catch (saveError) {
          console.error('Save error:', saveError);
          toast({
            title: "Warning",
            description: "Image uploaded but failed to save to profile. Please click Save Changes.",
            variant: "destructive",
          });
        }
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Error",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsEditUploading(false);
    }
  };

  const startEditUser = (userId: string, userData: any) => {
    setEditingUserId(userId);
    setEditUserData({
      email: userData.email || '',
      role: userData.role || '',
      branch: userData.branch || '',
      phone: userData.phone || '',
      dateOfBirth: userData.dateOfBirth || '',
      department: userData.department || '',
      profileImageUrl: userData.profileImageUrl || ''
    });
  };

  const cancelEditUser = () => {
    setEditingUserId(null);
    setEditUserData({
      email: '',
      role: '',
      branch: '',
      phone: '',
      dateOfBirth: '',
      department: '',
      profileImageUrl: ''
    });
    if (editFileInputRef.current) {
      editFileInputRef.current.value = '';
    }
  };

  const saveEditUser = () => {
    if (!editUserData.email) {
      toast({
        title: "Error",
        description: "Please enter an email address.",
        variant: "destructive",
      });
      return;
    }

    if (!editUserData.branch) {
      toast({
        title: "Error",
        description: "Please select a branch.",
        variant: "destructive",
      });
      return;
    }

    // Update the user in the users array
    setUsers(prevUsers => 
      prevUsers.map(user => 
        user.id === editingUserId 
          ? { 
              ...user, 
              email: editUserData.email,
              role: editUserData.role,
              branch: editUserData.branch,
              phone: editUserData.phone,
              dateOfBirth: editUserData.dateOfBirth,
              department: editUserData.department,
              profileImageUrl: editUserData.profileImageUrl
            }
          : user
      )
    );

    // Invalidate users cache to refresh profile images everywhere
    queryClient.invalidateQueries({ queryKey: ['/api/users'] });
    
    toast({
      title: "Success",
      description: `User updated successfully.`,
    });
    
    // Reset edit state
    cancelEditUser();
  };

  const addUser = () => {
    if (!newUserEmail) {
      toast({
        title: "Error",
        description: "Please enter an email address.",
        variant: "destructive",
      });
      return;
    }

    if (!newUserBranch) {
      toast({
        title: "Error",
        description: "Please select a branch.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: `User ${newUserEmail} has been invited with ${newUserRole} role.`,
    });
    
    // Clear all form fields
    setNewUserEmail('');
    setNewUserRole('counselor');
    setNewUserBranch('');
    setNewUserProfileImageUrl('');
    setNewUserDateOfBirth('');
    setNewUserDepartment('');
    setNewUserPhone('');
    
    // Clear file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };



  return (
    <Layout 
      title="Settings" 
      subtitle="Manage system configuration"
      helpText="Configure dropdown options and system settings for your CRM. Changes are saved locally and will apply to all forms."
    >
      <div className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-1">
            <TabsTrigger value="users" className="flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <span>User Management</span>
            </TabsTrigger>
          </TabsList>


          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="w-4 h-4 mr-2" />
                  Add New User
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="user-email">Email Address *</Label>
                    <Input
                      id="user-email"
                      type="email"
                      placeholder="user@example.com"
                      value={newUserEmail}
                      onChange={(e) => setNewUserEmail(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="user-role">Role *</Label>
                    <Select value={newUserRole} onValueChange={setNewUserRole}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="counselor">Counselor</SelectItem>
                        <SelectItem value="branch_manager">Branch Manager</SelectItem>
                        <SelectItem value="admin_staff">Admin Staff</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="user-branch">Branch *</Label>
                    <Select value={newUserBranch} onValueChange={setNewUserBranch}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select branch" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="branch_alpha">Branch Alpha - New York, NY</SelectItem>
                        <SelectItem value="branch_beta">Branch Beta - Los Angeles, CA</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="user-phone">Phone Number</Label>
                    <Input
                      id="user-phone"
                      type="tel"
                      placeholder="+1 (555) 123-4567"
                      value={newUserPhone}
                      onChange={(e) => setNewUserPhone(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="user-dob">Date of Birth</Label>
                    <DobPicker
                      id="user-dob"
                      value={newUserDateOfBirth}
                      onChange={(v) => setNewUserDateOfBirth(v)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="user-department">Department</Label>
                    <Select value={newUserDepartment} onValueChange={setNewUserDepartment}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="counseling">Counseling</SelectItem>
                        <SelectItem value="admissions">Admissions</SelectItem>
                        <SelectItem value="finance">Finance</SelectItem>
                        <SelectItem value="operations">Operations</SelectItem>
                        <SelectItem value="marketing">Marketing</SelectItem>
                        <SelectItem value="administration">Administration</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-3">
                    <Label htmlFor="user-picture">Profile Picture</Label>
                    <div className="space-y-3">
                      {/* File Upload Option */}
                      <div className="flex items-center gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploading}
                          className="flex items-center gap-2"
                        >
                          {isUploading ? (
                            <>
                              <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Upload className="h-4 w-4" />
                              Upload Profile Picture
                            </>
                          )}
                        </Button>
                        <span className="text-sm text-gray-500">
                          Max 5MB, JPG/PNG/GIF
                        </span>
                      </div>
                      
                      {/* Hidden File Input */}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      
                      {/* Preview */}
                      {newUserProfileImageUrl && (
                        <div className="flex items-center gap-3 p-3 border rounded-lg bg-gray-50">
                          <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200">
                            <img
                              src={newUserProfileImageUrl}
                              alt="Profile preview"
                              className="w-full h-full object-cover"
                              onError={() => {
                                toast({
                                  title: "Image Error",
                                  description: "Failed to load image preview.",
                                  variant: "destructive",
                                });
                              }}
                            />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">Profile picture uploaded</p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setNewUserProfileImageUrl('');
                              if (fileInputRef.current) {
                                fileInputRef.current.value = '';
                              }
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <Button onClick={addUser} className="w-full md:w-auto">
                  <Plus className="w-4 h-4 mr-2" />
                  Invite User
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Current Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users.map((user) => (
                    <div key={user.id} className="border rounded-lg p-4">
                      {editingUserId === user.id ? (
                        // Edit Mode
                        <div className="space-y-4">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="font-medium">Edit User Profile</h4>
                            <div className="flex gap-2">
                              <Button size="sm" onClick={saveEditUser}>
                                <Save className="h-4 w-4 mr-1" />
                                Save
                              </Button>
                              <Button size="sm" variant="outline" onClick={cancelEditUser}>
                                Cancel
                              </Button>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label>Email Address</Label>
                              <Input
                                value={editUserData.email}
                                onChange={(e) => setEditUserData(prev => ({ ...prev, email: e.target.value }))}
                              />
                            </div>
                            <div>
                              <Label>Role</Label>
                              <Select value={editUserData.role} onValueChange={(value) => setEditUserData(prev => ({ ...prev, role: value }))}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="counselor">Counselor</SelectItem>
                                  <SelectItem value="branch_manager">Branch Manager</SelectItem>
                                  <SelectItem value="admin_staff">Admin Staff</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label>Branch</Label>
                              <Select value={editUserData.branch} onValueChange={(value) => setEditUserData(prev => ({ ...prev, branch: value }))}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="branch_alpha">Branch Alpha - New York, NY</SelectItem>
                                  <SelectItem value="branch_beta">Branch Beta - Los Angeles, CA</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label>Phone Number</Label>
                              <Input
                                value={editUserData.phone}
                                onChange={(e) => setEditUserData(prev => ({ ...prev, phone: e.target.value }))}
                              />
                            </div>
                            <div>
                              <Label>Date of Birth</Label>
                              <DobPicker
                                value={editUserData.dateOfBirth}
                                onChange={(v) => setEditUserData(prev => ({ ...prev, dateOfBirth: v }))}
                              />
                            </div>
                            <div>
                              <Label>Department</Label>
                              <Select value={editUserData.department} onValueChange={(value) => setEditUserData(prev => ({ ...prev, department: value }))}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="counseling">Counseling</SelectItem>
                                  <SelectItem value="admissions">Admissions</SelectItem>
                                  <SelectItem value="finance">Finance</SelectItem>
                                  <SelectItem value="operations">Operations</SelectItem>
                                  <SelectItem value="marketing">Marketing</SelectItem>
                                  <SelectItem value="administration">Administration</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="md:col-span-2">
                              <Label>Profile Picture</Label>
                              <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => editFileInputRef.current?.click()}
                                    disabled={isEditUploading}
                                    className="flex items-center gap-2"
                                  >
                                    {isEditUploading ? (
                                      <>
                                        <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                                        Uploading...
                                      </>
                                    ) : (
                                      <>
                                        <Upload className="h-4 w-4" />
                                        Upload Profile Picture
                                      </>
                                    )}
                                  </Button>
                                  <span className="text-sm text-gray-500">
                                    Max 5MB, JPG/PNG/GIF
                                  </span>
                                </div>
                                
                                <input
                                  ref={editFileInputRef}
                                  type="file"
                                  accept="image/*"
                                  onChange={handleEditFileUpload}
                                  className="hidden"
                                />
                                
                                {editUserData.profileImageUrl && (
                                  <div className="flex items-center gap-3 p-3 border rounded-lg bg-gray-50">
                                    <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200">
                                      <img
                                        src={editUserData.profileImageUrl}
                                        alt="Profile preview"
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                    <div className="flex-1">
                                      <p className="text-sm font-medium">Profile picture uploaded</p>
                                    </div>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        setEditUserData(prev => ({ ...prev, profileImageUrl: '' }));
                                        if (editFileInputRef.current) {
                                          editFileInputRef.current.value = '';
                                        }
                                      }}
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        // Display Mode
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200">
                              {user.profileImageUrl ? (
                                <img
                                  src={user.profileImageUrl}
                                  alt={user.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full bg-blue-100 flex items-center justify-center">
                                  <Users size={20} className="text-blue-600" />
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="font-medium">{user.name}</p>
                              <p className="text-sm text-gray-500">{user.email}</p>
                              {user.phone && (
                                <p className="text-xs text-gray-400">{user.phone}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant="secondary">
                              {user.role === 'admin_staff' ? 'Admin Staff' : 
                               user.role === 'branch_manager' ? 'Branch Manager' : 'Counselor'}
                            </Badge>
                            <Badge variant="outline">
                              {user.branch === 'branch_alpha' ? 'Branch Alpha' : 'Branch Beta'}
                            </Badge>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => startEditUser(user.id, user)}
                            >
                              <Edit3 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
      </div>
    </Layout>
  );
}
