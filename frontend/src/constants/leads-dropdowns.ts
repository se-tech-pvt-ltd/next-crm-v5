export const LEADS_DROPDOWNS = {
  type: {
    'Direct': 'Direct',
    'Referral': 'Referral',
  },
  status: {
    'Raw': 'Raw',
    'First Touch': 'First Touch',
    'Interested': 'Interested',
    'Meeting': 'Meeting',
    'Follow Up': 'Follow Up',
  },
  source: {
    'Paid Ads': 'Paid Ads',
    'Social Media': 'Social Media',
    'Walk-in': 'Walk-in',
    'Events': 'Events',
    'Official Phone': 'Official Phone',
    'Outdoor': 'Outdoor',
  },
  interested_country: {
    'UK': 'UK',
    'USA': 'USA',
    'Canada': 'Canada',
    'Australia': 'Australia',
    'Europe': 'Europe',
  },
  study_level: {
    'Bachelors': 'Bachelors',
    'Masters': 'Masters',
    'MRes/PHD': 'MRes/PHD',
  },
  study_plan: {
    'Immediately': 'Immediately',
    'In Next 3 Months': 'In Next 3 Months',
    'In Next 6 Months': 'In Next 6 Months',
    'In 1 Year': 'In 1 Year',
    'Not Planned Yet': 'Not Planned Yet',
  },
} as const;

export type LeadsDropdownSection = keyof typeof LEADS_DROPDOWNS;
export type LeadsDropdownKey<S extends LeadsDropdownSection> = keyof (typeof LEADS_DROPDOWNS)[S];

export type Option = { value: string; label: string };

const toOptions = (record: Record<string, string>): Option[] =>
  Object.entries(record).map(([value, label]) => ({ value, label }));

export const TYPE_OPTIONS = toOptions(LEADS_DROPDOWNS.type);
export const STATUS_OPTIONS = toOptions(LEADS_DROPDOWNS.status);
export const SOURCE_OPTIONS = toOptions(LEADS_DROPDOWNS.source);
export const INTERESTED_COUNTRY_OPTIONS = toOptions(LEADS_DROPDOWNS.interested_country);
export const STUDY_LEVEL_OPTIONS = toOptions(LEADS_DROPDOWNS.study_level);
export const STUDY_PLAN_OPTIONS = toOptions(LEADS_DROPDOWNS.study_plan);

export function labelFrom(section: LeadsDropdownSection, key: string): string {
  const rec = LEADS_DROPDOWNS[section] as Record<string, string>;
  return rec[key] ?? key;
}

export function keyFromLabel(section: LeadsDropdownSection, label: string): string | undefined {
  const rec = LEADS_DROPDOWNS[section] as Record<string, string>;
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
