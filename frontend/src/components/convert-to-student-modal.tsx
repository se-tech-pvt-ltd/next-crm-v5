import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { FileUpload } from '@/components/ui/file-upload';
import { HelpTooltip } from './help-tooltip';
import { type Lead } from '@/lib/types';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import {
  ChevronDown,
  ChevronRight,
  UserPlus,
  User,
  Mail,
  Phone,
  MapPin,
  GraduationCap,
  Calendar,
  FileText,
  Target,
  Globe,
  Users,
  Award,
  DollarSign,
  Upload
} from 'lucide-react';

interface ConvertToStudentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: Lead | null;
}

export function ConvertToStudentModal({ open, onOpenChange, lead }: ConvertToStudentModalProps) {
  const { toast } = useToast();
  const [isLeadDetailsOpen, setIsLeadDetailsOpen] = useState(false);

  // Check for existing students to prevent duplicates
  const { data: existingStudents } = useQuery({
    queryKey: ['/api/students'],
  });

  // Check for existing leads to prevent duplicates
  const { data: existingLeads } = useQuery({
    queryKey: ['/api/leads'],
  });

  // Fetch users for counsellor dropdown
  const { data: users } = useQuery({
    queryKey: ['/api/users'],
  });

  // Dropdowns for mapping keys -> labels
  const { data: dropdownData } = useQuery({
    queryKey: ['/api/dropdowns/module/Leads'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/dropdowns/module/Leads');
      return response.json();
    }
  });

  const [formData, setFormData] = useState({
    // Student status and expectation
    status: 'Open',
    expectation: 'High',

    // From Lead (inherited fields)
    type: '',
    name: '',
    phone: '',
    email: '',
    city: '',
    source: '',
    interestedCountry: '',
    studyLevel: '',
    studyPlan: '',
    admissionOfficer: '',

    // Student specific fields
    counsellor: '',
    passport: '',
    dateOfBirth: '',
    address: '',
    eltTest: '',
    consultancyFee: 'No',
    consultancyFeeAttachment: '',
    scholarship: 'No',
    scholarshipAttachment: '',
  });

  // Helper to normalize lead fields (arrays/JSON strings) into text
  const normalizeToText = (value: unknown): string => {
    if (!value) return '';
    if (Array.isArray(value)) return value.filter(Boolean).join(', ');
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed.startsWith('[')) {
        try {
          const parsed = JSON.parse(trimmed);
          if (Array.isArray(parsed)) return parsed.filter(Boolean).join(', ');
        } catch {}
      }
      return trimmed;
    }
    return String(value);
  };

  // Map dropdown keys/ids to labels using dropdownData
  const mapDropdownToLabels = (raw: unknown, fieldName: string): string => {
    try {
      const options: any[] = dropdownData?.[fieldName] || [];
      const byKey = new Map(options.map(o => [o.key, o.value]));
      const byId = new Map(options.map(o => [o.id, o.value]));

      const toArray = (v: unknown): string[] => {
        if (!v) return [];
        if (Array.isArray(v)) return v.map(String);
        if (typeof v === 'string') {
          const t = v.trim();
          if (t.startsWith('[')) {
            try {
              const parsed = JSON.parse(t);
              if (Array.isArray(parsed)) return parsed.map(String);
            } catch {}
          }
          return t.split(',').map(s => s.trim()).filter(Boolean);
        }
        return [String(v)];
      };

      const items = toArray(raw);
      const labels = items.map(i => byKey.get(i) || byId.get(i) || i);
      return labels.filter(Boolean).join(', ');
    } catch {
      return normalizeToText(raw);
    }
  };

  // Pre-populate form when lead changes
  useEffect(() => {
    if (lead) {
      setFormData(prev => ({
        ...prev,
        // From Lead fields
        type: lead.type || '',
        name: lead.name || '',
        phone: lead.phone || '',
        email: lead.email || '',
        source: lead.source || '',
        interestedCountry: mapDropdownToLabels((lead as any).country, 'Interested Country') || normalizeToText((lead as any).country),
        studyLevel: lead.type || '',
        studyPlan: normalizeToText((lead as any).program),
        admissionOfficer: lead.createdBy || '',

        // Set default expectation from lead
        expectation: lead.expectation || 'High',
      }));
    }
  }, [lead, dropdownData]);

  const convertToStudentMutation = useMutation({
    mutationFn: async (studentData: any) => {
      return apiRequest('POST', '/api/students/convert-from-lead', {
        ...studentData,
        leadId: lead?.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/leads'] });
      queryClient.invalidateQueries({ queryKey: ['/api/students'] });
      toast({
        title: "Success",
        description: "Lead converted to student successfully.",
      });
      onOpenChange(false);
      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        dateOfBirth: '',
        nationality: '',
        passportNumber: '',
        targetCountry: '',
        targetProgram: '',
        targetLevel: '',
        englishProficiency: '',
        previousEducation: '',
        notes: '',
        status: 'active',
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to convert lead to student.",
        variant: "destructive",
      });
    },
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.email) {
      toast({
        title: "Error",
        description: "Name and email are required.",
        variant: "destructive",
      });
      return;
    }

    // Check for duplicate email in existing students
    if (Array.isArray(existingStudents)) {
      const duplicateStudent = existingStudents.find(
        (student: any) => student.email === formData.email && student.id !== lead?.id
      );
      if (duplicateStudent) {
        toast({
          title: "Error",
          description: "A student with this email already exists.",
          variant: "destructive",
        });
        return;
      }
    }

    // Check for duplicate phone in existing students
    if (formData.phone && Array.isArray(existingStudents)) {
      const duplicatePhone = existingStudents.find(
        (student: any) => student.phone === formData.phone && student.id !== lead?.id
      );
      if (duplicatePhone) {
        toast({
          title: "Error",
          description: "A student with this phone number already exists.",
          variant: "destructive",
        });
        return;
      }
    }

    convertToStudentMutation.mutate(formData);
  };

  if (!lead) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-6xl max-h-[90vh] overflow-y-auto"
        style={{ touchAction: 'pan-y' }}
      >
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <UserPlus className="w-5 h-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-xl">Convert Lead to Student</DialogTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Transform your lead into an active student with complete profile information
                </p>
              </div>
            </div>
            <HelpTooltip content="Complete all necessary fields to convert this lead into a student profile. Required fields are marked with an asterisk." />
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-2">
          <div className="space-y-4">
            {/* Collapsible Lead Details */}
            <Collapsible open={isLeadDetailsOpen} onOpenChange={setIsLeadDetailsOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  Lead Details (Auto-filled)
                  {isLeadDetailsOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-3 mt-3 p-3 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-600">Type</Label>
                    <Input value={formData.type} disabled className="h-8 text-sm bg-white" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-600">Name</Label>
                    <Input value={formData.name} disabled className="h-8 text-sm bg-white" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-600">Email</Label>
                    <Input value={formData.email} disabled className="h-8 text-sm bg-white" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-600">Phone</Label>
                    <Input value={formData.phone} disabled className="h-8 text-sm bg-white" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-600">Source</Label>
                    <Input value={formData.source} disabled className="h-8 text-sm bg-white" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-600">Interested Country</Label>
                    <Input value={formData.interestedCountry} disabled className="h-8 text-sm bg-white" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-600">Study Level</Label>
                    <Input value={formData.studyLevel} disabled className="h-8 text-sm bg-white" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-600">Study Plan</Label>
                    <Input value={formData.studyPlan} disabled className="h-8 text-sm bg-white" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-600">Admission Officer</Label>
                    <Input value={formData.admissionOfficer} disabled className="h-8 text-sm bg-white" />
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Student Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="space-y-1">
                <Label htmlFor="status" className="text-xs">Status *</Label>
                <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Open">Open</SelectItem>
                    <SelectItem value="Closed">Closed</SelectItem>
                    <SelectItem value="Enrolled">Enrolled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="expectation" className="text-xs">Expectation *</Label>
                <Select value={formData.expectation} onValueChange={(value) => handleInputChange('expectation', value)}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="Select expectation" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Average">Average</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="counsellor" className="text-xs">Counsellor</Label>
                <Select value={formData.counsellor} onValueChange={(value) => handleInputChange('counsellor', value)}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="Select counsellor" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.isArray(users) && users.map((user: any) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.firstName} {user.lastName} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="dateOfBirth" className="text-xs">Date of Birth</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                  className="h-8 text-sm"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="city" className="text-xs">City</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  placeholder="Enter city"
                  className="h-8 text-sm"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="eltTest" className="text-xs">ELT Test</Label>
                <Select value={formData.eltTest} onValueChange={(value) => handleInputChange('eltTest', value)}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="Select test" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="IELTS">IELTS</SelectItem>
                    <SelectItem value="PTE">PTE</SelectItem>
                    <SelectItem value="OIDI">OIDI</SelectItem>
                    <SelectItem value="TOEFL">TOEFL</SelectItem>
                    <SelectItem value="Passwords">Passwords</SelectItem>
                    <SelectItem value="No Test">No Test</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="consultancyFee" className="text-xs">Consultancy Fee</Label>
                <Select value={formData.consultancyFee} onValueChange={(value) => handleInputChange('consultancyFee', value)}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="Select option" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Yes">Yes</SelectItem>
                    <SelectItem value="No">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="scholarship" className="text-xs">Scholarship</Label>
                <Select value={formData.scholarship} onValueChange={(value) => handleInputChange('scholarship', value)}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="Select option" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Yes">Yes</SelectItem>
                    <SelectItem value="No">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* File Upload Fields */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="space-y-1">
                <FileUpload
                  label="Passport"
                  value={formData.passport}
                  onChange={(value) => handleInputChange('passport', value)}
                  accept="image/*,.pdf"
                  allowTextInput={true}
                  placeholder="Enter passport number or upload file"
                />
              </div>

              {formData.consultancyFee === 'Yes' && (
                <div className="space-y-1">
                  <FileUpload
                    label="Consultancy Fee Attachment"
                    value={formData.consultancyFeeAttachment}
                    onChange={(value) => handleInputChange('consultancyFeeAttachment', value)}
                    accept=".pdf,.doc,.docx,image/*"
                    allowTextInput={false}
                    placeholder="Upload consultancy fee document"
                  />
                </div>
              )}

              {formData.scholarship === 'Yes' && (
                <div className="space-y-1">
                  <FileUpload
                    label="Scholarship Attachment"
                    value={formData.scholarshipAttachment}
                    onChange={(value) => handleInputChange('scholarshipAttachment', value)}
                    accept=".pdf,.doc,.docx,image/*"
                    allowTextInput={false}
                    placeholder="Upload scholarship document"
                  />
                </div>
              )}
            </div>

            {/* Address Field */}
            <div className="space-y-1">
              <Label htmlFor="address" className="text-xs">Address</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="Enter full address"
                rows={2}
                className="text-sm"
              />
            </div>
          </div>
        </div>

        <div className="shrink-0 border-t pt-2 pb-2">
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} size="sm">
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={convertToStudentMutation.isPending} size="sm">
              {convertToStudentMutation.isPending ? 'Converting...' : 'Convert to Student'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
