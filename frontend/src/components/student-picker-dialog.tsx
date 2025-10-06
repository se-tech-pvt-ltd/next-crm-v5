import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { X } from "lucide-react";
import type { Student } from "@/lib/types";
import * as StudentsService from "@/services/students";

interface StudentPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (studentId: string, student?: Student | Record<string, any>) => void;
  title?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  pageSize?: number;
}

type StudentRecord = Student & {
  student_id?: string;
  phone?: string | null;
  email?: string | null;
};

const toArray = (resp: any): StudentRecord[] => {
  if (Array.isArray(resp)) return resp as StudentRecord[];
  if (resp && Array.isArray(resp.data)) return resp.data as StudentRecord[];
  return [];
};

export const StudentPickerDialog = ({
  open,
  onOpenChange,
  onSelect,
  title = "Select a student",
  searchPlaceholder = "Search by name, ID, or contact",
  emptyMessage = "No students found",
  pageSize = 6,
}: StudentPickerDialogProps) => {
  const [search, setSearch] = useState("");
  const page = 1;

  const { data: studentsPaged } = useQuery({
    queryKey: ["/api/students", { page, limit: pageSize }],
    queryFn: async () => StudentsService.getStudents({ page, limit: pageSize }),
    enabled: open && search.trim().length === 0,
  });

  const { data: studentsAll } = useQuery({
    queryKey: ["/api/students", "all-for-picker"],
    queryFn: async () => StudentsService.getStudents(),
    enabled: open && search.trim().length > 0,
    staleTime: 60_000,
  });

  const rows = useMemo(() => {
    const source = search.trim().length > 0 ? studentsAll : studentsPaged;
    const list = toArray(source);
    const query = search.trim().toLowerCase();
    const filtered = query
      ? list.filter((student: StudentRecord) => {
          const id = String(student.student_id ?? student.id ?? "").toLowerCase();
          const name = String(student.name ?? "").toLowerCase();
          const phone = String(student.phone ?? "").toLowerCase();
          const email = String(student.email ?? "").toLowerCase();
          return id.includes(query) || name.includes(query) || phone.includes(query) || email.includes(query);
        })
      : list;
    return filtered.slice(0, pageSize);
  }, [studentsAll, studentsPaged, search, pageSize]);

  useEffect(() => {
    if (!open) {
      setSearch("");
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent hideClose className="max-w-2xl overflow-hidden p-0">
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
                  <TableHead className="h-8 px-2 text-[11px]">Student ID</TableHead>
                  <TableHead className="h-8 px-2 text-[11px]">Student Name</TableHead>
                  <TableHead className="h-8 px-2 text-[11px]">Contact</TableHead>
                  <TableHead className="h-8 px-2 text-[11px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="py-6 text-center text-muted-foreground">
                      {emptyMessage}
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((student) => {
                    const id = String(student.id ?? student.student_id ?? "");
                    return (
                      <TableRow key={id || Math.random().toString(36).slice(2)}>
                        <TableCell className="p-2 font-mono text-xs">{student.student_id ?? student.id ?? "-"}</TableCell>
                        <TableCell className="p-2 text-xs">{student.name ?? "-"}</TableCell>
                        <TableCell className="p-2 text-xs">{student.phone ?? student.email ?? "-"}</TableCell>
                        <TableCell className="p-2 text-right">
                          <Button
                            type="button"
                            size="sm"
                            className="h-7"
                            onClick={() => onSelect(id, student)}
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
