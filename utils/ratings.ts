export interface RatingInfo {
	code: string;
	shortLabel: string;
	rule: string;
	badgeClass: string;
}

type RatingCode = 'G' | 'P' | 'PG12' | 'PG15' | 'R' | '?';

const RATING_DETAILS: Record<RatingCode, RatingInfo> = {
	G: {
		code: 'G',
		shortLabel: '普級',
		rule: '一般觀眾皆可觀賞。',
		badgeClass: 'bg-emerald-600 text-white',
	},
	P: {
		code: 'P',
		shortLabel: '護級',
		rule: '未滿 6 歲不得觀賞；6 至未滿 12 歲需父母、師長或成年親友陪同。',
		badgeClass: 'bg-sky-600 text-white',
	},
	PG12: {
		code: 'PG12',
		shortLabel: '輔12',
		rule: '未滿 12 歲不得觀賞。',
		badgeClass: 'bg-amber-500 text-gray-900',
	},
	PG15: {
		code: 'PG15',
		shortLabel: '輔15',
		rule: '未滿 15 歲不得觀賞。',
		badgeClass: 'bg-orange-600 text-white',
	},
	R: {
		code: 'R',
		shortLabel: '限級',
		rule: '未滿 18 歲不得觀賞。',
		badgeClass: 'bg-rose-700 text-white',
	},
	'?': {
		code: '?',
		shortLabel: '待定',
		rule: '片商尚未完成正式分級，實際入場需以文化部最終核定為準。',
		badgeClass: 'bg-slate-600 text-white',
	},
};

const DEFAULT_RATING_INFO: RatingInfo = {
	code: 'NR',
	shortLabel: '未提供',
	rule: '片商或戲院尚未提供分級資料。',
	badgeClass: 'bg-gray-600 text-white',
};

const normalizeRatingCode = (raw?: string | null): RatingCode | null => {
	if (!raw) {
		return null;
	}
	const upper = raw.trim().toUpperCase();
	if (!upper) {
		return null;
	}

	const normalized = upper.replace(/\s|-/g, '');

	if (normalized === '?' || normalized.includes('待')) {
		return '?';
	}
	if (normalized.includes('PG15') || normalized.includes('輔15')) {
		return 'PG15';
	}
	if (normalized.includes('PG12') || normalized.includes('輔12')) {
		return 'PG12';
	}
	if (normalized === 'P' || normalized.includes('保護') || normalized.includes('護')) {
		return 'P';
	}
	if (normalized === 'R' || normalized.includes('限制') || normalized === 'NC17') {
		return 'R';
	}
	if (normalized === 'G' || normalized.includes('普')) {
		return 'G';
	}

	return null;
};

export const getRatingInfo = (rating?: string | null): RatingInfo => {
	const normalized = normalizeRatingCode(rating);
	if (!normalized) {
		return DEFAULT_RATING_INFO;
	}
	return RATING_DETAILS[normalized];
};

export const getRatingBadgeClass = (rating?: string | null): string => {
	return getRatingInfo(rating).badgeClass;
};

