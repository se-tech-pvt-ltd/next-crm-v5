import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { FileUpload } from '@/components/ui/file-upload';
import { type Lead } from '@/lib/types';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { ChevronDown, ChevronRight } from 'lucide-react';

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
      <DialogContent className="w-[85vw] max-w-5xl h-[85vh] max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader className="shrink-0 pb-2">
          <DialogTitle className="text-lg font-semibold">Convert Lead to Student</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-2">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label htmlFor="name" className="text-xs">Full Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter full name"
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="email" className="text-xs">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="Enter email address"
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="phone" className="text-xs">Phone Number</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="Enter phone number"
                  className="h-8 text-sm"
                />
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
                <Label htmlFor="nationality" className="text-xs">Nationality</Label>
                <Input
                  id="nationality"
                  value={formData.nationality}
                  onChange={(e) => handleInputChange('nationality', e.target.value)}
                  placeholder="Enter nationality"
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="passportNumber" className="text-xs">Passport Number</Label>
                <Input
                  id="passportNumber"
                  value={formData.passportNumber}
                  onChange={(e) => handleInputChange('passportNumber', e.target.value)}
                  placeholder="Enter passport number"
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="targetCountry" className="text-xs">Target Country</Label>
                <Input
                  id="targetCountry"
                  value={formData.targetCountry}
                  onChange={(e) => handleInputChange('targetCountry', e.target.value)}
                  placeholder="Enter target country"
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="targetProgram" className="text-xs">Target Program</Label>
                <Input
                  id="targetProgram"
                  value={formData.targetProgram}
                  onChange={(e) => handleInputChange('targetProgram', e.target.value)}
                  placeholder="Enter target program"
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="targetLevel" className="text-xs">Target Level</Label>
                <Select value={formData.targetLevel} onValueChange={(value) => handleInputChange('targetLevel', value)}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="undergraduate">Undergraduate</SelectItem>
                    <SelectItem value="graduate">Graduate</SelectItem>
                    <SelectItem value="postgraduate">Postgraduate</SelectItem>
                    <SelectItem value="phd">PhD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="englishProficiency" className="text-xs">English Proficiency</Label>
                <Select value={formData.englishProficiency} onValueChange={(value) => handleInputChange('englishProficiency', value)}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="Select proficiency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                    <SelectItem value="native">Native</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="previousEducation" className="text-xs">Previous Education</Label>
                <Textarea
                  id="previousEducation"
                  value={formData.previousEducation}
                  onChange={(e) => handleInputChange('previousEducation', e.target.value)}
                  placeholder="Enter previous education details"
                  rows={2}
                  className="text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="notes" className="text-xs">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Enter any additional notes"
                  rows={2}
                  className="text-sm"
                />
              </div>
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
