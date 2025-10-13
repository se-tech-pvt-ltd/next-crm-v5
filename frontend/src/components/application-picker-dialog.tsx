import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { X } from "lucide-react";
import type { Application, Student } from "@/lib/types";
import * as ApplicationsService from '@/services/applications';
import * as StudentsService from '@/services/students';

interface ApplicationPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (applicationId: string, application?: Application | Record<string, any>) => void;
  title?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  pageSize?: number;
}

const toArray = (resp: any): any[] => {
  if (Array.isArray(resp)) return resp as any[];
  if (resp && Array.isArray(resp.data)) return resp.data as any[];
  return [];
};

export const ApplicationPickerDialog = ({
  open,
  onOpenChange,
  onSelect,
  title = "Select an application",
  searchPlaceholder = "Search by application ID, student, or university",
  emptyMessage = "No applications found",
  pageSize = 6,
}: ApplicationPickerDialogProps) => {
  const [search, setSearch] = useState("");
  const page = 1;

  const { data: appsPaged } = useQuery({
    queryKey: ["/api/applications", { page, limit: pageSize }],
    queryFn: async () => ApplicationsService.getApplications({ page, limit: pageSize }),
    enabled: open && search.trim().length === 0,
  });

  const { data: appsAll } = useQuery({
    queryKey: ["/api/applications", "all-for-picker"],
    queryFn: async () => ApplicationsService.getApplications(),
    enabled: open && search.trim().length > 0,
    staleTime: 60_000,
  });

  const { data: studentsAll } = useQuery({
    queryKey: ['/api/students', 'all-for-application-picker'],
    queryFn: async () => StudentsService.getStudents(),
    enabled: open,
    staleTime: 60_000,
  });

  const rows = useMemo(() => {
    const source = search.trim().length > 0 ? appsAll : appsPaged;
    // Only include applications that are not yet converted (isConverted === 0)
    const rawList = toArray(source);
    const list = rawList.filter((app: any) => {
      const v = app?.isConverted ?? app?.is_converted ?? app?.isconverted ?? app?.converted;
      // Only include when the conversion flag is explicitly present and indicates not converted
      if (v === undefined || v === null) return false;
      if (typeof v === 'boolean') return v === false;
      if (typeof v === 'number') return v === 0;
      // string forms: '0', 'false', 'no'
      const sv = String(v).trim().toLowerCase();
      return sv === '0' || sv === 'false' || sv === 'no';
    });

    const students = Array.isArray(studentsAll) ? studentsAll : (toArray(studentsAll) || []);
    const getStudentName = (sid: any) => {
      if (!sid) return 'Unknown';
      const s = students.find((x: Student) => String(x.id) === String(sid));
      return s?.name || 'Unknown';
    };
    const query = search.trim().toLowerCase();
    const filtered = query
      ? list.filter((app: any) => {
          const id = String(app.applicationCode ?? app.id ?? '').toLowerCase();
          const uni = String(app.university ?? '').toLowerCase();
          const prog = String(app.program ?? '').toLowerCase();
          const student = String(getStudentName(app.studentId)).toLowerCase();
          return id.includes(query) || uni.includes(query) || prog.includes(query) || student.includes(query);
        })
      : list;
    return filtered.slice(0, pageSize);
  }, [appsAll, appsPaged, studentsAll, search, pageSize]);

  useEffect(() => {
    if (!open) setSearch("");
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent hideClose className="max-w-[900px] overflow-hidden p-0">
        <DialogHeader className="p-0">
          <div className="flex items-center justify-between bg-[#223E7D] px-4 py-3 text-white">
            <DialogTitle className="text-base font-semibold text-white">{title}</DialogTitle>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full border border-gray-300 bg-white text-black hover:bg-gray-100"
              onClick={() => onOpenChange(false)}
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        <div className="space-y-3 p-4">
          <div className="flex items-center gap-2">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={searchPlaceholder}
              className="flex-1"
            />
          </div>
          <div className="overflow-hidden rounded-md border">
            <Table className="text-xs">
              <TableHeader>
                <TableRow>
                  <TableHead className="h-8 px-2 text-[11px]">Application ID</TableHead>
                  <TableHead className="h-8 px-2 text-[11px]">Student</TableHead>
                  <TableHead className="h-8 px-2 text-[11px]">University</TableHead>
                  <TableHead className="h-8 px-2 text-[11px]">Program</TableHead>
                  <TableHead className="h-8 px-2 text-[11px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-6 text-center text-muted-foreground">
                      {emptyMessage}
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((app: any, index: number) => {
                    const rawId = app.id ?? app.applicationCode ?? null;
                    const resolvedId = rawId ? String(rawId) : "";
                    const key = rawId ? String(rawId) : `app-${index}`;
                    const student = (studentsAll && Array.isArray(studentsAll)) ? (studentsAll as any[]).find((s: any) => String(s.id) === String(app.studentId)) : undefined;

                    return (
                      <TableRow key={key}>
                        <TableCell className="p-2 font-mono text-xs">{app.applicationCode ?? app.id ?? "-"}</TableCell>
                        <TableCell className="p-2 text-xs">{student?.name ?? (app.studentName ?? app.studentId ?? '-')}</TableCell>
                        <TableCell className="p-2 text-xs">{app.university ?? '-'}</TableCell>
                        <TableCell className="p-2 text-xs">{app.program ?? '-'}</TableCell>
                        <TableCell className="p-2 text-right">
                          <Button
                            type="button"
                            size="sm"
                            className="h-7"
                            disabled={!resolvedId}
                            onClick={() => resolvedId && onSelect(resolvedId, app)}
                          >
                            Select
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
