export const EVENTS_DROPDOWNS = {
  status: {
    'Not sure': 'Not sure',
    'Unable to contact': 'Unable to contact',
    'Not Attending': 'Not Attending',
    'Attending': 'Attending',
  },
  source: {
    'Paid Ads': 'Paid Ads',
    'Outdoor': 'Outdoor',
    'Social Media': 'Social Media',
    'Walk-in': 'Walk-in',
    'Events': 'Events',
    'Official Phone': 'Official Phone',
  },
} as const;

export type EventsDropdownSection = keyof typeof EVENTS_DROPDOWNS;
export type EventsDropdownKey<S extends EventsDropdownSection> = keyof (typeof EVENTS_DROPDOWNS)[S];

export type Option = { value: string; label: string };

const toOptions = (record: Record<string, string>): Option[] =>
  Object.entries(record).map(([value, label]) => ({ value, label }));

export const STATUS_OPTIONS = toOptions(EVENTS_DROPDOWNS.status);
export const SOURCE_OPTIONS = toOptions(EVENTS_DROPDOWNS.source);

export function labelFrom(section: EventsDropdownSection, key: string): string {
  const rec = EVENTS_DROPDOWNS[section] as Record<string, string>;
  return rec[key] ?? key;
}

export function keyFromLabel(section: EventsDropdownSection, label: string): string | undefined {
  const rec = EVENTS_DROPDOWNS[section] as Record<string, string>;
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
