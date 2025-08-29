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
        // From Lead fields - map IDs to display values
        type: mapDropdownToLabels(lead.type, 'Type') || normalizeToText(lead.type),
        name: lead.name || '',
        phone: lead.phone || '',
        email: lead.email || '',
        source: mapDropdownToLabels(lead.source, 'Source') || normalizeToText(lead.source),
        interestedCountry: mapDropdownToLabels((lead as any).country, 'Interested Country') || normalizeToText((lead as any).country),
        studyLevel: mapDropdownToLabels((lead as any).studyLevel, 'Study Level') || normalizeToText((lead as any).studyLevel),
        studyPlan: mapDropdownToLabels((lead as any).studyPlan, 'Study Plan') || normalizeToText((lead as any).studyPlan),
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

        <div className="space-y-6">
          {/* Collapsible Lead Details */}
          <Collapsible open={isLeadDetailsOpen} onOpenChange={setIsLeadDetailsOpen}>
            <Card>
              <CardHeader className="pb-3">
                <CollapsibleTrigger asChild>
                  <Button variant="outline" className="w-full justify-between hover:bg-muted/50 transition-all">
                    <div className="flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-primary" />
                      <span>Lead Details (Auto-filled from Lead Profile)</span>
                    </div>
                    {isLeadDetailsOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </Button>
                </CollapsibleTrigger>
              </CardHeader>
              <CollapsibleContent>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground flex items-center space-x-1">
                        <User className="w-3 h-3" />
                        <span>Type</span>
                      </Label>
                      <Input value={formData.type} disabled className="bg-background" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground flex items-center space-x-1">
                        <User className="w-3 h-3" />
                        <span>Name</span>
                      </Label>
                      <Input value={formData.name} disabled className="bg-background" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground flex items-center space-x-1">
                        <Mail className="w-3 h-3" />
                        <span>Email</span>
                      </Label>
                      <Input value={formData.email} disabled className="bg-background" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground flex items-center space-x-1">
                        <Phone className="w-3 h-3" />
                        <span>Phone</span>
                      </Label>
                      <Input value={formData.phone} disabled className="bg-background" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground flex items-center space-x-1">
                        <MapPin className="w-3 h-3" />
                        <span>Source</span>
                      </Label>
                      <Input value={formData.source} disabled className="bg-background" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground flex items-center space-x-1">
                        <Globe className="w-3 h-3" />
                        <span>Interested Country</span>
                      </Label>
                      <Input value={formData.interestedCountry} disabled className="bg-background" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground flex items-center space-x-1">
                        <GraduationCap className="w-3 h-3" />
                        <span>Study Level</span>
                      </Label>
                      <Input value={formData.studyLevel} disabled className="bg-background" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground flex items-center space-x-1">
                        <GraduationCap className="w-3 h-3" />
                        <span>Study Plan</span>
                      </Label>
                      <Input value={formData.studyPlan} disabled className="bg-background" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground flex items-center space-x-1">
                        <Users className="w-3 h-3" />
                        <span>Admission Officer</span>
                      </Label>
                      <Input value={formData.admissionOfficer} disabled className="bg-background" />
                    </div>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Student Status & Basic Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center space-x-2">
                <Target className="w-5 h-5 text-primary" />
                <span>Student Status & Priority</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status" className="text-sm font-medium flex items-center space-x-2">
                    <Target className="w-4 h-4" />
                    <span>Status *</span>
                  </Label>
                  <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                    <SelectTrigger className="transition-all focus:ring-2 focus:ring-primary/20">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Open">
                        <div className="flex items-center space-x-2">
                          <Badge className="w-2 h-2 rounded-full p-0 bg-green-500"></Badge>
                          <span>Open</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="Closed">
                        <div className="flex items-center space-x-2">
                          <Badge className="w-2 h-2 rounded-full p-0 bg-red-500"></Badge>
                          <span>Closed</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="Enrolled">
                        <div className="flex items-center space-x-2">
                          <Badge className="w-2 h-2 rounded-full p-0 bg-blue-500"></Badge>
                          <span>Enrolled</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expectation" className="text-sm font-medium flex items-center space-x-2">
                    <Award className="w-4 h-4" />
                    <span>Expectation *</span>
                  </Label>
                  <Select value={formData.expectation} onValueChange={(value) => handleInputChange('expectation', value)}>
                    <SelectTrigger className="transition-all focus:ring-2 focus:ring-primary/20">
                      <SelectValue placeholder="Select expectation" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="High">
                        <div className="flex items-center space-x-2">
                          <Badge variant="destructive" className="w-2 h-2 rounded-full p-0"></Badge>
                          <span>High</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="Average">
                        <div className="flex items-center space-x-2">
                          <Badge className="w-2 h-2 rounded-full p-0 bg-yellow-500"></Badge>
                          <span>Average</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="counsellor" className="text-sm font-medium flex items-center space-x-2">
                    <Users className="w-4 h-4" />
                    <span>Counsellor</span>
                  </Label>
                  <Select value={formData.counsellor} onValueChange={(value) => handleInputChange('counsellor', value)}>
                    <SelectTrigger className="transition-all focus:ring-2 focus:ring-primary/20">
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

                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth" className="text-sm font-medium flex items-center space-x-2">
                    <Calendar className="w-4 h-4" />
                    <span>Date of Birth</span>
                  </Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                    className="transition-all focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Academic & Location Details */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center space-x-2">
                <GraduationCap className="w-5 h-5 text-primary" />
                <span>Academic & Location Details</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city" className="text-sm font-medium flex items-center space-x-2">
                    <MapPin className="w-4 h-4" />
                    <span>City</span>
                  </Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    placeholder="Enter city"
                    className="transition-all focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="eltTest" className="text-sm font-medium flex items-center space-x-2">
                    <FileText className="w-4 h-4" />
                    <span>ELT Test</span>
                  </Label>
                  <Select value={formData.eltTest} onValueChange={(value) => handleInputChange('eltTest', value)}>
                    <SelectTrigger className="transition-all focus:ring-2 focus:ring-primary/20">
                      <SelectValue placeholder="Select test" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="IELTS">📝 IELTS</SelectItem>
                      <SelectItem value="PTE">📝 PTE</SelectItem>
                      <SelectItem value="OIDI">📝 OIDI</SelectItem>
                      <SelectItem value="TOEFL">📝 TOEFL</SelectItem>
                      <SelectItem value="Passwords">🔑 Passwords</SelectItem>
                      <SelectItem value="No Test">❌ No Test</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address" className="text-sm font-medium flex items-center space-x-2">
                  <MapPin className="w-4 h-4" />
                  <span>Full Address</span>
                </Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="Enter complete address with street, city, postal code..."
                  rows={3}
                  className="transition-all focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </CardContent>
          </Card>

          {/* Financial & Documentation */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center space-x-2">
                <DollarSign className="w-5 h-5 text-primary" />
                <span>Financial & Documentation</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="consultancyFee" className="text-sm font-medium flex items-center space-x-2">
                    <DollarSign className="w-4 h-4" />
                    <span>Consultancy Fee</span>
                  </Label>
                  <Select value={formData.consultancyFee} onValueChange={(value) => handleInputChange('consultancyFee', value)}>
                    <SelectTrigger className="transition-all focus:ring-2 focus:ring-primary/20">
                      <SelectValue placeholder="Select option" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Yes">✅ Yes</SelectItem>
                      <SelectItem value="No">❌ No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="scholarship" className="text-sm font-medium flex items-center space-x-2">
                    <Award className="w-4 h-4" />
                    <span>Scholarship</span>
                  </Label>
                  <Select value={formData.scholarship} onValueChange={(value) => handleInputChange('scholarship', value)}>
                    <SelectTrigger className="transition-all focus:ring-2 focus:ring-primary/20">
                      <SelectValue placeholder="Select option" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Yes">🎓 Yes</SelectItem>
                      <SelectItem value="No">❌ No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center space-x-2">
                    <Upload className="w-4 h-4" />
                    <span>Passport</span>
                  </Label>
                  <FileUpload
                    value={formData.passport}
                    onChange={(value) => handleInputChange('passport', value)}
                    accept="image/*,.pdf"
                    allowTextInput={true}
                    placeholder="Enter passport number or upload file"
                  />
                </div>

                {formData.consultancyFee === 'Yes' && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center space-x-2">
                      <DollarSign className="w-4 h-4" />
                      <span>Consultancy Fee Attachment</span>
                    </Label>
                    <FileUpload
                      value={formData.consultancyFeeAttachment}
                      onChange={(value) => handleInputChange('consultancyFeeAttachment', value)}
                      accept=".pdf,.doc,.docx,image/*"
                      allowTextInput={false}
                      placeholder="Upload consultancy fee document"
                    />
                  </div>
                )}

                {formData.scholarship === 'Yes' && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center space-x-2">
                      <Award className="w-4 h-4" />
                      <span>Scholarship Attachment</span>
                    </Label>
                    <FileUpload
                      value={formData.scholarshipAttachment}
                      onChange={(value) => handleInputChange('scholarshipAttachment', value)}
                      accept=".pdf,.doc,.docx,image/*"
                      allowTextInput={false}
                      placeholder="Upload scholarship document"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Separator />
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="px-6"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={convertToStudentMutation.isPending}
            className="px-6 bg-primary hover:bg-primary/90"
          >
            {convertToStudentMutation.isPending ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Converting...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <UserPlus className="w-4 h-4" />
                <span>Convert to Student</span>
              </div>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
