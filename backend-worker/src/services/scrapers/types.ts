// 檔案位置: services/scrapers/types.ts

// 爬蟲傳來的 Movie 物件 (沒有數字 id)
export interface ScraperMovie {
  source_id: string; // "vieshow_8366"
  title: string;
  englishTitle: string;
  posterUrl: string;
  synopsis: string;
  director: string;
  actors: string[];
  duration: number;
  rating: string;
  trailerUrl: string;
  releaseDate: string;
  bookingOpen: boolean;
  genres: string[];
}

// 爬蟲傳來的 Theater 物件 (沒有數字 id)
export interface ScraperTheater {
  source_id: string; // "vieshow_1"
  name: string;
  address: string;
  region: string;
  websiteUrl: string;
  location: {
    lat: number;
    lng: number;
  };
}

// 爬蟲傳來的 Showtime 物件 (id, movieId, theaterId 都是字串)
export interface ScraperShowtime {
  source_id: string;
  movieId: string; // Movie source_id (e.g., "vieshow_8366")
  theaterId: string; // Theater source_id (e.g., "vieshow_1")
  bookingUrl: string;
  time: string; // ISO String
  screenType: string; // "General", "IMAX" (讓 worker 處理)
  language: string; // "Chinese", "English" (讓 worker 處理)
  price: number;
}

// 這是 index.ts 真正使用的根 interface
export interface IScraperResult {
  movies: ScraperMovie[];
  theaters: ScraperTheater[];
  showtimes: ScraperShowtime[];
}