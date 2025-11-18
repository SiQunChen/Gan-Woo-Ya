export interface Movie {
  id: number; 
  source_id: string; 
  title: string;
  englishTitle: string;
  posterUrl:string;
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

export interface Theater {
  id: number; 
  source_id: string; 
  name: string;
  address: string;
  region: string;
  city?: string;
  websiteUrl: string;
  location: {
    lat: number;
    lng: number;
  };
}

export type ScreenType =
  | 'General'
  | '3D'
  | 'GC'
  | 'IMAX'
  | '4DX'
  | 'TITAN'
  | 'Dolby'
  | 'Dolby Cinema'
  | 'MUCROWN';

export type ShowtimeLanguage =
  | 'English'
  | 'Chinese'
  | 'Japanese'
  | 'Korean'
  | 'Thai'
  | 'German'
  | 'French'
  | 'Italian'
  | 'Spanish'
  | 'Portuguese'
  | 'Russian'
  | 'Vietnamese'
  | 'Hindi'
  | 'Cantonese'
  | 'Taiwanese'
  | 'Hakka'
  | 'Multiple'
  | 'Mandarin';

export interface Showtime {
  id: string;
  movieId: string;
  theaterId: string;
  bookingUrl: string;
  time: string; 
  screenType: ScreenType;
  language: ShowtimeLanguage;
  price: number;
}

export interface Review {
    id: string;
    movieId: string;
    userId: string;
    username: string;
    rating: number; // 1 to 5
    comment: string;
    createdAt: string; // ISO date string
}

export interface User {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
    favoriteTheaterIds: Set<string>;
    movieWatchlistIds: Set<string>;
    collectedMovieIds: Set<string>;
    viewingHabitTags: string[];
    trustScore: number;
    isVerified: boolean;
}

export interface Participant {
  userId: string;
  username: string;
  avatarUrl?: string;
}

export interface MovieBuddyEvent {
  id: string;
  movieId: string;
  theaterId: string;
  showtime: Showtime;
  organizer: Participant & { viewingHabitTags: string[]; trustScore: number; };
  title: string;
  description: string;
  maxParticipants: number;
  participants: Participant[];
  status: 'open' | 'full' | 'cancelled' | 'completed';
  createdAt: string;
}


export enum View {
  Home = 'HOME',
  SearchResults = 'SEARCH_RESULTS',
  AiSearchResults = 'AI_SEARCH_RESULTS',
  MovieDetails = 'MOVIE_DETAILS',
  TheaterDetails = 'THEATER_DETAILS',
  NearbyTheaters = 'NEARBY_THEATERS',
  RegionTheaters = 'REGION_THEATERS',
  Collection = 'COLLECTION',
  MovieBuddyEventDetails = 'MOVIE_BUDDY_EVENT_DETAILS',
  Profile = 'PROFILE',
  CreateEvent = 'CREATE_EVENT',
}

export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'late-night';
export type PriceSort = 'distance' | 'time' | 'price';