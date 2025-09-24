import React, { useMemo, useState } from 'react';
import { Layout } from '@/components/layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { MapPin } from 'lucide-react';

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
      'https://cdn.builder.io/api/v1/image/assets%2Feebbd39c9f344fff8d13cadcac5500de%2F085635753af1455293acdffc65f90384?format=webp&width=800',
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
      'https://cdn.builder.io/api/v1/image/assets%2Feebbd39c9f344fff8d13cadcac5500de%2F085635753af1455293acdffc65f90384?format=webp&width=800',
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
      'https://cdn.builder.io/api/v1/image/assets%2Feebbd39c9f344fff8d13cadcac5500de%2F085635753af1455293acdffc65f90384?format=webp&width=800',
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
      'https://cdn.builder.io/api/v1/image/assets%2Feebbd39c9f344fff8d13cadcac5500de%2F085635753af1455293acdffc65f90384?format=webp&width=800',
  },
];

const countries = ['All', 'United Kingdom', 'United States', 'Canada'];
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
    <Card className="overflow-hidden rounded-xl border-gray-200 shadow-sm">
      <img
        src={item.imageUrl}
        alt={item.name}
        className="w-full h-40 object-cover"
        loading="lazy"
      />
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
              {item.name.split(' ').map((w) => w[0]).join('').slice(0, 2)}
            </div>
            <div>
              <div className="font-semibold text-sm leading-tight">{item.name}</div>
              <div className="text-xs text-gray-500 flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{item.country}</div>
            </div>
          </div>
          <Badge className="bg-blue-100 text-blue-700 border border-blue-200">{item.type}</Badge>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {item.focus && <Badge variant="secondary">Focus University</Badge>}
          {item.lowInitialDeposit && <Badge variant="secondary">Low Initial Deposit</Badge>}
          {item.onlineTestAccepted && <Badge variant="secondary">Online Test accepted</Badge>}
          {item.moiAccepted && <Badge variant="secondary">MOI accepted</Badge>}
          {item.lowTuition && <Badge variant="secondary">Low Tuition Fees</Badge>}
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm"><span className="text-gray-500">Tuition Fee</span> <span className="font-semibold">${'{'}item.tuitionFee.toLocaleString(){'}'}</span></div>
          <div className="flex gap-2">
            <Button size="sm" className="rounded-full">Apply Now</Button>
            <Button size="sm" variant="outline" className="rounded-full">View Details</Button>
          </div>
        </div>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
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
    </Layout>
  );
}
