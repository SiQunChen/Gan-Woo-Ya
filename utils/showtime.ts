const pad = (value: number) => value.toString().padStart(2, '0');

const tryParseDate = (value?: string | null): Date | null => {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  const primary = new Date(trimmed);
  if (!Number.isNaN(primary.getTime())) {
    return primary;
  }

  const normalized = trimmed.replace(' ', 'T');
  const fallback = new Date(normalized);
  if (!Number.isNaN(fallback.getTime())) {
    return fallback;
  }

  const dateMatch = trimmed.match(/\d{4}-\d{2}-\d{2}/);
  return dateMatch ? new Date(`${dateMatch[0]}T00:00:00`) : null;
};

export const parseShowtimeDate = (value: string): Date | null => tryParseDate(value);

export const getDateKey = (value: string): string | null => {
  const date = tryParseDate(value);
  if (!date) return null;
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

export const formatDateLabel = (value: string, locale: string = 'zh-TW'): string => {
  const date = tryParseDate(`${value}T00:00:00`);
  if (!date) {
    return value;
  }
  const weekday = new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(date);
  return `${date.getMonth() + 1}/${date.getDate()} (${weekday})`;
};

export const formatShowtimeTime = (value: string, locale: string = 'zh-TW'): string => {
  if (!value) return '--:--';
  const date = tryParseDate(value);
  if (date) {
    return date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', hour12: false });
  }
  const timeMatch = value.match(/\d{2}:\d{2}/);
  return timeMatch ? timeMatch[0] : value;
};
