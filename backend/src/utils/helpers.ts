import crypto from 'crypto';

import { randomBytes } from 'node:crypto';

export function formatFieldName(fieldName: string): string {
  return fieldName
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase());
}

export function sanitizeUser(user: any) {
  const { passwordHash, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

export function generateUniqueFilename(originalName: string): string {
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
  const ext = originalName.split('.').pop();
  return `file-${uniqueSuffix}.${ext}`;
}

export function isValidRole(role: string): boolean {
  return [
    'super_admin',
    'admin',
    'regional_manager',
    'branch_manager',
    'processing',
    'counselor',
    'admission_officer',
    // legacy/support
    'admin_staff'
  ].includes(role);
}

export function hasPermission(userRole: string, requiredRole: string): boolean {
  const roleHierarchy = {
    counselor: 1,
    processing: 2,
    admission_officer: 3,
    branch_manager: 4,
    regional_manager: 5,
    admin: 6,
    super_admin: 7,
    // legacy mapping
    admin_staff: 6,
  } as const;
  return ((roleHierarchy as any)[userRole] ?? 0) >= ((roleHierarchy as any)[requiredRole] ?? Infinity);
}

export function generateNumericPassword(length = 10): string {
  const digits = '0123456789';
  let out = '';
  while (out.length < length) {
    const buf = randomBytes(1);
    const idx = buf[0] % digits.length;
    out += digits[idx];
  }
  return out;
}

export function normalizeDate(value: unknown): string | undefined {
  if (!value) return undefined;
  const s = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (m) {
    const mm = m[1].padStart(2, '0');
    const dd = m[2].padStart(2, '0');
    const yyyy = m[3];
    return `${yyyy}-${mm}-${dd}`;
  }
  const d = new Date(s);
  if (!isNaN(d.getTime())) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
  return undefined;
}

export function mapStudentFromLeadPayload(studentData: any) {
  return {
    name: studentData.name,
    email: studentData.email,
    phone: studentData.phone,
    dateOfBirth: normalizeDate(studentData.dateOfBirth),
    englishProficiency: studentData.englishProficiency || studentData.eltTest || undefined,
    passportNumber: studentData.passport || studentData.passportNumber || undefined,
    targetCountry: studentData.interestedCountry || studentData.targetCountry || undefined,
    status: (studentData.status === 'Open' ? 'active' : studentData.status) || 'active',
    counsellorId: studentData.counsellor || studentData.counsellorId || studentData.counselorId || undefined,
    admissionOfficerId: studentData.admissionOfficer || studentData.admissionOfficerId || undefined,
    // optionally accept branch/region if frontend sends them
    branchId: studentData.branchId || studentData.branch_id || undefined,
    regionId: studentData.regionId || studentData.region_id || undefined,
    address: studentData.address || studentData.city || undefined,
    consultancyFree: ['yes','true','1','on'].includes(String(studentData.consultancyFee ?? studentData.consultancy_free ?? studentData.consultancyFree ?? '').toLowerCase()),
    scholarship: ['yes','true','1','on'].includes(String(studentData.scholarship ?? '').toLowerCase()),
    expectation: studentData.expectation || '',
    eltTest: studentData.eltTest || '',
    notes: studentData.notes || undefined,
  };
}

export function processLeadUpdatePayload(data: any) {
  const processed = { ...data };
  if (Array.isArray(processed.country)) {
    processed.country = JSON.stringify(processed.country);
  }
  if (Array.isArray(processed.program)) {
    processed.program = JSON.stringify(processed.program);
  }
  return processed;
}
