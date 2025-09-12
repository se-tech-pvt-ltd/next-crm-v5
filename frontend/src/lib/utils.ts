import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function capitalizeFirst(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function formatStatus(status: string): string {
  if (!status) return status;
  // Handle hyphenated statuses like "under-review" -> "Under Review"
  return status
    .split('-')
    .map(word => capitalizeFirst(word))
    .join(' ');
}

// Open student profile via ModalManager if available, otherwise dispatch legacy event or navigate
export function openStudentProfile(studentId: string | undefined | null, navigate?: (path: string) => void) {
  const sid = studentId as string | undefined | null;
  if (!sid) return;
  try {
    const { useModalManager } = require('@/contexts/ModalManagerContext');
    const { openModal } = useModalManager();
    openModal(() => {
      try { window.dispatchEvent(new CustomEvent('open-student-profile', { detail: { id: sid } })); } catch {}
    });
    return;
  } catch (e) {
    // fallback to legacy approaches
  }

  try { window.dispatchEvent(new CustomEvent('open-student-profile', { detail: { id: sid } })); } catch {}
  try { if (navigate) navigate(`/students?studentId=${sid}`); } catch {}
}
