import { useMemo, useState } from 'react';
import { Layout } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ExternalLink, Star, Globe2, MapPin, University, ChevronRight, ChevronLeft } from 'lucide-react';

// Types for hardcoded toolkit/university data
interface UniversityType {
  id: string;
  logo?: string;
  coverPhoto?: string;
  name: string;
  type: string; // e.g., Public, Private
  location: string; // city/region
  country: string;
  website: string;
  priority: 'High' | 'Medium' | 'Low';
  focus: boolean;
  details: {
    cluster: string;
    totalFee: string;
    scholarship: string;
    initialDeposit: string;
    moi: string; // Medium of Instruction
    eltAcceptable: string; // Tests accepted
    intake: string; // e.g., Sep/Jan/May
    studyGap: string; // allowed study gap
    upcomingDeadlines: string;
    benefits: string;
    eligibility: string;
    eltRequirement: string;
    applyNotes: string;
  };
}

interface ToolkitType {
  id: string;
  name: string;
  country: string;
  type: string;
  priority: 'High' | 'Medium' | 'Low';
  focusUniversities: string[]; // ids
  universities: UniversityType[];
}

const HARD_CODED_TOOLKITS: ToolkitType[] = [
  {
    id: 'tk-1',
    name: 'UK Advanced STEM',
    country: 'United Kingdom',
    type: 'STEM',
    priority: 'High',
    focusUniversities: ['u-ox', 'u-manc', 'u-soton'],
    universities: [
      {
        id: 'u-ox',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/7/74/Oxford_University_Circlet.svg',
        coverPhoto: 'https://images.unsplash.com/photo-1528459448305-6b4aa4f7b8c9?q=80&w=1600&auto=format&fit=crop',
        name: 'University of Oxford',
        type: 'Public',
        location: 'Oxford, England',
        country: 'United Kingdom',
        website: 'https://www.ox.ac.uk',
        priority: 'High',
        focus: true,
        details: {
          cluster: 'Russell Group',
          totalFee: '£28,000 - £45,000 / year',
          scholarship: 'Up to 30% merit-based',
          initialDeposit: '£5,000',
          moi: 'English',
          eltAcceptable: 'IELTS, TOEFL, PTE',
          intake: 'Sep, Jan',
          studyGap: 'Up to 2 years (UG), 5 years (PG)',
          upcomingDeadlines: 'UG: Jan 15, PG: Rolling',
          benefits: 'World-class faculty, global alumni, strong research funding',
          eligibility: 'High academic standing, strong SOP, references',
          eltRequirement: 'IELTS 7.0 (no band < 6.5)',
          applyNotes: 'Prepare early; limited program seats; college selection required',
        },
      },
      {
        id: 'u-manc',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/6/6a/University_of_Manchester_coat_of_arms.svg',
        coverPhoto: 'https://images.unsplash.com/photo-1495462911434-be47104d70fa?q=80&w=1600&auto=format&fit=crop',
        name: 'University of Manchester',
        type: 'Public',
        location: 'Manchester, England',
        country: 'United Kingdom',
        website: 'https://www.manchester.ac.uk',
        priority: 'High',
        focus: true,
        details: {
          cluster: 'Russell Group',
          totalFee: '£24,000 - £35,000 / year',
          scholarship: 'Departmental awards up to 25%',
          initialDeposit: '£4,000',
          moi: 'English',
          eltAcceptable: 'IELTS, TOEFL, PTE',
          intake: 'Sep',
          studyGap: 'Up to 3 years (UG), 5 years (PG)',
          upcomingDeadlines: 'Rolling (varies by school)',
          benefits: 'Industry links, research opportunities, city campus',
          eligibility: 'Good academic profile, relevant background',
          eltRequirement: 'IELTS 6.5 (no band < 6.0)',
          applyNotes: 'Prioritize early application for scholarships',
        },
      },
      {
        id: 'u-soton',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/2/2f/UoS_logo_2017.png',
        coverPhoto: 'https://images.unsplash.com/photo-1460500063983-994d4c27756c?q=80&w=1600&auto=format&fit=crop',
        name: 'University of Southampton',
        type: 'Public',
        location: 'Southampton, England',
        country: 'United Kingdom',
        website: 'https://www.southampton.ac.uk',
        priority: 'Medium',
        focus: true,
        details: {
          cluster: 'Russell Group',
          totalFee: '£20,000 - £32,000 / year',
          scholarship: 'Up to £10,000',
          initialDeposit: '£3,000',
          moi: 'English',
          eltAcceptable: 'IELTS, TOEFL, PTE',
          intake: 'Sep, Jan (limited)',
          studyGap: 'Up to 3 years (UG), 5 years (PG)',
          upcomingDeadlines: 'Course specific',
          benefits: 'Strong engineering programs, coastal city',
          eligibility: 'Relevant academics, portfolio for some courses',
          eltRequirement: 'IELTS 6.5 overall',
          applyNotes: 'Prepare financials for CAS issuance timeline',
        },
      },
      {
        id: 'u-ports',
        logo: 'https://upload.wikimedia.org/wikipedia/en/2/20/University_of_Portsmouth_logo.svg',
        coverPhoto: 'https://images.unsplash.com/photo-1496568816309-51d7c20e3d8c?q=80&w=1600&auto=format&fit=crop',
        name: 'University of Portsmouth',
        type: 'Public',
        location: 'Portsmouth, England',
        country: 'United Kingdom',
        website: 'https://www.port.ac.uk',
        priority: 'Low',
        focus: false,
        details: {
          cluster: 'Post-92',
          totalFee: '£17,000 - £22,000 / year',
          scholarship: 'Automatic £1,500 - £3,000',
          initialDeposit: '£3,500',
          moi: 'English',
          eltAcceptable: 'IELTS, TOEFL, PTE, Duolingo',
          intake: 'Sep, Jan',
          studyGap: 'Flexible (case-by-case)',
          upcomingDeadlines: 'Rolling',
          benefits: 'Affordable fees, career support',
          eligibility: 'Standard entry requirements',
          eltRequirement: 'IELTS 6.0 overall',
          applyNotes: 'Check country-specific scholarships',
        },
      },
    ],
  },
  {
    id: 'tk-2',
    name: 'Canada Business & IT',
    country: 'Canada',
    type: 'Business & IT',
    priority: 'Medium',
    focusUniversities: ['u-waterloo', 'u-ubc'],
    universities: [
      {
        id: 'u-waterloo',
        logo: 'https://upload.wikimedia.org/wikipedia/en/0/0e/University_of_Waterloo_seal.svg',
        coverPhoto: 'https://images.unsplash.com/photo-1460411794035-42aac080490a?q=80&w=1600&auto=format&fit=crop',
        name: 'University of Waterloo',
        type: 'Public',
        location: 'Waterloo, Ontario',
        country: 'Canada',
        website: 'https://uwaterloo.ca',
        priority: 'High',
        focus: true,
        details: {
          cluster: 'U15',
          totalFee: 'CA$38,000 - CA$62,000 / year',
          scholarship: 'Entrance scholarships up to CA$10,000',
          initialDeposit: 'CA$2,000',
          moi: 'English',
          eltAcceptable: 'IELTS, TOEFL, PTE',
          intake: 'Sep, Jan, May (co-op heavy)',
          studyGap: 'Up to 2 years (UG), 5 years (PG)',
          upcomingDeadlines: 'Jan 15 (UG), program-based (PG)',
          benefits: 'Co-op programs, tech hub, innovation',
          eligibility: 'Strong math/CS background for CS/SE',
          eltRequirement: 'IELTS 6.5 overall',
          applyNotes: 'Program-specific AIF required',
        },
      },
      {
        id: 'u-ubc',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/0/04/UBC_coat_of_arms.svg',
        coverPhoto: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?q=80&w=1600&auto=format&fit=crop',
        name: 'University of British Columbia',
        type: 'Public',
        location: 'Vancouver, British Columbia',
        country: 'Canada',
        website: 'https://www.ubc.ca',
        priority: 'High',
        focus: true,
        details: {
          cluster: 'U15',
          totalFee: 'CA$45,000 - CA$65,000 / year',
          scholarship: 'International Major Entrance Scholarship',
          initialDeposit: 'CA$5,000',
          moi: 'English',
          eltAcceptable: 'IELTS, TOEFL, PTE',
          intake: 'Sep, Jan (some)',
          studyGap: 'Up to 3 years (UG), 5 years (PG)',
          upcomingDeadlines: 'Jan 31 (UG)',
          benefits: 'Global ranking, research, city campus',
          eligibility: 'Competitive academics, essays',
          eltRequirement: 'IELTS 6.5 (no band < 6.0)',
          applyNotes: 'Scholarships require early application',
        },
      },
      {
        id: 'u-sfu',
        logo: 'https://upload.wikimedia.org/wikipedia/en/9/9a/Simon_Fraser_University_coat_of_arms.svg',
        coverPhoto: 'https://images.unsplash.com/photo-1600359737907-89f1b786e33b?q=80&w=1600&auto=format&fit=crop',
        name: 'Simon Fraser University',
        type: 'Public',
        location: 'Burnaby, British Columbia',
        country: 'Canada',
        website: 'https://www.sfu.ca',
        priority: 'Medium',
        focus: false,
        details: {
          cluster: 'Comprehensive',
          totalFee: 'CA$28,000 - CA$45,000 / year',
          scholarship: 'Entrance awards up to CA$5,000',
          initialDeposit: 'CA$1,500',
          moi: 'English',
          eltAcceptable: 'IELTS, TOEFL, PTE, Duolingo',
          intake: 'Sep, Jan, May',
          studyGap: 'Flexible',
          upcomingDeadlines: 'Program-based',
          benefits: 'Strong CS/Business, coop',
          eligibility: 'Meets program prerequisites',
          eltRequirement: 'IELTS 6.5 overall',
          applyNotes: 'Rolling basis for some programs',
        },
      },
    ],
  },
];

const priorityBadge = (p: UniversityType['priority']) => {
  switch (p) {
    case 'High':
      return 'bg-red-100 text-red-800';
    case 'Medium':
      return 'bg-amber-100 text-amber-800';
    case 'Low':
    default:
      return 'bg-green-100 text-green-800';
  }
};

export default function ToolkitsPage() {
  const [selectedToolkitId, setSelectedToolkitId] = useState<string>(HARD_CODED_TOOLKITS[0]?.id || '');
  const [selectedUniversityId, setSelectedUniversityId] = useState<string | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [countryFilter, setCountryFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [focusFilter, setFocusFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  const selectedToolkit = useMemo(() => HARD_CODED_TOOLKITS.find(t => t.id === selectedToolkitId) || HARD_CODED_TOOLKITS[0], [selectedToolkitId]);

  const allCountries = useMemo(() => Array.from(new Set(HARD_CODED_TOOLKITS.flatMap(t => t.universities.map(u => u.country)))), []);
  const allTypes = useMemo(() => Array.from(new Set(HARD_CODED_TOOLKITS.flatMap(t => t.universities.map(u => u.type)))), []);

  const universities = useMemo(() => {
    if (!selectedToolkit) return [] as UniversityType[];
    let list = [...selectedToolkit.universities];
    if (countryFilter !== 'all') list = list.filter(u => u.country === countryFilter);
    if (typeFilter !== 'all') list = list.filter(u => u.type === typeFilter);
    if (priorityFilter !== 'all') list = list.filter(u => u.priority === priorityFilter);
    if (focusFilter !== 'all') list = list.filter(u => (focusFilter === 'focus' ? u.focus : !u.focus));
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(u => [u.name, u.location, u.country, u.type].some(v => v.toLowerCase().includes(q)));
    }
    return list;
  }, [selectedToolkit, countryFilter, typeFilter, priorityFilter, focusFilter, search]);

  const selectedUniversity = useMemo(() => universities.find(u => u.id === selectedUniversityId) || null, [universities, selectedUniversityId]);

  const moveToolkitSelection = (dir: -1 | 1) => {
    const idx = HARD_CODED_TOOLKITS.findIndex(t => t.id === selectedToolkitId);
    const next = Math.max(0, Math.min(HARD_CODED_TOOLKITS.length - 1, idx + dir));
    setSelectedToolkitId(HARD_CODED_TOOLKITS[next].id);
    setSelectedUniversityId(null);
  };

  return (
    <Layout
      title="Toolkits"
      subtitle="Group universities into curated toolkits for quick selection."
      helpText="Pick a toolkit to view universities. Filter by country, type, priority, and focus."
    >
      <div className="space-y-3">
        {/* Filters */}
        <Card>
          <CardContent className="p-3">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
              <Input placeholder="Search by name, country, or type" value={search} onChange={e => setSearch(e.target.value)} className="h-9" />

              <Select value={countryFilter} onValueChange={setCountryFilter}>
                <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Country" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Countries</SelectItem>
                  {allCountries.map(c => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {allTypes.map(t => (<SelectItem key={t} value={t}>{t}</SelectItem>))}
                </SelectContent>
              </Select>

              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Priority" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Low">Low</SelectItem>
                </SelectContent>
              </Select>

              <Select value={focusFilter} onValueChange={setFocusFilter}>
                <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Focus" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Universities</SelectItem>
                  <SelectItem value="focus">Focus Only</SelectItem>
                  <SelectItem value="nonfocus">Non-focus Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
          {/* Toolkit list */}
          <Card className="lg:col-span-3">
            <CardHeader className="p-3 pb-1 flex flex-row items-center justify-between">
              <CardTitle className="text-sm">Toolkits</CardTitle>
              <div className="space-x-1">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveToolkitSelection(-1)} aria-label="Previous toolkit"><ChevronLeft className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveToolkitSelection(1)} aria-label="Next toolkit"><ChevronRight className="h-4 w-4" /></Button>
              </div>
            </CardHeader>
            <CardContent className="p-2">
              <div className="space-y-1">
                {HARD_CODED_TOOLKITS.map(t => {
                  const isActive = t.id === selectedToolkitId;
                  return (
                    <button
                      key={t.id}
                      className={`w-full text-left px-2 py-2 rounded-md border transition ${isActive ? 'border-blue-500 bg-blue-50' : 'border-transparent hover:bg-gray-50'}`}
                      onClick={() => { setSelectedToolkitId(t.id); setSelectedUniversityId(null); }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium">{t.name}</div>
                          <div className="text-[11px] text-gray-500">{t.country} • {t.type}</div>
                        </div>
                        <Badge className={priorityBadge(t.priority)}>{t.priority}</Badge>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-3">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full h-8 text-xs">Focus Universities</Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-xl">
                    <DialogHeader>
                      <DialogTitle>Focus Universities — {selectedToolkit?.name}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-2">
                      {selectedToolkit?.universities.filter(u => selectedToolkit.focusUniversities.includes(u.id)).map(u => (
                        <div key={u.id} className="flex items-center justify-between p-2 border rounded-md">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-7 w-7">
                              {u.logo ? <AvatarImage src={u.logo} alt={`${u.name} logo`} /> : <AvatarFallback>{u.name.split(' ').map(s=>s[0]).join('').slice(0,2)}</AvatarFallback>}
                            </Avatar>
                            <div>
                              <div className="text-sm font-medium">{u.name}</div>
                              <div className="text-[11px] text-gray-500">{u.location}</div>
                            </div>
                          </div>
                          <Badge className={priorityBadge(u.priority)}>{u.priority}</Badge>
                        </div>
                      ))}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>

          {/* Universities table */}
          <Card className="lg:col-span-9">
            <CardHeader className="p-3 pb-1">
              <CardTitle className="text-sm flex items-center gap-2"><University className="h-4 w-4" />Universities</CardTitle>
            </CardHeader>
            <CardContent className="p-2 pt-0">
              <Table className="text-xs">
                <TableHeader>
                  <TableRow>
                    <TableHead className="h-8 px-2 text-[11px]">University</TableHead>
                    <TableHead className="h-8 px-2 text-[11px]">Type</TableHead>
                    <TableHead className="h-8 px-2 text-[11px]">Location</TableHead>
                    <TableHead className="h-8 px-2 text-[11px]">Country</TableHead>
                    <TableHead className="h-8 px-2 text-[11px]">Priority</TableHead>
                    <TableHead className="h-8 px-2 text-[11px]">Focus</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {universities.map(u => (
                    <TableRow key={u.id} className={`cursor-pointer hover:bg-gray-50 ${selectedUniversityId === u.id ? 'bg-blue-50' : ''}`} onClick={() => { setSelectedUniversityId(u.id); setIsDetailsOpen(true); }}>
                      <TableCell className="p-2">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-7 w-7">
                            {u.logo ? <AvatarImage src={u.logo} alt={`${u.name} logo`} /> : <AvatarFallback>{u.name.split(' ').map(s=>s[0]).join('').slice(0,2)}</AvatarFallback>}
                          </Avatar>
                          <div className="text-xs font-medium">{u.name}</div>
                        </div>
                      </TableCell>
                      <TableCell className="p-2">{u.type}</TableCell>
                      <TableCell className="p-2"><div className="flex items-center gap-1 text-gray-600"><MapPin className="h-3 w-3" />{u.location}</div></TableCell>
                      <TableCell className="p-2">{u.country}</TableCell>
                      <TableCell className="p-2"><Badge className={priorityBadge(u.priority)}>{u.priority}</Badge></TableCell>
                      <TableCell className="p-2">{u.focus ? <Badge className="bg-blue-100 text-blue-800">Focus</Badge> : <span className="text-gray-500">—</span>}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* University details */}
          <Card className="hidden">
            <CardHeader className="p-3 pb-1 flex items-center justify-between">
              <CardTitle className="text-sm">Details</CardTitle>
              {selectedUniversity?.website && (
                <a href={selectedUniversity.website} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline inline-flex items-center gap-1">
                  Visit Site <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </CardHeader>
            <CardContent className="p-0">
              {selectedUniversity ? (
                <div>
                  {selectedUniversity.coverPhoto ? (
                    <img src={selectedUniversity.coverPhoto} alt={`${selectedUniversity.name} campus`} className="w-full h-32 object-cover rounded-t-md" />
                  ) : (
                    <div className="w-full h-32 bg-gradient-to-r from-slate-200 to-slate-100 rounded-t-md" />
                  )}
                  <div className="p-3 space-y-3">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-10 w-10">
                        {selectedUniversity.logo ? <AvatarImage src={selectedUniversity.logo} alt={`${selectedUniversity.name} logo`} /> : <AvatarFallback>{selectedUniversity.name.split(' ').map(s=>s[0]).join('').slice(0,2)}</AvatarFallback>}
                      </Avatar>
                      <div>
                        <div className="text-sm font-semibold flex items-center gap-2">{selectedUniversity.name}{selectedUniversity.focus && <Star className="h-3.5 w-3.5 text-blue-600" />}</div>
                        <div className="text-[11px] text-gray-600 flex items-center gap-2"><Globe2 className="h-3 w-3" />{selectedUniversity.type} • {selectedUniversity.country}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <DetailRow label="Cluster" value={selectedUniversity.details.cluster} />
                      <DetailRow label="Total Fee" value={selectedUniversity.details.totalFee} />
                      <DetailRow label="Scholarship" value={selectedUniversity.details.scholarship} />
                      <DetailRow label="Initial Deposit" value={selectedUniversity.details.initialDeposit} />
                      <DetailRow label="MOI" value={selectedUniversity.details.moi} />
                      <DetailRow label="ELT Acceptable" value={selectedUniversity.details.eltAcceptable} />
                      <DetailRow label="Intake" value={selectedUniversity.details.intake} />
                      <DetailRow label="Study Gap" value={selectedUniversity.details.studyGap} />
                    </div>

                    <div className="space-y-1 text-[11px]">
                      <DetailBlock label="Upcoming Deadlines" value={selectedUniversity.details.upcomingDeadlines} />
                      <DetailBlock label="Benefits" value={selectedUniversity.details.benefits} />
                      <DetailBlock label="Eligibility Requirement" value={selectedUniversity.details.eligibility} />
                      <DetailBlock label="ELT Requirement" value={selectedUniversity.details.eltRequirement} />
                      <DetailBlock label="Apply Notes" value={selectedUniversity.details.applyNotes} />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center text-sm text-gray-600">Select a university to see full details.</div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={isDetailsOpen} onOpenChange={(open) => { setIsDetailsOpen(open); if (!open) setSelectedUniversityId(null); }}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{selectedUniversity?.name || 'Institution Details'}</DialogTitle>
          </DialogHeader>
          {selectedUniversity ? (
            <div>
              {selectedUniversity.coverPhoto ? (
                <img src={selectedUniversity.coverPhoto} alt={`${selectedUniversity.name} campus`} className="w-full h-40 object-cover rounded-md" />
              ) : null}
              <div className="mt-3 space-y-3">
                <div className="flex items-center gap-2">
                  <Avatar className="h-10 w-10">
                    {selectedUniversity.logo ? <AvatarImage src={selectedUniversity.logo} alt={`${selectedUniversity.name} logo`} /> : <AvatarFallback>{selectedUniversity.name.split(' ').map(s=>s[0]).join('').slice(0,2)}</AvatarFallback>}
                  </Avatar>
                  <div>
                    <div className="text-sm font-semibold inline-flex items-center gap-2">{selectedUniversity.name}{selectedUniversity.focus && <Star className="h-3.5 w-3.5 text-blue-600" />}</div>
                    <div className="text-[11px] text-gray-600">{selectedUniversity.type} • {selectedUniversity.location} • {selectedUniversity.country}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <DetailRow label="Cluster" value={selectedUniversity.details.cluster} />
                  <DetailRow label="Total Fee" value={selectedUniversity.details.totalFee} />
                  <DetailRow label="Scholarship" value={selectedUniversity.details.scholarship} />
                  <DetailRow label="Initial Deposit" value={selectedUniversity.details.initialDeposit} />
                  <DetailRow label="MOI" value={selectedUniversity.details.moi} />
                  <DetailRow label="ELT Acceptable" value={selectedUniversity.details.eltAcceptable} />
                  <DetailRow label="Intake" value={selectedUniversity.details.intake} />
                  <DetailRow label="Study Gap" value={selectedUniversity.details.studyGap} />
                </div>

                <div className="space-y-1 text-[11px]">
                  <DetailBlock label="Upcoming Deadlines" value={selectedUniversity.details.upcomingDeadlines} />
                  <DetailBlock label="Benefits" value={selectedUniversity.details.benefits} />
                  <DetailBlock label="Eligibility Requirement" value={selectedUniversity.details.eligibility} />
                  <DetailBlock label="ELT Requirement" value={selectedUniversity.details.eltRequirement} />
                  <DetailBlock label="Apply Notes" value={selectedUniversity.details.applyNotes} />
                </div>

                {selectedUniversity.website && (
                  <a href={selectedUniversity.website} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline inline-flex items-center gap-1">
                    Visit Site <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-600">No university selected.</div>
          )}
        </DialogContent>
      </Dialog>

    </Layout>
  );
}

const DetailRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex flex-col border rounded-md p-2 bg-white">
    <div className="text-[10px] text-gray-500">{label}</div>
    <div className="text-xs text-gray-800">{value}</div>
  </div>
);

const DetailBlock = ({ label, value }: { label: string; value: string }) => (
  <div className="border rounded-md p-2 bg-white">
    <div className="text-[10px] text-gray-500 mb-1">{label}</div>
    <div className="text-xs text-gray-800 whitespace-pre-wrap">{value}</div>
  </div>
);
