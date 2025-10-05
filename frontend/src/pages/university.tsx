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
import { useQuery } from '@tanstack/react-query';
import * as UniversitiesService from '@/services/universities';
import type { UniversitySummary, UniversityDetail } from '@/services/universities';

import { useMemo, useState } from 'react';

type CourseCategory = 'UG' | 'PG' | 'Research' | 'Top up';

type PanelKey = 'overview' | 'fees' | 'admissions' | 'resources' | 'courses';

const types = ['All', 'Public', 'Private'];
const priorities = ['All', 'High', 'Medium', 'Low'];

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
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [panel, setPanel] = useState<PanelKey>('overview');

  const { data: universities = [] } = useQuery({
    queryKey: ['/api/universities'],
    queryFn: UniversitiesService.listUniversities,
  });

  const countries = useMemo(() => {
    const list = Array.isArray(universities) ? universities : [];
    const set = new Set<string>();
    list.forEach((u: any) => { if (u?.country) set.add(String(u.country)); });
    return ['All', ...Array.from(set).sort()];
  }, [universities]);

  const filtered = useMemo(() => {
    const list = Array.isArray(universities) ? universities : [];
    return list.filter((u) => {
      if (search) {
        const hay = `${u.name} ${u.website ?? ''}`.toLowerCase();
        if (!hay.includes(search.toLowerCase())) return false;
      }
      if (country && country !== 'All' && (u as any).country !== country) return false;
      // Other filters (type/priority/toggles) are not applied since API may not provide these fields in list
      return true;
    });
  }, [universities, search, country]);

  const { data: detail } = useQuery<UniversityDetail | undefined>({
    queryKey: ['/api/universities', selectedId],
    queryFn: async () => selectedId ? UniversitiesService.getUniversity(selectedId) : undefined,
    enabled: !!selectedId,
    staleTime: 0,
  });

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

  const UniversityCard = ({ item }: { item: UniversitySummary }) => (
    <Card className="overflow-hidden rounded-xl border-gray-200 shadow-sm flex h-full flex-col">
      <div className="relative">
        {item.coverImageUrl ? (
          <img
            src={item.coverImageUrl}
            alt={item.name}
            className="w-full h-40 object-cover"
            loading="lazy"
          />
        ) : null}
        {item.logoImageUrl ? (
          <img src={item.logoImageUrl} alt={`${item.name} logo`} className="absolute -bottom-10 left-4 w-16 h-16 rounded-full object-cover ring-2 ring-white shadow-md" loading="lazy" />
        ) : null}
      </div>
      <CardContent className="p-4 pt-4 flex-1">
        <div className="pl-[76px] -mt-[10px] -ml-[3px]">
          <div className="font-semibold text-sm leading-tight">{item.name}</div>
          {item.website ? (
            <div className="text-xs text-gray-500 flex items-center gap-1"><Globe className="w-3.5 h-3.5" /><a href={item.website} target="_blank" rel="noopener noreferrer" className="hover:underline">{new URL(item.website).hostname}</a></div>
          ) : null}
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0 justify-between">
        <Button size="sm" variant="outline" onClick={() => { setSelectedId(item.id); setPanel('overview'); }}>View Details</Button>
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
    <Layout title="Universities" showSearch={false} helpText="Search and filter universities to apply for students.">
      <div className="space-y-4">
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
      <Dialog open={!!selectedId} onOpenChange={(o) => { if (!o) setSelectedId(null); }}>
        <DialogContent hideClose className="p-0 max-w-5xl w-[95vw] max-h-[90vh] h-[85vh] overflow-hidden rounded-xl">
          <DialogTitle className="sr-only">University Details</DialogTitle>
          <div className="flex flex-col h-full">
            <div className="bg-[#1e3a8a] text-white px-5 py-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">University Details</h2>
              <button aria-label="Close" onClick={() => setSelectedId(null)} className="w-8 h-8 rounded-full bg-white/90 text-[#1e3a8a] inline-flex items-center justify-center hover:bg-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid flex-1 min-h-0 overflow-hidden" style={{ gridTemplateColumns: '240px 1fr' }}>
              <aside className="bg-white border-r p-4 space-y-2 overflow-y-auto">
                <NavItem k="overview" label="Overview" />
                <NavItem k="fees" label="Fees and Funding" />
                <NavItem k="admissions" label="Admission Requirements" />
                <NavItem k="resources" label="Resources" />
                <NavItem k="courses" label="Courses" />
              </aside>
              <section className="bg-white p-6 overflow-y-auto min-h-0">
                {detail ? (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3">
                      {detail.overview.logoImageUrl ? (
                        <img src={detail.overview.logoImageUrl} alt={`${detail.overview.name} logo`} className="w-16 h-16 rounded-full object-cover" />
                      ) : null}
                      <div>
                        <div className="text-lg font-semibold text-gray-900">{detail.overview.name}</div>
                        {detail.overview.website ? (
                          <div className="text-xs text-gray-500 flex items-center gap-1"><Globe className="w-3.5 h-3.5" /><a href={detail.overview.website} target="_blank" rel="noopener noreferrer" className="hover:underline">{new URL(detail.overview.website).hostname}</a></div>
                        ) : null}
                      </div>
                      <div className="ml-auto flex items-center gap-2">
                        {detail.admissionRequirements.priority ? (
                          <Badge className="rounded-full">Priority: {detail.admissionRequirements.priority}</Badge>
                        ) : null}
                      </div>
                    </div>

                    {panel === 'overview' && (
                      <SectionCard title="Overview">
                        <InfoRow label="Priority" value={detail.admissionRequirements.priority ?? undefined} />
                        <InfoRow label="About" value={detail.overview.about ?? undefined} />
                        <InfoRow label="Campus City" value={detail.overview.campusCity ?? undefined} />
                        <InfoRow label="Intakes" value={(detail.admissionRequirements.intakes || []).length ? detail.admissionRequirements.intakes.join(', ') : undefined} />
                        <InfoRow label="Website" value={detail.overview.website ? <a href={detail.overview.website} target="_blank" rel="noopener noreferrer" className="text-[#1e3a8a] underline break-all">{detail.overview.website}</a> : undefined} />
                      </SectionCard>
                    )}

                    {panel === 'fees' && (
                      <SectionCard title="Fees and Funding">
                        <InfoRow label="Total Fees" value={detail.feesAndFunding.totalFees != null ? `$${Number(detail.feesAndFunding.totalFees).toLocaleString()}` : undefined} />
                        <InfoRow label="Initial deposit" value={detail.feesAndFunding.initialDepositAmount != null ? `$${Number(detail.feesAndFunding.initialDepositAmount).toLocaleString()}` : undefined} />
                        <InfoRow label="Scholarship Fee" value={detail.feesAndFunding.scholarshipFee != null ? `$${Number(detail.feesAndFunding.scholarshipFee).toLocaleString()}` : undefined} />
                        <InfoRow label="Merit Scholarships" value={detail.feesAndFunding.meritScholarships ?? undefined} />
                      </SectionCard>
                    )}

                    {panel === 'admissions' && (
                      <SectionCard title="Admission Requirements">
                        <InfoRow label="UG Entry Criteria" value={detail.admissionRequirements.ugEntryCriteria ?? undefined} />
                        <InfoRow label="PG Entry Criteria" value={detail.admissionRequirements.pgEntryCriteria ?? undefined} />
                        <InfoRow label="Accepted ELT’s" value={(detail.admissionRequirements.acceptedElts || []).length ? detail.admissionRequirements.acceptedElts.join(', ') : undefined} />
                        <InfoRow label="ELT Requirements" value={detail.admissionRequirements.eltRequirements ?? undefined} />
                        <InfoRow label="MOI" value={detail.admissionRequirements.moiPolicy ?? undefined} />
                        <InfoRow label="Study Gap" value={detail.admissionRequirements.studyGap ?? undefined} />
                      </SectionCard>
                    )}

                    {panel === 'resources' && (
                      <SectionCard title="Resources">
                        <div className="space-y-3">
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Top Courses</div>
                            {(() => {
                              const tops = (detail.courses || []).filter(c => c.isTopCourse).map(c => c.name);
                              return tops.length ? (
                                <ul className="list-disc ml-5 text-sm text-gray-900">
                                  {tops.map((c) => (
                                    <li key={c}>{c}</li>
                                  ))}
                                </ul>
                              ) : (
                                <div className="text-sm text-gray-400">No data</div>
                              );
                            })()}
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Drive</div>
                            {detail.resources?.driveUrl ? (
                              <a href={detail.resources.driveUrl} target="_blank" rel="noopener noreferrer" className="text-[#1e3a8a] underline break-all">{detail.resources.driveUrl}</a>
                            ) : (
                              <div className="text-sm text-gray-400">No link</div>
                            )}
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Notes</div>
                            <div className="text-sm text-gray-900 whitespace-pre-wrap">{detail.resources?.notes ?? <span className="text-gray-400">No notes</span>}</div>
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
                                {(detail.courses || [])
                                  .filter((c) => tab === 'All' ? true : c.category === (tab as CourseCategory))
                                  .map((c) => (
                                    <Card key={c.id} className="border-gray-200">
                                      <CardContent className="p-3">
                                        <div className="text-sm font-medium text-gray-900">{c.name}</div>
                                        <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                                          <Badge variant="outline" className="rounded-full">{c.category}</Badge>
                                          {c.fees != null ? <span className="text-gray-600">${Number(c.fees).toLocaleString()}</span> : null}
                                        </div>
                                      </CardContent>
                                    </Card>
                                  ))}
                                {((detail.courses || []).filter((c) => tab === 'All' ? true : c.category === (tab as CourseCategory)).length === 0) && (
                                  <div className="col-span-full text-sm text-gray-400">No courses found</div>
                                )}
                              </div>
                            </TabsContent>
                          ))}
                        </Tabs>
                      </SectionCard>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-8">
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      <div className="animate-spin h-5 w-5 border-2 border-current border-t-transparent rounded-full" />
                      <div>Loading university details...</div>
                    </div>
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
