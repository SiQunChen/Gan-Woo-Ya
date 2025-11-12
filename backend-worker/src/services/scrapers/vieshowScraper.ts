// backend-worker/src/services/scrapers/vieshowScraper.ts
import { Movie, Theater, Showtime } from '../../../../types';
import { IScraper, IScraperResult } from './types';
 
// Vieshow 網站的基礎 URL
const BASE_URL = 'https://www.vscinemas.com.tw';
// 電影列表頁面
const NOW_SHOWING_URL = `${BASE_URL}/film/index.aspx`;
const COMING_SOON_URL = `${BASE_URL}/film/coming.aspx`;
 
/**
 * 建立一個共用的 fetch 輔助函式
 * 這會自動加入 User-Agent 並在失敗時提供詳細日誌
 */
const fetchWithHeaders = async (url: string): Promise<string> => {
    // 偽裝成一個常見的 Chrome 瀏覽器 User-Agent
    const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7',
    };

    console.log(`Fetching with headers: ${url}`);
    const response = await fetch(url, { headers });

    // 🚩 關鍵的診斷步驟 🚩
    // 檢查回應是否成功 (狀態碼 200-299)
    if (!response.ok) {
        console.error(`Failed to fetch ${url}. Status: ${response.status} ${response.statusText}`);
        
        // 讀取前 500 個字元的回應內容
        const text = await response.text();
        const snippet = text.substring(0, 500);
        
        console.error(`Response snippet: ${snippet}`);
        
        // 拋出錯誤，中斷後續的解析
        throw new Error(`Request failed for ${url} with status ${response.status}. Snippet: ${snippet}`);
    }

    // 如果成功，回傳 HTML 文字
    return response.text();
};
 
/**
 * 擷取兩個標記之間的字串
 */
const extractBetween = (content: string, start: string, end: string): string => {
    const match = content.match(new RegExp(start + '(.*?)' + end, 's'));
    return match ? match[1].trim() : '';
};
 
/**
 * 擷取所有符合正規表示式的內容
 */
const extractAll = (content: string, regex: RegExp): string[] => {
    const matches = [];
    let match;
    while ((match = regex.exec(content)) !== null) {
        matches.push(match[1].trim());
    }
    return matches;
};
 
/**
 * 將 "1 時 40 分" 這樣的字串轉換為分鐘數 (100)
 */
const parseDuration = (text: string): number => {
    let minutes = 0;
    const hourMatch = text.match(/(\d+)\s*時/);
    const minMatch = text.match(/(\d+)\s*分/);
    if (hourMatch) {
        minutes += parseInt(hourMatch[1], 10) * 60;
    }
    if (minMatch) {
        minutes += parseInt(minMatch[1], 10);
    }
    return minutes;
};
 
/**
 * 將 "2025 年 11 月 10 日 星期一" 和 "10:30" 轉換為 ISO 8601 日期字串
 */
const parseDateTime = (dateText: string, timeText: string): string => {
    // 移除 "星期一" 等文字
    const datePart = dateText.split(' ')[0]; 
    const [year, month, day] = datePart.match(/\d+/g) ?? [];
    
    if (!year || !month || !day) {
        return new Date().toISOString(); // 回傳一個無效日期，但格式正確
    }
 
    const [hour, minute] = timeText.split(':');
    
    // 建立日期物件 (月份要 -1)
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute));
    
    // 轉換為台灣時區 (UTC+8) 的 ISO 字串
    // 範例: 2025-11-10T10:30:00+08:00
    // D1/SQLite 更喜歡 UTC，所以我們先轉成 UTC
    const utcDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
    return utcDate.toISOString().split('.')[0] + 'Z'; // 轉為 UTC 格式: 2025-11-10T02:30:00Z
};

/**
 * 將爬蟲抓到的版本字串 映射到 Showtime['screenType'] 型別
 */
const mapScreenType = (scrapedType: string): Showtime['screenType'] => {
    const lowerType = scrapedType.toLowerCase();
    
    if (lowerType.includes('imax')) return 'IMAX';
    if (lowerType.includes('4dx')) return '4DX';
    if (lowerType.includes('titan')) return 'TITAN';
    if (lowerType.includes('dolby')) return 'Dolby Cinema';
    
    // 威秀的 "數位" (Digital) 對應到我們的 "General" (一般)
    if (lowerType.includes('數位')) return 'General';
    
    return 'General'; // 預設值
};

/**
 * 將爬蟲抓到的語言字串 映射到 Showtime['language'] 型別
 */
const mapLanguage = (scrapedLang: string): Showtime['language'] => {
    // 威秀使用 "日", "英", "國", "粵"
    if (scrapedLang.includes('英')) return 'English';
    if (scrapedLang.includes('日')) return 'Japanese';
    if (scrapedLang.includes('韓')) return 'Korean';
    
    // "國" (國語) 和 "粵" (粵語) 都對應到 "Chinese"
    if (scrapedLang.includes('國') || scrapedLang.includes('粵')) return 'Chinese';

    // 備用檢查 (如果未來格式改變)
    const lowerLang = scrapedLang.toLowerCase();
    if (lowerLang.includes('en')) return 'English';
    if (lowerLang.includes('jp')) return 'Japanese';
    if (lowerLang.includes('kr')) return 'Korean';
    
    return 'Chinese'; // 預設值
};
 
/**
 * 威秀影城 (Vieshow) 爬蟲
 */
class VieshowScraper implements IScraper {
    public name = 'Vieshow';
 
    /**
     * 主執行函式
     */
    public async scrape(): Promise<IScraperResult> {
        console.log(`Starting scrape for ${this.name}...`);
 
        try {
            // --- 步驟 1: 取得所有電影 ID ---
            // 我們平行抓取 "熱售中" 和 "即將上映" 兩個頁面
            const [nowShowingHtml, comingSoonHtml] = await Promise.all([
                fetchWithHeaders(NOW_SHOWING_URL),
                fetchWithHeaders(COMING_SOON_URL),
            ]);
 
            // 從兩個頁面的 HTML 中解析出所有 ID
            const ids1 = this.parseMovieIdsFromList(nowShowingHtml);
            const ids2 = this.parseMovieIdsFromList(comingSoonHtml);
            
            // 合併並去除重複
            const allMovieIds = Array.from(new Set([...ids1, ...ids2]));
            console.log(`Found ${allMovieIds.length} unique movie IDs.`);
 
            // --- 步驟 2: 取得所有影城資料 ---
            // 這是必要的，因為電影詳情頁只有 "影城名稱" 和 "ID"，
            // 我們需要一個地方 (例如影城列表頁) 來取得 "地址"、"經緯度" 等完整資訊。
            // 我們先建立一個 Map，key 為影城 ID (例如 "23")。
            const theatersMap = await this.fetchTheaters();
            console.log(`Found ${theatersMap.size} theaters.`);
 
 
            // --- 步驟 3: 迭代抓取每部電影的詳細資料和場次 ---
            const allMovies: Movie[] = [];
            const allShowtimes: Showtime[] = [];
 
            // 為了加快速度，我們可以分批 (batch) 平行處理
            const batchSize = 5;
            for (let i = 0; i < allMovieIds.length; i += batchSize) {
                const batchIds = allMovieIds.slice(i, i + batchSize);
                
                const results = await Promise.allSettled(
                    batchIds.map(id => this.fetchMovieDetailsAndShowtimes(id, theatersMap))
                );
 
                results.forEach(result => {
                    if (result.status === 'fulfilled' && result.value) {
                        allMovies.push(result.value.movie);
                        allShowtimes.push(...result.value.showtimes);
                    } else if (result.status === 'rejected') {
                        console.error(`Failed to fetch details for one movie:`, result.reason);
                    }
                });
            }
 
            console.log(`Scrape for ${this.name} finished. Movies: ${allMovies.length}, Showtimes: ${allShowtimes.length}`);
 
            return {
                movies: allMovies,
                theaters: Array.from(theatersMap.values()), // 將 Map 轉回陣列
                showtimes: allShowtimes,
            };
 
        } catch (error) {
            console.error(`Error scraping ${this.name}:`, error);
            return { movies: [], theaters: [], showtimes: [] };
        }
    }
 
    /**
     * 步驟 1: 從 "熱售中" / "即將上映" 頁面解析出電影 ID
     */
    private parseMovieIdsFromList(html: string): string[] {
        // 我們要找的格式是 <a href="/film/detail.aspx?id=8173">
        const regex = /\/detail\.aspx\?id=(\d+)/g;
        return extractAll(html, regex);
    }
 
    /**
     * 步驟 2: 抓取並解析影城列表 (已更新)
     * * 我們採用一個巧妙的方法：
     * 1. 抓取 *任何一個* 影城詳情頁 (例如 id=1)。
     * 2. 該頁面上有一個 <select> 下拉式選單，裡面包含 *所有* 影城的 ID 和名稱。
     * 3. 我們解析這個選單來建立所有影城的抓取任務。
     * 4. 平行抓取所有影城的詳情頁以取得地址等資訊。
     */
    private async fetchTheaters(): Promise<Map<string, Theater>> {
        const theaterMap = new Map<string, Theater>();
        const MAIN_THEATER_PAGE_URL = `${BASE_URL}/theater/detail.aspx?id=1`; // 任何有效的 ID 都可以

        try {
            // 1. 抓取基礎頁面以取得列表
            const listHtml = await fetchWithHeaders(MAIN_THEATER_PAGE_URL);

            // 2. 找出 <select> ... </select> 區塊
            const selectBlock = extractBetween(listHtml, '<select onchange="javascript:if', '</select>');
            
            // 3. 解析所有 <option value="ID">NAME</option>
            const theaterInfos: { id: string, name: string }[] = [];
            // Regex: 抓取 value="(\d+)" 和 >(.*?)<
            const optionRegex = /<option value="(\d+)".*?>(.*?)<\/option>/g;
            let match;

            while ((match = optionRegex.exec(selectBlock)) !== null) {
                const id = match[1];
                const name = match[2].trim();
                // 忽略 "【雙北】" 這樣的標題
                if (id && name && !name.startsWith('【')) {
                    theaterInfos.push({ id, name });
                }
            }

            // 4. 平行抓取所有影城的詳細資料
            const results = await Promise.allSettled(
                theaterInfos.map(info => this.fetchSingleTheaterDetails(info.id, info.name))
            );

            results.forEach(result => {
                if (result.status === 'fulfilled' && result.value) {
                    theaterMap.set(result.value.id, result.value);
                } else if (result.status === 'rejected') {
                    console.error('Failed to fetch a theater detail:', result.reason);
                }
            });

        } catch (error) {
            console.error('Failed to fetch main theater list:', error);
        }
        
        if (theaterMap.size === 0) {
             console.warn("Theater list is empty! Showtimes might not be parsed correctly.");
        }

        return theaterMap;
    }

    /**
     * 輔助函式：抓取並解析「單一」影城的詳細資料
     * (使用 text.html [theater/detail] 作為範本)
     */
    private async fetchSingleTheaterDetails(id: string, name: string): Promise<Theater> {
        const url = `${BASE_URL}/theater/detail.aspx?id=${id}`;
        let address = 'N/A';
        let region = 'N/A';
        
        try {
            const html = await fetchWithHeaders(url);
            
            // 1. 找出 <div class="theaterPosition"> ... </div> 區塊
            const infoSection = extractBetween(html, '<div class="theaterPosition">', '</div>');
            
            // 2. 找出地址: <li class="icon-marker"> ... <p>台北市信義區松壽路20號</p> ... </li>
            const addressRegex = /<li class="icon-marker">[\s\S]*?<p>(.*?)<\/p>/;
            const addressMatch = infoSection.match(addressRegex);

            if (addressMatch && addressMatch[1]) {
                address = addressMatch[1].trim();
                // 從地址中擷取前 3 個字作為 "地區" (例如 "台北市")
                region = address.substring(0, 3);
            }

        } catch (e) {
            console.error(`Failed to parse details for theater ID ${id} (${name})`, e);
        }

        return {
            id: id,
            name: name,
            address: address,
            region: region,
            bookingUrl: url,
            location: { 
                lat: 0, 
                lng: 0 
            } // TODO: 經緯度 (Lat/Lng) 是透過 JavaScript 動態載入的，無法用靜態爬蟲抓取。
        };
    }
 
    /**
     * 步驟 3: 抓取並解析單一電影的詳細資料和場次
     * (使用 text.html 作為範本)
     */
    private async fetchMovieDetailsAndShowtimes(
        movieId: string, 
        theatersMap: Map<string, Theater>
    ): Promise<{ movie: Movie; showtimes: Showtime[] }> {
        
        const url = `${BASE_URL}/film/detail.aspx?id=${movieId}`;
        const html = await fetchWithHeaders(url);
 
        // --- A. 解析 Movie 物件 ---
        
        // 從 <section class="movieInfo"> ... </section> 擷取資訊
        const infoSection = extractBetween(html, '<section class="movieInfo">', '</section>');
        const posterUrl = extractBetween(html, '<figure><img src="(\\.\\.\\/.*?)".*?>', '<\/figure>')
            .replace('../', `${BASE_URL}/`); // ../upload/film/film... -> https://.../upload/film/film...
 
        const trailerUrl = extractBetween(html, '<iframe u="image".*?src="(.*?)"', '><\/iframe>');
 
        // 從 <div class="bbsArticle"> ... </div> 擷取劇情簡介
        const synopsis = extractBetween(html, '<div class="bbsArticle">', '</div>')
            .replace(/<p>|<\/p>|<br>/g, ' ') // 移除 <p> 和 <br> 標籤
            .replace(/<.*?>/g, ' ') // 移除其他 HTML 標籤
            .trim()
            .split('《全台預售情報》')[0] // 去掉預售資訊
            .trim();
 
        const durationText = extractBetween(infoSection, '<td>片長：<\/td>', '<\/td>');
        const actorsText = extractBetween(infoSection, '<td>演員：<\/td>', '<\/p>');
        
        const movie: Movie = {
            id: movieId,
            title: extractBetween(infoSection, '<h1>', '<\/h1>'),
            englishTitle: extractBetween(infoSection, '<h2>', '<\/h2>'),
            posterUrl: posterUrl,
            synopsis: synopsis,
            director: extractBetween(infoSection, '<td>導演：<\/td>', '<\/p>'),
            actors: actorsText.replace('(配音)', '').split('、').map(s => s.trim()),
            duration: parseDuration(durationText),
            rating: extractBetween(infoSection, '<div class="markArea"><span class="', '">'), // 'teenager'
            trailerUrl: trailerUrl,
            releaseDate: extractBetween(infoSection, '<time>上映日期：', '</time>'),
            bookingOpen: true, // 假設此頁面有場次就是開放 booking
            genres: extractBetween(infoSection, '<td>類型：<\/td>', '<\/td>').split('、').map(s => s.trim()),
        };
 
        // --- B. 解析 Showtime 陣列 ---
        const showtimes: Showtime[] = [];
 
        // B1. 建立 "影廳ID組合" (e.g., "1_3_23") 到 "版本/語言/影城名稱" 的對照表
        const versionMap = new Map<string, { version: string, language: string, theaterName: string, theaterId: string }>();
        const versionRegex = /<li(?: class="show")?>([\s\S]*?)<\/li>/g;
        let versionMatch;
 
        // 取得 <div class="movieVersion">...</div> 區塊
        const versionSection = extractBetween(html, '<div class="movieVersion"', '</div>');
 
        // 迭代 "數位 / 日", "TITAN / 日" ...
        while ((versionMatch = versionRegex.exec(versionSection)) !== null) {
            const versionBlock = versionMatch[1];
            // "數位 / 日<span..." -> "數位 / 日"
            const versionLangText = (versionBlock.match(/<a.*?>(.*?)<span/s) ?? ['', ''])[1].trim();
            const [version, language] = versionLangText.split(' / ').map(s => s.trim());
 
            // 迭代此版本下的所有影城
            // <a href="#movieTime1_3_23">MUVIE CINEMAS 台北松仁</a>
            const theaterRegex = /<a href="#(movieTime.*?)">(.*?)<\/a>/g;
            let theaterMatch;
            while ((theaterMatch = theaterRegex.exec(versionBlock)) !== null) {
                const mapKey = theaterMatch[1]; // "movieTime1_3_23"
                const theaterName = theaterMatch[2];
                const theaterId = mapKey.split('_').pop() ?? ''; // "23"
                
                versionMap.set(mapKey, { version, language, theaterName, theaterId });
            }
        }
 
        // B2. 迭代 <div class="movieTime"> ... </div> 區塊
        const showtimeSection = extractBetween(html, '<div class="movieTime">', '<div class="movieVideo">');
        
        // 抓取每一個 <article id="movieTime1_3_23" ...> ... </article>
        const articleRegex = /<article id="(movieTime.*?)"[\s\S]*?<\/article>/g;
        let articleMatch;
 
        while ((articleMatch = articleRegex.exec(showtimeSection)) !== null) {
            const mapKey = articleMatch[1]; // "movieTime1_3_23"
            const articleHtml = articleMatch[0];
 
            const versionInfo = versionMap.get(mapKey);
            if (!versionInfo) continue; // 找不到對應的版本資訊
 
            const theater = theatersMap.get(versionInfo.theaterId);
            if (!theater) continue; // 找不到對應的影城 (可能被 fetchTheaters 漏掉了)
 
            // 抓取此影城的每一個 <div class="movieDay"> ... </div>
            const dayRegex = /<div class="movieDay">[\s\S]*?<\/div>/g;
            let dayMatch;
 
            while ((dayMatch = dayRegex.exec(articleHtml)) !== null) {
                const dayHtml = dayMatch[0];
                
                // <h4>2025 年 11 月 10 日 星期一</h4>
                const dateText = extractBetween(dayHtml, '<h4>', '</h4>');
 
                // 抓取此日期的每一個 <li> ... <a ...>10:30</a> ... </li>
                const timeRegex = /<li class="">[\s\S]*?<\/li>/g;
                let timeMatch;
                
                while ((timeMatch = timeRegex.exec(dayHtml)) !== null) {
                    const liHtml = timeMatch[0];
                    
                    // txtSessionId=145846
                    const sessionIdMatch = liHtml.match(/txtSessionId=(\d+)/);
                    // >10:30</a>
                    const timeTextMatch = liHtml.match(/>(\d{2}:\d{2})<\/a>/);
 
                    if (sessionIdMatch && timeTextMatch) {
                        const showtimeId = sessionIdMatch[1];
                        const timeText = timeTextMatch[1];
                        
                        showtimes.push({
                            id: showtimeId,
                            movieId: movieId,
                            theaterId: theater.id,
                            time: parseDateTime(dateText, timeText),
                            screenType: mapScreenType(versionInfo.version),
                            language: mapLanguage(versionInfo.language),
                            price: 0, // TODO: 價格資訊不在這頁，需要更深的爬蟲
                        });
                    }
                }
            }
        }
 
        return { movie, showtimes };
    }
}
 
// 導出一個 VieshowScraper 的實例
export const vieshowScraper = new VieshowScraper();