import { Alert, Share } from 'react-native';

export function escapeCsv(value: string | number | boolean | null | undefined) {
  if (value === null || value === undefined) return '';
  const text = String(value);
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export function formatCsvDateTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
}

export function csvDateStamp(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export function rowsToCsv(
  headers: string[],
  rows: (string | number | boolean | null | undefined)[][],
) {
  return [
    headers.map(escapeCsv).join(','),
    ...rows.map(row => row.map(escapeCsv).join(',')),
  ].join('\n');
}

export async function shareCsv(filename: string, csv: string) {
  try {
    await Share.share({
      title: filename,
      message: csv,
    });
  } catch {
    Alert.alert("Couldn't export", 'Sharing failed on this device.');
  }
}
