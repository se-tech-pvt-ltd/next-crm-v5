import React, { useMemo, useState } from 'react';
import { Layout } from '@/components/layout';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Globe, X } from 'lucide-react';
import { Link } from 'wouter';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type CourseCategory = 'UG' | 'PG' | 'Research' | 'Top up';

interface CourseItem {
  id: string;
  name: string;
  category: CourseCategory;
  fees?: number;
}

interface ResourcesInfo {
  topCourses?: string[];
  driveUrl?: string;
  notes?: string;
}

interface UniversityItem {
  id: string;
  name: string;
  country: string;
  type: 'Public' | 'Private';
  priority: 'High' | 'Medium' | 'Low';
  tuitionFee: number; // yearly USD
  focus: boolean; // Focus University
  lowInitialDeposit: boolean;
  onlineTestAccepted: boolean;
  moiAccepted: boolean;
  lowTuition: boolean; // helper flag for quick filter
  interviewRequired: boolean;
  imageUrl: string;
  avatarUrl: string;
  website: string;
  about?: string;
  locationCluster?: string;
  campusCities?: string[];
  intakes?: string[];
  totalFees?: number;
  initialDepositAmount?: number;
  scholarship?: string;
  meritScholarships?: string;
  ugEntryCriteria?: string;
  pgEntryCriteria?: string;
  acceptedELTs?: string[];
  eltRequirements?: string;
  moiPolicy?: string;
  studyGap?: string;
  resources?: ResourcesInfo;
  courses?: CourseItem[];
}

const UNIVERSITY_DATA: UniversityItem[] = [
  {
    id: 'oxford',
    name: 'University of Oxford',
    country: 'United Kingdom',
    type: 'Public',
    priority: 'High',
    tuitionFee: 17000,
    focus: true,
    lowInitialDeposit: true,
    onlineTestAccepted: true,
    moiAccepted: true,
    lowTuition: true,
    interviewRequired: true,
    imageUrl:
      'https://picsum.photos/seed/oxford/800/400',
    avatarUrl:
      'https://picsum.photos/seed/oxford-logo/64/64',
    website: 'https://www.ox.ac.uk',
    about: 'A world-leading centre of learning, teaching and research.',
    locationCluster: 'Oxfordshire',
    campusCities: ['Oxford'],
    intakes: ['January', 'April', 'September'],
    totalFees: 17000,
    initialDepositAmount: 2000,
    scholarship: 'Need-based and college-specific awards available',
    meritScholarships: 'Limited merit awards for exceptional profiles',
    ugEntryCriteria: 'A*AA at A-level or equivalent; strong academic profile',
    pgEntryCriteria: 'First-class or strong upper second-class degree',
    acceptedELTs: ['IELTS', 'TOEFL iBT', 'Duolingo English Test'],
    eltRequirements: 'IELTS 7.0 overall with 6.5 in each component (course dependent)',
    moiPolicy: 'MOI accepted on a case-by-case basis for recent graduates',
    studyGap: 'Up to 2 years with relevant justification for UG; 5 years for PG',
    resources: {
      topCourses: ['Computer Science', 'Economics', 'Law'],
      driveUrl: 'https://drive.google.com/drive/folders/oxford-folder',
      notes: 'Highly competitive; apply early and prepare for interviews.'
    },
    courses: [
      { id: 'ox-ug-1', name: 'BSc Computer Science', category: 'UG', fees: 17000 },
      { id: 'ox-ug-2', name: 'BA Economics & Management', category: 'UG', fees: 16800 },
      { id: 'ox-pg-1', name: 'MSc Data Science', category: 'PG', fees: 22000 },
      { id: 'ox-re-1', name: 'DPhil in Engineering', category: 'Research' },
      { id: 'ox-top-1', name: 'Top-up in Business Management', category: 'Top up' }
    ],
  },
  {
    id: 'cambridge',
    name: 'University of Cambridge',
    country: 'United Kingdom',
    type: 'Public',
    priority: 'High',
    tuitionFee: 22000,
    focus: false,
    lowInitialDeposit: false,
    onlineTestAccepted: true,
    moiAccepted: true,
    lowTuition: false,
    interviewRequired: false,
    imageUrl:
      'https://picsum.photos/seed/cambridge/800/400',
    avatarUrl:
      'https://picsum.photos/seed/cambridge-logo/64/64',
    website: 'https://www.cam.ac.uk',
    about: 'Renowned for excellence in education and research across disciplines.',
    locationCluster: 'Cambridgeshire',
    campusCities: ['Cambridge'],
    intakes: ['October', 'January'],
    totalFees: 22000,
    initialDepositAmount: 3000,
    scholarship: 'College scholarships and external funding options',
    meritScholarships: 'Several merit-based awards for top applicants',
    ugEntryCriteria: 'A*AA at A-level or equivalent; admissions assessment may apply',
    pgEntryCriteria: 'First-class or high 2:1 degree with strong references',
    acceptedELTs: ['IELTS', 'TOEFL iBT'],
    eltRequirements: 'IELTS 7.0–7.5 overall depending on course',
    moiPolicy: 'MOI generally not accepted unless specified by the department',
    studyGap: 'Typically up to 2 years for UG; 5 years for PG with justification',
    resources: {
      topCourses: ['Engineering', 'Natural Sciences', 'Law'],
      driveUrl: 'https://drive.google.com/drive/folders/cambridge-folder',
      notes: 'Course-specific requirements vary; check departmental pages.'
    },
    courses: [
      { id: 'cam-ug-1', name: 'BA Law', category: 'UG', fees: 21000 },
      { id: 'cam-ug-2', name: 'BA Natural Sciences', category: 'UG' },
      { id: 'cam-pg-1', name: 'MPhil Machine Learning', category: 'PG', fees: 25000 },
      { id: 'cam-re-1', name: 'PhD Physics', category: 'Research' }
    ],
  },
  {
    id: 'mit',
    name: 'Massachusetts Institute of Technology',
    country: 'United States',
    type: 'Private',
    priority: 'Medium',
    tuitionFee: 26000,
    focus: false,
    lowInitialDeposit: false,
    onlineTestAccepted: true,
    moiAccepted: false,
    lowTuition: false,
    interviewRequired: false,
    imageUrl:
      'https://picsum.photos/seed/mit/800/400',
    avatarUrl:
      'https://picsum.photos/seed/mit-logo/64/64',
    website: 'https://www.mit.edu',
    about: 'Pioneer in science and technology with strong entrepreneurial ecosystem.',
    locationCluster: 'Massachusetts',
    campusCities: ['Cambridge (MA)'],
    intakes: ['September', 'February'],
    totalFees: 26000,
    initialDepositAmount: 3500,
    scholarship: 'Generous need-based aid; limited merit awards',
    meritScholarships: 'Select departmental merit scholarships',
    ugEntryCriteria: 'Holistic review with strong academics and STEM rigor',
    pgEntryCriteria: 'Bachelor’s with strong GPA; research experience preferred',
    acceptedELTs: ['IELTS', 'TOEFL iBT', 'Duolingo English Test'],
    eltRequirements: 'TOEFL iBT 90–100 or IELTS 7.0+',
    moiPolicy: 'MOI not accepted',
    studyGap: 'Considered with relevant work/research experience',
    resources: {
      topCourses: ['Computer Science', 'Mechanical Engineering', 'AI'],
      driveUrl: 'https://drive.google.com/drive/folders/mit-folder',
      notes: 'Highly selective; strong research profile recommended.'
    },
    courses: [
      { id: 'mit-ug-1', name: 'BSc Electrical Engineering', category: 'UG' },
      { id: 'mit-pg-1', name: 'MEng Computer Science', category: 'PG' },
      { id: 'mit-re-1', name: 'PhD Artificial Intelligence', category: 'Research' },
      { id: 'mit-top-1', name: 'Top-up in Information Systems', category: 'Top up' }
    ],
  },
  {
    id: 'toronto',
    name: 'University of Toronto',
    country: 'Canada',
    type: 'Public',
    priority: 'Low',
    tuitionFee: 15000,
    focus: false,
    lowInitialDeposit: true,
    onlineTestAccepted: true,
    moiAccepted: true,
    lowTuition: true,
    interviewRequired: false,
    imageUrl:
      'https://picsum.photos/seed/toronto/800/400',
    avatarUrl:
      'https://picsum.photos/seed/toronto-logo/64/64',
    website: 'https://www.utoronto.ca',
    about: 'Leading Canadian university with diverse academic offerings.',
    locationCluster: 'Ontario',
    campusCities: ['Toronto', 'Mississauga', 'Scarborough'],
    intakes: ['January', 'May', 'September'],
    totalFees: 15000,
    initialDepositAmount: 1500,
    scholarship: 'Entrance scholarships and bursaries available',
    meritScholarships: 'Merit awards for high-achieving students',
    ugEntryCriteria: 'Competitive high school grades with required prerequisites',
    pgEntryCriteria: 'Four-year bachelor’s with strong GPA',
    acceptedELTs: ['IELTS', 'TOEFL iBT', 'PTE Academic'],
    eltRequirements: 'IELTS 6.5 overall with no band less than 6.0',
    moiPolicy: 'MOI accepted for select programs',
    studyGap: 'UG up to 2 years; PG up to 5 years with justification',
    resources: {
      topCourses: ['Computer Science', 'Finance', 'Public Health'],
      driveUrl: 'https://drive.google.com/drive/folders/uoft-folder',
      notes: 'Multiple campuses; check program-specific deadlines.'
    },
    courses: [
      { id: 'uoft-ug-1', name: 'BCom Finance', category: 'UG' },
      { id: 'uoft-ug-2', name: 'BSc Computer Science', category: 'UG' },
      { id: 'uoft-pg-1', name: 'MSc Public Health', category: 'PG' },
      { id: 'uoft-re-1', name: 'PhD Computer Science', category: 'Research' }
    ],
  },
];

const countries = ['All', 'United Kingdom', 'United States', 'Canada'];
const types = ['All', 'Public', 'Private'];
const priorities = ['All', 'High', 'Medium', 'Low'];

type PanelKey = 'overview' | 'fees' | 'admissions' | 'resources' | 'courses';

export default function UniversityPage() {
  const [search, setSearch] = useState('');
  const [country, setCountry] = useState<string>('All');
  const [type, setType] = useState<string>('All');
  const [priority, setPriority] = useState<string>('All');

  const [focus, setFocus] = useState(false);
  const [lowDeposit, setLowDeposit] = useState(false);
  const [onlineTest, setOnlineTest] = useState(false);
  const [moi, setMoi] = useState(false);
  const [lowTuition, setLowTuition] = useState(false);

  const [interviewRequired, setInterviewRequired] = useState(false);
  const [tuitionBelow18k, setTuitionBelow18k] = useState(false);
  const [acceptingMOI, setAcceptingMOI] = useState(false);
  const [details, setDetails] = useState<UniversityItem | null>(null);
  const [panel, setPanel] = useState<PanelKey>('overview');

  const filtered = useMemo(() => {
    return UNIVERSITY_DATA.filter((u) => {
      if (country !== 'All' && u.country !== country) return false;
      if (type !== 'All' && u.type !== (type as UniversityItem['type'])) return false;
      if (priority !== 'All' && u.priority !== (priority as UniversityItem['priority'])) return false;
      if (focus && !u.focus) return false;
      if (lowDeposit && !u.lowInitialDeposit) return false;
      if (onlineTest && !u.onlineTestAccepted) return false;
      if (moi && !u.moiAccepted) return false;
      if (lowTuition && !u.lowTuition) return false;
      if (interviewRequired && !u.interviewRequired) return false;
      if (tuitionBelow18k && !(u.tuitionFee < 18000)) return false;
      if (acceptingMOI && !u.moiAccepted) return false;
      if (search && !u.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [country, type, priority, focus, lowDeposit, onlineTest, moi, lowTuition, interviewRequired, tuitionBelow18k, acceptingMOI, search]);

  const FilterChip = ({
    active,
    onToggle,
    children,
  }: {
    active: boolean;
    onToggle: () => void;
    children: React.ReactNode;
  }) => (
    <Button
      type="button"
      variant={active ? 'default' : 'outline'}
      className={`h-8 px-3 rounded-full ${active ? '' : ''}`}
      onClick={onToggle}
    >
      {children}
    </Button>
  );

  const UniversityCard = ({ item }: { item: UniversityItem }) => (
    <Card className="overflow-hidden rounded-xl border-gray-200 shadow-sm flex h-full flex-col">
      <div className="relative">
        <img
          src={item.imageUrl}
          alt={item.name}
          className="w-full h-40 object-cover"
          loading="lazy"
        />
        <img src={item.avatarUrl} alt={`${item.name} logo`} className="absolute -bottom-10 left-4 w-16 h-16 rounded-full object-cover ring-2 ring-white shadow-md" loading="lazy" />
      </div>
      <CardContent className="p-4 pt-4 flex-1">
        <div className="pl-[76px] -mt-[10px] -ml-[3px]">
          <div className="font-semibold text-sm leading-tight">{item.name}</div>
          <div className="text-xs text-gray-500 flex items-center gap-1"><Globe className="w-3.5 h-3.5" /><a href={item.website} target="_blank" rel="noopener noreferrer" className="hover:underline">{new URL(item.website).hostname}</a></div>
        </div>


      </CardContent>
      <CardFooter className="p-4 pt-0 justify-between">
        <Button size="sm" variant="outline" onClick={() => { setDetails(item); setPanel('overview'); }}>View Details</Button>
        <Link href="/applications/add"><Button size="sm">Apply Now</Button></Link>
      </CardFooter>
    </Card>
  );

  const NavItem = ({ k, label }: { k: PanelKey; label: string }) => (
    <button
      onClick={() => setPanel(k)}
      className={`w-full text-left px-3 py-2 rounded-md text-sm transition ${panel === k ? 'bg-[#e8eefc] text-[#1e3a8a] font-medium' : 'hover:bg-gray-100 text-gray-700'}`}
      aria-current={panel === k ? 'page' : undefined}
    >
      {label}
    </button>
  );

  const InfoRow = ({ label, value }: { label: string; value?: React.ReactNode }) => (
    <div className="grid grid-cols-3 gap-2 py-2">
      <div className="col-span-1 text-xs text-gray-500">{label}</div>
      <div className="col-span-2 text-sm text-gray-900 break-words">{value ?? <span className="text-gray-400">Not provided</span>}</div>
    </div>
  );

  const SectionCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <Card className="border-gray-200">
      <CardContent className="p-4">
        <div className="text-sm font-semibold text-[#1e3a8a] mb-2">{title}</div>
        <Separator className="mb-3" />
        {children}
      </CardContent>
    </Card>
  );

  return (
    <Layout title="Toolkit" showSearch={false} helpText="Search and filter universities to apply for students.">
      <div className="space-y-4">
        {/* Filters row */}
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name, location or country"
                  className="h-10"
                  aria-label="Search universities"
                />
              </div>
              <div>
                <Select value={country} onValueChange={setCountry}>
                  <SelectTrigger className="h-10"><SelectValue placeholder="Country" /></SelectTrigger>
                  <SelectContent>
                    {countries.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger className="h-10"><SelectValue placeholder="Type" /></SelectTrigger>
                  <SelectContent>
                    {types.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger className="h-10"><SelectValue placeholder="Priority" /></SelectTrigger>
                  <SelectContent>
                    {priorities.map((p) => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <FilterChip active={focus} onToggle={() => setFocus((v) => !v)}>Focus University</FilterChip>
              <FilterChip active={lowDeposit} onToggle={() => setLowDeposit((v) => !v)}>Low Initial Deposit</FilterChip>
              <FilterChip active={onlineTest} onToggle={() => setOnlineTest((v) => !v)}>Online Test acceptable</FilterChip>
              <FilterChip active={moi} onToggle={() => setMoi((v) => !v)}>MOI accepted</FilterChip>
              <FilterChip active={lowTuition} onToggle={() => setLowTuition((v) => !v)}>Low Tuition Fees</FilterChip>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
              <div className="col-span-1 md:col-span-3 lg:col-span-5">
                <div className="flex flex-wrap items-center gap-4 bg-gray-50 rounded-lg p-3 border">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">Interview Required</span>
                    <Switch checked={interviewRequired} onCheckedChange={setInterviewRequired} />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">Tuition Fee below 18k</span>
                    <Switch checked={tuitionBelow18k} onCheckedChange={setTuitionBelow18k} />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">Accepting MOI</span>
                    <Switch checked={acceptingMOI} onCheckedChange={setAcceptingMOI} />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {filtered.map((u) => (
            <UniversityCard key={u.id} item={u} />
          ))}
          {filtered.length === 0 && (
            <Card className="col-span-full">
              <CardContent className="p-8 text-center text-sm text-muted-foreground">
                No universities match the selected filters.
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      <Dialog open={!!details} onOpenChange={(o) => { if (!o) setDetails(null); }}>
        <DialogContent hideClose className="p-0 max-w-5xl w-[95vw] max-h-[90vh] h-[85vh] overflow-hidden rounded-xl">
          <DialogTitle className="sr-only">University Details</DialogTitle>
          <div className="flex flex-col h-full">
            <div className="bg-[#1e3a8a] text-white px-5 py-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">University Details</h2>
              <button aria-label="Close" onClick={() => setDetails(null)} className="w-8 h-8 rounded-full bg-white/90 text-[#1e3a8a] inline-flex items-center justify-center hover:bg-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid flex-1 min-h-0 overflow-hidden" style={{ gridTemplateColumns: '240px 1fr' }}>
              <aside className="bg-white border-r p-4 space-y-2 overflow-y-auto">
                <div className="px-2 pb-2 text-xs font-semibold text-[#1e3a8a]">Panels</div>
                <NavItem k="overview" label="Overview" />
                <NavItem k="fees" label="Fees and Funding" />
                <NavItem k="admissions" label="Admission Requirements" />
                <NavItem k="resources" label="Resources" />
                <NavItem k="courses" label="Courses" />
              </aside>
              <section className="bg-white p-6 overflow-y-auto min-h-0">
                {details && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3">
                      <img src={details.avatarUrl} alt={`${details.name} logo`} className="w-16 h-16 rounded-full object-cover" />
                      <div>
                        <div className="text-lg font-semibold text-gray-900">{details.name}</div>
                        <div className="text-xs text-gray-500 flex items-center gap-1"><Globe className="w-3.5 h-3.5" /><a href={details.website} target="_blank" rel="noopener noreferrer" className="hover:underline">{new URL(details.website).hostname}</a></div>
                      </div>
                      <div className="ml-auto flex items-center gap-2">
                        <Badge variant="secondary" className="rounded-full">{details.type}</Badge>
                        <Badge className="rounded-full">Priority: {details.priority}</Badge>
                      </div>
                    </div>

                    {panel === 'overview' && (
                      <SectionCard title="Overview">
                        <InfoRow label="Priority" value={details.priority} />
                        <InfoRow label="About" value={details.about} />
                        <InfoRow label="Location Cluster" value={details.locationCluster} />
                        <InfoRow label="Campus City" value={details.campusCities && details.campusCities.length ? details.campusCities.join(', ') : undefined} />
                        <InfoRow label="Intakes" value={details.intakes && details.intakes.length ? details.intakes.join(', ') : undefined} />
                        <InfoRow label="Website" value={<a href={details.website} target="_blank" rel="noopener noreferrer" className="text-[#1e3a8a] underline break-all">{details.website}</a>} />
                      </SectionCard>
                    )}

                    {panel === 'fees' && (
                      <SectionCard title="Fees and Funding">
                        <InfoRow label="Total Fees" value={details.totalFees ? `$${details.totalFees.toLocaleString()}` : details.tuitionFee ? `$${details.tuitionFee.toLocaleString()}` : undefined} />
                        <InfoRow label="Initial deposit" value={details.initialDepositAmount ? `$${details.initialDepositAmount.toLocaleString()}` : undefined} />
                        <InfoRow label="Scholarship" value={details.scholarship} />
                        <InfoRow label="Merit Scholarships" value={details.meritScholarships} />
                      </SectionCard>
                    )}

                    {panel === 'admissions' && (
                      <SectionCard title="Admission Requirements">
                        <InfoRow label="UG Entry Criteria" value={details.ugEntryCriteria} />
                        <InfoRow label="PG Entry Criteria" value={details.pgEntryCriteria} />
                        <InfoRow label="Accepted ELT’s" value={details.acceptedELTs && details.acceptedELTs.length ? details.acceptedELTs.join(', ') : undefined} />
                        <InfoRow label="ELT Requirements" value={details.eltRequirements} />
                        <InfoRow label="MOI" value={details.moiPolicy ?? (details.moiAccepted ? 'Accepted' : 'Not accepted')} />
                        <InfoRow label="Study Gap" value={details.studyGap} />
                      </SectionCard>
                    )}

                    {panel === 'resources' && (
                      <SectionCard title="Resources">
                        <div className="space-y-3">
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Top Courses</div>
                            {details.resources?.topCourses && details.resources.topCourses.length ? (
                              <ul className="list-disc ml-5 text-sm text-gray-900">
                                {details.resources.topCourses.map((c) => (
                                  <li key={c}>{c}</li>
                                ))}
                              </ul>
                            ) : (
                              <div className="text-sm text-gray-400">No data</div>
                            )}
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Drive</div>
                            {details.resources?.driveUrl ? (
                              <a href={details.resources.driveUrl} target="_blank" rel="noopener noreferrer" className="text-[#1e3a8a] underline break-all">{details.resources.driveUrl}</a>
                            ) : (
                              <div className="text-sm text-gray-400">No link</div>
                            )}
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Notes</div>
                            <div className="text-sm text-gray-900 whitespace-pre-wrap">{details.resources?.notes ?? <span className="text-gray-400">No notes</span>}</div>
                          </div>
                        </div>
                      </SectionCard>
                    )}

                    {panel === 'courses' && (
                      <SectionCard title="Courses">
                        <Tabs defaultValue="All">
                          <TabsList>
                            {['All', 'UG', 'PG', 'Research', 'Top up'].map((t) => (
                              <TabsTrigger key={t} value={t}>{t}</TabsTrigger>
                            ))}
                          </TabsList>
                          {['All', 'UG', 'PG', 'Research', 'Top up'].map((tab) => (
                            <TabsContent key={tab} value={tab}>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {(details.courses ?? [])
                                  .filter((c) => tab === 'All' ? true : c.category === (tab as CourseCategory))
                                  .map((c) => (
                                    <Card key={c.id} className="border-gray-200">
                                      <CardContent className="p-3">
                                        <div className="text-sm font-medium text-gray-900">{c.name}</div>
                                        <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                                          <Badge variant="outline" className="rounded-full">{c.category}</Badge>
                                          {c.fees ? <span className="text-gray-600">${c.fees.toLocaleString()}</span> : null}
                                        </div>
                                      </CardContent>
                                    </Card>
                                  ))}
                                {((details.courses ?? []).filter((c) => tab === 'All' ? true : c.category === (tab as CourseCategory)).length === 0) && (
                                  <div className="col-span-full text-sm text-gray-400">No courses found</div>
                                )}
                              </div>
                            </TabsContent>
                          ))}
                        </Tabs>
                      </SectionCard>
                    )}
                  </div>
                )}
              </section>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
