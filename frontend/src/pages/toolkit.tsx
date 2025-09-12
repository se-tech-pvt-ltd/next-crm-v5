import { useMemo, useState } from 'react';
import { Layout } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

export type Institution = {
  id: string;
  logo: string;
  coverPhoto: string;
  name: string;
  type: 'Public' | 'Private' | 'Community' | 'Technical' | string;
  location: string;
  country: string;
  website: string;
  priority: 'High' | 'Medium' | 'Low';
  focusUniversity: boolean;
  details: {
    institutionDetails: string;
    cluster: string;
    totalFee: string;
    scholarship: string;
    initialDeposit: string;
    moi: string; // Medium of Instruction
    eltAcceptable: string; // Which ELT tests are acceptable
    intake: string[];
    studyGap: string;
    upcomingDeadlines: string[];
    benefits: string[];
    eligibilityRequirement: string;
    eltRequirement: string;
    applyNotes: string;
  };
};

const institutionsData: Institution[] = [
  {
    id: 'u-oxford',
    logo: 'https://upload.wikimedia.org/wikipedia/en/f/ff/Oxford_University_Coat_Of_Arms.svg',
    coverPhoto: 'https://images.unsplash.com/photo-1471623432079-b009d30b6729?q=80&w=1600&auto=format&fit=crop',
    name: 'University of Oxford',
    type: 'Public',
    location: 'Oxford, England',
    country: 'United Kingdom',
    website: 'https://www.ox.ac.uk/',
    priority: 'High',
    focusUniversity: true,
    details: {
      institutionDetails: 'One of the world’s leading universities with a collegiate system and strong research output across disciplines.',
      cluster: 'Russell Group / Golden Triangle',
      totalFee: '£24,000 - £38,000 per year (program dependent)',
      scholarship: 'Rhodes, Clarendon, departmental scholarships available',
      initialDeposit: '£2,000 - £5,000 (program dependent)',
      moi: 'English',
      eltAcceptable: 'IELTS, TOEFL iBT, Cambridge C1 Advanced/C2 Proficiency',
      intake: ['Michaelmas (Oct)', 'Hilary (Jan)', 'Trinity (Apr/May)'],
      studyGap: 'Up to 2 years typically acceptable with justification',
      upcomingDeadlines: ['Undergrad UCAS: 15 Oct', 'Graduate: course-specific rolling deadlines'],
      benefits: ['Global reputation', 'Extensive alumni network', 'Strong supervision'],
      eligibilityRequirement: 'High academic achievement; course-specific prerequisites',
      eltRequirement: 'IELTS 7.0–7.5 (varies by course) or equivalent',
      applyNotes: 'Early application recommended; some courses require written work and interviews.'
    }
  },
  {
    id: 'u-toronto',
    logo: 'https://upload.wikimedia.org/wikipedia/en/0/0c/University_of_Toronto_coat_of_arms.svg',
    coverPhoto: 'https://images.unsplash.com/photo-1473172707857-f9e276582ab6?q=80&w=1600&auto=format&fit=crop',
    name: 'University of Toronto',
    type: 'Public',
    location: 'Toronto, Ontario',
    country: 'Canada',
    website: 'https://www.utoronto.ca/',
    priority: 'High',
    focusUniversity: true,
    details: {
      institutionDetails: 'Canada’s top research university with three campuses and a wide range of programs.',
      cluster: 'U15 Group of Canadian Research Universities',
      totalFee: 'CAD $45,000 - $65,000 per year (international)',
      scholarship: 'Lester B. Pearson, Faculty awards',
      initialDeposit: 'CAD $1,000 - $5,000',
      moi: 'English',
      eltAcceptable: 'IELTS, TOEFL iBT, Duolingo (some programs)',
      intake: ['Fall (Sep)', 'Winter (Jan)', 'Summer (May) for limited programs'],
      studyGap: 'Up to 5 years with relevant experience',
      upcomingDeadlines: ['Most undergrad: Jan 12', 'Program-specific graduate deadlines'],
      benefits: ['Co-op opportunities', 'Strong research', 'Diverse community'],
      eligibilityRequirement: 'Competitive GPA; program prerequisites',
      eltRequirement: 'IELTS 6.5–7.0 or TOEFL 100 (varies)',
      applyNotes: 'Some programs highly competitive; apply early and monitor portal.'
    }
  },
  {
    id: 'mit',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/0/0c/MIT_logo.svg',
    coverPhoto: 'https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?q=80&w=1600&auto=format&fit=crop',
    name: 'Massachusetts Institute of Technology',
    type: 'Private',
    location: 'Cambridge, Massachusetts',
    country: 'United States',
    website: 'https://www.mit.edu/',
    priority: 'High',
    focusUniversity: false,
    details: {
      institutionDetails: 'Pioneer in STEM education and research with strong entrepreneurship culture.',
      cluster: 'Ivy-Plus / AAU',
      totalFee: 'USD $55,000 - $60,000 per year (tuition)',
      scholarship: 'Need-based aid; fellowships for graduate students',
      initialDeposit: 'Varies by program',
      moi: 'English',
      eltAcceptable: 'IELTS, TOEFL iBT',
      intake: ['Fall (Sep) primary', 'Occasional Spring (Jan) for some programs'],
      studyGap: 'Flexible with strong justification',
      upcomingDeadlines: ['Undergrad: Jan 1 (Reg. Action 2)', 'Grad: program-specific'],
      benefits: ['World-class labs', 'Startup ecosystem', 'Industry links'],
      eligibilityRequirement: 'Excellent academics; strong math/physics background for STEM',
      eltRequirement: 'TOEFL 90–100 or IELTS 7.0+',
      applyNotes: 'Holistic review; strong research/projects recommended.'
    }
  },
  {
    id: 'deakin',
    logo: 'https://upload.wikimedia.org/wikipedia/en/0/03/Deakin_University_logo.svg',
    coverPhoto: 'https://images.unsplash.com/photo-1510070009289-b5bc34383727?q=80&w=1600&auto=format&fit=crop',
    name: 'Deakin University',
    type: 'Public',
    location: 'Victoria',
    country: 'Australia',
    website: 'https://www.deakin.edu.au/',
    priority: 'Medium',
    focusUniversity: true,
    details: {
      institutionDetails: 'Career-focused programs with strong industry placements across Victoria.',
      cluster: 'ATN (Australian Technology Network)',
      totalFee: 'AUD $32,000 - $45,000 per year',
      scholarship: 'Vice-Chancellor’s, Merit scholarships',
      initialDeposit: 'AUD $4,000 - $10,000',
      moi: 'English',
      eltAcceptable: 'IELTS, TOEFL iBT, PTE Academic',
      intake: ['Trimester 1 (Mar)', 'Trimester 2 (Jul)', 'Trimester 3 (Nov)'],
      studyGap: 'Up to 3–5 years with relevant experience',
      upcomingDeadlines: ['Rolling deadlines; advise early application'],
      benefits: ['Industry-aligned curricula', 'Multiple campuses', 'Good student support'],
      eligibilityRequirement: 'Program prerequisites; minimum GPA/percentage',
      eltRequirement: 'IELTS 6.0–6.5 or PTE 50–58 (varies)',
      applyNotes: 'Offer letters typically fast; packaging with ELICOS possible.'
    }
  },
  {
    id: 'tum',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/8/80/Logo_of_the_Technical_University_of_Munich.svg',
    coverPhoto: 'https://images.unsplash.com/photo-1568719387561-d3a925632768?q=80&w=1600&auto=format&fit=crop',
    name: 'Technical University of Munich',
    type: 'Public',
    location: 'Munich, Bavaria',
    country: 'Germany',
    website: 'https://www.tum.de/',
    priority: 'Low',
    focusUniversity: false,
    details: {
      institutionDetails: 'Leading technical university in Germany with strong engineering and CS programs.',
      cluster: 'TU9',
      totalFee: 'Minimal tuition; semester contribution €150–€300',
      scholarship: 'DAAD, TUM scholarships',
      initialDeposit: 'Not typically required',
      moi: 'German / English (program dependent)',
      eltAcceptable: 'IELTS/TOEFL for English-taught; TestDaF/DSH for German',
      intake: ['Winter (Oct)', 'Summer (Apr) for some programs'],
      studyGap: 'Up to 3 years commonly acceptable',
      upcomingDeadlines: ['Winter: May–Jul', 'Summer: Nov–Jan'],
      benefits: ['Low tuition', 'Strong research', 'Industry proximity'],
      eligibilityRequirement: 'Relevant bachelor background; language requirements',
      eltRequirement: 'IELTS 6.5/TOEFL 88 for English programs',
      applyNotes: 'UniAssist for many programs; program-specific docs required.'
    }
  }
];

const unique = (arr: string[]) => Array.from(new Set(arr)).sort();

const ToolkitPage = () => {
  const [country, setCountry] = useState<string>('all');
  const [type, setType] = useState<string>('all');
  const [priority, setPriority] = useState<string>('all');
  const [focusOnly, setFocusOnly] = useState<boolean>(false);
  const [search, setSearch] = useState<string>('');
  const [selected, setSelected] = useState<Institution | null>(null);

  const countries = useMemo(() => unique(institutionsData.map(i => i.country)), []);
  const types = useMemo(() => unique(institutionsData.map(i => i.type)), []);
  const priorities = useMemo(() => unique(institutionsData.map(i => i.priority)), []);

  const filtered = useMemo(() => {
    return institutionsData.filter(i =>
      (country === 'all' || i.country === country) &&
      (type === 'all' || i.type === type) &&
      (priority === 'all' || i.priority === priority) &&
      (!focusOnly || i.focusUniversity) &&
      (search.trim() === '' ||
        i.name.toLowerCase().includes(search.toLowerCase()) ||
        i.location.toLowerCase().includes(search.toLowerCase()) ||
        i.country.toLowerCase().includes(search.toLowerCase()))
    );
  }, [country, type, priority, focusOnly, search]);

  const focusInstitutions = useMemo(() => institutionsData.filter(i => i.focusUniversity), []);

  return (
    <Layout title="Toolkit" subtitle="Institutions">
      <div className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
          <div className="col-span-1 md:col-span-2">
            <Label htmlFor="search">Search</Label>
            <Input id="search" placeholder="Search by name, location or country" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div>
            <Label>Country</Label>
            <Select value={country} onValueChange={setCountry}>
              <SelectTrigger>
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {countries.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {types.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Priority</Label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger>
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {priorities.map((p) => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end space-x-2 mt-2 md:mt-0">
            <Checkbox id="focusOnly" checked={focusOnly} onCheckedChange={(v) => setFocusOnly(Boolean(v))} />
            <Label htmlFor="focusOnly">Focus University</Label>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">{filtered.length} results</div>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="secondary">View Focus Universities ({focusInstitutions.length})</Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>Focus Universities</DialogTitle>
              </DialogHeader>
              <ScrollArea className="h-[60vh] pr-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {focusInstitutions.map((i) => (
                    <Card key={i.id} className="overflow-hidden">
                      <div className="h-24 w-full bg-cover bg-center" style={{ backgroundImage: `url(${i.coverPhoto})` }} />
                      <CardHeader className="flex-row items-center space-y-0 space-x-3">
                        <img src={i.logo} alt={`${i.name} logo`} className="h-10 w-10 object-contain rounded bg-white p-1 border" />
                        <div className="flex-1">
                          <CardTitle className="text-base">{i.name}</CardTitle>
                          <div className="text-xs text-muted-foreground">{i.location}</div>
                        </div>
                        <Badge className="bg-emerald-600">Focus</Badge>
                      </CardHeader>
                      <CardContent className="space-y-1">
                        <div className="flex flex-wrap gap-1">
                          <Badge variant="outline">{i.country}</Badge>
                          <Badge variant="secondary">{i.type}</Badge>
                          <Badge variant="outline">Priority: {i.priority}</Badge>
                        </div>
                        <Button className="mt-2" size="sm" onClick={() => setSelected(i)}>View Details</Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filtered.map((i) => (
            <Card key={i.id} className="overflow-hidden group">
              <div className="h-28 w-full bg-cover bg-center" style={{ backgroundImage: `url(${i.coverPhoto})` }} />
              <CardHeader className="space-y-2">
                <div className="flex items-center gap-3">
                  <img src={i.logo} alt={`${i.name} logo`} className="h-10 w-10 object-contain rounded bg-white p-1 border" />
                  <div className="min-w-0">
                    <CardTitle className="text-base truncate">{i.name}</CardTitle>
                    <div className="text-xs text-muted-foreground truncate">{i.location}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline">{i.country}</Badge>
                  <Badge variant="secondary">{i.type}</Badge>
                  <Badge variant="outline">Priority: {i.priority}</Badge>
                  {i.focusUniversity && <Badge className="bg-emerald-600">Focus</Badge>}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <a className="text-xs text-blue-600 hover:underline truncate" href={i.website} target="_blank" rel="noreferrer">{i.website}</a>
                  <Button size="sm" onClick={() => setSelected(i)}>View Details</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-3xl">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>{selected.name}</DialogTitle>
              </DialogHeader>
              <div className="h-36 w-full bg-cover bg-center rounded" style={{ backgroundImage: `url(${selected.coverPhoto})` }} />
              <div className="flex items-center gap-3 mt-3">
                <img src={selected.logo} alt={`${selected.name} logo`} className="h-12 w-12 object-contain rounded bg-white p-1 border" />
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">{selected.type}</Badge>
                  <Badge variant="outline">{selected.country}</Badge>
                  <Badge variant="outline">{selected.location}</Badge>
                  <Badge variant="outline">Priority: {selected.priority}</Badge>
                  {selected.focusUniversity && <Badge className="bg-emerald-600">Focus University</Badge>}
                </div>
              </div>

              <ScrollArea className="max-h-[60vh] pr-2 mt-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div className="space-y-2">
                    <Field label="Institution Details" value={selected.details.institutionDetails} />
                    <Field label="Cluster" value={selected.details.cluster} />
                    <Field label="Total Fee" value={selected.details.totalFee} />
                    <Field label="Scholarship" value={selected.details.scholarship} />
                    <Field label="Initial Deposit" value={selected.details.initialDeposit} />
                    <Field label="MOI" value={selected.details.moi} />
                    <Field label="ELT Acceptable" value={selected.details.eltAcceptable} />
                  </div>
                  <div className="space-y-2">
                    <Field label="Intake" value={selected.details.intake.join(', ')} />
                    <Field label="Study Gap" value={selected.details.studyGap} />
                    <Field label="Upcoming Deadlines" value={selected.details.upcomingDeadlines.join(' • ')} />
                    <Field label="Benefits" value={selected.details.benefits.join(' • ')} />
                    <Field label="Eligibility requirement" value={selected.details.eligibilityRequirement} />
                    <Field label="ELT Requirement" value={selected.details.eltRequirement} />
                    <Field label="Apply Notes" value={selected.details.applyNotes} />
                  </div>
                </div>
              </ScrollArea>

              <div className="flex items-center justify-between">
                <a href={selected.website} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline">Visit Website</a>
                <Button onClick={() => setSelected(null)} variant="secondary">Close</Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

const Field = ({ label, value }: { label: string; value: string }) => (
  <div>
    <div className="text-xs text-muted-foreground">{label}</div>
    <div className="mt-0.5 text-sm whitespace-pre-wrap">{value}</div>
  </div>
);

export default ToolkitPage;
