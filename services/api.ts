// Real Taiwan Movie Data - November 5, 2025
import { Movie, Theater, Showtime, Review, MovieBuddyEvent } from '../types';

const today = new Date('2025-11-05');

const formatDate = (date: Date) => date.toISOString().split('T')[0];

const futureDate = (days: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() + days);
  return formatDate(d);
};

// --- REAL MOVIE DATA ---

const movies: Movie[] = [
    {
        id: 'm1',
        title: '劇場版『鏈鋸人 蕾潔篇』',
        englishTitle: 'Chainsaw Man: The Movie - Reze Arc',
        posterUrl: 'https://www.vscinemas.com.tw/upload/film/film_20250815002.jpg',
        synopsis: '《鏈鋸人》動畫版動作導演吉原達矢執導，延續動畫系列篇章。淀治與神秘少女蕾潔相遇，展開一場愛情與陰謀交織的致命對決。',
        director: '吉原達矢',
        actors: ['戶谷菊之介', '楠木燈', '早見沙織'],
        duration: 100,
        rating: 'PG15',
        trailerUrl: 'https://www.youtube.com/watch?v=ttUwLaUr-a0',
        releaseDate: '2025-09-24',
        bookingOpen: true,
        genres: ['動畫', '動作', '冒險'],
    },
    {
        id: 'm2',
        title: '女孩',
        englishTitle: 'Girl',
        posterUrl: 'https://www.vscinemas.com.tw/upload/film/film_20251017008.jpg',
        synopsis: '舒淇主演的心理驚悚電影，探討關於身份與認同的深刻主題。',
        director: 'Joel Edgerton',
        actors: ['舒淇', '羅伯帕汀森'],
        duration: 123,
        rating: 'PG15',
        trailerUrl: 'https://www.youtube.com/watch?v=5slHQOBCDf4',
        releaseDate: formatDate(today),
        bookingOpen: true,
        genres: ['驚悚', '心理'],
    },
    {
        id: 'm3',
        title: '劇場版「鬼滅之刃」無限城篇 第一章 猗窩座再襲',
        englishTitle: 'Demon Slayer: Kimetsu no Yaiba - Infinity Castle Arc Part 1',
        posterUrl: 'https://www.vscinemas.com.tw/upload/film/film_20250428011.jpg',
        synopsis: '故事承接《鬼滅之刃 柱訓練篇》，鬼殺隊群體掉進「無限城」，面對上弦之參「猗窩座」、上弦之貳「童磨」以及新任上弦之陸「獪岳」的攻擊，展開激烈戰鬥。',
        director: '外崎春雄',
        actors: ['花江夏樹', '鬼頭明里', '下野紘', '松岡禎丞', '上田麗奈', '早見沙織', '石田彰'],
        duration: 155,
        rating: 'PG12',
        trailerUrl: 'https://www.youtube.com/watch?v=xLnogE9T46o',
        releaseDate: '2025-08-08',
        bookingOpen: true,
        genres: ['動畫', '動作', '冒險'],
    },
    {
        id: 'm4',
        title: '左撇子女孩',
        englishTitle: 'LEFT HANDED GIRL',
        posterUrl: 'https://www.vscinemas.com.tw/upload/film/film_20250924004.jpg',
        synopsis: '旅美台灣導演鄒時擎執導，蔡淑臻、馬士媛、葉子綺及黃鐙輝主演，述說母女三口為求生計到台北夜市擺攤，卻在一連串的意外與衝突下，重新面對各自的人生課題。',
        director: '鄒時擎',
        actors: ['蔡淑臻', '馬士媛', '葉子綺', '黃鐙輝'],
        duration: 108,
        rating: 'PG12',
        trailerUrl: 'https://www.youtube.com/watch?v=sjp_UuBZI_Q',
        releaseDate: '2025-10-31',
        bookingOpen: true,
        genres: ['劇情', '藝術'],
    },
    {
        id: 'm5',
        title: '國寶',
        englishTitle: 'KOKUHO',
        posterUrl: 'https://www.vscinemas.com.tw/upload/film/film_20251014010.jpg',
        synopsis: '日本重磅史詩鉅作，展現日本文化瑰寶。',
        director: '日本導演',
        actors: ['日本演員'],
        duration: 174,
        rating: 'PG15',
        trailerUrl: 'https://www.youtube.com/watch?v=qnqsxKY37-s',
        releaseDate: formatDate(today),
        bookingOpen: true,
        genres: ['劇情', '歷史'],
    },
    {
        id: 'm6',
        title: '鬼聲泣3',
        englishTitle: 'Insidious: The Red Door Finale',
        posterUrl: 'https://www.vscinemas.com.tw/upload/film/film_20251008008.jpg',
        synopsis: '驚悚恐怖系列第三集，深入紅門的更深層秘密。',
        director: 'Leigh Whannell',
        actors: ['Patrick Wilson', 'Rose Byrne'],
        duration: 103,
        rating: 'PG15',
        trailerUrl: 'https://www.youtube.com/watch?v=h3skpajd0gs&t=1s',
        releaseDate: formatDate(today),
        bookingOpen: true,
        genres: ['恐怖', '驚悚'],
    },
    {
        id: 'm7',
        title: '96分鐘',
        englishTitle: '96 Minutes',
        posterUrl: 'https://www.vscinemas.com.tw/upload/film/film_20250826001.jpg',
        synopsis: '2025年台北電影節開幕片，耗資1.6億台幣打造。林柏宏、宋芸樺主演。',
        director: '洪子烜',
        actors: ['林柏宏', '宋芸樺', '王柏傑', '李李仁'],
        duration: 118,
        rating: 'PG15',
        trailerUrl: 'https://www.youtube.com/watch?v=BeR_NIREjKY',
        releaseDate: formatDate(today),
        bookingOpen: true,
        genres: ['動作', '犯罪', '懸疑'],
    },
    {
        id: 'm8',
        title: '新來的小朋友',
        englishTitle: 'Tuned In',
        posterUrl: 'https://www.vscinemas.com.tw/upload/film/film_20251013015.jpg',
        synopsis: '溫馨家庭劇情片，講述新成員加入家庭的故事。',
        director: '家庭電影導演',
        actors: ['年輕演員'],
        duration: 80,
        rating: 'G',
        trailerUrl: 'https://www.youtube.com/watch?v=8zqO3XmP-os',
        releaseDate: formatDate(today),
        bookingOpen: true,
        genres: ['家庭', '溫馨'],
    },
    {
        id: 'm9',
        title: '我們意外的勇氣',
        englishTitle: 'Unexpected Courage',
        posterUrl: 'https://www.vscinemas.com.tw/upload/film/film_20250930001.jpg',
        synopsis: '勵志家庭電影，關於尋找內心勇氣的故事。',
        director: '溫暖電影導演',
        actors: ['溫暖電影演員'],
        duration: 110,
        rating: 'G',
        trailerUrl: 'https://www.youtube.com/watch?v=05B6qkKPPFY',
        releaseDate: formatDate(today),
        bookingOpen: true,
        genres: ['家庭', '勵志'],
    },
];

// --- REAL THEATER DATA ---

const theaters: Theater[] = [
  {
    id: 't1',
    name: '台北京站威秀影城',
    address: '台北市大同區市民大道一段209號5樓',
    region: '北部',
    bookingUrl: 'https://www.vscinemas.com.tw/',
    location: { lat: 25.0489, lng: 121.5174 }
  },
  {
    id: 't2',
    name: '光點華山電影館',
    address: '台北市中正區八德路一段一號',
    region: '北部',
    bookingUrl: 'https://www.spot-hs.org.tw',
    location: { lat: 25.0339, lng: 121.5223 }
  },
  {
    id: 't3',
    name: '真善美劇院',
    address: '台北市萬華區漢中街116號',
    region: '北部',
    bookingUrl: 'https://wonderful.movie.com.tw/',
    location: { lat: 25.0376, lng: 121.5019 }
  },
  {
    id: 't4',
    name: '台北長春國賓影城',
    address: '台北市中山區長春路176號',
    region: '北部',
    bookingUrl: 'https://www.ambassador.com.tw/',
    location: { lat: 25.0527, lng: 121.5345 }
  },
  {
    id: 't5',
    name: '光點台北電影院',
    address: '台北市中山區中山北路二段18號',
    region: '北部',
    bookingUrl: 'https://www.spot.org.tw',
    location: { lat: 25.0535, lng: 121.5298 }
  },
];

// --- REAL SHOWTIMES DATA (November 5, 2025) ---

const showtimes: Showtime[] = [
  // 台北京站威秀影城 - 劇場版『鏈鋸人 蕾潔篇』
  { id: 'st1', movieId: 'm1', theaterId: 't1', time: '14:20', screenType: 'General', language: 'Japanese', price: 330 },
  { id: 'st2', movieId: 'm1', theaterId: 't1', time: '16:20', screenType: 'General', language: 'Japanese', price: 330 },
  { id: 'st3', movieId: 'm1', theaterId: 't1', time: '18:20', screenType: 'General', language: 'Japanese', price: 330 },
  { id: 'st4', movieId: 'm1', theaterId: 't1', time: '20:20', screenType: 'General', language: 'Japanese', price: 330 },
  { id: 'st5', movieId: 'm1', theaterId: 't1', time: '22:20', screenType: 'General', language: 'Japanese', price: 300 },

  // 台北京站威秀影城 - 女孩
  { id: 'st6', movieId: 'm2', theaterId: 't1', time: '15:00', screenType: 'General', language: 'Chinese', price: 330 },
  { id: 'st7', movieId: 'm2', theaterId: 't1', time: '17:25', screenType: 'General', language: 'Chinese', price: 330 },
  { id: 'st8', movieId: 'm2', theaterId: 't1', time: '19:50', screenType: 'General', language: 'Chinese', price: 330 },

  // 台北京站威秀影城 - 劇場版「鬼滅之刃」無限城篇 第一章
  { id: 'st9', movieId: 'm3', theaterId: 't1', time: '17:30', screenType: 'General', language: 'Japanese', price: 330 },

  // 台北京站威秀影城 - 國寶
  { id: 'st10', movieId: 'm5', theaterId: 't1', time: '15:50', screenType: 'General', language: 'Japanese', price: 350 },
  { id: 'st11', movieId: 'm5', theaterId: 't1', time: '19:05', screenType: 'General', language: 'Japanese', price: 350 },

  // 台北京站威秀影城 - 鬼聲泣3
  { id: 'st12', movieId: 'm6', theaterId: 't1', time: '15:25', screenType: 'General', language: 'English', price: 330 },
  { id: 'st13', movieId: 'm6', theaterId: 't1', time: '20:25', screenType: 'General', language: 'English', price: 330 },

  // 光點華山電影館 - 左撇子女孩
  { id: 'st14', movieId: 'm4', theaterId: 't2', time: '17:00', screenType: 'General', language: 'Chinese', price: 300 },
  { id: 'st15', movieId: 'm4', theaterId: 't2', time: '21:35', screenType: 'General', language: 'Chinese', price: 300 },

  // 光點華山電影館 - 女孩
  { id: 'st16', movieId: 'm2', theaterId: 't2', time: '11:10', screenType: 'General', language: 'Chinese', price: 300 },
  { id: 'st17', movieId: 'm2', theaterId: 't2', time: '19:15', screenType: 'General', language: 'Chinese', price: 300 },

  // 光點華山電影館 - 新來的小朋友
  { id: 'st18', movieId: 'm8', theaterId: 't2', time: '12:15', screenType: 'General', language: 'Chinese', price: 300 },
  { id: 'st19', movieId: 'm8', theaterId: 't2', time: '22:15', screenType: 'General', language: 'Chinese', price: 300 },

  // 光點華山電影館 - 國寶
  { id: 'st20', movieId: 'm5', theaterId: 't2', time: '13:50', screenType: 'General', language: 'Japanese', price: 320 },
  { id: 'st21', movieId: 'm5', theaterId: 't2', time: '19:05', screenType: 'General', language: 'Japanese', price: 320 },

  // 真善美劇院 - 左撇子女孩
  { id: 'st22', movieId: 'm4', theaterId: 't3', time: '10:30', screenType: 'General', language: 'Chinese', price: 320 },
  { id: 'st23', movieId: 'm4', theaterId: 't3', time: '19:00', screenType: 'General', language: 'Chinese', price: 320 },

  // 真善美劇院 - 新來的小朋友
  { id: 'st24', movieId: 'm8', theaterId: 't3', time: '14:05', screenType: 'General', language: 'Chinese', price: 280 },
  { id: 'st25', movieId: 'm8', theaterId: 't3', time: '17:30', screenType: 'General', language: 'Chinese', price: 280 },

  // 台北長春國賓影城 - 國寶
  { id: 'st26', movieId: 'm5', theaterId: 't4', time: '10:30', screenType: 'General', language: 'Japanese', price: 320 },
  { id: 'st27', movieId: 'm5', theaterId: 't4', time: '15:30', screenType: 'General', language: 'Japanese', price: 380 },

  // 光點台北電影院 - 女孩
  { id: 'st28', movieId: 'm2', theaterId: 't5', time: '13:40', screenType: 'General', language: 'Chinese', price: 320 },
  { id: 'st29', movieId: 'm2', theaterId: 't5', time: '21:15', screenType: 'General', language: 'Chinese', price: 320 },

  // 光點台北電影院 - 左撇子女孩
  { id: 'st30', movieId: 'm4', theaterId: 't5', time: '19:10', screenType: 'General', language: 'Chinese', price: 320 },

  // 光點台北電影院 - 國寶
  { id: 'st31', movieId: 'm5', theaterId: 't5', time: '10:30', screenType: 'General', language: 'Japanese', price: 320 },
  { id: 'st32', movieId: 'm5', theaterId: 't5', time: '16:00', screenType: 'General', language: 'Japanese', price: 320 },
];

// --- REVIEWS ---

let reviews: Review[] = [
  {
    id: 'r1',
    movieId: 'm1',
    userId: 'u1',
    username: '動漫迷',
    rating: 5,
    comment: '蕾潔篇終於上映！質量超高，強烈推薦各位粉絲進戲院支持！',
    createdAt: '2025-11-05T10:00:00Z'
  },
  {
    id: 'r2',
    movieId: 'm3',
    userId: 'u2',
    username: '鬼滅粉',
    rating: 5,
    comment: '無限城篇場面壯觀，動畫品質一流，是今年必看大作！',
    createdAt: '2025-11-05T09:30:00Z'
  },
];

let movieBuddyEvents: MovieBuddyEvent[] = [
  {
    id: 'mbe1',
    movieId: 'm1',
    theaterId: 't1',
    showtime: showtimes.find(s => s.id === 'st3')!,
    organizer: {
      userId: 'u1',
      username: '動漫迷',
      avatarUrl: 'https://i.pravatar.cc/150?u=u1',
      viewingHabitTags: ['#喜歡日本動漫', '#愛看劇場版'],
      trustScore: 4.8
    },
    title: '鏈鋸人蕾潔篇集合',
    description: '找同好一起看蕾潔篇！看完可以一起討論劇情。',
    maxParticipants: 3,
    participants: [
      {
        userId: 'u1',
        username: '動漫迷',
        avatarUrl: 'https://i.pravatar.cc/150?u=u1'
      }
    ],
    status: 'open',
    createdAt: '2025-11-05T08:00:00Z',
  },
  {
    id: 'mbe2',
    movieId: 'm3',
    theaterId: 't2',
    showtime: showtimes.find(s => s.id === 'st20')!,
    organizer: {
      userId: 'u3',
      username: '鬼滅粉絲',
      avatarUrl: 'https://i.pravatar.cc/150?u=u3',
      viewingHabitTags: ['#追劇場版', '#喜歡日本文化'],
      trustScore: 4.9
    },
    title: '鬼滅之刃無限城篇觀影會',
    description: '無限城篇正式上映！歡迎所有鬼滅粉絲一起來支持！',
    maxParticipants: 5,
    participants: [
      {
        userId: 'u3',
        username: '鬼滅粉絲',
        avatarUrl: 'https://i.pravatar.cc/150?u=u3'
      },
      {
        userId: 'u4',
        username: '粉絲甲',
        avatarUrl: 'https://i.pravatar.cc/150?u=u4'
      }
    ],
    status: 'open',
    createdAt: '2025-11-05T07:30:00Z',
  },
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
};

export const getTheaterById = async (id: string): Promise<Theater | undefined> => {
  await new Promise(res => setTimeout(res, FAKE_DELAY));
  return theaters.find(t => t.id === id);
};

export const getShowtimesByMovieId = async (movieId: string): Promise<Showtime[]> => {
  await new Promise(res => setTimeout(res, FAKE_DELAY));
  return showtimes.filter(s => s.movieId === movieId);
};

export const getShowtimesByTheaterId = async (theaterId: string): Promise<Showtime[]> => {
  await new Promise(res => setTimeout(res, FAKE_DELAY));
  return showtimes.filter(s => s.theaterId === theaterId);
};

export const getAllTheaters = async (): Promise<Theater[]> => {
  await new Promise(res => setTimeout(res, FAKE_DELAY));
  return theaters;
};

export const getMoviesByIds = async (ids: string[]): Promise<Movie[]> => {
  await new Promise(res => setTimeout(res, FAKE_DELAY));
  const idSet = new Set(ids);
  return movies.filter(m => idSet.has(m.id));
};

export const getTheatersByIds = async (ids: string[]): Promise<Theater[]> => {
  await new Promise(res => setTimeout(res, FAKE_DELAY));
  const idSet = new Set(ids);
  return theaters.filter(t => idSet.has(t.id));
};

export const getReviewsByMovieId = async (movieId: string): Promise<Review[]> => {
  await new Promise(res => setTimeout(res, 100));
  return reviews.filter(r => r.movieId === movieId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

export const addReview = async (review: Omit<Review, 'id' | 'createdAt'>): Promise<Review> => {
  await new Promise(res => setTimeout(res, FAKE_DELAY));
  const newReview: Review = {
    ...review,
    id: `r${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  reviews = [newReview, ...reviews];
  return newReview;
};

// --- MOVIE BUDDY API FUNCTIONS ---

export const getMovieBuddyEventsByMovieId = async (movieId: string): Promise<MovieBuddyEvent[]> => {
  await new Promise(res => setTimeout(res, FAKE_DELAY));
  return movieBuddyEvents.filter(e => e.movieId === movieId);
};

export const getMovieBuddyEventById = async (eventId: string): Promise<MovieBuddyEvent | undefined> => {
  await new Promise(res => setTimeout(res, FAKE_DELAY));
  return movieBuddyEvents.find(e => e.id === eventId);
};

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