import React, { useState, useEffect, useMemo } from 'react';
import { Theater, Showtime, Movie } from '../types';
import { getShowtimesByTheaterId, getMoviesByIds } from '../services/api';
import Spinner from './Spinner';
import { LocationIcon, HeartIcon } from './Icons';
import { useUser } from '../contexts/UserContext';
import ShowtimeItem from './ShowtimeItem';
import { getDateKey, formatDateLabel } from '../utils/showtime';

interface TheaterDetailsProps {
  theater: Theater;
  onSelectMovie: (movie: Movie) => void;
}

const dateSelectClass =
  "bg-gray-700 border-2 border-gray-700 text-gray-200 rounded-full py-2 px-4 focus:outline-none focus:ring-2 focus:ring-cyan-500 w-full md:w-auto";

const TheaterDetails: React.FC<TheaterDetailsProps> = ({ theater, onSelectMovie }) => {
  const [showtimes, setShowtimes] = useState<Showtime[]>([]);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const { user, isFavoriteTheater, toggleFavoriteTheater } = useUser();
  const theaterSourceId = theater.source_id;
  const isFavorite = user ? isFavoriteTheater(theaterSourceId) : false;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
  const fetchedShowtimes = await getShowtimesByTheaterId(theaterSourceId);
      const movieIds = [...new Set(fetchedShowtimes.map(s => s.movieId))];
      const fetchedMovies = await getMoviesByIds(movieIds);
      setShowtimes(fetchedShowtimes);
      setMovies(fetchedMovies);
      setLoading(false);
    };
    fetchData();
  }, [theaterSourceId]);

  const handleToggleFavorite = () => {
    if (user) {
  toggleFavoriteTheater(theaterSourceId);
    } else {
      alert('請先登入才能將影城加入最愛！');
    }
  };
  
  const dateOptions = useMemo(() => {
    const uniqueDates = Array.from(
      new Set(
        showtimes
          .map(s => getDateKey(s.time))
          .filter((value): value is string => Boolean(value))
      )
    ) as string[];
    uniqueDates.sort();
    return uniqueDates.map(value => ({ value, label: formatDateLabel(value) }));
  }, [showtimes]);

  useEffect(() => {
    if (dateOptions.length === 0) {
      setSelectedDate('');
      return;
    }
    if (!dateOptions.some(option => option.value === selectedDate)) {
      setSelectedDate(dateOptions[0].value);
    }
  }, [dateOptions, selectedDate]);

  const filteredShowtimes = useMemo(() => {
    return showtimes.filter(showtime => {
      const dateKey = getDateKey(showtime.time);
      return !selectedDate || dateKey === selectedDate;
    });
  }, [showtimes, selectedDate]);

  const moviesWithShowtimes = useMemo(() => {
    return movies
      .map(movie => ({
        ...movie,
        showtimes: filteredShowtimes
          .filter(s => s.movieId === movie.source_id)
          .sort((a, b) => a.time.localeCompare(b.time)),
      }))
      .filter(m => m.showtimes.length > 0);
  }, [movies, filteredShowtimes]);

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(theater.address)}`;

  return (
    <div>
      <div className="bg-gray-800 p-6 rounded-lg mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-extrabold text-white">{theater.name}</h1>
            <div className="flex items-center text-gray-400 mt-2">
              <LocationIcon className="w-5 h-5 mr-2 flex-shrink-0" />
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-cyan-400 hover:underline transition-colors"
                title="在 Google 地圖上查看"
              >
                {theater.address}
              </a>
            </div>
          </div>
           <button onClick={handleToggleFavorite} className="group flex-shrink-0 text-gray-400 hover:text-red-500 transition-colors p-2" title={isFavorite ? "從最愛移除" : "加入最愛"}>
              <HeartIcon className={`w-8 h-8 ${isFavorite ? 'text-red-500 fill-current' : ''}`} />
            </button>
        </div>
      </div>
      
      <div className="mb-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-3xl font-bold">場次時刻表</h2>
            {selectedDate && (
              <p className="text-gray-400 mt-1">{formatDateLabel(selectedDate)}</p>
            )}
          </div>
          {dateOptions.length > 0 && (
            <div className="w-full md:w-auto flex items-center gap-3">
              <label className="font-semibold text-white" htmlFor="theater-date-select">日期:</label>
              <select
                id="theater-date-select"
                className={dateSelectClass}
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
              >
                {dateOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Spinner />
        </div>
      ) : (
        <div className="space-y-8">
            {moviesWithShowtimes.length > 0 ? (
              moviesWithShowtimes.map(movie => (
                <div key={movie.id} className="flex flex-col md:flex-row gap-6 bg-gray-800/50 p-4 rounded-lg">
                    <div className="md:w-1/5 flex-shrink-0">
                       <img 
                         src={movie.posterUrl} 
                         alt={movie.title} 
                         className="w-full rounded-md cursor-pointer hover:opacity-80 transition-opacity"
                         onClick={() => onSelectMovie(movie)}
                       />
                    </div>
                    <div className="md:w-4/5">
                        <h3 
                            className="text-2xl font-bold text-cyan-400 cursor-pointer hover:text-cyan-300"
                            onClick={() => onSelectMovie(movie)}
                        >{movie.title}</h3>
                        <p className="text-gray-400">{movie.englishTitle}</p>
                        <div className="mt-4">
                            <h4 className="font-semibold text-lg mb-2">場次</h4>
                            <div className="flex flex-wrap gap-2">
                            {movie.showtimes.map(showtime => (
                              <ShowtimeItem key={showtime.id} showtime={showtime} />
                            ))}
                            </div>
                        </div>
                    </div>
                </div>
            ))
          ) : (
            <div className="text-center py-10 text-gray-400">
              <p>該日期沒有場次，請選擇其他日期。</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TheaterDetails;