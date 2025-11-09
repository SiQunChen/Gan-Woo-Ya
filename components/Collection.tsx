import React, { useState, useEffect } from 'react';
import { Movie, Theater, MovieBuddyEvent } from '../types';
import { getMoviesByIds, getTheatersByIds, getMovieBuddyEventsByIds } from '../services/api';
import { useUser } from '../contexts/UserContext';
import MovieCard from './MovieCard';
import Spinner from './Spinner';
import { BookmarkIcon, HeartIcon, UsersIcon } from './Icons';
import MovieBuddyEventCard from './MovieBuddyEventCard';

interface CollectionProps {
  onSelectMovie: (movie: Movie) => void;
  onSelectTheater: (theater: Theater) => void;
  onSelectEvent: (eventId: string) => void;
}

const Collection: React.FC<CollectionProps> = ({ onSelectMovie, onSelectTheater, onSelectEvent }) => {
  const [activeTab, setActiveTab] = useState<'watchlist' | 'collected' | 'theaters' | 'events'>('watchlist');
  
  const [watchlistMovies, setWatchlistMovies] = useState<Movie[]>([]);
  const [collectedMovies, setCollectedMovies] = useState<Movie[]>([]);
  const [theaters, setTheaters] = useState<Theater[]>([]);
  const [events, setEvents] = useState<(MovieBuddyEvent & { movie: Movie })[]>([]);
  
  const [watchlistLoading, setWatchlistLoading] = useState(true);
  const [collectedLoading, setCollectedLoading] = useState(true);
  const [theatersLoading, setTheatersLoading] = useState(true);
  const [eventsLoading, setEventsLoading] = useState(true);

  const { movieWatchlistIds, collectedMovieIds, favoriteTheaterIds, joinedEventIds } = useUser();

  useEffect(() => {
    const fetchWatchlistMovies = async () => {
      setWatchlistLoading(true);
      const movieIds = [...movieWatchlistIds];
      if (movieIds.length > 0) {
        const movies = await getMoviesByIds(movieIds);
        setWatchlistMovies(movies);
      } else {
        setWatchlistMovies([]);
      }
      setWatchlistLoading(false);
    };
    if (activeTab === 'watchlist') fetchWatchlistMovies();
  }, [movieWatchlistIds, activeTab]);

  useEffect(() => {
    const fetchCollectedMovies = async () => {
      setCollectedLoading(true);
      const movieIds = [...collectedMovieIds];
      if (movieIds.length > 0) {
        const movies = await getMoviesByIds(movieIds);
        setCollectedMovies(movies);
      } else {
        setCollectedMovies([]);
      }
      setCollectedLoading(false);
    };
    if (activeTab === 'collected') fetchCollectedMovies();
  }, [collectedMovieIds, activeTab]);

  useEffect(() => {
    const fetchFavoriteTheaters = async () => {
      setTheatersLoading(true);
      const theaterIds = [...favoriteTheaterIds];
      if (theaterIds.length > 0) {
        const favoriteTheaters = await getTheatersByIds(theaterIds);
        setTheaters(favoriteTheaters);
      } else {
        setTheaters([]);
      }
      setTheatersLoading(false);
    };
    if (activeTab === 'theaters') fetchFavoriteTheaters();
  }, [favoriteTheaterIds, activeTab]);

  useEffect(() => {
    const fetchJoinedEvents = async () => {
        setEventsLoading(true);
        const eventIds = [...joinedEventIds];
        if (eventIds.length > 0) {
            const fetchedEvents = await getMovieBuddyEventsByIds(eventIds);
            const movieIds = [...new Set(fetchedEvents.map(e => e.movieId))];
            const movies = await getMoviesByIds(movieIds);
            const moviesMap = new Map(movies.map(m => [m.id, m]));
            
            const eventsWithMovies = fetchedEvents
                .map(event => ({ ...event, movie: moviesMap.get(event.movieId)!}))
                .filter(e => e.movie);
            setEvents(eventsWithMovies);
        } else {
            setEvents([]);
        }
        setEventsLoading(false);
    }
    if (activeTab === 'events') fetchJoinedEvents();
  }, [joinedEventIds, activeTab]);


  const renderWatchlist = () => {
    if (watchlistLoading) {
      return <div className="flex justify-center items-center h-64"><Spinner /></div>;
    }
    return watchlistMovies.length > 0 ? (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {watchlistMovies.map(movie => <MovieCard key={movie.id} movie={movie} onSelectMovie={onSelectMovie} />)}
      </div>
    ) : (
      <p className="text-gray-400 text-center py-10">您的待看清單是空的。去逛逛電影並將它們加入清單吧！</p>
    );
  };
  
  const renderCollected = () => {
    if (collectedLoading) {
      return <div className="flex justify-center items-center h-64"><Spinner /></div>;
    }
    return collectedMovies.length > 0 ? (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {collectedMovies.map(movie => <MovieCard key={movie.id} movie={movie} onSelectMovie={onSelectMovie} />)}
      </div>
    ) : (
      <p className="text-gray-400 text-center py-10">您尚未收藏任何電影。</p>
    );
  };

  const renderTheaters = () => {
    if (theatersLoading) {
      return <div className="flex justify-center items-center h-64"><Spinner /></div>;
    }
    return theaters.length > 0 ? (
      <div className="space-y-4">
        {theaters.map(theater => (
          <div key={theater.id} onClick={() => onSelectTheater(theater)} className="bg-gray-800 p-4 rounded-lg flex justify-between items-center cursor-pointer hover:bg-gray-700 transition-colors">
            <div>
              <h3 className="text-xl font-semibold text-white">{theater.name}</h3>
              <p className="text-gray-400">{theater.address}</p>
            </div>
          </div>
        ))}
      </div>
    ) : (
      <p className="text-gray-400 text-center py-10">您尚未將任何影城加入收藏。</p>
    );
  };

  const renderEvents = () => {
    if(eventsLoading) {
        return <div className="flex justify-center items-center h-64"><Spinner /></div>;
    }
    return events.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {events.map(event => (
                <MovieBuddyEventCard key={event.id} event={event} movie={event.movie} onSelectEvent={onSelectEvent} />
            ))}
        </div>
    ) : (
        <p className="text-gray-400 text-center py-10">您尚未參加任何揪團。去看看有誰想看同一部電影吧！</p>
    )
  }
  
  const renderContent = () => {
    switch(activeTab) {
      case 'watchlist': return renderWatchlist();
      case 'collected': return renderCollected();
      case 'theaters': return renderTheaters();
      case 'events': return renderEvents();
      default: return null;
    }
  }
  
  const tabBaseClass = "px-4 sm:px-6 py-3 font-semibold text-base sm:text-lg rounded-t-lg transition-colors flex items-center gap-2";
  const activeTabClass = "bg-gray-800 text-cyan-400";
  const inactiveTabClass = "bg-transparent text-gray-400 hover:bg-gray-800/50";

  return (
    <div>
      <h2 className="text-3xl font-bold mb-6">我的收藏</h2>
      <div className="flex border-b-2 border-gray-700">
        <button className={`${tabBaseClass} ${activeTab === 'watchlist' ? activeTabClass : inactiveTabClass}`} onClick={() => setActiveTab('watchlist')}>
          <BookmarkIcon className="w-5 h-5 sm:w-6 sm:h-6" /> 待看電影
        </button>
        <button className={`${tabBaseClass} ${activeTab === 'collected' ? activeTabClass : inactiveTabClass}`} onClick={() => setActiveTab('collected')}>
          <HeartIcon className="w-5 h-5 sm:w-6 sm:h-6" /> 電影收藏
        </button>
        <button className={`${tabBaseClass} ${activeTab === 'theaters' ? activeTabClass : inactiveTabClass}`} onClick={() => setActiveTab('theaters')}>
          <HeartIcon className="w-5 h-5 sm:w-6 sm:h-6" /> 影城收藏
        </button>
         {/* FIX: Corrected typo in variable name from tabBaseСlass to tabBaseClass */}
         <button className={`${tabBaseClass} ${activeTab === 'events' ? activeTabClass : inactiveTabClass}`} onClick={() => setActiveTab('events')}>
          <UsersIcon className="w-5 h-5 sm:w-6 sm:h-6" /> 我的揪團
        </button>
      </div>
      <div className="bg-gray-800 p-4 sm:p-6 rounded-b-lg">
        {renderContent()}
      </div>
    </div>
  );
};

export default Collection;