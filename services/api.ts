import { Movie, Theater, Showtime, Review, MovieBuddyEvent } from '../types';

const DEFAULT_API_BASE_URL = 'http://localhost:8787/api';
const RAW_API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL;
const API_BASE_URL = normalizeApiBaseUrl(RAW_API_BASE_URL);

function normalizeApiBaseUrl(url: string): string {
    const trimmed = url.trim();
    if (!trimmed) {
        return DEFAULT_API_BASE_URL;
    }

    try {
        const parsed = new URL(trimmed);
        if (parsed.pathname === '' || parsed.pathname === '/') {
            parsed.pathname = '/api';
        }
        // 移除結尾的斜線，避免重複 //
        return parsed.toString().replace(/\/$/, '');
    } catch {
        const withoutTrailingSlash = trimmed.replace(/\/$/, '');
        if (withoutTrailingSlash.endsWith('/api')) {
            return withoutTrailingSlash;
        }
        return `${withoutTrailingSlash}/api`;
    }
}

const FAKE_DELAY = 100; // 模擬延遲，用於本地開發測試

// --- Helper Functions to fetch and parse JSON ---
async function fetchApi<T>(path: string, options?: RequestInit): Promise<T> {
    const url = `${API_BASE_URL}${path}`;
    try {
        const response = await fetch(url, options);
        if (!response.ok) {
            throw new Error(`API call failed: ${response.statusText}`);
        }
        // 模擬延遲，讓使用者感受載入狀態
        await new Promise(res => setTimeout(res, FAKE_DELAY));
        return (await response.json()) as T;
    } catch (error) {
        console.error(`Error fetching ${path}:`, error);
        // 這裡可以選擇拋出錯誤或返回空資料
        throw error;
    }
}

// --- 介面轉換：從 DB 格式轉為前端格式 ---
// 由於 D1/SQL 會將陣列 (actors, genres) 儲存為字串，需要轉換回來
const transformMovie = (dbMovie: any): Movie => ({
    ...dbMovie,
    actors: dbMovie.actors ? dbMovie.actors.split(',') : [],
    genres: dbMovie.genres ? dbMovie.genres.split(',') : [],
    bookingOpen: dbMovie.bookingOpen === 1,
});

const REGION_CITY_MAP: Record<string, string[]> = {
    '北部': ['台北市', '臺北市', '新北市', '基隆市', '桃園市', '新竹市', '新竹縣', '宜蘭縣'],
    '中部': ['台中市', '臺中市', '彰化縣', '南投縣', '雲林縣', '苗栗縣'],
    '南部': ['台南市', '臺南市', '高雄市', '嘉義市', '嘉義縣', '屏東縣'],
    '東部': ['花蓮縣', '台東縣', '臺東縣'],
    '離島': ['澎湖縣', '金門縣', '連江縣', '馬祖縣'],
};

function mapCityToRegion(city?: string | null): string {
    if (!city) {
        return '北部';
    }
    const normalized = city.replace(/臺/g, '台').trim();
    for (const [region, cities] of Object.entries(REGION_CITY_MAP)) {
        if (cities.includes(normalized)) {
            return region;
        }
    }
    return '北部';
}

const transformTheater = (dbTheater: any): Theater => {
    const city = dbTheater.region ?? '';
    return {
        ...dbTheater,
        city,
        region: mapCityToRegion(city),
        location: { lat: dbTheater.lat, lng: dbTheater.lng },
    };
};

const transformShowtime = (row: any): Showtime => {
    const id = row?.id ?? row?.source_id ?? row?.showtimeId;
    const movieId = row?.movieId ?? row?.movieSourceId;
    const theaterId = row?.theaterId ?? row?.theaterSourceId;
    if (!id || !movieId || !theaterId) {
        throw new Error('Invalid showtime payload: missing id/movieId/theaterId');
    }
    return {
        id: String(id),
        movieId: String(movieId),
        theaterId: String(theaterId),
        bookingUrl: row.bookingUrl ?? row.showtimeBookingUrl ?? '',
        time: row.time ?? row.showtimeTime ?? '',
        screenType: row.screenType ?? row.showtimeScreenType ?? 'General',
        language: row.language ?? row.showtimeLanguage ?? 'Chinese',
        price: Number(row.price ?? row.showtimePrice ?? 0),
    };
};

const transformEvent = (event: any): MovieBuddyEvent => ({
    ...event,
    movieId: String(event.movieId ?? event.movieSourceId ?? ''),
    theaterId: String(event.theaterId ?? event.theaterSourceId ?? ''),
    showtime: transformShowtime(event.showtime ?? {
        id: event.showtimeId,
        movieId: event.movieSourceId ?? event.movieId,
        theaterId: event.theaterSourceId ?? event.theaterId,
        bookingUrl: event.showtimeBookingUrl,
        time: event.showtimeTime,
        screenType: event.showtimeScreenType,
        language: event.showtimeLanguage,
        price: event.showtimePrice,
    }),
    participants: event.participants ?? [],
});

// --- API 函數實作 (改為呼叫 Worker) ---

export const getAllMovies = async (): Promise<Movie[]> => {
    const dbMovies = await fetchApi<any[]>('/movies');
    return dbMovies.map(transformMovie);
};

export const search = async (query: string): Promise<{ movies: Movie[], theaters: Theater[] }> => {
    // 注意：Worker 端需要實作 search 路由
    const result = await fetchApi<{ movies: any[], theaters: any[] }>(`/search?q=${encodeURIComponent(query)}`);
    return {
        movies: result.movies.map(transformMovie),
        theaters: result.theaters.map(transformTheater),
    };
};

export const getMovieById = async (id: string): Promise<Movie | undefined> => {
    const dbMovie = await fetchApi<any>(`/movie/${id}`);
    return dbMovie ? transformMovie(dbMovie) : undefined;
};

export const getTheaterById = async (id: string): Promise<Theater | undefined> => {
    const dbTheater = await fetchApi<any>(`/theater/${id}`);
    return dbTheater ? transformTheater(dbTheater) : undefined;
};

export const getShowtimesByMovieId = async (movieId: string): Promise<Showtime[]> => {
    const dbShowtimes = await fetchApi<any[]>(`/showtimes/movie/${movieId}`);
    return dbShowtimes.map(transformShowtime);
};

export const getShowtimesByTheaterId = async (theaterId: string): Promise<Showtime[]> => {
    const dbShowtimes = await fetchApi<any[]>(`/showtimes/theater/${theaterId}`);
    return dbShowtimes.map(transformShowtime);
};

export const getAllTheaters = async (): Promise<Theater[]> => {
    const dbTheaters = await fetchApi<any[]>('/theaters');
    return dbTheaters.map(transformTheater);
};

export const getMoviesByIds = async (ids: string[]): Promise<Movie[]> => {
    const dbMovies = await fetchApi<any[]>(`/movies/batch?ids=${ids.join(',')}`);
    return dbMovies.map(transformMovie);
};

export const getTheatersByIds = async (ids: string[]): Promise<Theater[]> => {
    const dbTheaters = await fetchApi<any[]>(`/theaters/batch?ids=${ids.join(',')}`);
    return dbTheaters.map(transformTheater);
};

export const getReviewsByMovieId = async (movieId: string): Promise<Review[]> => {
    const reviews = await fetchApi<Review[]>(`/reviews/movie/${movieId}`);
    return reviews.map(review => ({ ...review, movieId }));
};

export const addReview = async (review: Omit<Review, 'id' | 'createdAt'>): Promise<Review> => {
    return fetchApi<Review>(
        `/reviews`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(review),
        },
    );
};

export const getMovieBuddyEventsByMovieId = async (movieId: string): Promise<MovieBuddyEvent[]> => {
    const events = await fetchApi<any[]>(`/movie-buddy-events/movie/${movieId}`);
    return events.map(transformEvent);
};

export const getMovieBuddyEventById = async (eventId: string): Promise<MovieBuddyEvent | undefined> => {
    const event = await fetchApi<any | null>(`/movie-buddy-events/${eventId}`);
    return event ? transformEvent(event) : undefined;
};

export const getMovieBuddyEventsByIds = async (eventIds: string[]): Promise<MovieBuddyEvent[]> => {
    if (eventIds.length === 0) {
        return [];
    }
    const uniqueIds = Array.from(new Set(eventIds));
    const events = await fetchApi<any[]>(`/movie-buddy-events?ids=${uniqueIds.join(',')}`);
    return events.map(transformEvent);
};

export const createMovieBuddyEvent = async (eventData: Omit<MovieBuddyEvent, 'id' | 'participants' | 'status' | 'createdAt'>): Promise<MovieBuddyEvent> => {
    const event = await fetchApi<any>(
        `/movie-buddy-events`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(eventData),
        },
    );
    return transformEvent(event);
};