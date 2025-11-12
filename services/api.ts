import { Movie, Theater, Showtime, Review, MovieBuddyEvent } from '../types';

// TODO: 請將此變數替換為您部署後的 Cloudflare Worker URL
// 例如: 'https://gan-woo-ya-api.your-username.workers.dev'
const API_BASE_URL = 'http://localhost:8787/api'; 

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

const transformTheater = (dbTheater: any): Theater => ({
    ...dbTheater,
    location: { lat: dbTheater.lat, lng: dbTheater.lng },
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
    // 這是 Worker 已經實作的路由範例
    return await fetchApi<Showtime[]>(`/showtimes/movie/${movieId}`);
};

export const getShowtimesByTheaterId = async (theaterId: string): Promise<Showtime[]> => {
    // 範例：呼叫 Worker 實作的路由
    return await fetchApi<Showtime[]>(`/showtimes/theater/${theaterId}`);
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
    return fetchApi<Review[]>(`/reviews/movie/${movieId}`);
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
    return fetchApi<MovieBuddyEvent[]>(`/movie-buddy-events/movie/${movieId}`);
};

export const getMovieBuddyEventById = async (eventId: string): Promise<MovieBuddyEvent | undefined> => {
    const event = await fetchApi<MovieBuddyEvent | null>(`/movie-buddy-events/${eventId}`);
    return event ?? undefined;
};

export const getMovieBuddyEventsByIds = async (eventIds: string[]): Promise<MovieBuddyEvent[]> => {
    if (eventIds.length === 0) {
        return [];
    }
    const uniqueIds = Array.from(new Set(eventIds));
    return fetchApi<MovieBuddyEvent[]>(`/movie-buddy-events?ids=${uniqueIds.join(',')}`);
};

export const createMovieBuddyEvent = async (eventData: Omit<MovieBuddyEvent, 'id' | 'participants' | 'status' | 'createdAt'>): Promise<MovieBuddyEvent> => {
    return fetchApi<MovieBuddyEvent>(
        `/movie-buddy-events`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(eventData),
        },
    );
};