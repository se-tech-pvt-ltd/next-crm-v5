import React, { useEffect, useState } from 'react';
import { StudentProfileModal } from './student-profile-modal-new';

export function GlobalStudentProfileListener() {
  const [open, setOpen] = useState(false);
  const [studentId, setStudentId] = useState<string | null>(null);

  useEffect(() => {
    const handler = (e: any) => {
      const id = e?.detail?.id;
      if (id) {
        setStudentId(id);
        // ensure modal opens fresh
        setOpen(false);
        setTimeout(() => setOpen(true), 50);
      }
    };
    window.addEventListener('open-student-profile', handler);
    return () => window.removeEventListener('open-student-profile', handler);
  }, []);

  if (!studentId) return null;

  return (
    <StudentProfileModal
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) setStudentId(null);
      }}
      studentId={studentId}
    />
  );
}
