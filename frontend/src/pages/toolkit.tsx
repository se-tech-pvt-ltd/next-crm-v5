import React, { useMemo, useState } from 'react';
import { Layout } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

// Sample data (kept small and representative)
export type Institution = {
  id: string;
  logo: string;
  coverPhoto: string;
  name: string;
  type: string;
  location: string;
  country: string;
  website: string;
};

const institutions: Institution[] = [
  {
    id: 'u-oxford',
    logo: 'https://placehold.co/80x80/ffffff/000000?text=Oxford',
    coverPhoto: 'https://picsum.photos/seed/oxford/1200/400',
    name: 'University of Oxford',
    type: 'Public',
    location: 'Oxford, England',
    country: 'United Kingdom',
    website: 'https://www.ox.ac.uk/',
  },
  {
    id: 'u-toronto',
    logo: 'https://placehold.co/80x80/ffffff/000000?text=Toronto',
    coverPhoto: 'https://picsum.photos/seed/toronto/1200/400',
    name: 'University of Toronto',
    type: 'Public',
    location: 'Toronto, Canada',
    country: 'Canada',
    website: 'https://www.utoronto.ca/',
  },
  {
    id: 'deakin',
    logo: 'https://placehold.co/80x80/ffffff/000000?text=Deakin',
    coverPhoto: 'https://picsum.photos/seed/deakin/1200/400',
    name: 'Deakin University',
    type: 'Public',
    location: 'Victoria, Australia',
    country: 'Australia',
    website: 'https://www.deakin.edu.au/',
  },
  {
    id: 'tum',
    logo: 'https://placehold.co/80x80/ffffff/000000?text=TUM',
    coverPhoto: 'https://picsum.photos/seed/tum/1200/400',
    name: 'Technical University of Munich',
    type: 'Public',
    location: 'Munich, Germany',
    country: 'Germany',
    website: 'https://www.tum.de/',
  },
];

export default function Universities() {
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const filtered = useMemo(() => {
    const q = String(search || '').trim().toLowerCase();
    if (!q) return institutions;
    return institutions.filter((i) => (i.name || '').toLowerCase().includes(q) || (i.location || '').toLowerCase().includes(q) || (i.country || '').toLowerCase().includes(q));
  }, [search]);

  return (
    <Layout title="Universities" subtitle="Browse and explore universities">
      <div className="space-y-4">
        {/* Toolbar */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 max-w-xl">
            <Input placeholder="Search by name, location or country" value={search} onChange={(e:any) => setSearch(e.target.value)} />
          </div>

          <div className="flex items-center gap-2">
            <Button variant={viewMode === 'grid' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('grid')}>Grid</Button>
            <Button variant={viewMode === 'list' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('list')}>List</Button>
            <Badge className="ml-2">{filtered.length} results</Badge>
          </div>
        </div>

        {/* Filters / Pills (simple placeholders) */}
        <div className="flex gap-2 items-center flex-wrap">
          <label className="inline-flex items-center gap-2 text-sm text-gray-600">
            <input type="checkbox" className="form-checkbox" />
            <span>Focus University</span>
          </label>
          <label className="inline-flex items-center gap-2 text-sm text-gray-600">
            <input type="checkbox" className="form-checkbox" />
            <span>Low Initial Deposit</span>
          </label>
          <label className="inline-flex items-center gap-2 text-sm text-gray-600">
            <input type="checkbox" className="form-checkbox" />
            <span>MOI accepted</span>
          </label>
        </div>

        {/* Grid / List */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((u) => (
              <Card key={u.id} className="overflow-hidden rounded-lg">
                <div className="relative">
                  <div className="h-36 w-full bg-cover bg-center" style={{ backgroundImage: `url(${u.coverPhoto})` }} />
                  <div className="absolute left-4 bottom-0 translate-y-1/2">
                    <div className="h-16 w-16 rounded-full bg-white p-1 border shadow flex items-center justify-center">
                      <img src={u.logo} alt={`${u.name} logo`} className="h-12 w-12 object-contain rounded-full" />
                    </div>
                  </div>
                </div>

                <CardContent className="pt-6 pb-4 px-4 flex flex-col items-start">
                  <div className="ml-20">{/* offset to avoid logo */}
                    <CardTitle className="text-base font-semibold">{u.name}</CardTitle>
                    <div className="text-xs text-blue-600 mt-1 truncate max-w-[90%]"><a href={u.website} target="_blank" rel="noreferrer">{u.website}</a></div>

                    <div className="mt-3 flex items-center justify-between w-full">
                      <div>
                        <Button size="sm" className="px-4" onClick={() => window.open(u.website, '_blank')}>Apply Now</Button>
                      </div>
                      <div>
                        <Button variant="outline" size="sm" onClick={() => alert(`View details for ${u.name}`)}>View Details</Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((u) => (
              <div key={u.id} className="flex items-center bg-white border rounded p-3">
                <img src={u.logo} alt="logo" className="h-12 w-12 object-contain rounded-full mr-3" />
                <div className="flex-1">
                  <div className="text-sm font-semibold">{u.name}</div>
                  <div className="text-xs text-blue-600"><a href={u.website} target="_blank" rel="noreferrer">{u.website}</a></div>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" className="px-3" onClick={() => window.open(u.website, '_blank')}>Apply Now</Button>
                  <Button variant="outline" size="sm" onClick={() => alert(`View details for ${u.name}`)}>View Details</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
