export interface AfricanCountry {
  code: string;
  name: string;
  dial: string;
  flag: string;
  localLength: number;
}

export const AFRICAN_COUNTRIES: AfricanCountry[] = [
  { code: 'NG', name: 'Nigeria', dial: '234', flag: '🇳🇬', localLength: 10 },
  { code: 'GH', name: 'Ghana', dial: '233', flag: '🇬🇭', localLength: 9 },
  { code: 'KE', name: 'Kenya', dial: '254', flag: '🇰🇪', localLength: 9 },
  { code: 'ZA', name: 'South Africa', dial: '27', flag: '🇿🇦', localLength: 9 },
  { code: 'EG', name: 'Egypt', dial: '20', flag: '🇪🇬', localLength: 10 },
  { code: 'ET', name: 'Ethiopia', dial: '251', flag: '🇪🇹', localLength: 9 },
  { code: 'TZ', name: 'Tanzania', dial: '255', flag: '🇹🇿', localLength: 9 },
  { code: 'UG', name: 'Uganda', dial: '256', flag: '🇺🇬', localLength: 9 },
  { code: 'RW', name: 'Rwanda', dial: '250', flag: '🇷🇼', localLength: 9 },
  { code: 'CI', name: "Côte d'Ivoire", dial: '225', flag: '🇨🇮', localLength: 10 },
  { code: 'SN', name: 'Senegal', dial: '221', flag: '🇸🇳', localLength: 9 },
  { code: 'CM', name: 'Cameroon', dial: '237', flag: '🇨🇲', localLength: 9 },
];

export const DEFAULT_COUNTRY = AFRICAN_COUNTRIES[0];

export function digitsOnly(value: string): string {
  return value.replace(/\D/g, '');
}

export function findCountryByDial(dial: string): AfricanCountry | undefined {
  const cleaned = digitsOnly(dial);
  return [...AFRICAN_COUNTRIES]
    .sort((a, b) => b.dial.length - a.dial.length)
    .find(c => cleaned.startsWith(c.dial));
}

export function parsePhone(value: string): {
  country: AfricanCountry;
  local: string;
} {
  const digits = digitsOnly(value);
  const match = findCountryByDial(digits);
  if (match) {
    return {
      country: match,
      local: digits
        .slice(match.dial.length)
        .replace(/^0+/, '')
        .slice(0, match.localLength),
    };
  }
  return {
    country: DEFAULT_COUNTRY,
    local: digits.replace(/^0+/, '').slice(0, DEFAULT_COUNTRY.localLength),
  };
}

export function toE164(dial: string, local: string): string {
  const localDigits = digitsOnly(local).replace(/^0+/, '');
  if (!localDigits) return '';
  return `+${digitsOnly(dial)}${localDigits}`;
}

export function formatLocalDisplay(local: string): string {
  const d = digitsOnly(local).replace(/^0+/, '');
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)} ${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`;
  return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6, 10)}`;
}

export function isValidAfricanPhone(value: string): boolean {
  if (!value.startsWith('+')) return false;
  const { country, local } = parsePhone(value);
  return (
    local.length >= Math.min(8, country.localLength) &&
    local.length <= country.localLength
  );
}
