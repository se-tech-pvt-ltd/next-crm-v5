import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { type Lead } from '@/lib/types';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface ConvertToStudentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: Lead | null;
}

export function ConvertToStudentModal({ open, onOpenChange, lead }: ConvertToStudentModalProps) {
  const { toast } = useToast();

  // Check for existing students to prevent duplicates
  const { data: existingStudents } = useQuery({
    queryKey: ['/api/students'],
  });

  // Check for existing leads to prevent duplicates
  const { data: existingLeads } = useQuery({
    queryKey: ['/api/leads'],
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
        name: lead.name || '',
        email: lead.email || '',
        phone: lead.phone || '',
        targetCountry: mapDropdownToLabels((lead as any).country, 'Interested Country') || normalizeToText((lead as any).country),
        targetProgram: normalizeToText((lead as any).program),
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Convert Lead to Student</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter full name"
              />
            </div>
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="Enter email address"
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="Enter phone number"
              />
            </div>
            <div>
              <Label htmlFor="dateOfBirth">Date of Birth</Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="nationality">Nationality</Label>
              <Input
                id="nationality"
                value={formData.nationality}
                onChange={(e) => handleInputChange('nationality', e.target.value)}
                placeholder="Enter nationality"
              />
            </div>
            <div>
              <Label htmlFor="passportNumber">Passport Number</Label>
              <Input
                id="passportNumber"
                value={formData.passportNumber}
                onChange={(e) => handleInputChange('passportNumber', e.target.value)}
                placeholder="Enter passport number"
              />
            </div>
            <div>
              <Label htmlFor="targetCountry">Target Country</Label>
              <Input
                id="targetCountry"
                value={formData.targetCountry}
                onChange={(e) => handleInputChange('targetCountry', e.target.value)}
                placeholder="Enter target country"
              />
            </div>
            <div>
              <Label htmlFor="targetProgram">Target Program</Label>
              <Input
                id="targetProgram"
                value={formData.targetProgram}
                onChange={(e) => handleInputChange('targetProgram', e.target.value)}
                placeholder="Enter target program"
              />
            </div>
            <div>
              <Label htmlFor="targetLevel">Target Level</Label>
              <Select value={formData.targetLevel} onValueChange={(value) => handleInputChange('targetLevel', value)}>
                <SelectTrigger>
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
            <div>
              <Label htmlFor="englishProficiency">English Proficiency</Label>
              <Select value={formData.englishProficiency} onValueChange={(value) => handleInputChange('englishProficiency', value)}>
                <SelectTrigger>
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
          
          <div>
            <Label htmlFor="previousEducation">Previous Education</Label>
            <Textarea
              id="previousEducation"
              value={formData.previousEducation}
              onChange={(e) => handleInputChange('previousEducation', e.target.value)}
              placeholder="Enter previous education details"
              rows={3}
            />
          </div>
          
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Enter any additional notes"
              rows={3}
            />
          </div>
        </div>
        
        <div className="flex justify-end space-x-3 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={convertToStudentMutation.isPending}>
            {convertToStudentMutation.isPending ? 'Converting...' : 'Convert to Student'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
