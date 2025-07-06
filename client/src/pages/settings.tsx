import { useState } from 'react';
import { Layout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { HelpTooltip } from '@/components/help-tooltip';
import { Plus, X, Save, Settings as SettingsIcon, Users, Edit3, Building } from 'lucide-react';

interface DropdownOption {
  id: string;
  value: string;
  label: string;
}

interface DropdownConfig {
  leadStatuses: DropdownOption[];
  studentStatuses: DropdownOption[];
  applicationStatuses: DropdownOption[];
  countries: DropdownOption[];
  leadSources: DropdownOption[];
  degreeTypes: DropdownOption[];
  intakeSemesters: DropdownOption[];
  englishProficiency: DropdownOption[];
  budgetRanges: DropdownOption[];
}

export default function Settings() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('fields');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState('counselor');
  const [newUserBranch, setNewUserBranch] = useState('');
  const [newUserPicture, setNewUserPicture] = useState('');
  const [newUserDateOfBirth, setNewUserDateOfBirth] = useState('');
  const [newUserDepartment, setNewUserDepartment] = useState('');
  const [newUserPhone, setNewUserPhone] = useState('');
  
  const [config, setConfig] = useState<DropdownConfig>({
    leadStatuses: [
      { id: '1', value: 'new', label: 'New' },
      { id: '2', value: 'contacted', label: 'Contacted' },
      { id: '3', value: 'qualified', label: 'Qualified' },
      { id: '4', value: 'converted', label: 'Converted' },
      { id: '5', value: 'lost', label: 'Lost' },
    ],
    studentStatuses: [
      { id: '1', value: 'active', label: 'Active' },
      { id: '2', value: 'application_prep', label: 'Application Prep' },
      { id: '3', value: 'applied', label: 'Applied' },
      { id: '4', value: 'admitted', label: 'Admitted' },
      { id: '5', value: 'enrolled', label: 'Enrolled' },
    ],
    applicationStatuses: [
      { id: '1', value: 'draft', label: 'Draft' },
      { id: '2', value: 'submitted', label: 'Submitted' },
      { id: '3', value: 'under_review', label: 'Under Review' },
      { id: '4', value: 'decision_pending', label: 'Decision Pending' },
      { id: '5', value: 'accepted', label: 'Accepted' },
      { id: '6', value: 'rejected', label: 'Rejected' },
    ],
    countries: [
      { id: '1', value: 'us', label: 'United States' },
      { id: '2', value: 'uk', label: 'United Kingdom' },
      { id: '3', value: 'canada', label: 'Canada' },
      { id: '4', value: 'australia', label: 'Australia' },
      { id: '5', value: 'germany', label: 'Germany' },
    ],
    leadSources: [
      { id: '1', value: 'website', label: 'Website' },
      { id: '2', value: 'referral', label: 'Referral' },
      { id: '3', value: 'social_media', label: 'Social Media' },
      { id: '4', value: 'education_fair', label: 'Education Fair' },
      { id: '5', value: 'partner_agent', label: 'Partner Agent' },
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
  });

  const [newOptionInputs, setNewOptionInputs] = useState<Record<string, { value: string; label: string }>>({});

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
    setNewUserPicture('');
    setNewUserDateOfBirth('');
    setNewUserDepartment('');
    setNewUserPhone('');
  };

  const renderOptionCategory = (
    title: string,
    category: keyof DropdownConfig,
    description: string
  ) => (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <SettingsIcon className="w-4 h-4 mr-2" />
              {title}
            </CardTitle>
            <p className="text-sm text-gray-500 mt-1">{description}</p>
          </div>
          <HelpTooltip content={`Manage the available options for ${title.toLowerCase()}. Add new options or remove existing ones.`} />
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
            <div className="flex justify-end">
              <Button onClick={saveConfiguration}>
                <Save className="w-4 h-4 mr-2" />
                Save Configuration
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {renderOptionCategory(
                "Lead Statuses",
                "leadStatuses",
                "Status options for lead management"
              )}

              {renderOptionCategory(
                "Student Statuses",
                "studentStatuses",
                "Status options for student tracking"
              )}

              {renderOptionCategory(
                "Application Statuses",
                "applicationStatuses",
                "Status options for application progress"
              )}

              {renderOptionCategory(
                "Countries",
                "countries",
                "Available destination countries"
              )}

              {renderOptionCategory(
                "Lead Sources",
                "leadSources",
                "Sources where leads can come from"
              )}

              {renderOptionCategory(
                "Degree Types",
                "degreeTypes",
                "Available degree levels"
              )}

              {renderOptionCategory(
                "Intake Semesters",
                "intakeSemesters",
                "University intake periods"
              )}

              {renderOptionCategory(
                "English Proficiency",
                "englishProficiency",
                "English test scores and levels"
              )}

              {renderOptionCategory(
                "Budget Ranges",
                "budgetRanges",
                "Student budget categories"
              )}
            </div>

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
                    <Input
                      id="user-dob"
                      type="date"
                      value={newUserDateOfBirth}
                      onChange={(e) => setNewUserDateOfBirth(e.target.value)}
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
                    <Label htmlFor="user-picture">Profile Picture URL</Label>
                    <Input
                      id="user-picture"
                      type="url"
                      placeholder="https://example.com/profile.jpg"
                      value={newUserPicture}
                      onChange={(e) => setNewUserPicture(e.target.value)}
                    />
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
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <Users size={16} className="text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">Admin User</p>
                        <p className="text-sm text-gray-500">admin@studybridge.com</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary">Admin Staff</Badge>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <Users size={16} className="text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium">Branch Manager</p>
                        <p className="text-sm text-gray-500">manager@studybridge.com</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary">Branch Manager</Badge>
                      <Badge variant="outline">Branch Alpha</Badge>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <Users size={16} className="text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium">John Counselor</p>
                        <p className="text-sm text-gray-500">counselor@studybridge.com</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary">Counselor</Badge>
                      <Badge variant="outline">Branch Beta</Badge>
                    </div>
                  </div>
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