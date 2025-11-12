// backend-worker/src/index.ts
import { Movie, Theater, Showtime, Review, MovieBuddyEvent, Participant } from '../../types'; // 假設 types.ts 被複製到 Worker 專案中
import { IScraper, IScraperResult } from './services/scrapers/types'; // 假設你建立了新檔案
import { vieshowScraper } from './services/scrapers/vieshowScraper';

type D1Result<T = unknown> = { results?: T[] };
type D1PreparedStatement = {
    bind: (...values: unknown[]) => D1PreparedStatement;
    first: <T = unknown>() => Promise<T | null>;
    all: <T = unknown>() => Promise<D1Result<T>>;
    run: () => Promise<unknown>;
};

interface D1Database {
    prepare: (query: string) => D1PreparedStatement;
    batch: (statements: D1PreparedStatement[]) => Promise<unknown[]>;
}

interface ExportedHandler<TEnv> {
    fetch: (request: Request, env: TEnv) => Promise<Response>;
    scheduled?: (controller: unknown, env: TEnv) => Promise<void>;
}

// 定義 Worker 的環境變數類型，包含 D1 繫結
export interface Env {
    DB: D1Database;
    API_BASE_URL?: string;
}

const CORS_HEADERS: Record<string, string> = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const jsonResponse = (payload: unknown, status = 200): Response =>
    new Response(JSON.stringify(payload), {
        status,
        headers: { 'Content-Type': 'application/json' },
    });

const ensureSchema = async (db: D1Database) => {
    await db.batch([
        db.prepare(`CREATE TABLE IF NOT EXISTS Movies (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            englishTitle TEXT,
            posterUrl TEXT,
            synopsis TEXT,
            director TEXT,
            actors TEXT,
            duration INTEGER,
            rating TEXT,
            trailerUrl TEXT,
            releaseDate TEXT,
            bookingOpen INTEGER DEFAULT 0,
            genres TEXT
        )`),
        db.prepare(`CREATE TABLE IF NOT EXISTS Theaters (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            address TEXT,
            region TEXT,
            bookingUrl TEXT,
            lat REAL,
            lng REAL
        )`),
        db.prepare(`CREATE TABLE IF NOT EXISTS Showtimes (
            id TEXT PRIMARY KEY,
            movieId TEXT NOT NULL,
            theaterId TEXT NOT NULL,
            time TEXT NOT NULL,
            screenType TEXT NOT NULL,
            language TEXT NOT NULL,
            price REAL NOT NULL
        )`),
        db.prepare(`CREATE TABLE IF NOT EXISTS Reviews (
            id TEXT PRIMARY KEY,
            movieId TEXT NOT NULL,
            userId TEXT NOT NULL,
            username TEXT NOT NULL,
            rating INTEGER NOT NULL,
            comment TEXT NOT NULL,
            createdAt TEXT NOT NULL
        )`),
        db.prepare(`CREATE TABLE IF NOT EXISTS MovieBuddyEvents (
            id TEXT PRIMARY KEY,
            movieId TEXT NOT NULL,
            theaterId TEXT NOT NULL,
            showtimeId TEXT NOT NULL,
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            maxParticipants INTEGER NOT NULL,
            status TEXT NOT NULL,
            createdAt TEXT NOT NULL,
            organizerUserId TEXT NOT NULL,
            organizerUsername TEXT NOT NULL,
            organizerAvatarUrl TEXT,
            organizerViewingHabitTags TEXT,
            organizerTrustScore REAL
        )`),
        db.prepare(`CREATE TABLE IF NOT EXISTS EventParticipants (
            eventId TEXT NOT NULL,
            userId TEXT NOT NULL,
            username TEXT NOT NULL,
            avatarUrl TEXT,
            PRIMARY KEY (eventId, userId)
        )`),
    ]);
};

const getUniqueIdsFromParams = (params: URLSearchParams, key: string): string[] => {
    const raw = params.get(key);
    if (!raw) {
        return [];
    }
    const ids = raw
        .split(',')
        .map(id => id.trim())
        .filter(Boolean);
    return Array.from(new Set(ids));
};

const fetchEvents = async (db: D1Database, whereClause: string, bindings: unknown[]): Promise<MovieBuddyEvent[]> => {
    const query = `
        SELECT
            e.id,
            e.movieId,
            e.theaterId,
            e.showtimeId,
            e.title,
            e.description,
            e.maxParticipants,
            e.status,
            e.createdAt,
            e.organizerUserId,
            e.organizerUsername,
            e.organizerAvatarUrl,
            e.organizerViewingHabitTags,
            e.organizerTrustScore,
            s.movieId AS showtimeMovieId,
            s.theaterId AS showtimeTheaterId,
            s.time AS showtimeTime,
            s.screenType AS showtimeScreenType,
            s.language AS showtimeLanguage,
            s.price AS showtimePrice
        FROM MovieBuddyEvents e
        JOIN Showtimes s ON e.showtimeId = s.id
        ${whereClause}
        ORDER BY e.createdAt DESC
    `;

    const { results } = await db.prepare(query).bind(...bindings).all();
    if (!results || results.length === 0) {
        return [];
    }

    const eventIds = results.map((row: any) => row.id);
    const placeholders = eventIds.map(() => '?').join(',');
    const participantMap = new Map<string, Participant[]>();

    if (eventIds.length > 0) {
        const { results: participantRows } = await db
            .prepare(`SELECT eventId, userId, username, avatarUrl FROM EventParticipants WHERE eventId IN (${placeholders}) ORDER BY rowid`)
            .bind(...eventIds)
            .all();

        for (const row of participantRows as any[]) {
            const list = participantMap.get(row.eventId) ?? [];
            list.push({
                userId: row.userId,
                username: row.username,
                avatarUrl: row.avatarUrl ?? undefined,
            });
            participantMap.set(row.eventId, list);
        }
    }

    return (results as any[]).map(row => ({
        id: row.id,
        movieId: row.movieId,
        theaterId: row.theaterId,
        showtime: {
            id: row.showtimeId,
            movieId: row.showtimeMovieId,
            theaterId: row.showtimeTheaterId,
            time: row.showtimeTime,
            screenType: row.showtimeScreenType,
            language: row.showtimeLanguage,
            price: row.showtimePrice,
        },
        organizer: {
            userId: row.organizerUserId,
            username: row.organizerUsername,
            avatarUrl: row.organizerAvatarUrl ?? undefined,
            viewingHabitTags: row.organizerViewingHabitTags ? JSON.parse(row.organizerViewingHabitTags) : [],
            trustScore: row.organizerTrustScore !== null && row.organizerTrustScore !== undefined ? Number(row.organizerTrustScore) : 0,
        },
        title: row.title,
        description: row.description,
        maxParticipants: row.maxParticipants,
        participants: participantMap.get(row.id) ?? [],
        status: row.status,
        createdAt: row.createdAt,
    }));
};

// 實際的爬蟲函數 (已更新)
async function runScraper(db: D1Database) {
    console.log('Starting scheduled scraper orchestration...');
 
    await ensureSchema(db);
 
    // --- 1. 註冊所有要執行的爬蟲 ---
    const allScrapers: IScraper[] = [
        vieshowScraper,
        // ambassadorScraper, // 未來加入
        // shinKongScraper, // 未來加入
    ];
 
    // --- 2. 平行執行所有爬蟲 ---
    // 使用 Promise.allSettled 確保即使有爬蟲失敗，也不會中斷其他爬蟲
    const results = await Promise.allSettled(
        allScrapers.map(scraper => scraper.scrape())
    );
 
    const allMovies = new Map<string, Movie>();
    const allTheaters = new Map<string, Theater>();
    const allShowtimes: Showtime[] = [];
 
    console.log('Aggregating results...');
 
    // --- 3. 彙整並去除重複資料 ---
    for (const result of results) {
        if (result.status === 'fulfilled') {
            const data: IScraperResult = result.value;
            
            // 使用 Map，以 ID (或 title) 為 key 來去除重複的電影
            data.movies.forEach(movie => {
                if (!allMovies.has(movie.id)) { // 假設 ID 是可靠的
                    allMovies.set(movie.id, movie);
                }
            });
            
            // 使用 Map，以 ID (或 name) 為 key 來去除重複的影城
            data.theaters.forEach(theater => {
                if (!allTheaters.has(theater.id)) { // 假設 ID 是可靠的
                    allTheaters.set(theater.id, theater);
                }
            });
 
            // 場次通常不會重複 (因為是 DELETE -> INSERT)，直接加入
            allShowtimes.push(...data.showtimes);
        } else {
            console.error('A scraper failed:', result.reason);
        }
    }
 
    const finalMovies = Array.from(allMovies.values());
    const finalTheaters = Array.from(allTheaters.values());
 
    // --- 4. 寫入資料庫 (D1) ---
    try {
        // 場次：先刪除舊資料，再寫入新資料
        await db.prepare('DELETE FROM Showtimes').run();
 
        // 影城：寫入 (如果 ID 已存在則忽略)
        const theaterBatch = finalTheaters.map(t =>
            db
                .prepare('INSERT OR IGNORE INTO Theaters (id, name, address, region, bookingUrl, lat, lng) VALUES (?, ?, ?, ?, ?, ?, ?)')
                .bind(t.id, t.name, t.address, t.region, t.bookingUrl, t.location.lat, t.location.lng)
        );
        if (theaterBatch.length > 0) await db.batch(theaterBatch);
 
        // 電影：寫入 (如果 ID 已存在則取代)
        const movieBatch = finalMovies.map(m =>
            db
                .prepare(
                    'INSERT OR REPLACE INTO Movies (id, title, englishTitle, posterUrl, synopsis, director, actors, duration, rating, trailerUrl, releaseDate, bookingOpen, genres) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                )
                .bind(
                    m.id, m.title, m.englishTitle, m.posterUrl, m.synopsis,
                    m.director, m.actors.join(','), m.duration, m.rating,
                    m.trailerUrl, m.releaseDate, m.bookingOpen ? 1 : 0, m.genres.join(',')
                )
        );
        if (movieBatch.length > 0) await db.batch(movieBatch);
 
        // 場次：寫入新的
        const showtimeBatch = allShowtimes.map(s =>
            db
                .prepare('INSERT INTO Showtimes (id, movieId, theaterId, time, screenType, language, price) VALUES (?, ?, ?, ?, ?, ?, ?)')
                .bind(s.id, s.movieId, s.theaterId, s.time, s.screenType, s.language, s.price),
        );
        if (showtimeBatch.length > 0) {
            await db.batch(showtimeBatch);
        }
 
        console.log(`Scrape successful. Unique Movies: ${finalMovies.length}, Unique Theaters: ${finalTheaters.length}, Total Showtimes: ${allShowtimes.length}`);
    } catch (e) {
        console.error('D1 write failed:', e);
    }
}

// --- Worker 核心處理器 ---

const router = async (request: Request, env: Env): Promise<Response> => {
    await ensureSchema(env.DB);

    const url = new URL(request.url);
    const { pathname, searchParams } = url;
    const method = request.method.toUpperCase();
    const segments = pathname.split('/').filter(Boolean);

    try {
        if (segments[0] !== 'api') {
            return new Response('API Not Found', { status: 404 });
        }

        if (method === 'GET' && pathname === '/api/movies') {
            const { results } = await env.DB.prepare('SELECT * FROM Movies ORDER BY releaseDate ASC').all();
            return jsonResponse(results ?? []);
        }

        if (method === 'GET' && segments[1] === 'movie' && segments.length === 3) {
            const movieId = segments[2];
            const row = await env.DB.prepare('SELECT * FROM Movies WHERE id = ? LIMIT 1').bind(movieId).first();
            return jsonResponse(row ?? null);
        }

        if (method === 'GET' && pathname === '/api/theaters') {
            const { results } = await env.DB.prepare('SELECT * FROM Theaters ORDER BY name ASC').all();
            return jsonResponse(results ?? []);
        }

        if (method === 'GET' && segments[1] === 'theater' && segments.length === 3) {
            const theaterId = segments[2];
            const row = await env.DB.prepare('SELECT * FROM Theaters WHERE id = ? LIMIT 1').bind(theaterId).first<any>();
            return jsonResponse(row ?? null);
        }

        if (method === 'GET' && segments[1] === 'showtimes' && segments[2] === 'movie' && segments.length === 4) {
            const movieId = segments[3];
            const { results } = await env.DB.prepare('SELECT * FROM Showtimes WHERE movieId = ? ORDER BY time ASC').bind(movieId).all();
            return jsonResponse(results ?? []);
        }

        if (method === 'GET' && segments[1] === 'showtimes' && segments[2] === 'theater' && segments.length === 4) {
            const theaterId = segments[3];
            const { results } = await env.DB.prepare('SELECT * FROM Showtimes WHERE theaterId = ? ORDER BY time ASC').bind(theaterId).all();
            return jsonResponse(results ?? []);
        }

        if (method === 'GET' && pathname === '/api/movies/batch') {
            const ids = getUniqueIdsFromParams(searchParams, 'ids');
            if (ids.length === 0) {
                return jsonResponse([]);
            }
            const placeholders = ids.map(() => '?').join(',');
            const { results } = await env.DB
                .prepare(`SELECT * FROM Movies WHERE id IN (${placeholders})`)
                .bind(...ids)
                .all();
            return jsonResponse(results ?? []);
        }

        if (method === 'GET' && pathname === '/api/theaters/batch') {
            const ids = getUniqueIdsFromParams(searchParams, 'ids');
            if (ids.length === 0) {
                return jsonResponse([]);
            }
            const placeholders = ids.map(() => '?').join(',');
            const { results } = await env.DB
                .prepare(`SELECT * FROM Theaters WHERE id IN (${placeholders})`)
                .bind(...ids)
                .all();
            return jsonResponse(results ?? []);
        }

        if (method === 'GET' && pathname === '/api/search') {
            const query = searchParams.get('q')?.trim();
            if (!query) {
                return jsonResponse({ movies: [], theaters: [] });
            }
            const likeValue = `%${query}%`;
            const { results: movieRows } = await env.DB
                .prepare('SELECT * FROM Movies WHERE title LIKE ? OR englishTitle LIKE ? ORDER BY releaseDate ASC')
                .bind(likeValue, likeValue)
                .all();
            const { results: theaterRows } = await env.DB
                .prepare('SELECT * FROM Theaters WHERE name LIKE ? ORDER BY name ASC')
                .bind(likeValue)
                .all();
            return jsonResponse({ movies: movieRows ?? [], theaters: theaterRows ?? [] });
        }

        if (method === 'GET' && segments[1] === 'reviews' && segments[2] === 'movie' && segments.length === 4) {
            const movieId = segments[3];
            const { results } = await env.DB
                .prepare('SELECT * FROM Reviews WHERE movieId = ? ORDER BY datetime(createdAt) DESC')
                .bind(movieId)
                .all();
            return jsonResponse(results ?? []);
        }

        if (method === 'POST' && pathname === '/api/reviews') {
            const body = (await request.json()) as Omit<Review, 'id' | 'createdAt'>;

            if (!body.movieId || !body.userId || !body.username || typeof body.rating !== 'number' || !body.comment) {
                return jsonResponse({ error: 'Invalid review payload' }, 400);
            }

            const review: Review = {
                ...body,
                id: crypto.randomUUID(),
                createdAt: new Date().toISOString(),
            };

            await env.DB
                .prepare(
                    'INSERT INTO Reviews (id, movieId, userId, username, rating, comment, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
                )
                .bind(
                    review.id,
                    review.movieId,
                    review.userId,
                    review.username,
                    review.rating,
                    review.comment,
                    review.createdAt,
                )
                .run();

            return jsonResponse(review, 201);
        }

        if (method === 'GET' && segments[1] === 'movie-buddy-events' && segments[2] === 'movie' && segments.length === 4) {
            const movieId = segments[3];
            const events = await fetchEvents(env.DB, 'WHERE e.movieId = ?', [movieId]);
            return jsonResponse(events);
        }

        if (method === 'GET' && segments[1] === 'movie-buddy-events' && segments.length === 2) {
            const ids = getUniqueIdsFromParams(searchParams, 'ids');
            if (ids.length === 0) {
                return jsonResponse([]);
            }
            const placeholders = ids.map(() => '?').join(',');
            const events = await fetchEvents(env.DB, `WHERE e.id IN (${placeholders})`, ids);
            return jsonResponse(events);
        }

        if (method === 'GET' && segments[1] === 'movie-buddy-events' && segments.length === 3) {
            const eventId = segments[2];
            const events = await fetchEvents(env.DB, 'WHERE e.id = ?', [eventId]);
            return jsonResponse(events.length > 0 ? events[0] : null);
        }

        if (method === 'POST' && pathname === '/api/movie-buddy-events') {
            const body = await request.json();

            const {
                movieId,
                theaterId,
                showtime,
                organizer,
                title,
                description,
                maxParticipants,
            } = body as Omit<MovieBuddyEvent, 'id' | 'participants' | 'status' | 'createdAt'>;

            if (!movieId || !theaterId || !showtime?.id || !organizer?.userId || !title || !description || !maxParticipants) {
                return jsonResponse({ error: 'Invalid event payload' }, 400);
            }

            const eventId = crypto.randomUUID();
            const createdAt = new Date().toISOString();
            const status: MovieBuddyEvent['status'] = 'open';
            const organizerTags = JSON.stringify(organizer.viewingHabitTags ?? []);

            await env.DB.batch([
                env.DB
                    .prepare(
                        'INSERT INTO MovieBuddyEvents (id, movieId, theaterId, showtimeId, title, description, maxParticipants, status, createdAt, organizerUserId, organizerUsername, organizerAvatarUrl, organizerViewingHabitTags, organizerTrustScore) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                    )
                    .bind(
                        eventId,
                        movieId,
                        theaterId,
                        showtime.id,
                        title,
                        description,
                        maxParticipants,
                        status,
                        createdAt,
                        organizer.userId,
                        organizer.username,
                        organizer.avatarUrl ?? null,
                        organizerTags,
                        organizer.trustScore ?? null,
                    ),
                env.DB
                    .prepare('INSERT INTO EventParticipants (eventId, userId, username, avatarUrl) VALUES (?, ?, ?, ?)')
                    .bind(eventId, organizer.userId, organizer.username, organizer.avatarUrl ?? null),
            ]);

            const [createdEvent] = await fetchEvents(env.DB, 'WHERE e.id = ?', [eventId]);
            return jsonResponse(createdEvent, 201);
        }

        if (method === 'POST' && pathname === '/api/admin/seed') {
            await runScraper(env.DB);
            return jsonResponse({ ok: true });
        }

        if (method === 'POST' && pathname === '/api/admin/clear') {
            console.log('Clearing all database tables...');
            try {
                // 我們使用 batch 批次刪除所有表格的內容
                await env.DB.batch([
                    env.DB.prepare('DELETE FROM Movies'),
                    env.DB.prepare('DELETE FROM Theaters'),
                    env.DB.prepare('DELETE FROM Showtimes'),
                    env.DB.prepare('DELETE FROM Reviews'),
                    env.DB.prepare('DELETE FROM MovieBuddyEvents'),
                    env.DB.prepare('DELETE FROM EventParticipants'),
                ]);
                console.log('Database cleared.');
                return jsonResponse({ ok: true, message: 'All tables cleared.' });
            } catch (e: any) {
                console.error('Failed to clear database:', e);
                return jsonResponse({ error: e.message }, 500);
            }
        }

        return new Response('API Not Found', { status: 404 });
    } catch (e: any) {
        console.error('Worker error:', e);
        return jsonResponse({ error: e.message ?? 'Internal Server Error' }, 500);
    }
};

const worker: ExportedHandler<Env> = {
    fetch: async (request, env) => {
        if (request.method.toUpperCase() === 'OPTIONS') {
            return new Response(null, { headers: CORS_HEADERS });
        }

        const response = await router(request, env);
        Object.entries(CORS_HEADERS).forEach(([key, value]) => response.headers.set(key, value));
        return response;
    },
    scheduled: async (_event, env) => {
        await runScraper(env.DB);
    },
};

export default worker;