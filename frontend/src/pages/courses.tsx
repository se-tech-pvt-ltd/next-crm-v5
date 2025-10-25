import React from 'react';
import { Layout } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { InputWithIcon } from '@/components/ui/input-with-icon';
import { Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Pagination } from '@/components/ui/pagination';
import { useQuery } from '@tanstack/react-query';
import * as CoursesService from '@/services/courses';

export default function CoursesPage() {
  const [queryText, setQueryText] = React.useState('');
  const [categoryFilter, setCategoryFilter] = React.useState<string>('all');
  const [topOnly, setTopOnly] = React.useState<string>('all');
  const [currentPage, setCurrentPage] = React.useState(1);
  const pageSize = 10;

  const { data, isLoading } = useQuery({
    queryKey: ['/api/university-courses'],
    queryFn: () => CoursesService.getCourses(),
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  const courses = (data?.data || []) as CoursesService.Course[];

  const categories = React.useMemo(() => {
    const set = new Set<string>();
    courses.forEach(c => { if (c.category) set.add(c.category); });
    return ['all', ...Array.from(set).sort()];
  }, [courses]);

  const filtered = courses.filter(c => {
    const q = queryText.trim().toLowerCase();
    const matchesQuery = q === '' ? true : [c.name, c.universityName, c.country, c.category || '']
      .some(v => (v || '').toString().toLowerCase().includes(q));

    const matchesCategory = categoryFilter === 'all' ? true : String(c.category || '').toLowerCase() === String(categoryFilter).toLowerCase();
    const matchesTop = topOnly === 'all' ? true : (topOnly === 'top' ? Boolean(c.isTopCourse) : !Boolean(c.isTopCourse));

    return matchesQuery && matchesCategory && matchesTop;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageItems = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [queryText, categoryFilter, topOnly]);

  return (
    <Layout title="Courses" showSearch={false}>
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <InputWithIcon
                icon={Search}
                placeholder="Search by course, university, country"
                value={queryText}
                onChange={e => setQueryText(e.target.value)}
              />

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat === 'all' ? 'All Categories' : cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={topOnly} onValueChange={setTopOnly}>
                <SelectTrigger>
                  <SelectValue placeholder="Top course" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="top">Top courses only</SelectItem>
                  <SelectItem value="non-top">Non-top only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Courses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Course</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Fees</TableHead>
                    <TableHead>Top</TableHead>
                    <TableHead>University</TableHead>
                    <TableHead>Country</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6}>Loading...</TableCell>
                    </TableRow>
                  ) : pageItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6}>No courses found.</TableCell>
                    </TableRow>
                  ) : (
                    pageItems.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">{c.name}</TableCell>
                        <TableCell>{c.category || '-'}</TableCell>
                        <TableCell>{c.fees != null ? new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(c.fees) : '-'}</TableCell>
                        <TableCell>{c.isTopCourse ? <Badge className="bg-emerald-600">Top</Badge> : <span className="text-gray-500">—</span>}</TableCell>
                        <TableCell>{c.universityName || '-'}</TableCell>
                        <TableCell>{c.country || '-'}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="mt-4">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
