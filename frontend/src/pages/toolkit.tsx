import { useMemo, useState, useEffect } from 'react';
import { Layout } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SearchableCombobox } from '@/components/ui/searchable-combobox';
import { List, LayoutGrid, Star } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

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
    moi: string;
    eltAcceptable: string;
    intake: string[];
    studyGap: string;
    upcomingDeadlines: string[];
    benefits: string[];
    eligibilityRequirement: string;
    eltRequirement: string;
    applyNotes: string;
  };
};

export type InstitutionGroup = {
  id: string;
  name: string;
  description?: string;
  coverPhoto?: string;
  logo?: string;
  universities: Institution[];
};

const initialGroups: InstitutionGroup[] = [
  {
    id: 'uk-elite',
    name: 'UK Elite',
    description: 'Top UK research universities and colleges',
    coverPhoto: 'https://images.unsplash.com/photo-1471623432079-b009d30b6729?q=80&w=1600&auto=format&fit=crop',
    universities: [
      {
        id: 'u-oxford',
        logo: 'https://placehold.co/80x80/ffffff/000000?text=Oxford',
        coverPhoto: 'https://picsum.photos/seed/oxford/1200/400',
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
      }
    ]
  },
  {
    id: 'canada-research',
    name: 'Canada Research',
    description: 'Leading Canadian public research institutions',
    coverPhoto: 'https://images.unsplash.com/photo-1473172707857-f9e276582ab6?q=80&w=1600&auto=format&fit=crop',
    universities: [
      {
        id: 'u-toronto',
        logo: 'https://placehold.co/80x80/ffffff/000000?text=Toronto',
        coverPhoto: 'https://picsum.photos/seed/toronto/1200/400',
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
      }
    ]
  },
  {
    id: 'australia-tech',
    name: 'Australia Tech',
    description: 'Technology-focused universities in Australia',
    coverPhoto: 'https://images.unsplash.com/photo-1510070009289-b5bc34383727?q=80&w=1600&auto=format&fit=crop',
    universities: [
      {
        id: 'deakin',
        logo: 'https://placehold.co/80x80/ffffff/000000?text=Deakin',
        coverPhoto: 'https://picsum.photos/seed/deakin/1200/400',
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
      }
    ]
  },
  {
    id: 'germany-tu',
    name: 'Germany TU',
    description: 'German technical universities',
    coverPhoto: 'https://images.unsplash.com/photo-1568719387561-d3a925632768?q=80&w=1600&auto=format&fit=crop',
    universities: [
      {
        id: 'tum',
        logo: 'https://placehold.co/80x80/ffffff/000000?text=TUM',
        coverPhoto: 'https://picsum.photos/seed/tum/1200/400',
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
    ]
  }
];

const unique = (arr: string[]) => Array.from(new Set(arr)).sort();

const ToolkitPage = () => {
  const [groupId, setGroupId] = useState<string>('all');
  const [groups, setGroups] = useState<InstitutionGroup[]>(initialGroups);
  const [country, setCountry] = useState<string>('all');
  const [priority, setPriority] = useState<string>('all');
  const [focusOnly, setFocusOnly] = useState<boolean>(false);
  const [search, setSearch] = useState<string>('');
  const [selected, setSelected] = useState<Institution | null>(null);
  const [groupSearch, setGroupSearch] = useState<string>('');
  const [addGroupOpen, setAddGroupOpen] = useState(false);
  const [editGroupOpen, setEditGroupOpen] = useState(false);
  const [addUniOpen, setAddUniOpen] = useState(false);
  const [editUniOpen, setEditUniOpen] = useState<Institution | null>(null);
  const [viewMode, setViewMode] = useState<'grid'|'list'>(() => {
    try {
      const saved = localStorage.getItem('universities_view_mode');
      if (saved === 'grid' || saved === 'list') return saved as 'grid'|'list';
    } catch {}
    return 'grid';
  });

  // Persist selection to localStorage
  useEffect(() => {
    try { localStorage.setItem('universities_view_mode', viewMode); } catch {}
  }, [viewMode]);

  const allInstitutions = useMemo(() => groups.flatMap(g => g.universities), [groups]);

  const countries = useMemo(() => unique(allInstitutions.map(i => i.country)), [allInstitutions]);
  const priorities = useMemo(() => unique(allInstitutions.map(i => i.priority)), [allInstitutions]);

  const currentGroup = useMemo(() => groups.find(g => g.id === groupId), [groups, groupId]);

  const sourceList: Institution[] = useMemo(() => {
    if (groupId === 'all' || !currentGroup) return allInstitutions;
    return currentGroup.universities;
  }, [groupId, currentGroup, allInstitutions]);

  const filtered = useMemo(() => {
    return sourceList.filter(i =>
      (country === 'all' || i.country === country) &&
      (priority === 'all' || i.priority === priority) &&
      (!focusOnly || i.focusUniversity) &&
      (search.trim() === '' ||
        i.name.toLowerCase().includes(search.toLowerCase()) ||
        i.location.toLowerCase().includes(search.toLowerCase()) ||
        i.country.toLowerCase().includes(search.toLowerCase()))
    );
  }, [sourceList, country, priority, focusOnly, search]);

  const focusInstitutions = useMemo(() => filtered.filter(i => i.focusUniversity), [filtered]);

  const groupOptions = useMemo(() => {
    const base = [{ value: 'all', label: 'All Universities' }, ...groups.map(g => ({ value: g.id, label: g.name }))];
    if (!groupSearch.trim()) return base;
    const q = groupSearch.toLowerCase();
    return base.filter(o => o.label.toLowerCase().includes(q));
  }, [groupSearch, groups]);

  return (
    <Layout title="Universities" subtitle="Groups → Universities → Details">
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex w-full gap-3">
            <div className="w-full sm:w-64">
              <SearchableCombobox
                value={groupId}
                onValueChange={setGroupId}
                placeholder="Select university..."
                searchPlaceholder="Search universities..."
                onSearch={setGroupSearch}
                options={groupOptions}
              />
            </div>
            <div className="flex-1">
              <Input id="search" placeholder="Search by name, location or country" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center gap-2" aria-label="Actions">Actions</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setAddGroupOpen(true)}>Add Group</DropdownMenuItem>
                {groupId !== 'all' && (
                  <>
                    <DropdownMenuItem onClick={() => setAddUniOpen(true)}>Add University</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setEditGroupOpen(true)}>Edit Group</DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>


        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">{filtered.length} results</div>
          <div className="flex items-center gap-2">
            <div className="flex items-center space-x-1 bg-gray-100 rounded p-1">
              {viewMode === 'grid' ? (
                <Button size="icon" variant="ghost" onClick={() => setViewMode('list')} aria-label="Switch to list view">
                  <List className="w-4 h-4" />
                </Button>
              ) : (
                <Button size="icon" variant="ghost" onClick={() => setViewMode('grid')} aria-label="Switch to grid view">
                  <LayoutGrid className="w-4 h-4" />
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <Checkbox id="focusOnlyToggle" checked={focusOnly} onCheckedChange={(v) => setFocusOnly(Boolean(v))} />
                <Label htmlFor="focusOnlyToggle" className="text-xs">Focus Only</Label>
              </div>

              <Dialog>
                <DialogTrigger asChild>
                  <Button variant={focusOnly ? 'secondary' : 'ghost'} className="flex items-center gap-2" aria-label="View Focus Universities">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span className="hidden sm:inline">Focus Universities</span>
                    <Badge className="ml-2">{focusInstitutions.length}</Badge>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl">
                  <DialogHeader>
                    <DialogTitle>Focus Universities {groupId !== 'all' && currentGroup ? `— ${currentGroup.name}` : ''}</DialogTitle>
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
          </div>
        </div>

        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filtered.map((i) => (
              <Card key={i.id} className="overflow-hidden group relative">
                <div className="h-36 w-full bg-cover bg-center rounded-t" style={{ backgroundImage: `url(${i.coverPhoto})` }} />

                {/* Logo overlapping */}
                <div className="absolute left-6 -translate-y-1/2 top-28">
                  <div className="h-16 w-16 rounded-full bg-white p-1 border shadow-md flex items-center justify-center">
                    <img src={i.logo} alt={`${i.name} logo`} className="h-12 w-12 object-contain rounded-full" />
                  </div>
                </div>

                <CardContent className="pt-8">
                  <div className="pl-20 pr-4">
                    <CardTitle className="text-base font-semibold truncate">{i.name}</CardTitle>

                    <div className="text-xs mb-3">
                      <a href={i.website} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline truncate">{i.website}</a>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button size="sm" className="px-3" onClick={() => window.open(i.website, '_blank')}>Apply Now</Button>
                      <Button variant="outline" size="sm" onClick={() => setSelected(i)}>View Details</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((i) => (
              <div key={i.id} className="flex items-center justify-between p-3 bg-white border rounded">
                <div className="flex items-center gap-3 min-w-0">
                  <img src={i.logo} alt={`${i.name} logo`} className="h-12 w-12 object-contain rounded-full bg-white p-1 border" />
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{i.name}</div>
                    <div className="text-xs truncate text-blue-600"><a href={i.website} target="_blank" rel="noreferrer" className="hover:underline">{i.website}</a></div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" className="px-3" onClick={() => window.open(i.website, '_blank')}>Apply Now</Button>
                  <Button variant="outline" size="sm" onClick={() => setSelected(i)}>View Details</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* University Details Dialog */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>{selected.name}</DialogTitle>
              </DialogHeader>
              <div className="w-full rounded bg-muted/30 flex items-center justify-center">
                <img src={selected.coverPhoto} alt={`${selected.name} cover`} className="max-h-56 w-full object-contain" />
              </div>
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

              <ScrollArea className="h-[60vh] pr-2 mt-2">
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

      {/* Add Group Dialog */}
      <Dialog open={addGroupOpen} onOpenChange={setAddGroupOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Group</DialogTitle>
          </DialogHeader>
          <GroupForm onCancel={() => setAddGroupOpen(false)} onSave={(data) => {
            const id = `grp-${Math.random().toString(36).slice(2,8)}`;
            const newGroup: InstitutionGroup = { id, name: data.name, description: data.description, coverPhoto: data.coverPhoto, logo: data.logo, universities: [] };
            setGroups((prev) => [...prev, newGroup]);
            setGroupId(id);
            setAddGroupOpen(false);
          }} />
        </DialogContent>
      </Dialog>

      {/* Edit Group Dialog */}
      <Dialog open={editGroupOpen} onOpenChange={setEditGroupOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Group</DialogTitle>
          </DialogHeader>
          {currentGroup && (
            <GroupForm
              initial={{ name: currentGroup.name, description: currentGroup.description || '', coverPhoto: currentGroup.coverPhoto || '', logo: currentGroup.logo || '' }}
              onCancel={() => setEditGroupOpen(false)}
              onSave={(data) => {
                setGroups(prev => prev.map(g => g.id === currentGroup.id ? { ...g, ...data } : g));
                setEditGroupOpen(false);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Add University Dialog */}
      <Dialog open={addUniOpen} onOpenChange={setAddUniOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add University</DialogTitle>
          </DialogHeader>
          {currentGroup && (
            <UniversityForm
              onCancel={() => setAddUniOpen(false)}
              onSave={(u) => {
                setGroups(prev => prev.map(g => g.id === currentGroup.id ? { ...g, universities: [...g.universities, u] } : g));
                setAddUniOpen(false);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Edit University Dialog */}
      <Dialog open={!!editUniOpen} onOpenChange={(o) => !o && setEditUniOpen(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit University</DialogTitle>
          </DialogHeader>
          {currentGroup && editUniOpen && (
            <UniversityForm
              initial={editUniOpen}
              onCancel={() => setEditUniOpen(null)}
              onSave={(u) => {
                setGroups(prev => prev.map(g => g.id === currentGroup.id ? { ...g, universities: g.universities.map(x => x.id === u.id ? u : x) } : g));
                setEditUniOpen(null);
              }}
            />
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

function GroupForm({ initial, onSave, onCancel }: { initial?: { name: string; description: string; coverPhoto: string; logo: string }; onSave: (data: { name: string; description: string; coverPhoto: string; logo: string }) => void; onCancel: () => void; }) {
  const [name, setName] = useState(initial?.name || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [coverPhoto, setCoverPhoto] = useState(initial?.coverPhoto || '');
  const [logo, setLogo] = useState(initial?.logo || '');
  return (
    <div className="space-y-3">
      <div>
        <Label>Name</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div>
        <Label>Description</Label>
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      <div>
        <Label>Cover Photo URL</Label>
        <Input value={coverPhoto} onChange={(e) => setCoverPhoto(e.target.value)} />
      </div>
      <div>
        <Label>Logo URL</Label>
        <Input value={logo} onChange={(e) => setLogo(e.target.value)} />
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button onClick={() => onSave({ name, description, coverPhoto, logo })} disabled={!name.trim()}>Save</Button>
      </div>
    </div>
  );
}

function UniversityForm({ initial, onSave, onCancel }: { initial?: Institution; onSave: (u: Institution) => void; onCancel: () => void; }) {
  const [form, setForm] = useState<Institution>(initial ?? {
    id: `uni-${Math.random().toString(36).slice(2,8)}`,
    logo: '',
    coverPhoto: '',
    name: '',
    type: 'Public',
    location: '',
    country: '',
    website: '',
    priority: 'Medium',
    focusUniversity: false,
    details: {
      institutionDetails: '',
      cluster: '',
      totalFee: '',
      scholarship: '',
      initialDeposit: '',
      moi: '',
      eltAcceptable: '',
      intake: [],
      studyGap: '',
      upcomingDeadlines: [],
      benefits: [],
      eligibilityRequirement: '',
      eltRequirement: '',
      applyNotes: '',
    }
  });

  const set = (k: keyof Institution, v: any) => setForm(prev => ({ ...prev, [k]: v }));
  const setD = (k: keyof Institution['details'], v: any) => setForm(prev => ({ ...prev, details: { ...prev.details, [k]: v } }));

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <Label>Name</Label>
          <Input value={form.name} onChange={e => set('name', e.target.value)} />
        </div>
        <div>
          <Label>Type</Label>
          <Select value={form.type} onValueChange={(v) => set('type', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Public">Public</SelectItem>
              <SelectItem value="Private">Private</SelectItem>
              <SelectItem value="Community">Community</SelectItem>
              <SelectItem value="Technical">Technical</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Location</Label>
          <Input value={form.location} onChange={e => set('location', e.target.value)} />
        </div>
        <div>
          <Label>Country</Label>
          <Input value={form.country} onChange={e => set('country', e.target.value)} />
        </div>
        <div>
          <Label>Website</Label>
          <Input value={form.website} onChange={e => set('website', e.target.value)} />
        </div>
        <div>
          <Label>Priority</Label>
          <Select value={form.priority} onValueChange={(v) => set('priority', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="High">High</SelectItem>
              <SelectItem value="Medium">Medium</SelectItem>
              <SelectItem value="Low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-end gap-2">
          <Checkbox id="focusU" checked={form.focusUniversity} onCheckedChange={(v) => set('focusUniversity', Boolean(v))} />
          <Label htmlFor="focusU">Focus University</Label>
        </div>
        <div>
          <Label>Logo URL</Label>
          <Input value={form.logo} onChange={e => set('logo', e.target.value)} />
        </div>
        <div>
          <Label>Cover Photo URL</Label>
          <Input value={form.coverPhoto} onChange={e => set('coverPhoto', e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <Label>Institution Details</Label>
          <Textarea value={form.details.institutionDetails} onChange={e => setD('institutionDetails', e.target.value)} />
        </div>
        <div>
          <Label>Cluster</Label>
          <Input value={form.details.cluster} onChange={e => setD('cluster', e.target.value)} />
        </div>
        <div>
          <Label>Total Fee</Label>
          <Input value={form.details.totalFee} onChange={e => setD('totalFee', e.target.value)} />
        </div>
        <div>
          <Label>Scholarship</Label>
          <Input value={form.details.scholarship} onChange={e => setD('scholarship', e.target.value)} />
        </div>
        <div>
          <Label>Initial Deposit</Label>
          <Input value={form.details.initialDeposit} onChange={e => setD('initialDeposit', e.target.value)} />
        </div>
        <div>
          <Label>MOI</Label>
          <Input value={form.details.moi} onChange={e => setD('moi', e.target.value)} />
        </div>
        <div>
          <Label>ELT Acceptable</Label>
          <Input value={form.details.eltAcceptable} onChange={e => setD('eltAcceptable', e.target.value)} />
        </div>
        <div>
          <Label>Intake (comma separated)</Label>
          <Input value={form.details.intake.join(', ')} onChange={e => setD('intake', e.target.value.split(',').map(s => s.trim()).filter(Boolean))} />
        </div>
        <div>
          <Label>Study Gap</Label>
          <Input value={form.details.studyGap} onChange={e => setD('studyGap', e.target.value)} />
        </div>
        <div>
          <Label>Upcoming Deadlines (comma separated)</Label>
          <Input value={form.details.upcomingDeadlines.join(', ')} onChange={e => setD('upcomingDeadlines', e.target.value.split(',').map(s => s.trim()).filter(Boolean))} />
        </div>
        <div>
          <Label>Benefits (comma separated)</Label>
          <Input value={form.details.benefits.join(', ')} onChange={e => setD('benefits', e.target.value.split(',').map(s => s.trim()).filter(Boolean))} />
        </div>
        <div>
          <Label>Eligibility Requirement</Label>
          <Textarea value={form.details.eligibilityRequirement} onChange={e => setD('eligibilityRequirement', e.target.value)} />
        </div>
        <div>
          <Label>ELT Requirement</Label>
          <Input value={form.details.eltRequirement} onChange={e => setD('eltRequirement', e.target.value)} />
        </div>
        <div>
          <Label>Apply Notes</Label>
          <Textarea value={form.details.applyNotes} onChange={e => setD('applyNotes', e.target.value)} />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button onClick={() => onSave(form)} disabled={!form.name.trim() || !form.country.trim() || !form.type.trim()}>Save</Button>
      </div>
    </div>
  );
}

export default ToolkitPage;
