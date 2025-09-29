import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

// Minimal but fairly comprehensive country list with ISO2 and dial code
// Source compiled from public dial code lists (E.164). Kept local to avoid extra deps.
const COUNTRIES: { name: string; iso2: string; dialCode: string }[] = [
  { name: 'United States', iso2: 'US', dialCode: '+1' },
  { name: 'Canada', iso2: 'CA', dialCode: '+1' },
  { name: 'India', iso2: 'IN', dialCode: '+91' },
  { name: 'United Kingdom', iso2: 'GB', dialCode: '+44' },
  { name: 'Australia', iso2: 'AU', dialCode: '+61' },
  { name: 'New Zealand', iso2: 'NZ', dialCode: '+64' },
  { name: 'Ireland', iso2: 'IE', dialCode: '+353' },
  { name: 'Singapore', iso2: 'SG', dialCode: '+65' },
  { name: 'United Arab Emirates', iso2: 'AE', dialCode: '+971' },
  { name: 'Saudi Arabia', iso2: 'SA', dialCode: '+966' },
  { name: 'Qatar', iso2: 'QA', dialCode: '+974' },
  { name: 'Kuwait', iso2: 'KW', dialCode: '+965' },
  { name: 'Bahrain', iso2: 'BH', dialCode: '+973' },
  { name: 'Oman', iso2: 'OM', dialCode: '+968' },
  { name: 'Bangladesh', iso2: 'BD', dialCode: '+880' },
  { name: 'Nepal', iso2: 'NP', dialCode: '+977' },
  { name: 'Pakistan', iso2: 'PK', dialCode: '+92' },
  { name: 'Sri Lanka', iso2: 'LK', dialCode: '+94' },
  { name: 'Indonesia', iso2: 'ID', dialCode: '+62' },
  { name: 'Malaysia', iso2: 'MY', dialCode: '+60' },
  { name: 'Philippines', iso2: 'PH', dialCode: '+63' },
  { name: 'Vietnam', iso2: 'VN', dialCode: '+84' },
  { name: 'Thailand', iso2: 'TH', dialCode: '+66' },
  { name: 'China', iso2: 'CN', dialCode: '+86' },
  { name: 'Hong Kong', iso2: 'HK', dialCode: '+852' },
  { name: 'Taiwan', iso2: 'TW', dialCode: '+886' },
  { name: 'Japan', iso2: 'JP', dialCode: '+81' },
  { name: 'South Korea', iso2: 'KR', dialCode: '+82' },
  { name: 'Turkey', iso2: 'TR', dialCode: '+90' },
  { name: 'South Africa', iso2: 'ZA', dialCode: '+27' },
  { name: 'Kenya', iso2: 'KE', dialCode: '+254' },
  { name: 'Nigeria', iso2: 'NG', dialCode: '+234' },
  { name: 'Ghana', iso2: 'GH', dialCode: '+233' },
  { name: 'Egypt', iso2: 'EG', dialCode: '+20' },
  { name: 'Morocco', iso2: 'MA', dialCode: '+212' },
  { name: 'Tunisia', iso2: 'TN', dialCode: '+216' },
  { name: 'Mexico', iso2: 'MX', dialCode: '+52' },
  { name: 'Brazil', iso2: 'BR', dialCode: '+55' },
  { name: 'Argentina', iso2: 'AR', dialCode: '+54' },
  { name: 'Chile', iso2: 'CL', dialCode: '+56' },
  { name: 'Colombia', iso2: 'CO', dialCode: '+57' },
  { name: 'Peru', iso2: 'PE', dialCode: '+51' },
  { name: 'Spain', iso2: 'ES', dialCode: '+34' },
  { name: 'Portugal', iso2: 'PT', dialCode: '+351' },
  { name: 'France', iso2: 'FR', dialCode: '+33' },
  { name: 'Germany', iso2: 'DE', dialCode: '+49' },
  { name: 'Italy', iso2: 'IT', dialCode: '+39' },
  { name: 'Netherlands', iso2: 'NL', dialCode: '+31' },
  { name: 'Belgium', iso2: 'BE', dialCode: '+32' },
  { name: 'Switzerland', iso2: 'CH', dialCode: '+41' },
  { name: 'Sweden', iso2: 'SE', dialCode: '+46' },
  { name: 'Norway', iso2: 'NO', dialCode: '+47' },
  { name: 'Denmark', iso2: 'DK', dialCode: '+45' },
  { name: 'Finland', iso2: 'FI', dialCode: '+358' },
  { name: 'Poland', iso2: 'PL', dialCode: '+48' },
  { name: 'Czechia', iso2: 'CZ', dialCode: '+420' },
  { name: 'Austria', iso2: 'AT', dialCode: '+43' },
  { name: 'Greece', iso2: 'GR', dialCode: '+30' },
  { name: 'Romania', iso2: 'RO', dialCode: '+40' },
  { name: 'Hungary', iso2: 'HU', dialCode: '+36' },
  { name: 'Bulgaria', iso2: 'BG', dialCode: '+359' },
  { name: 'Ukraine', iso2: 'UA', dialCode: '+380' },
  { name: 'Russia', iso2: 'RU', dialCode: '+7' },
];

const DIAL_TO_COUNTRY = new Map<string, { name: string; iso2: string; dialCode: string }[]>(
  Array.from(
    COUNTRIES.reduce((acc, c) => {
      const arr = acc.get(c.dialCode) || [];
      arr.push(c);
      acc.set(c.dialCode, arr);
      return acc;
    }, new Map<string, { name: string; iso2: string; dialCode: string }[]>())
  )
);

function isoToFlag(iso2: string): string {
  try {
    const codePoints = iso2
      .toUpperCase()
      .split('')
      .map((char) => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  } catch {
    return '🏳️';
  }
}

function parseValue(value: string | undefined): { dial: string; national: string } {
  const v = (value || '').replace(/\s+/g, '');
  if (!v.startsWith('+')) return { dial: '+1', national: v };
  // Try to find the longest matching dial code
  let match = '+1';
  for (const { dialCode } of COUNTRIES) {
    if (v.startsWith(dialCode) && dialCode.length > match.length) match = dialCode;
  }
  return { dial: match, national: v.slice(match.length) };
}

export interface PhoneNumberInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export const PhoneNumberInput: React.FC<PhoneNumberInputProps> = ({ value, onChange, className, disabled, ...rest }) => {
  const { dial, national } = React.useMemo(() => parseValue(value), [value]);
  const [dialCode, setDialCode] = React.useState(dial);
  const [local, setLocal] = React.useState(national);

  // Sync local state when external value changes
  React.useEffect(() => {
    const p = parseValue(value);
    setDialCode(p.dial);
    setLocal(p.national);
  }, [value]);

  const handleDialChange = (newDial: string) => {
    setDialCode(newDial);
    onChange(`${newDial}${local || ''}`);
  };

  const handleLocalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, '');
    setLocal(raw);
    onChange(`${dialCode}${raw}`);
  };

  const active = (DIAL_TO_COUNTRY.get(dialCode) || [])[0] || { iso2: 'US', name: 'United States', dialCode: '+1' };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Select value={dialCode} onValueChange={handleDialChange} disabled={disabled}>
        <SelectTrigger className="h-9 w-[110px] px-2 text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="max-h-72">
          {COUNTRIES.map((c) => (
            <SelectItem key={`${c.iso2}-${c.dialCode}`} value={c.dialCode}>
              <div className="flex items-center gap-2">
                <span aria-hidden className="text-base leading-none">{isoToFlag(c.iso2)}</span>
                <span className="text-xs">{c.name}</span>
                <span className="ml-auto text-xs text-muted-foreground">{c.dialCode}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div className="flex-1 flex items-center gap-2 border border-input rounded-md px-2 h-9 bg-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
        <span aria-hidden className="text-base leading-none">{isoToFlag(active.iso2)}</span>
        <span className="text-xs text-muted-foreground">{dialCode}</span>
        <Input
          type="tel"
          inputMode="tel"
          value={local}
          onChange={handleLocalChange}
          className="border-0 h-8 px-1 focus-visible:ring-0 focus-visible:ring-offset-0 flex-1"
          placeholder="1234567890"
          disabled={disabled}
          {...rest}
        />
      </div>
    </div>
  );
};

export default PhoneNumberInput;
