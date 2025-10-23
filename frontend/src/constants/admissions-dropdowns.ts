export const ADMISSIONS_DROPDOWNS = {
  status: {
    'Open': 'Open',
    'Needs Attention': 'Needs Attention',
    'Closed': 'Closed',
  },
  case_status: {
    'Deposit': 'Deposit',
    'CAS': 'CAS',
    'Visa': 'Visa',
    'Enrolled': 'Enrolled',
    'Deferred': 'Deferred',
    'Closed': 'Closed',
  },
} as const;

export type AdmissionsDropdownSection = keyof typeof ADMISSIONS_DROPDOWNS;
export type AdmissionsDropdownKey<S extends AdmissionsDropdownSection> = keyof (typeof ADMISSIONS_DROPDOWNS)[S];

export type Option = { value: string; label: string };

const toOptions = (record: Record<string, string>): Option[] =>
  Object.entries(record).map(([value, label]) => ({ value, label }));

export const STATUS_OPTIONS = toOptions(ADMISSIONS_DROPDOWNS.status);
export const CASE_STATUS_OPTIONS = toOptions(ADMISSIONS_DROPDOWNS.case_status);

export function labelFrom(section: AdmissionsDropdownSection, key: string): string {
  const rec = ADMISSIONS_DROPDOWNS[section] as Record<string, string>;
  return rec[key] ?? key;
}

export function keyFromLabel(section: AdmissionsDropdownSection, label: string): string | undefined {
  const rec = ADMISSIONS_DROPDOWNS[section] as Record<string, string>;
  const lower = String(label || '').toLowerCase();
  for (const [k, v] of Object.entries(rec)) {
    if (String(v).toLowerCase() === lower || String(k).toLowerCase() === lower) return k;
  }
  for (const [k, v] of Object.entries(rec)) {
    const l = String(v).toLowerCase();
    if (l.includes(lower)) return k;
  }
  return undefined;
}
