import { useEffect, useState } from 'react';
import { useRoute, useLocation } from 'wouter';
import { Layout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { DobPicker } from '@/components/ui/dob-picker';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { type Lead, type Student } from '@/lib/types';
import { ArrowLeft, Award, Calendar, DollarSign, FileText, GraduationCap, MapPin, Target, Users } from 'lucide-react';

export default function ConvertLeadToStudent() {
  const [, params] = useRoute('/leads/:id/convert');
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: lead, isLoading: leadLoading } = useQuery<Lead>({
    queryKey: ['/api/leads', params?.id],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/leads/${params?.id}`);
      return res.json();
    },
    enabled: !!params?.id,
    staleTime: 0,
    refetchOnMount: true,
  });

  const { data: existingStudents } = useQuery({ queryKey: ['/api/students'] });
  const { data: users } = useQuery({ queryKey: ['/api/users'], staleTime: 5 * 60 * 1000 });
  const { data: dropdownData } = useQuery({
    queryKey: ['/api/dropdowns/module/Leads'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/dropdowns/module/Leads');
      return response.json();
    },
  });

  // Fetch dropdowns for Students module (status, expectation, ELT Test)
  const { data: studentDropdowns } = useQuery({
    queryKey: ['/api/dropdowns/module/students'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/dropdowns/module/students');
      return response.json();
    },
  });

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

  const initialFormData = {
    status: 'Open',
    expectation: 'High',
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
    counsellor: '',
    passport: '',
    dateOfBirth: '',
    address: '',
    eltTest: '',
    consultancyFee: 'No',
    consultancyFeeAttachment: '',
    scholarship: 'No',
    scholarshipAttachment: '',
  };

  const [formData, setFormData] = useState(initialFormData);

  // Align defaults with fetched student dropdowns
  useEffect(() => {
    if (studentDropdowns) {
      const ensureKey = (field: string, current: string) => {
        const list: any[] = (studentDropdowns as any)[field] || [];
        const keys = new Set(list.map(o => o.key));
        if (current && keys.has(current)) return current;
        return list[0]?.key || '';
      };
      setFormData(prev => ({
        ...prev,
        status: ensureKey('Status', prev.status),
        expectation: ensureKey('Expectation', prev.expectation),
        eltTest: ensureKey('ELT Test', prev.eltTest),
      }));
    }
  }, [studentDropdowns]);

  useEffect(() => {
    if (lead) {
      setFormData(prev => ({
        ...prev,
        type: mapDropdownToLabels(lead.type, 'Type') || normalizeToText(lead.type),
        name: lead.name || '',
        phone: lead.phone || '',
        email: lead.email || '',
        city: lead.city || '',
        source: mapDropdownToLabels(lead.source, 'Source') || normalizeToText(lead.source),
        interestedCountry: mapDropdownToLabels(lead.country, 'Interested Country') || normalizeToText(lead.country),
        studyLevel: mapDropdownToLabels(lead.studyLevel, 'Study Level') || normalizeToText(lead.studyLevel),
        studyPlan: mapDropdownToLabels(lead.studyPlan, 'Study Plan') || normalizeToText(lead.studyPlan),
        admissionOfficer: lead.createdBy || '',
        expectation: lead.expectation || prev.expectation,
      }));
    }
  }, [lead, dropdownData]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const convertToStudentMutation = useMutation({
    mutationFn: async (studentData: any) => {
      const res = await apiRequest('POST', '/api/students/convert-from-lead', {
        ...studentData,
        leadId: params?.id,
      });
      return res.json() as Promise<Student>;
    },
    onSuccess: (student: Student) => {
      queryClient.invalidateQueries({ queryKey: ['/api/leads'] });
      queryClient.invalidateQueries({ queryKey: ['/api/students'] });
      toast({ title: 'Success', description: 'Lead converted to student successfully.' });
      setLocation(`/students/${student.id}`);
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message || 'Failed to convert lead to student.', variant: 'destructive' });
    },
  });

  const handleSubmit = () => {
    if (!formData.name || !formData.email) {
      toast({ title: 'Error', description: 'Name and email are required.', variant: 'destructive' });
      return;
    }

    if (Array.isArray(existingStudents)) {
      const duplicateStudent = existingStudents.find((student: any) => student.email === formData.email);
      if (duplicateStudent) {
        toast({ title: 'Error', description: 'A student with this email already exists.', variant: 'destructive' });
        return;
      }
    }

    if (formData.phone && Array.isArray(existingStudents)) {
      const duplicatePhone = existingStudents.find((student: any) => student.phone === formData.phone);
      if (duplicatePhone) {
        toast({ title: 'Error', description: 'A student with this phone number already exists.', variant: 'destructive' });
        return;
      }
    }

    const normalizeDate = (value: string): string => {
      if (!value) return '';
      if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
      const m = value.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
      if (m) {
        const mm = m[1].padStart(2, '0');
        const dd = m[2].padStart(2, '0');
        const yyyy = m[3];
        return `${yyyy}-${mm}-${dd}`;
      }
      const d = new Date(value);
      if (!isNaN(d.getTime())) {
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
      }
      return value;
    };

    convertToStudentMutation.mutate({ ...formData, dateOfBirth: normalizeDate(formData.dateOfBirth) });
  };

  return (
    <Layout
      title={
        <Button variant="ghost" size="sm" onClick={() => setLocation(`/leads/${params?.id}`)} className="p-1 h-8 w-8">
          <ArrowLeft className="w-4 h-4" />
        </Button>
      }
      helpText="Review and edit details before converting this lead to a student."
    >
      <div className="space-y-3 text-xs md:text-[12px]">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center space-x-2">
              <Target className="w-5 h-5 text-primary" />
              <span>Student Status & Priority</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
              <div className="space-y-2">
                <Label htmlFor="status" className="text-sm font-medium flex items-center space-x-2">
                  <Target className="w-4 h-4" />
                  <span>Status *</span>
                </Label>
                <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                  <SelectTrigger className="h-8 text-xs transition-all focus:ring-2 focus:ring-primary/20">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.isArray(studentDropdowns?.['Status']) && studentDropdowns['Status'].map((opt: any) => (
                      <SelectItem key={opt.key} value={opt.key}>{opt.value}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="expectation" className="text-sm font-medium flex items-center space-x-2">
                  <Award className="w-4 h-4" />
                  <span>Expectation *</span>
                </Label>
                <Select value={formData.expectation} onValueChange={(value) => handleInputChange('expectation', value)}>
                  <SelectTrigger className="h-8 text-xs transition-all focus:ring-2 focus:ring-primary/20">
                    <SelectValue placeholder="Select expectation" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.isArray(studentDropdowns?.['Expectation']) && studentDropdowns['Expectation'].map((opt: any) => (
                      <SelectItem key={opt.key} value={opt.key}>{opt.value}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="counsellor" className="text-sm font-medium flex items-center space-x-2">
                  <Users className="w-4 h-4" />
                  <span>Counsellor</span>
                </Label>
                <Select value={formData.counsellor} onValueChange={(value) => handleInputChange('counsellor', value)}>
                  <SelectTrigger className="h-8 text-xs transition-all focus:ring-2 focus:ring-primary/20">
                    <SelectValue placeholder="Select counsellor" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.isArray(users) && users.map((user: any) => (
                      <SelectItem key={user.id} value={user.id}>{user.firstName} {user.lastName} ({user.email})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateOfBirth" className="text-sm font-medium flex items-center space-x-2">
                  <Calendar className="w-4 h-4" />
                  <span>Date of Birth</span>
                </Label>
                <DobPicker id="dateOfBirth" value={formData.dateOfBirth} onChange={(v) => handleInputChange('dateOfBirth', v)} className="h-8 text-xs" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center space-x-2">
              <GraduationCap className="w-5 h-5 text-primary" />
              <span>Academic & Location Details</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              <div className="space-y-2">
                <Label htmlFor="city" className="text-sm font-medium flex items-center space-x-2">
                  <MapPin className="w-4 h-4" />
                  <span>City</span>
                </Label>
                <Input id="city" value={formData.city} onChange={(e) => handleInputChange('city', e.target.value)} placeholder="Enter city" className="h-8 text-xs transition-all focus:ring-2 focus:ring-primary/20" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="eltTest" className="text-sm font-medium flex items-center space-x-2">
                  <FileText className="w-4 h-4" />
                  <span>ELT Test</span>
                </Label>
                <Select value={formData.eltTest} onValueChange={(value) => handleInputChange('eltTest', value)}>
                  <SelectTrigger className="h-8 text-xs transition-all focus:ring-2 focus:ring-primary/20">
                    <SelectValue placeholder="Select test" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.isArray(studentDropdowns?.['ELT Test']) && studentDropdowns['ELT Test'].map((opt: any) => (
                      <SelectItem key={opt.key} value={opt.key}>{opt.value}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="passport" className="text-sm font-medium flex items-center space-x-2">
                  <FileText className="w-4 h-4" />
                  <span>Passport</span>
                </Label>
                <Input id="passport" type="text" value={formData.passport} onChange={(e) => handleInputChange('passport', e.target.value)} placeholder="Enter passport number" className="h-8 text-xs transition-all focus:ring-2 focus:ring-primary/20" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address" className="text-sm font-medium flex items-center space-x-2">
                <MapPin className="w-4 h-4" />
                <span>Full Address</span>
              </Label>
              <Textarea id="address" value={formData.address} onChange={(e) => handleInputChange('address', e.target.value)} placeholder="Enter complete address with street, city, postal code..." rows={2} className="text-xs transition-all focus:ring-2 focus:ring-primary/20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-primary" />
              <span>Financial & Documentation</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label htmlFor="consultancyFee" className="text-sm font-medium flex items-center space-x-2">
                  <DollarSign className="w-4 h-4" />
                  <span>Consultancy Fee</span>
                </Label>
                <Select value={formData.consultancyFee} onValueChange={(value) => handleInputChange('consultancyFee', value)}>
                  <SelectTrigger className="h-8 text-xs transition-all focus:ring-2 focus:ring-primary/20">
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
                  <SelectTrigger className="h-8 text-xs transition-all focus:ring-2 focus:ring-primary/20">
                    <SelectValue placeholder="Select option" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Yes">🎓 Yes</SelectItem>
                    <SelectItem value="No">❌ No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Separator />

        <div className="flex justify-end space-x-3 pt-2">
          <Button type="button" variant="outline" onClick={() => setLocation(`/leads/${params?.id}`)} className="px-4 h-8 text-xs">Cancel</Button>
          <Button onClick={handleSubmit} disabled={convertToStudentMutation.isPending || leadLoading} className="px-4 h-8 text-xs bg-primary hover:bg-primary/90">
            {convertToStudentMutation.isPending ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Converting...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <span>Convert to Student</span>
              </div>
            )}
          </Button>
        </div>
      </div>
    </Layout>
  );
}
