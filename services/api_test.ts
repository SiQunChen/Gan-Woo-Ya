import { Movie, Theater, Showtime, Review, MovieBuddyEvent } from '../types';

const today = new Date();
const formatDate = (date: Date) => date.toISOString().split('T')[0];
const futureDate = (days: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() + days);
    return formatDate(d);
}

// --- MOCK DATA ---
const movies: Movie[] = [
  {
    id: 'm1',
    title: '沙丘：第二部',
    englishTitle: 'Dune: Part Two',
    posterUrl: 'https://picsum.photos/seed/dune2/500/750',
    synopsis: '保羅·亞崔迪與弗瑞曼人聯手，對毀滅他家庭的陰謀者展開報復。面對一生摯愛與宇宙命運的抉擇，他必須努力阻止只有他能預見的可怕未來。',
    director: '丹尼·維勒納夫',
    actors: ['提摩西·夏勒梅', '辛蒂亞', '蕾貝卡·弗格森'],
    duration: 166,
    rating: 'PG-13',
    trailerUrl: 'https://www.youtube.com/embed/U2Qp5pL3ovA',
    releaseDate: formatDate(today),
    bookingOpen: true,
    genres: ['科幻', '冒險', '動作'],
  },
  {
    id: 'm2',
    title: '哥吉拉與金剛：新帝國',
    englishTitle: 'Godzilla x Kong: The New Empire',
    posterUrl: 'https://picsum.photos/seed/gvk/500/750',
    synopsis: '傳奇影業的怪獸宇宙繼《哥吉拉大戰金剛》的爆炸性對決後，再度推出全新冒險，全能的金剛和駭人的哥吉拉將聯手對抗隱藏在我們世界中未被發現的巨大威脅，那不僅挑戰了牠們的生存，更威脅了人類的存亡。',
    director: '亞當·溫高德',
    actors: ['蕾貝ка·霍爾', '布萊恩·泰瑞·亨利', '丹·史蒂文斯'],
    duration: 115,
    rating: 'PG-13',
    trailerUrl: 'https://www.youtube.com/embed/qqrpMRDuPfc',
    releaseDate: formatDate(today),
    bookingOpen: true,
    genres: ['動作', '科幻', '驚悚'],
  },
  {
    id: 'm3',
    title: '功夫熊貓4',
    englishTitle: 'Kung Fu Panda 4',
    posterUrl: 'https://picsum.photos/seed/kungfupanda4/500/750',
    synopsis: '神龍大俠阿波憑著無人能及的勇氣和武功，在三次驚險萬分的冒險中打敗了世界級的大壞蛋，現在命運安排他要……休息一下。更明確地說，他被選為和平谷的精神領袖。',
    director: '麥克·米契',
    actors: ['傑克·布萊克', '奧卡菲娜', '關繼威'],
    duration: 94,
    rating: 'PG',
    trailerUrl: 'https://www.youtube.com/embed/Yp_t-1-3i-E',
    releaseDate: formatDate(today),
    bookingOpen: true,
    genres: ['動畫', '喜劇', '家庭'],
  },
  {
    id: 'm4',
    title: ' фуріоза: шалений макс. сага',
    englishTitle: 'Furiosa: A Mad Max Saga',
    posterUrl: 'https://picsum.photos/seed/furiosa/500/750',
    synopsis: 'As the world fell, young Furiosa is snatched from the Green Place of Many Mothers and falls into the hands of a great Biker Horde led by the Warlord Dementus. Sweeping through the Wasteland they come across the Citadel presided over by The Immortan Joe. While the two Tyrants war for dominance, Furiosa must survive many trials as she puts together the means to find her way home.',
    director: 'George Miller',
    actors: ['Anya Taylor-Joy', 'Chris Hemsworth', 'Tom Burke'],
    duration: 148,
    rating: 'R',
    trailerUrl: 'https://www.youtube.com/embed/XJMuhwVlca4',
    releaseDate: futureDate(14),
    bookingOpen: false,
    genres: ['動作', '科幻', '冒險'],
  }
];

const theaters: Theater[] = [
  { id: 't1', name: '台北信義威秀影城', address: '台北市信義區松壽路20號', region: '北部', bookingUrl: 'https://www.vscinemas.com.tw/', location: { lat: 25.0339, lng: 121.5645 } },
  { id: 't2', name: '板橋大遠百威秀影城', address: '新北市板橋區新站路28號10樓', region: '北部', bookingUrl: 'https://www.vscinemas.com.tw/', location: { lat: 25.0142, lng: 121.4675 } },
  { id: 't3', name: '京站威秀影城', address: '台北市大同區市民大道一段209號5樓', region: '北部', bookingUrl: 'https://www.vscinemas.com.tw/', location: { lat: 25.0489, lng: 121.5174 } },
  { id: 't4', name: '秀泰影城欣欣店', address: '台北市中山區林森北路247號', region: '北部', bookingUrl: 'https://www.showtimes.com.tw/', location: { lat: 25.0524, lng: 121.5255 } },
  { id: 't5', name: '板橋秀泰影城', address: '新北市板橋區縣民大道二段3號', region: '北部', bookingUrl: 'https://www.showtimes.com.tw/', location: { lat: 25.0138, lng: 121.4638 } },
  { id: 't6', name: '台中大遠百威秀影城', address: '台中市西屯區台灣大道三段251號13樓', region: '中部', bookingUrl: 'https://www.vscinemas.com.tw/', location: { lat: 24.1652, lng: 120.6436 } },
  { id: 't7', name: '高雄大遠百威秀影城', address: '高雄市苓雅區三多四路21號13樓', region: '南部', bookingUrl: 'https://www.vscinemas.com.tw/', location: { lat: 22.6139, lng: 120.3023 } },
  { id: 't8', name: '花蓮新天堂樂園威秀影城', address: '花蓮縣吉安鄉南濱路一段503號', region: '東部', bookingUrl: 'https://www.vscinemas.com.tw/', location: { lat: 23.9621, lng: 121.6111 } },
];

const showtimes: Showtime[] = [
  // Dune Part 2 Showtimes
  { id: 'st1', movieId: 'm1', theaterId: 't1', time: '10:30', screenType: 'IMAX', language: 'English', price: 420 },
  { id: 'st2', movieId: 'm1', theaterId: 't1', time: '14:00', screenType: 'IMAX', language: 'English', price: 420 },
  { id: 'st3', movieId: 'm1', theaterId: 't1', time: '19:30', screenType: 'General', language: 'English', price: 320 },
  { id: 'st4', movieId: 'm1', theaterId: 't1', time: '22:45', screenType: 'General', language: 'English', price: 280 },
  { id: 'st5', movieId: 'm1', theaterId: 't2', time: '11:00', screenType: 'General', language: 'English', price: 310 },
  { id: 'st6', movieId: 'm1', theaterId: 't2', time: '17:30', screenType: '4DX', language: 'English', price: 550 },
  { id: 'st7', movieId: 'm1', theaterId: 't4', time: '13:15', screenType: 'General', language: 'English', price: 300 },
  { id: 'st8', movieId: 'm1', theaterId: 't4', time: '21:00', screenType: 'General', language: 'English', price: 300 },
  { id: 'st21', movieId: 'm1', theaterId: 't6', time: '15:00', screenType: 'IMAX', language: 'English', price: 400 },

  // Godzilla x Kong Showtimes
  { id: 'st9', movieId: 'm2', theaterId: 't1', time: '11:45', screenType: '4DX', language: 'English', price: 560 },
  { id: 'st10', movieId: 'm2', theaterId: 't1', time: '16:20', screenType: 'General', language: 'Chinese', price: 320 },
  { id: 'st11', movieId: 'm2', theaterId: 't2', time: '10:00', screenType: 'Dolby Cinema', language: 'English', price: 450 },
  { id: 'st12', movieId: 'm2', theaterId: 't2', time: '13:00', screenType: 'Dolby Cinema', language: 'English', price: 450 },
  { id: 'st13', movieId: 'm2', theaterId: 't3', time: '15:10', screenType: 'General', language: 'English', price: 330 },
  { id: 'st14', movieId: 'm2', theaterId: 't5', time: '19:00', screenType: 'TITAN', language: 'English', price: 380 },
  { id: 'st15', movieId: 'm2', theaterId: 't5', time: '22:00', screenType: 'TITAN', language: 'Chinese', price: 380 },
  { id: 'st22', movieId: 'm2', theaterId: 't7', time: '18:30', screenType: '4DX', language: 'English', price: 540 },
  
  // Kung Fu Panda 4 Showtimes
  { id: 'st16', movieId: 'm3', theaterId: 't2', time: '09:40', screenType: 'General', language: 'Chinese', price: 280 },
  { id: 'st17', movieId: 'm3', theaterId: 't3', time: '11:20', screenType: 'General', language: 'English', price: 330 },
  { id: 'st18', movieId: 'm3', theaterId: 't3', time: '14:30', screenType: 'General', language: 'Chinese', price: 330 },
  { id: 'st19', movieId: 'm3', theaterId: 't4', time: '16:00', screenType: 'General', language: 'English', price: 300 },
  { id: 'st20', movieId: 'm3', theaterId: 't5', time: '18:10', screenType: 'General', language: 'Chinese', price: 290 },
  { id: 'st23', movieId: 'm3', theaterId: 't8', time: '14:00', screenType: 'General', language: 'Chinese', price: 270 },
];

let reviews: Review[] = [
    { id: 'r1', movieId: 'm1', userId: 'u2', username: '電影愛好者', rating: 5, comment: '視覺和聽覺的雙重饗宴，絕對是年度必看大片！', createdAt: '2024-05-20T10:00:00Z' },
    { id: 'r2', movieId: 'm1', userId: 'u3', username: '科幻迷', rating: 4, comment: '故事節奏有點慢，但場面真的太震撼了。', createdAt: '2024-05-19T14:30:00Z' },
    { id: 'r3', movieId: 'm2', userId: 'u2', username: '電影愛好者', rating: 4, comment: '就是看爽片！哥吉拉和金剛打鬥的場面很過癮。', createdAt: '2024-05-18T18:00:00Z' },
];

let movieBuddyEvents: MovieBuddyEvent[] = [
    {
        id: 'mbe1',
        movieId: 'm1',
        theaterId: 't1',
        showtime: showtimes.find(s => s.id === 'st3')!,
        organizer: { userId: 'u2', username: '電影愛好者', avatarUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026704e', viewingHabitTags: ['#安靜觀影', '#必吃爆米花'], trustScore: 4.8 },
        title: '沙丘鐵粉團，看完一起討論！',
        description: '我已經二刷了，想找同好一起看IMAX版，看完可以到附近咖啡廳聊聊劇情彩蛋，不劇透的勿入！希望是熟悉原作的粉絲。',
        maxParticipants: 4,
        participants: [
            { userId: 'u2', username: '電影愛好者', avatarUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026704e' },
            { userId: 'u3', username: '科幻迷', avatarUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026704f' },
        ],
        status: 'open',
        createdAt: '2024-05-20T11:00:00Z',
    },
    {
        id: 'mbe2',
        movieId: 'm1',
        theaterId: 't2',
        showtime: showtimes.find(s => s.id === 'st6')!,
        organizer: { userId: 'u4', username: '4DX體驗家', avatarUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026704a', viewingHabitTags: ['#追求刺激', '#不介意聊天'], trustScore: 4.5 },
        title: '下班後一起體驗4DX的震撼！',
        description: '有沒有人想下班後來點刺激的？一起來感受被沙蟲追趕的感覺！',
        maxParticipants: 2,
        participants: [
            { userId: 'u4', username: '4DX體驗家', avatarUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026704a' },
        ],
        status: 'open',
        createdAt: '2024-05-21T14:00:00Z',
    },
    {
        id: 'mbe3',
        movieId: 'm2',
        theaterId: 't7',
        showtime: showtimes.find(s => s.id === 'st22')!,
        organizer: { userId: 'u5', username: '怪獸宇宙迷', avatarUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026704b', viewingHabitTags: ['#映後愛討論'], trustScore: 4.9 },
        title: '高雄哥吉拉粉絲站出來！',
        description: '尋找高雄的怪獸同好，一起為王者們歡呼！',
        maxParticipants: 6,
        participants: [
            { userId: 'u5', username: '怪獸宇宙迷', avatarUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026704b' },
            { userId: 'u1', username: '使用者', avatarUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026704d' }
        ],
        status: 'open',
        createdAt: '2024-05-19T18:00:00Z',
    }
];


// --- MOCK API FUNCTIONS ---
const FAKE_DELAY = 500;

export const getAllMovies = async (): Promise<Movie[]> => {
    await new Promise(res => setTimeout(res, FAKE_DELAY));
    return movies;
};

export const search = async (query: string): Promise<{ movies: Movie[], theaters: Theater[] }> => {
  await new Promise(res => setTimeout(res, FAKE_DELAY));
  if (!query) return { movies: [], theaters: [] };
  
  const lowerCaseQuery = query.toLowerCase();
  
  const foundMovies = movies.filter(
    m =>
      m.title.toLowerCase().includes(lowerCaseQuery) ||
      m.englishTitle.toLowerCase().includes(lowerCaseQuery)
  );

  const foundTheaters = theaters.filter(
    t => t.name.toLowerCase().includes(lowerCaseQuery)
  );
  
  return { movies: foundMovies, theaters: foundTheaters };
};

export const getMovieById = async (id: string): Promise<Movie | undefined> => {
    await new Promise(res => setTimeout(res, FAKE_DELAY));
    return movies.find(m => m.id === id);
}

export const getTheaterById = async (id: string): Promise<Theater | undefined> => {
    await new Promise(res => setTimeout(res, FAKE_DELAY));
    return theaters.find(t => t.id === id);
}

export const getShowtimesByMovieId = async (movieId: string): Promise<Showtime[]> => {
    await new Promise(res => setTimeout(res, FAKE_DELAY));
    return showtimes.filter(s => s.movieId === movieId);
}

export const getShowtimesByTheaterId = async (theaterId: string): Promise<Showtime[]> => {
    await new Promise(res => setTimeout(res, FAKE_DELAY));
    return showtimes.filter(s => s.theaterId === theaterId);
}

export const getAllTheaters = async (): Promise<Theater[]> => {
    await new Promise(res => setTimeout(res, FAKE_DELAY));
    return theaters;
}

export const getMoviesByIds = async (ids: string[]): Promise<Movie[]> => {
    await new Promise(res => setTimeout(res, FAKE_DELAY));
    const idSet = new Set(ids);
    return movies.filter(m => idSet.has(m.id));
}

export const getTheatersByIds = async (ids: string[]): Promise<Theater[]> => {
    await new Promise(res => setTimeout(res, FAKE_DELAY));
    const idSet = new Set(ids);
    // Fix: Corrected the filter condition to use `idSet.has(t.id)` instead of comparing with an undefined `id` variable.
    return theaters.filter(t => idSet.has(t.id));
}

export const getReviewsByMovieId = async (movieId: string): Promise<Review[]> => {
    await new Promise(res => setTimeout(res, 100)); // Quicker delay for reviews
    return reviews.filter(r => r.movieId === movieId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export const addReview = async (review: Omit<Review, 'id' | 'createdAt'>): Promise<Review> => {
    await new Promise(res => setTimeout(res, FAKE_DELAY));
    const newReview: Review = {
        ...review,
        id: `r${Date.now()}`,
        createdAt: new Date().toISOString(),
    };
    reviews = [newReview, ...reviews];
    return newReview;
}

// --- MOVIE BUDDY API FUNCTIONS ---

export const getMovieBuddyEventsByMovieId = async (movieId: string): Promise<MovieBuddyEvent[]> => {
    await new Promise(res => setTimeout(res, FAKE_DELAY));
    return movieBuddyEvents.filter(e => e.movieId === movieId);
}

export const getMovieBuddyEventById = async (eventId: string): Promise<MovieBuddyEvent | undefined> => {
    await new Promise(res => setTimeout(res, FAKE_DELAY));
    return movieBuddyEvents.find(e => e.id === eventId);
}

export const getMovieBuddyEventsByIds = async (eventIds: string[]): Promise<MovieBuddyEvent[]> => {
    await new Promise(res => setTimeout(res, FAKE_DELAY));
    const idSet = new Set(eventIds);
    return movieBuddyEvents.filter(e => idSet.has(e.id));
};

export const createMovieBuddyEvent = async (eventData: Omit<MovieBuddyEvent, 'id' | 'participants' | 'status' | 'createdAt'>): Promise<MovieBuddyEvent> => {
    await new Promise(res => setTimeout(res, FAKE_DELAY));
    const newEvent: MovieBuddyEvent = {
        ...eventData,
        id: `mbe${Date.now()}`,
        participants: [eventData.organizer],
        status: 'open',
        createdAt: new Date().toISOString(),
    };
    movieBuddyEvents.unshift(newEvent);
    return newEvent;
};