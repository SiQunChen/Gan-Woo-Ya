import { ScreenType, ShowtimeLanguage } from '../types';

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

type LanguageLabelVariant = 'short' | 'long';

const LANGUAGE_LABELS: Record<ShowtimeLanguage, Record<LanguageLabelVariant, string>> = {
  English: { short: '英', long: '英文' },
  Chinese: { short: '中', long: '中文' },
  Japanese: { short: '日', long: '日文' },
  Korean: { short: '韓', long: '韓文' },
  Thai: { short: '泰', long: '泰文' },
  German: { short: '德', long: '德文' },
  French: { short: '法', long: '法文' },
  Italian: { short: '義', long: '義大利文' },
  Spanish: { short: '西', long: '西班牙文' },
  Portuguese: { short: '葡', long: '葡萄牙文' },
  Russian: { short: '俄', long: '俄文' },
  Vietnamese: { short: '越', long: '越南文' },
  Hindi: { short: '印', long: '印地文' },
  Cantonese: { short: '粵', long: '粵語' },
  Taiwanese: { short: '台', long: '台語' },
  Hakka: { short: '客', long: '客語' },
  Multiple: { short: '多', long: '多元語' },
  Mandarin: { short: '國', long: '國語' },
};

const SCREEN_TYPE_LABELS: Record<ScreenType, string> = {
  General: '數位',
  '3D': '3D',
  GC: 'GC',
  IMAX: 'IMAX',
  '4DX': '4DX',
  TITAN: 'TITAN',
  Dolby: 'Dolby Atmos',
  'Dolby Cinema': 'Dolby Cinema',
  MUCROWN: 'MU Crown',
};

export const getLanguageLabel = (
  language: ShowtimeLanguage | string,
  variant: LanguageLabelVariant = 'long',
): string => {
  if (!language) {
    return variant === 'short' ? '--' : '未知語言';
  }
  const normalized = String(language) as ShowtimeLanguage;
  const entry = LANGUAGE_LABELS[normalized];
  if (!entry) {
    if (variant === 'short') {
      return language.slice(0, 1).toUpperCase();
    }
    return language;
  }
  return entry[variant];
};

export const getScreenTypeLabel = (screenType: ScreenType | string): string => {
  if (!screenType) {
    return '一般廳';
  }
  return SCREEN_TYPE_LABELS[screenType as ScreenType] ?? screenType;
};
