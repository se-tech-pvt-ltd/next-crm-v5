export const LEADS_DROPDOWNS = {
  type: {
    direct: 'Direct',
    referral: 'Referral',
  },
  status: {
    raw: 'Raw',
    first_touch: 'First Touch',
    interested: 'Interested',
    meeting: 'Meeting',
    follow_up: 'Follow Up',
  },
  source: {
    paid_ads: 'Paid Ads',
    social_media: 'Social Media',
    walk_in: 'Walk-in',
    events: 'Events',
    official_phone: 'Official Phone',
    outdoor: 'Outdoor',
  },
  interested_country: {
    uk: 'UK',
    usa: 'USA',
    canada: 'Canada',
    australia: 'Australia',
    europe: 'Europe',
  },
  study_level: {
    bachelors: 'Bachelors',
    masters: 'Masters',
    mres_phd: 'MRes/PHD',
  },
  study_plan: {
    immediately: 'Immediately',
    in_next_3_months: 'In Next 3 Months',
    in_next_6_months: 'In Next 6 Months',
    in_1_year: 'In 1 Year',
    not_planned_yet: 'Not Planned Yet',
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
