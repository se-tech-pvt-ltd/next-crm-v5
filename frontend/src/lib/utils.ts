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

export function sanitizePassportNumber(value: string): string {
  if (!value) return '';
  return value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
}
