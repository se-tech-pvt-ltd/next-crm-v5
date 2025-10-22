export const STUDENTS_DROPDOWNS = {
  status: {
    open: 'Open',
    closed: 'Closed',
    enrolled: 'Enrolled',
  },
  expectation: {
    high: 'High',
    average: 'Average',
  },
  elt_test: {
    ielts: 'IELTS',
    pte: 'PTE',
    oidi: 'OIDI',
    toefl: 'Toefl',
    passwords: 'Passwords',
    no_test: 'No Test',
  },
  consultancy_fee: {
    yes: 'Yes',
    no: 'No',
  },
  scholarship: {
    yes: 'Yes',
    no: 'No',
  },
} as const;

export type StudentsDropdownSection = keyof typeof STUDENTS_DROPDOWNS;
export type StudentsDropdownKey<S extends StudentsDropdownSection> = keyof (typeof STUDENTS_DROPDOWNS)[S];

export type Option = { value: string; label: string };

const toOptions = (record: Record<string, string>): Option[] =>
  Object.entries(record).map(([value, label]) => ({ value, label }));

export const STATUS_OPTIONS = toOptions(STUDENTS_DROPDOWNS.status);
export const EXPECTATION_OPTIONS = toOptions(STUDENTS_DROPDOWNS.expectation);
export const ELT_TEST_OPTIONS = toOptions(STUDENTS_DROPDOWNS.elt_test);
export const CONSULTANCY_FEE_OPTIONS = toOptions(STUDENTS_DROPDOWNS.consultancy_fee);
export const SCHOLARSHIP_OPTIONS = toOptions(STUDENTS_DROPDOWNS.scholarship);

export function labelFrom(section: StudentsDropdownSection, key: string): string {
  const rec = STUDENTS_DROPDOWNS[section] as Record<string, string>;
  return rec[key] ?? key;
}

export function keyFromLabel(section: StudentsDropdownSection, label: string): string | undefined {
  const rec = STUDENTS_DROPDOWNS[section] as Record<string, string>;
  const lower = String(label || '').toLowerCase();
  for (const [k, v] of Object.entries(rec)) {
    if (String(v).toLowerCase() === lower || String(k).toLowerCase() === lower) return k;
  }
  // support partial contains
  for (const [k, v] of Object.entries(rec)) {
    const l = String(v).toLowerCase();
    if (l.includes(lower)) return k;
  }
  return undefined;
}
