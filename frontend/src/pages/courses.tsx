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
  const [selectedUniversity, setSelectedUniversity] = React.useState<string>('all');
  const [topOnly, setTopOnly] = React.useState<string>('all');
  const [currentPage, setCurrentPage] = React.useState(1);
  const pageSize = 6;

  const { data: universitiesResp } = useQuery({
    queryKey: ['/api/universities'],
    queryFn: () => import('@/services/universities').then(m => m.listUniversities()),
    staleTime: 1000 * 60 * 5,
  });
  const universities = (universitiesResp || []) as any[];

  // Fetch categories from server by requesting a larger list (first page)
  const { data: allCoursesResp } = useQuery({
    queryKey: ['/api/university-courses', 'all-categories'],
    queryFn: () => CoursesService.getCourses({ limit: 1000, page: 1 }),
    staleTime: 1000 * 60 * 5,
  });
  const categories = React.useMemo(() => {
    const set = new Set<string>();
    (allCoursesResp?.data || []).forEach((c: any) => { if (c.category) set.add(c.category); });
    return ['all', ...Array.from(set).sort()];
  }, [allCoursesResp]);

  const { data, isLoading } = useQuery({
    queryKey: ['/api/university-courses', queryText, categoryFilter, selectedUniversity, topOnly, currentPage, pageSize],
    queryFn: () => CoursesService.getCourses({
      page: currentPage,
      limit: pageSize,
      q: queryText || undefined,
      category: categoryFilter || undefined,
      universityId: selectedUniversity && selectedUniversity !== 'all' ? selectedUniversity : undefined,
      top: topOnly || undefined,
    }),
    keepPreviousData: true,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  const courses = (data?.data || []) as CoursesService.Course[];

  const totalPages = data?.pagination?.totalPages || 1;
  const pageItems = courses;

  React.useEffect(() => {
    setCurrentPage(1);
  }, [queryText, categoryFilter, topOnly, selectedUniversity]);

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

              <Select value={selectedUniversity} onValueChange={setSelectedUniversity}>
                <SelectTrigger>
                  <SelectValue placeholder="University" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Universities</SelectItem>
                  {universities?.map(u => (
                    <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
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
                hasNextPage={Boolean(data?.pagination?.hasNextPage)}
                hasPrevPage={Boolean(data?.pagination?.hasPrevPage)}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
