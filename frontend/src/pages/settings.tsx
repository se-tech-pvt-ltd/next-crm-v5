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
  
  const [config, setConfig] = useState<DropdownConfig>({
    // Lead fields
    leadStatuses: [
      { id: '1', value: 'new', label: 'New' },
      { id: '2', value: 'contacted', label: 'Contacted' },
      { id: '3', value: 'qualified', label: 'Qualified' },
      { id: '4', value: 'converted', label: 'Converted' },
      { id: '5', value: 'lost', label: 'Lost' },
    ],
    leadSources: [
      { id: '1', value: 'website', label: 'Website' },
      { id: '2', value: 'referral', label: 'Referral' },
      { id: '3', value: 'social_media', label: 'Social Media' },
      { id: '4', value: 'education_fair', label: 'Education Fair' },
      { id: '5', value: 'partner_agent', label: 'Partner Agent' },
    ],
    leadExpectations: [
      { id: '1', value: 'high', label: 'High' },
      { id: '2', value: 'medium', label: 'Medium' },
      { id: '3', value: 'low', label: 'Low' },
    ],
    leadTypes: [
      { id: '1', value: 'undergraduate', label: 'Undergraduate' },
      { id: '2', value: 'graduate', label: 'Graduate' },
      { id: '3', value: 'postgraduate', label: 'Postgraduate' },
      { id: '4', value: 'phd', label: 'PhD' },
      { id: '5', value: 'certificate', label: 'Certificate' },
      { id: '6', value: 'diploma', label: 'Diploma' },
    ],
    leadLostReasons: [
      { id: '1', value: 'no_response', label: 'No Response' },
      { id: '2', value: 'not_interested', label: 'Not Interested' },
      { id: '3', value: 'budget_constraints', label: 'Budget Constraints' },
      { id: '4', value: 'timing_issues', label: 'Timing Issues' },
      { id: '5', value: 'chose_competitor', label: 'Chose Competitor' },
      { id: '6', value: 'unqualified', label: 'Unqualified' },
      { id: '7', value: 'other', label: 'Other' },
    ],
    
    // Student fields
    studentStatuses: [
      { id: '1', value: 'active', label: 'Active' },
      { id: '2', value: 'applied', label: 'Applied' },
      { id: '3', value: 'admitted', label: 'Admitted' },
      { id: '4', value: 'enrolled', label: 'Enrolled' },
      { id: '5', value: 'inactive', label: 'Inactive' },
    ],
    nationalities: [
      { id: '1', value: 'pakistani', label: 'Pakistani' },
      { id: '2', value: 'indian', label: 'Indian' },
      { id: '3', value: 'bangladeshi', label: 'Bangladeshi' },
      { id: '4', value: 'nepali', label: 'Nepali' },
      { id: '5', value: 'sri_lankan', label: 'Sri Lankan' },
      { id: '6', value: 'other', label: 'Other' },
    ],
    englishProficiency: [
      { id: '1', value: 'ielts_6_5', label: 'IELTS 6.5+' },
      { id: '2', value: 'toefl_90', label: 'TOEFL 90+' },
      { id: '3', value: 'pte_65', label: 'PTE 65+' },
      { id: '4', value: 'duolingo_115', label: 'Duolingo 115+' },
      { id: '5', value: 'native', label: 'Native Speaker' },
    ],
    budgetRanges: [
      { id: '1', value: 'under_20k', label: 'Under $20,000' },
      { id: '2', value: '20k_40k', label: '$20,000 - $40,000' },
      { id: '3', value: '40k_60k', label: '$40,000 - $60,000' },
      { id: '4', value: '60k_80k', label: '$60,000 - $80,000' },
      { id: '5', value: 'over_80k', label: 'Over $80,000' },
    ],
    
    // Application fields
    applicationStatuses: [
      { id: '1', value: 'draft', label: 'Draft' },
      { id: '2', value: 'submitted', label: 'Submitted' },
      { id: '3', value: 'under-review', label: 'Under Review' },
      { id: '4', value: 'accepted', label: 'Accepted' },
      { id: '5', value: 'rejected', label: 'Rejected' },
      { id: '6', value: 'waitlisted', label: 'Waitlisted' },
    ],
    degreeTypes: [
      { id: '1', value: 'bachelors', label: 'Bachelor\'s' },
      { id: '2', value: 'masters', label: 'Master\'s' },
      { id: '3', value: 'phd', label: 'PhD' },
      { id: '4', value: 'diploma', label: 'Diploma' },
      { id: '5', value: 'certificate', label: 'Certificate' },
    ],
    intakeSemesters: [
      { id: '1', value: 'fall', label: 'Fall' },
      { id: '2', value: 'spring', label: 'Spring' },
      { id: '3', value: 'summer', label: 'Summer' },
      { id: '4', value: 'winter', label: 'Winter' },
    ],
    
    // Admission fields
    admissionDecisions: [
      { id: '1', value: 'accepted', label: 'Accepted' },
      { id: '2', value: 'rejected', label: 'Rejected' },
      { id: '3', value: 'waitlisted', label: 'Waitlisted' },
      { id: '4', value: 'conditional', label: 'Conditional' },
    ],
    visaStatuses: [
      { id: '1', value: 'not-applied', label: 'Not Applied' },
      { id: '2', value: 'pending', label: 'Pending' },
      { id: '3', value: 'approved', label: 'Approved' },
      { id: '4', value: 'rejected', label: 'Rejected' },
    ],
    
    // Shared fields
    countries: [
      { id: '1', value: 'canada', label: 'Canada' },
      { id: '2', value: 'usa', label: 'United States' },
      { id: '3', value: 'uk', label: 'United Kingdom' },
      { id: '4', value: 'australia', label: 'Australia' },
      { id: '5', value: 'new-zealand', label: 'New Zealand' },
      { id: '6', value: 'germany', label: 'Germany' },
      { id: '7', value: 'france', label: 'France' },
      { id: '8', value: 'netherlands', label: 'Netherlands' },
    ],
    programs: [
      { id: '1', value: 'business-admin', label: 'Business Administration' },
      { id: '2', value: 'computer-science', label: 'Computer Science' },
      { id: '3', value: 'engineering', label: 'Engineering' },
      { id: '4', value: 'medicine', label: 'Medicine' },
      { id: '5', value: 'law', label: 'Law' },
      { id: '6', value: 'arts-humanities', label: 'Arts & Humanities' },
      { id: '7', value: 'social-sciences', label: 'Social Sciences' },
      { id: '8', value: 'natural-sciences', label: 'Natural Sciences' },
    ],
  });

  const [newOptionInputs, setNewOptionInputs] = useState<Record<string, { value: string; label: string }>>({});
  const [editingField, setEditingField] = useState<keyof DropdownConfig | null>(null);

  const addOption = (category: keyof DropdownConfig) => {
    const newOption: DropdownOption = {
      id: Date.now().toString(),
      value: newOptionInputs[category]?.value || '',
      label: newOptionInputs[category]?.label || '',
    };

    if (!newOption.value || !newOption.label) {
      toast({
        title: "Error",
        description: "Both value and label are required.",
        variant: "destructive",
      });
      return;
    }

    setConfig(prev => ({
      ...prev,
      [category]: [...prev[category], newOption],
    }));

    setNewOptionInputs(prev => ({
      ...prev,
      [category]: { value: '', label: '' },
    }));

    toast({
      title: "Success",
      description: "Option added successfully.",
    });
  };

  const removeOption = (category: keyof DropdownConfig, optionId: string) => {
    setConfig(prev => ({
      ...prev,
      [category]: prev[category].filter(option => option.id !== optionId),
    }));

    toast({
      title: "Success",
      description: "Option removed successfully.",
    });
  };

  const saveConfiguration = () => {
    localStorage.setItem('crmDropdownConfig', JSON.stringify(config));
    toast({
      title: "Success",
      description: "Configuration saved successfully.",
    });
  };

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
      const formData = new FormData();
      formData.append('profilePicture', file);
      
      const response = await fetch('/api/upload/profile-picture', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
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
      const formData = new FormData();
      formData.append('profilePicture', file);
      
      const response = await fetch('/api/upload/profile-picture', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        // Update local state
        setEditUserData(prev => ({ ...prev, profileImageUrl: result.fileUrl }));
        
        // Also save to database immediately
        try {
          const updateResponse = await fetch(`/api/users/${editingUserId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              profileImageUrl: result.fileUrl,
            }),
          });

          if (updateResponse.ok) {
            // Invalidate users cache to refresh profile images everywhere
            queryClient.invalidateQueries({ queryKey: ['/api/users'] });
            
            toast({
              title: "Success",
              description: "Profile picture uploaded and saved successfully.",
            });
          } else {
            toast({
              title: "Warning",
              description: "Image uploaded but failed to save to profile. Please click Save Changes.",
              variant: "destructive",
            });
          }
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

  const renderFieldRow = (
    title: string,
    category: keyof DropdownConfig,
    description: string
  ) => (
    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
      <div className="flex-1">
        <div className="flex items-center space-x-2">
          <h4 className="font-medium">{title}</h4>
          <Badge variant="outline" className="text-xs">
            {config[category].length} options
          </Badge>
        </div>
        <p className="text-sm text-gray-500 mt-1">{description}</p>
      </div>
      <Select
        value={editingField === category ? "edit" : ""}
        onValueChange={(value) => {
          if (value === "edit") {
            setEditingField(category);
          } else if (value === "add") {
            setNewOptionInputs(prev => ({
              ...prev,
              [category]: { value: '', label: '' }
            }));
          }
        }}
      >
        <SelectTrigger className="w-32">
          <SelectValue placeholder="Edit" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="edit">Edit Options</SelectItem>
          <SelectItem value="add">Add Option</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );

  const renderFieldEditor = (category: keyof DropdownConfig) => (
    <Card className="mt-4">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            Edit {category.charAt(0).toUpperCase() + category.slice(1).replace(/([A-Z])/g, ' $1')} Options
          </CardTitle>
          <Button variant="outline" size="sm" onClick={() => setEditingField(null)}>
            <X className="w-4 h-4 mr-2" />
            Close
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium">Current Options</Label>
          <div className="flex flex-wrap gap-2">
            {config[category].map((option) => (
              <Badge key={option.id} variant="secondary" className="flex items-center gap-2">
                {option.label}
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                  onClick={() => removeOption(category, option.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
          </div>
        </div>

        <Separator />

        <div className="space-y-3">
          <Label className="text-sm font-medium">Add New Option</Label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor={`${category}-value`} className="text-xs">System Value</Label>
              <Input
                id={`${category}-value`}
                placeholder="Enter system value"
                value={newOptionInputs[category]?.value || ''}
                onChange={(e) =>
                  setNewOptionInputs(prev => ({
                    ...prev,
                    [category]: { ...prev[category], value: e.target.value, label: prev[category]?.label || '' },
                  }))
                }
              />
            </div>
            <div>
              <Label htmlFor={`${category}-label`} className="text-xs">Display Label</Label>
              <Input
                id={`${category}-label`}
                placeholder="Enter display label"
                value={newOptionInputs[category]?.label || ''}
                onChange={(e) =>
                  setNewOptionInputs(prev => ({
                    ...prev,
                    [category]: { ...prev[category], label: e.target.value, value: prev[category]?.value || '' },
                  }))
                }
              />
            </div>
          </div>
          <Button size="sm" onClick={() => addOption(category)} className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Add Option
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <Layout 
      title="Settings" 
      subtitle="Manage system configuration"
      helpText="Configure dropdown options and system settings for your CRM. Changes are saved locally and will apply to all forms."
    >
      <div className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="fields" className="flex items-center space-x-2">
              <Edit3 className="w-4 h-4" />
              <span>Field Management</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <span>User Management</span>
            </TabsTrigger>
            <TabsTrigger value="branches" className="flex items-center space-x-2">
              <Building className="w-4 h-4" />
              <span>Branch Management</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="fields" className="space-y-6">
            <div className="space-y-6">
              {/* Lead Fields */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <SettingsIcon className="w-4 h-4 mr-2 text-blue-600" />
                    Lead Fields
                  </CardTitle>
                  <p className="text-sm text-gray-500">Manage dropdown options for lead management</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {renderFieldRow("Lead Status", "leadStatuses", "Status options for lead management")}
                  {renderFieldRow("Lead Source", "leadSources", "Sources where leads can come from")}
                  {renderFieldRow("Lead Expectation", "leadExpectations", "Expected quality level of leads")}
                  {renderFieldRow("Lead Type", "leadTypes", "Types of educational programs")}
                  {renderFieldRow("Lead Lost Reasons", "leadLostReasons", "Reasons why leads are marked as lost")}
                </CardContent>
              </Card>

              {/* Student Fields */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <SettingsIcon className="w-4 h-4 mr-2 text-green-600" />
                    Student Fields
                  </CardTitle>
                  <p className="text-sm text-gray-500">Manage dropdown options for student management</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {renderFieldRow("Student Status", "studentStatuses", "Status options for student tracking")}
                  {renderFieldRow("Nationality", "nationalities", "Available nationality options")}
                  {renderFieldRow("English Proficiency", "englishProficiency", "English test scores and levels")}
                  {renderFieldRow("Budget Range", "budgetRanges", "Student budget categories")}
                </CardContent>
              </Card>

              {/* Application Fields */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <SettingsIcon className="w-4 h-4 mr-2 text-purple-600" />
                    Application Fields
                  </CardTitle>
                  <p className="text-sm text-gray-500">Manage dropdown options for application tracking</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {renderFieldRow("Application Status", "applicationStatuses", "Status options for application progress")}
                  {renderFieldRow("Degree Type", "degreeTypes", "Available degree levels")}
                  {renderFieldRow("Intake Semester", "intakeSemesters", "University intake periods")}
                </CardContent>
              </Card>

              {/* Admission Fields */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <SettingsIcon className="w-4 h-4 mr-2 text-orange-600" />
                    Admission Fields
                  </CardTitle>
                  <p className="text-sm text-gray-500">Manage dropdown options for admission tracking</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {renderFieldRow("Admission Decision", "admissionDecisions", "University admission decisions")}
                  {renderFieldRow("Visa Status", "visaStatuses", "Student visa application status")}
                </CardContent>
              </Card>

              {/* Shared Fields */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <SettingsIcon className="w-4 h-4 mr-2 text-gray-600" />
                    Shared Fields
                  </CardTitle>
                  <p className="text-sm text-gray-500">Manage dropdown options used across multiple entities</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {renderFieldRow("Countries", "countries", "Available destination countries (supports multiple selection)")}
                  {renderFieldRow("Programs", "programs", "Available study programs (supports multiple selection)")}
                </CardContent>
              </Card>

              {/* Field Editor */}
              {editingField && renderFieldEditor(editingField as keyof DropdownConfig)}

              {/* Configuration Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Configuration Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm text-gray-600">
                    <p>• Changes to dropdown options will be reflected in all forms throughout the system.</p>
                    <p>• Configuration is saved locally in your browser's storage.</p>
                    <p>• For a multi-user environment, these settings would typically be managed by an administrator.</p>
                    <p>• Removing an option that's currently in use may affect existing records.</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

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

          <TabsContent value="branches" className="space-y-6">
            {/* Add New Branch */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Building className="w-4 h-4 mr-2" />
                  Add New Branch
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="branch-name">Branch Name *</Label>
                    <Input
                      id="branch-name"
                      placeholder="Branch Alpha"
                    />
                  </div>
                  <div>
                    <Label htmlFor="branch-location">Location *</Label>
                    <Input
                      id="branch-location"
                      placeholder="New York, NY"
                    />
                  </div>
                </div>
                <Button className="w-full md:w-auto">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Branch
                </Button>
              </CardContent>
            </Card>

            {/* Current Branches */}
            <Card>
              <CardHeader>
                <CardTitle>Current Branches</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <Building size={16} className="text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">Branch Alpha</p>
                        <p className="text-sm text-gray-500">New York, NY</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">0 Counselors</Badge>
                      <Badge variant="outline">1 Manager</Badge>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <Building size={16} className="text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium">Branch Beta</p>
                        <p className="text-sm text-gray-500">Los Angeles, CA</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">1 Counselor</Badge>
                      <Badge variant="outline">0 Managers</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
