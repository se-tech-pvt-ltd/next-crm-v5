export const APPLICATIONS_DROPDOWNS = {
  app_status: {
    'Open': 'Open',
    'Needs Attention': 'Needs Attention',
    'Closed': 'Closed',
  },
  case_status: {
    'Raw': 'Raw',
    'Processing' : 'Processing',
    'Offered': 'Offered',
    'Deposited': 'Deposited',
    'Closed': 'Closed'
  },
  channel_partner: {
    'Scorp': 'Scorp',
    'UKEC': 'UKEC',
    'Crizac': 'Crizac',
    'Direct': 'Direct',
    'MSM Unify': 'MSM Unify',
    'Adventus': 'Adventus',
    'ABN': 'ABN',
    'NSA': 'NSA',
  },
} as const;

export type ApplicationsDropdownSection = keyof typeof APPLICATIONS_DROPDOWNS;
export type ApplicationsDropdownKey<S extends ApplicationsDropdownSection> = keyof (typeof APPLICATIONS_DROPDOWNS)[S];

export type Option = { value: string; label: string };

const toOptions = (record: Record<string, string>): Option[] =>
  Object.entries(record).map(([value, label]) => ({ value, label }));

export const APP_STATUS_OPTIONS = toOptions(APPLICATIONS_DROPDOWNS.app_status);
export const CASE_STATUS_OPTIONS = toOptions(APPLICATIONS_DROPDOWNS.case_status);
export const CHANNEL_PARTNER_OPTIONS = toOptions(APPLICATIONS_DROPDOWNS.channel_partner);

export function labelFrom(section: ApplicationsDropdownSection, key: string): string {
  const rec = APPLICATIONS_DROPDOWNS[section] as Record<string, string>;
  return rec[key] ?? key;
}

export function keyFromLabel(section: ApplicationsDropdownSection, label: string): string | undefined {
  const rec = APPLICATIONS_DROPDOWNS[section] as Record<string, string>;
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
