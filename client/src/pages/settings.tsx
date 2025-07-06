import { useState } from 'react';
import { Layout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { HelpTooltip } from '@/components/help-tooltip';
import { Plus, X, Save, Settings as SettingsIcon } from 'lucide-react';

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
      { id: '2', value: 'applied', label: 'Applied' },
      { id: '3', value: 'admitted', label: 'Admitted' },
      { id: '4', value: 'enrolled', label: 'Enrolled' },
      { id: '5', value: 'inactive', label: 'Inactive' },
    ],
    applicationStatuses: [
      { id: '1', value: 'draft', label: 'Draft' },
      { id: '2', value: 'submitted', label: 'Submitted' },
      { id: '3', value: 'under-review', label: 'Under Review' },
      { id: '4', value: 'accepted', label: 'Accepted' },
      { id: '5', value: 'rejected', label: 'Rejected' },
      { id: '6', value: 'waitlisted', label: 'Waitlisted' },
    ],
    countries: [
      { id: '1', value: 'USA', label: 'United States' },
      { id: '2', value: 'Canada', label: 'Canada' },
      { id: '3', value: 'UK', label: 'United Kingdom' },
      { id: '4', value: 'Australia', label: 'Australia' },
      { id: '5', value: 'Germany', label: 'Germany' },
      { id: '6', value: 'France', label: 'France' },
      { id: '7', value: 'Netherlands', label: 'Netherlands' },
      { id: '8', value: 'New Zealand', label: 'New Zealand' },
    ],
    leadSources: [
      { id: '1', value: 'website', label: 'Website' },
      { id: '2', value: 'referral', label: 'Referral' },
      { id: '3', value: 'social-media', label: 'Social Media' },
      { id: '4', value: 'advertisement', label: 'Advertisement' },
      { id: '5', value: 'event', label: 'Event' },
    ],
    degreeTypes: [
      { id: '1', value: 'Bachelor\'s', label: 'Bachelor\'s' },
      { id: '2', value: 'Master\'s', label: 'Master\'s' },
      { id: '3', value: 'PhD', label: 'PhD' },
      { id: '4', value: 'Diploma', label: 'Diploma' },
      { id: '5', value: 'Certificate', label: 'Certificate' },
    ],
    intakeSemesters: [
      { id: '1', value: 'Fall', label: 'Fall' },
      { id: '2', value: 'Spring', label: 'Spring' },
      { id: '3', value: 'Summer', label: 'Summer' },
      { id: '4', value: 'Winter', label: 'Winter' },
    ],
    englishProficiency: [
      { id: '1', value: 'IELTS 6.0', label: 'IELTS 6.0' },
      { id: '2', value: 'IELTS 6.5', label: 'IELTS 6.5' },
      { id: '3', value: 'IELTS 7.0', label: 'IELTS 7.0' },
      { id: '4', value: 'IELTS 7.5', label: 'IELTS 7.5' },
      { id: '5', value: 'IELTS 8.0+', label: 'IELTS 8.0+' },
      { id: '6', value: 'TOEFL 80', label: 'TOEFL 80' },
      { id: '7', value: 'TOEFL 90', label: 'TOEFL 90' },
      { id: '8', value: 'TOEFL 100', label: 'TOEFL 100' },
      { id: '9', value: 'TOEFL 110+', label: 'TOEFL 110+' },
      { id: '10', value: 'Native', label: 'Native Speaker' },
      { id: '11', value: 'Not tested', label: 'Not Yet Tested' },
    ],
    budgetRanges: [
      { id: '1', value: '$10,000 - $20,000', label: '$10,000 - $20,000' },
      { id: '2', value: '$20,000 - $30,000', label: '$20,000 - $30,000' },
      { id: '3', value: '$30,000 - $50,000', label: '$30,000 - $50,000' },
      { id: '4', value: '$50,000 - $70,000', label: '$50,000 - $70,000' },
      { id: '5', value: '$70,000+', label: '$70,000+' },
      { id: '6', value: 'Looking for scholarships', label: 'Looking for scholarships' },
    ],
  });

  const [newOptionInputs, setNewOptionInputs] = useState<Record<string, { value: string; label: string }>>({});

  const addOption = (category: keyof DropdownConfig) => {
    const input = newOptionInputs[category];
    if (!input?.value || !input?.label) {
      toast({
        title: "Error",
        description: "Please enter both value and label for the new option.",
        variant: "destructive",
      });
      return;
    }

    const newOption: DropdownOption = {
      id: Date.now().toString(),
      value: input.value,
      label: input.label,
    };

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
    // In a real application, this would save to a backend
    localStorage.setItem('crmDropdownConfig', JSON.stringify(config));
    toast({
      title: "Success",
      description: "Configuration saved successfully.",
    });
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
        {/* Existing Options */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Current Options</Label>
          <div className="flex flex-wrap gap-2">
            {config[category].map((option) => (
              <Badge key={option.id} variant="secondary" className="flex items-center gap-2">
                {option.label}
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-4 w-4 p-0 hover:bg-red-100"
                  onClick={() => removeOption(category, option.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
          </div>
        </div>

        <Separator />

        {/* Add New Option */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Add New Option</Label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor={`${category}-value`} className="text-xs">Value</Label>
              <Input
                id={`${category}-value`}
                placeholder="Enter value"
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
        {/* Save Configuration */}
        <div className="flex justify-end">
          <Button onClick={saveConfiguration}>
            <Save className="w-4 h-4 mr-2" />
            Save Configuration
          </Button>
        </div>

        {/* Configuration Categories */}
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

        {/* Information Section */}
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
    </Layout>
  );
}