// Shared date formatting utilities
// Supported output formats: 'DD-MM-YYYY', 'YYYY-MM-DD'
// Accepts inputs: ISO date string (YYYY-MM-DD or full timestamp), Date object, or already formatted.

export function normalizeToDate(value) {
  if (!value) return null;
  if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
  const str = String(value).trim();
  // If already in YYYY-MM-DD form
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    const d = new Date(str + 'T00:00:00');
    return isNaN(d.getTime()) ? null : d;
  }
  // If already in DD-MM-YYYY form
  if (/^\d{2}-\d{2}-\d{4}$/.test(str)) {
    const [dd, mm, yyyy] = str.split('-');
    const d = new Date(`${yyyy}-${mm}-${dd}T00:00:00`);
    return isNaN(d.getTime()) ? null : d;
  }
  // Try general Date parse
  const parsed = new Date(str);
  return isNaN(parsed.getTime()) ? null : parsed;
}

export function formatDate(value, format = 'DD-MM-YYYY') {
  const dt = normalizeToDate(value);
  if (!dt) return '';
  const yyyy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  const dd = String(dt.getDate()).padStart(2, '0');
  if (format === 'YYYY-MM-DD') return `${yyyy}-${mm}-${dd}`;
  return `${dd}-${mm}-${yyyy}`; // default
}

export function formatDateTime(value, format = 'DD-MM-YYYY') {
  const dt = normalizeToDate(value);
  if (!dt) return '';
  const base = formatDate(dt, format);
  const hours = String(dt.getHours()).padStart(2, '0');
  const mins = String(dt.getMinutes()).padStart(2, '0');
  return `${base} • ${hours}:${mins}`;
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function parseUserInput(value) {
  // Accept either supported format and return canonical YYYY-MM-DD string
  const dt = normalizeToDate(value);
  if (!dt) return '';
  const yyyy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  const dd = String(dt.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}
