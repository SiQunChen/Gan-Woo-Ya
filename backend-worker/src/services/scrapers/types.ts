// 在 types.ts (或 services/scrapers/types.ts) 中
import { Movie, Theater, Showtime } from '../../../../types'; // 沿用你現有的
 
// 定義爬蟲成功時應回傳的資料包
export interface IScraperResult {
    movies: Movie[];
    theaters: Theater[];
    showtimes: Showtime[];
}
 
// 定義一個「爬蟲」必須具備的能力
export interface IScraper {
    /**
     * 爬蟲的唯一名稱 (例如 'Vieshow', 'Ambassador')
     */
    name: string;
 
    /**
     * 執行爬蟲，抓取電影、影城和場次資料
     */
    scrape: () => Promise<IScraperResult>;
}