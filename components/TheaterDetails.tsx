import React, { useState, useEffect } from 'react';
import { Theater, Showtime, Movie } from '../types';
import { getShowtimesByTheaterId, getMoviesByIds } from '../services/api';
import Spinner from './Spinner';
import { LocationIcon, HeartIcon } from './Icons';
import { useUser } from '../contexts/UserContext';

interface TheaterDetailsProps {
  theater: Theater;
  onSelectMovie: (movie: Movie) => void;
}

const TheaterDetails: React.FC<TheaterDetailsProps> = ({ theater, onSelectMovie }) => {
  const [showtimes, setShowtimes] = useState<Showtime[]>([]);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, isFavoriteTheater, toggleFavoriteTheater } = useUser();

  const isFavorite = user ? isFavoriteTheater(theater.id) : false;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const fetchedShowtimes = await getShowtimesByTheaterId(theater.id);
      const movieIds = [...new Set(fetchedShowtimes.map(s => s.movieId))];
      const fetchedMovies = await getMoviesByIds(movieIds);
      setShowtimes(fetchedShowtimes);
      setMovies(fetchedMovies);
      setLoading(false);
    };
    fetchData();
  }, [theater.id]);

  const handleToggleFavorite = () => {
    if (user) {
      toggleFavoriteTheater(theater.id);
    } else {
      alert('請先登入才能將影城加入最愛！');
    }
  };
  
  const moviesWithShowtimes = movies.map(movie => ({
      ...movie,
      showtimes: showtimes.filter(s => s.movieId === movie.id).sort((a,b) => a.time.localeCompare(b.time)),
  })).filter(m => m.showtimes.length > 0);

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
      
      <h2 className="text-3xl font-bold mb-4">今日時刻表</h2>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Spinner />
        </div>
      ) : (
        <div className="space-y-8">
            {moviesWithShowtimes.map(movie => (
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
                                <a
                                    key={showtime.id}
                                    href={theater.bookingUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group relative flex flex-col items-center justify-center w-28 h-24 bg-gray-700 text-white rounded-md hover:bg-cyan-600 transition-colors duration-200 text-center p-1"
                                >
                                    <span className="text-xl font-bold">{showtime.time}</span>
                                     <div className="mt-1">
                                        <span className="font-bold text-base">
                                            ${showtime.price}
                                        </span>
                                    </div>
                                    <div className="text-xs text-gray-400 group-hover:text-white mt-1">
                                      {showtime.language.slice(0,1)} / {showtime.screenType}
                                    </div>
                                </a>
                            ))}
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
      )}
    </div>
  );
};

export default TheaterDetails;