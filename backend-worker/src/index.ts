// backend-worker/src/index.ts
import { Movie, Theater, Showtime, Review, MovieBuddyEvent, Participant } from '../../types';
import { IScraperResult } from './services/scrapers/types';

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
    exec: (query: string) => Promise<unknown>; // NEW:
}

interface ExportedHandler<TEnv> {
    fetch: (request: Request, env: TEnv) => Promise<Response>;
    scheduled?: (controller: unknown, env: TEnv) => Promise<void>;
}

export interface Env {
    DB: D1Database;
    API_BASE_URL?: string;
    SCRAPER_SECRET: string;
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

// MODIFIED: 全面更新 Schema
const ensureSchema = async (db: D1Database) => {
    await db.batch([
        // --- Movies 資料表 (id: 數字, source_id: 字串) ---
        db.prepare(`CREATE TABLE IF NOT EXISTS Movies (
            id INTEGER PRIMARY KEY AUTOINCREMENT, 
            source_id TEXT NOT NULL UNIQUE,
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
        
        // --- Theaters 資料表 (id: 數字, source_id: 字串, websiteUrl) ---
        db.prepare(`CREATE TABLE IF NOT EXISTS Theaters (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            source_id TEXT NOT NULL UNIQUE,
            name TEXT NOT NULL,
            address TEXT,
            region TEXT,
            websiteUrl TEXT,
            lat REAL,
            lng REAL
        )`),
        
        // --- Showtimes 資料表 (id: 字串, bookingUrl, foreign keys: 數字) ---
        db.prepare(`CREATE TABLE IF NOT EXISTS Showtimes (
            source_id TEXT PRIMARY KEY,
            movieId INTEGER NOT NULL, 
            theaterId INTEGER NOT NULL,
            bookingUrl TEXT NOT NULL,
            time TEXT NOT NULL,
            screenType TEXT NOT NULL,
            language TEXT NOT NULL,
            price REAL NOT NULL,
            FOREIGN KEY (movieId) REFERENCES Movies(id) ON DELETE CASCADE,
            FOREIGN KEY (theaterId) REFERENCES Theaters(id) ON DELETE CASCADE
        )`),
        
        // --- Reviews 資料表 (foreign key: 數字) ---
        db.prepare(`CREATE TABLE IF NOT EXISTS Reviews (
            id TEXT PRIMARY KEY,
            movieId INTEGER NOT NULL, 
            userId TEXT NOT NULL,
            username TEXT NOT NULL,
            rating INTEGER NOT NULL,
            comment TEXT NOT NULL,
            createdAt TEXT NOT NULL,
            FOREIGN KEY (movieId) REFERENCES Movies(id) ON DELETE CASCADE
        )`),
        
        // --- MovieBuddyEvents 資料表 (foreign keys: 數字) ---
        db.prepare(`CREATE TABLE IF NOT EXISTS MovieBuddyEvents (
            id TEXT PRIMARY KEY,
            movieId INTEGER NOT NULL, 
            theaterId INTEGER NOT NULL,
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
            organizerTrustScore REAL,
            FOREIGN KEY (movieId) REFERENCES Movies(id) ON DELETE CASCADE,
            FOREIGN KEY (theaterId) REFERENCES Theaters(id) ON DELETE CASCADE,
            FOREIGN KEY (showtimeId) REFERENCES Showtimes(source_id) ON DELETE CASCADE
        )`),

        // --- EventParticipants 資料表 (維持不變) ---
        db.prepare(`CREATE TABLE IF NOT EXISTS EventParticipants (
            eventId TEXT NOT NULL,
            userId TEXT NOT NULL,
            username TEXT NOT NULL,
            avatarUrl TEXT,
            PRIMARY KEY (eventId, userId),
            FOREIGN KEY (eventId) REFERENCES MovieBuddyEvents(id) ON DELETE CASCADE
        )`),
    ]);

    // NEW: 建立索引以加快 source_id 查詢
    await db.exec(`
        CREATE INDEX IF NOT EXISTS idx_movies_source_id ON Movies(source_id);
        CREATE INDEX IF NOT EXISTS idx_theaters_source_id ON Theaters(source_id);
        CREATE INDEX IF NOT EXISTS idx_showtimes_movie_id ON Showtimes(movieId);
        CREATE INDEX IF NOT EXISTS idx_showtimes_theater_id ON Showtimes(theaterId);
    `).catch(e => console.error("Error creating indexes:", e));
};

const getUniqueIdsFromParams = (params: URLSearchParams, key: string): string[] => {
    // (此函式維持不變... 故省略)
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

// MODIFIED: fetchEvents (擴充 JOIN)
// whereClause 現在可以包含 JOIN 語句
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
            s.source_id AS showtimeId,
            s.movieId AS showtimeMovieId,
            s.theaterId AS showtimeTheaterId,
            s.time AS showtimeTime,
            s.screenType AS showtimeScreenType,
            s.language AS showtimeLanguage,
            s.price AS showtimePrice,
            s.bookingUrl AS showtimeBookingUrl,
            m.source_id AS movieSourceId,
            t.source_id AS theaterSourceId
        FROM MovieBuddyEvents e
    JOIN Showtimes s ON e.showtimeId = s.source_id
        JOIN Movies m ON e.movieId = m.id
        JOIN Theaters t ON e.theaterId = t.id
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
        // MODIFIED: 回傳 source_id (API 需要)
        movieId: row.movieSourceId, 
        theaterId: row.theaterSourceId,
        showtime: {
            id: row.showtimeId,
            movieId: row.movieSourceId,
            theaterId: row.theaterSourceId,
            bookingUrl: row.showtimeBookingUrl, // NEW
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

// MODIFIED: 
async function processScraperResults(db: D1Database, data: IScraperResult) {
    console.log('Processing received scraper data...');
    
    const finalMovies = data.movies ?? [];
    const finalTheaters = data.theaters ?? [];
    const allShowtimes = data.showtimes ?? [];
    
    try {
        // --- 1. 寫入 影城 (Theaters) ---
        if (finalTheaters.length > 0) {
            const theaterBatch = finalTheaters.map(t =>
                db
                    .prepare('INSERT OR IGNORE INTO Theaters (source_id, name, address, region, websiteUrl, lat, lng) VALUES (?, ?, ?, ?, ?, ?, ?)')
                    .bind(
                        t.source_id, // NEW: "vieshow_1"
                        t.name ?? 'Unknown Theater',
                        t.address ?? '',
                        t.region ?? '',
                        t.websiteUrl ?? '', // MODIFIED
                        t.location?.lat ?? 0,
                        t.location?.lng ?? 0
                    )
            );
            console.log(`Batch writing ${theaterBatch.length} theaters...`);
            await db.batch(theaterBatch);
        } else {
            console.log('No theaters to write.');
        }
 
        // --- 2. 寫入 電影 (Movies) ---
        if (finalMovies.length > 0) {
            const movieBatch = finalMovies.map(m =>
                db
                    .prepare(
                        'INSERT OR REPLACE INTO Movies (source_id, title, englishTitle, posterUrl, synopsis, director, actors, duration, rating, trailerUrl, releaseDate, bookingOpen, genres) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                    )
                    .bind(
                        m.source_id, // NEW: "vieshow_8366"
                        m.title ?? 'Untitled Movie',
                        m.englishTitle ?? '',
                        m.posterUrl ?? '',
                        m.synopsis ?? '',
                        m.director ?? '',
                        (m.actors ?? []).join(','),
                        m.duration ?? 0,
                        m.rating ?? '',
                        m.trailerUrl ?? '',
                        m.releaseDate ?? '',
                        m.bookingOpen ? 1 : 0,
                        (m.genres ?? []).join(',')
                    )
            );
            console.log(`Batch writing ${movieBatch.length} movies...`);
            await db.batch(movieBatch);
        } else {
            console.log('No movies to write.');
        }
 
        // --- 3. 建立 source_id -> id 的轉換地圖 ---
        console.log('Building ID lookup maps...');
        const movieSourceIds = finalMovies.map(m => m.source_id).filter(Boolean);
        const theaterSourceIds = finalTheaters.map(t => t.source_id).filter(Boolean);
        
        const movieSourceMap = new Map<string, number>();
        const theaterSourceMap = new Map<string, number>();

        if (movieSourceIds.length > 0) {
            const { results } = await db.prepare(`SELECT id, source_id FROM Movies WHERE source_id IN (${movieSourceIds.map(() => '?').join(',')})`)
                .bind(...movieSourceIds)
                .all<{id: number, source_id: string}>();
            results?.forEach(row => movieSourceMap.set(row.source_id, row.id));
        }

        if (theaterSourceIds.length > 0) {
            const { results } = await db.prepare(`SELECT id, source_id FROM Theaters WHERE source_id IN (${theaterSourceIds.map(() => '?').join(',')})`)
                .bind(...theaterSourceIds)
                .all<{id: number, source_id: string}>();
            results?.forEach(row => theaterSourceMap.set(row.source_id, row.id));
        }
        console.log(`Built maps. Movies: ${movieSourceMap.size}, Theaters: ${theaterSourceMap.size}`);

        // --- 4. 寫入 場次 (Showtimes) ---
        
        // 4a. 刪除舊場次 (使用 "數字 id")
        console.log('Deleting old showtimes for relevant movies...');
        const movieIntegerIds = Array.from(movieSourceMap.values());
        if (movieIntegerIds.length > 0) {
             const placeholders = movieIntegerIds.map(() => '?').join(',');
             await db.prepare(`DELETE FROM Showtimes WHERE movieId IN (${placeholders})`)
                 .bind(...movieIntegerIds)
                 .run();
             console.log(`Deleted old showtimes for ${movieIntegerIds.length} movies.`);
        } else {
             await db.prepare('DELETE FROM Showtimes').run();
             console.log('No movies found, cleared all showtimes as a fallback.');
        }

        // 4b. 寫入新場次 (使用 "數字 id")
        if (allShowtimes.length > 0) {
            const showtimeBatch = [];
            for (const s of allShowtimes) {
                // 轉換
                const autoMovieId = movieSourceMap.get(s.movieId); // s.movieId 是 "vieshow_8366"
                const autoTheaterId = theaterSourceMap.get(s.theaterId); // s.theaterId 是 "vieshow_1"

                if (autoMovieId && autoTheaterId) {
                    showtimeBatch.push(
                        db
                            .prepare('INSERT INTO Showtimes (source_id, movieId, theaterId, bookingUrl, time, screenType, language, price) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
                            .bind(
                                s.source_id,
                                autoMovieId, // 數字
                                autoTheaterId, // 數字
                                s.bookingUrl, // NEW
                                s.time ?? new Date().toISOString(),
                                s.screenType ?? 'General',
                                s.language ?? 'Chinese',
                                s.price ?? 0
                            )
                    );
                } else {
                    console.warn(`Could not find mapping for showtime: m=${s.movieId}, t=${s.theaterId}`);
                }
            }

            if (showtimeBatch.length > 0) {
                console.log(`Batch writing ${showtimeBatch.length} showtimes...`);
                await db.batch(showtimeBatch);
            } else {
                console.log('No showtimes to write (after filtering).');
            }
        } else {
             console.log('No showtimes to write.');
        }
 
        console.log(`Scrape data processed successfully. Movies: ${finalMovies.length}, Theaters: ${finalTheaters.length}, Showtimes: ${allShowtimes.length}`);
        return {
            ok: true,
            movies: finalMovies.length,
            theaters: finalTheaters.length,
            showtimes: allShowtimes.length
        };

    } catch (e: any) {
        console.error('D1 write failed:', e);
        return { ok: false, error: e.message, stack: e.stack };
    }
}

// --- Worker 核心處理器 (已更新所有 API 端點) ---
const router = async (request: Request, env: Env): Promise<Response> => {
    const url = new URL(request.url);
    const { pathname, searchParams } = url;
    const method = request.method.toUpperCase();
    const segments = pathname.split('/').filter(Boolean);

    try {
        await ensureSchema(env.DB);
    
        if (segments[0] !== 'api') {
            return new Response('API Not Found', { status: 404 });
        }
        
        // --- PUSH API (不變) ---
        if (method === 'POST' && pathname === '/api/admin/push-data') {
            // ... (auth logic)
            const authHeader = request.headers.get('Authorization');
            const token = authHeader?.split('Bearer ')?.[1];
            if (!token || token !== env.SCRAPER_SECRET) {
                return jsonResponse({ error: 'Unauthorized' }, 401);
            }
            try {
                const data: IScraperResult = await request.json();
                const result = await processScraperResults(env.DB, data);
                if (result.ok) {
                    return jsonResponse(result, 201);
                } else {
                    return jsonResponse({ error: 'Failed to write to D1', detail: result.error, stack: result.stack }, 500);
                }
            } catch (e: any) {
                return jsonResponse({ error: 'Invalid JSON payload' }, 400);
            }
        }
        
        // --- (以下是 API 端點，全部改為使用 source_id) ---

        if (method === 'GET' && pathname === '/api/movies') {
            const { results } = await env.DB.prepare('SELECT * FROM Movies ORDER BY releaseDate ASC').all();
            return jsonResponse(results ?? []);
        }

        // MODIFIED: /api/movie/[source_id]
        if (method === 'GET' && segments[1] === 'movie' && segments.length === 3) {
            const movieSourceId = segments[2];
            const row = await env.DB.prepare('SELECT * FROM Movies WHERE source_id = ? LIMIT 1').bind(movieSourceId).first();
            return jsonResponse(row ?? null);
        }

        if (method === 'GET' && pathname === '/api/theaters') {
            const { results } = await env.DB.prepare('SELECT * FROM Theaters ORDER BY name ASC').all();
            return jsonResponse(results ?? []);
        }

        // MODIFIED: /api/theater/[source_id]
        if (method === 'GET' && segments[1] === 'theater' && segments.length === 3) {
            const theaterSourceId = segments[2];
            const row = await env.DB.prepare('SELECT * FROM Theaters WHERE source_id = ? LIMIT 1').bind(theaterSourceId).first<any>();
            return jsonResponse(row ?? null);
        }

        // MODIFIED: /api/showtimes/movie/[source_id] (JOINed to return source_ids)
        if (method === 'GET' && segments[1] === 'showtimes' && segments[2] === 'movie' && segments.length === 4) {
            const movieSourceId = segments[3];
            const query = `
                SELECT 
                    s.source_id AS id, 
                    m.source_id AS movieId, 
                    t.source_id AS theaterId,
                    s.bookingUrl, 
                    s.time, 
                    s.screenType, 
                    s.language, 
                    s.price 
                FROM Showtimes s
                JOIN Movies m ON s.movieId = m.id
                JOIN Theaters t ON s.theaterId = t.id
                WHERE m.source_id = ?
                ORDER BY s.time ASC
            `;
            const { results } = await env.DB.prepare(query).bind(movieSourceId).all();
            return jsonResponse(results ?? []);
        }

        // MODIFIED: /api/showtimes/theater/[source_id] (JOINed to return source_ids)
        if (method === 'GET' && segments[1] === 'showtimes' && segments[2] === 'theater' && segments.length === 4) {
            const theaterSourceId = segments[3];
            const query = `
                SELECT 
                    s.source_id AS id, 
                    m.source_id AS movieId, 
                    t.source_id AS theaterId,
                    s.bookingUrl, 
                    s.time, 
                    s.screenType, 
                    s.language, 
                    s.price 
                FROM Showtimes s
                JOIN Movies m ON s.movieId = m.id
                JOIN Theaters t ON s.theaterId = t.id
                WHERE t.source_id = ?
                ORDER BY s.time ASC
            `;
            const { results } = await env.DB.prepare(query).bind(theaterSourceId).all();
            return jsonResponse(results ?? []);
        }

        // MODIFIED: /api/movies/batch (使用 source_id)
        if (method === 'GET' && pathname === '/api/movies/batch') {
            const ids = getUniqueIdsFromParams(searchParams, 'ids'); // ids are source_ids
            if (ids.length === 0) return jsonResponse([]);
            const placeholders = ids.map(() => '?').join(',');
            const { results } = await env.DB
                .prepare(`SELECT * FROM Movies WHERE source_id IN (${placeholders})`)
                .bind(...ids)
                .all();
            return jsonResponse(results ?? []);
        }

        // MODIFIED: /api/theaters/batch (使用 source_id)
        if (method === 'GET' && pathname === '/api/theaters/batch') {
            const ids = getUniqueIdsFromParams(searchParams, 'ids'); // ids are source_ids
            if (ids.length === 0) return jsonResponse([]);
            const placeholders = ids.map(() => '?').join(',');
            const { results } = await env.DB
                .prepare(`SELECT * FROM Theaters WHERE source_id IN (${placeholders})`)
                .bind(...ids)
                .all();
            return jsonResponse(results ?? []);
        }

        // /api/search (不變)
        if (method === 'GET' && pathname === '/api/search') {
            const query = searchParams.get('q')?.trim();
            if (!query) return jsonResponse({ movies: [], theaters: [] });
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

        // MODIFIED: /api/reviews/movie/[source_id]
        if (method === 'GET' && segments[1] === 'reviews' && segments[2] === 'movie' && segments.length === 4) {
            const movieSourceId = segments[3];
            const query = `
                SELECT r.* FROM Reviews r
                JOIN Movies m ON r.movieId = m.id
                WHERE m.source_id = ?
                ORDER BY datetime(r.createdAt) DESC
            `;
            const { results } = await env.DB.prepare(query).bind(movieSourceId).all();
            return jsonResponse(results ?? []);
        }

        // MODIFIED: POST /api/reviews (使用 source_id)
        if (method === 'POST' && pathname === '/api/reviews') {
            const body = (await request.json()) as Omit<Review, 'id' | 'createdAt'>;

            if (!body.movieId || !body.userId || !body.username || typeof body.rating !== 'number' || !body.comment) {
                return jsonResponse({ error: 'Invalid review payload' }, 400);
            }
            
            // 查找 "數字 id"
            const movie = await env.DB.prepare('SELECT id FROM Movies WHERE source_id = ? LIMIT 1').bind(body.movieId).first<{id: number}>();
            if (!movie) {
                return jsonResponse({ error: 'Movie not found' }, 404);
            }

            const reviewId = crypto.randomUUID();
            const createdAt = new Date().toISOString();

            await env.DB
                .prepare(
                    'INSERT INTO Reviews (id, movieId, userId, username, rating, comment, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
                )
                .bind(
                    reviewId,
                    movie.id,
                    body.userId,
                    body.username,
                    body.rating,
                    body.comment,
                    createdAt,
                )
                .run();
            
            // 回傳時，把數字 id 換回 source_id
            const responseReview: Review = {
                id: reviewId,
                movieId: body.movieId,
                userId: body.userId,
                username: body.username,
                rating: body.rating,
                comment: body.comment,
                createdAt,
            };
            return jsonResponse(responseReview, 201);
        }

        // MODIFIED: /api/movie-buddy-events/movie/[source_id]
        if (method === 'GET' && segments[1] === 'movie-buddy-events' && segments[2] === 'movie' && segments.length === 4) {
            const movieSourceId = segments[3];
            // fetchEvents 已被修改為可以 JOIN
            const events = await fetchEvents(env.DB, 'WHERE m.source_id = ?', [movieSourceId]);
            return jsonResponse(events);
        }

        // /api/movie-buddy-events/batch (不變)
        if (method === 'GET' && segments[1] === 'movie-buddy-events' && segments.length === 2) {
             const ids = getUniqueIdsFromParams(searchParams, 'ids'); // ids are event UUIDs
             if (ids.length === 0) return jsonResponse([]);
             const placeholders = ids.map(() => '?').join(',');
             const events = await fetchEvents(env.DB, `WHERE e.id IN (${placeholders})`, ids);
             return jsonResponse(events);
        }

        // /api/movie-buddy-events/[id] (不變)
        if (method === 'GET' && segments[1] === 'movie-buddy-events' && segments.length === 3) {
            const eventId = segments[2];
            const events = await fetchEvents(env.DB, 'WHERE e.id = ?', [eventId]);
            return jsonResponse(events.length > 0 ? events[0] : null);
        }

        // MODIFIED: POST /api/movie-buddy-events (使用 source_id)
        if (method === 'POST' && pathname === '/api/movie-buddy-events') {
            const body = await request.json();
            const { movieId, theaterId, showtime, organizer, title, description, maxParticipants } = body;

            if (!movieId || !theaterId || !showtime?.id || !organizer?.userId || !title || !description || !maxParticipants) {
                return jsonResponse({ error: 'Invalid event payload' }, 400);
            }
            
            // 查找 "數字 id"
            const movie = await env.DB.prepare('SELECT id FROM Movies WHERE source_id = ? LIMIT 1').bind(movieId).first<{id: number}>();
            const theater = await env.DB.prepare('SELECT id FROM Theaters WHERE source_id = ? LIMIT 1').bind(theaterId).first<{id: number}>();
            
            if (!movie || !theater) {
                 return jsonResponse({ error: 'Movie or Theater not found' }, 404);
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
                        movie.id, // 數字
                        theater.id, // 數字
                        showtime.id, // showtime.id (txtSessionId)
                        title,
                        description,
                        maxParticipants,
                        status,
                        createdAt,
                        organizer.userId,
                        organizer.username,
                        organizer.avatarUrl ?? null,
                        organizerTags,
                        organizer.trustScore ?? null
                    ),
                env.DB
                    .prepare('INSERT INTO EventParticipants (eventId, userId, username, avatarUrl) VALUES (?, ?, ?, ?)')
                    .bind(eventId, organizer.userId, organizer.username, organizer.avatarUrl ?? null),
            ]);

            const [createdEvent] = await fetchEvents(env.DB, 'WHERE e.id = ?', [eventId]);
            return jsonResponse(createdEvent, 201);
        }

        if (method === 'POST' && pathname === '/api/admin/seed') {
            return jsonResponse({ error: "This endpoint is deprecated. Use /api/admin/push-data instead." }, 400);
        }

        if (method === 'POST' && pathname === '/api/admin/clear') {
            console.log('Clearing all database tables...');
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
        }

        return new Response('API Not Found', { status: 404 });

    } catch (e: any) {
        console.error('Worker router error:', e);
        return jsonResponse({ error: e.message ?? 'Internal Server Error', stack: e.stack }, 500);
    }
};

// --- (worker 和 scheduled 函式維持不變) ---
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
        console.log('Scheduled trigger received, but worker-side scraping is disabled.');
    },
};

export default worker;