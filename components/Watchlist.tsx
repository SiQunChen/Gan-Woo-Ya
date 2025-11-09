import React, { useState, useEffect } from 'react';
import { Movie } from '../types';
import { getMoviesByIds } from '../services/api';
import { useUser } from '../contexts/UserContext';
import MovieCard from './MovieCard';
import Spinner from './Spinner';
import { BookmarkIcon } from './Icons';

interface WatchlistProps {
  onSelectMovie: (movie: Movie) => void;
}

const Watchlist: React.FC<WatchlistProps> = ({ onSelectMovie }) => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const { movieWatchlistIds } = useUser();

  useEffect(() => {
    const fetchWatchlistMovies = async () => {
      setLoading(true);
      // Fix: Use spread syntax to convert Set to array to ensure correct type inference for `getMoviesByIds`.
      const movieIds = [...movieWatchlistIds];
      if (movieIds.length > 0) {
        const watchlistMovies = await getMoviesByIds(movieIds);
        setMovies(watchlistMovies);
      } else {
        setMovies([]);
      }
      setLoading(false);
    };

    fetchWatchlistMovies();
  }, [movieWatchlistIds]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner />
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-3xl font-bold mb-6 flex items-center">
        <BookmarkIcon className="w-8 h-8 mr-3 text-cyan-400" />
        我的待看清單
      </h2>
      {movies.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {movies.map(movie => (
            <MovieCard key={movie.id} movie={movie} onSelectMovie={onSelectMovie} />
          ))}
        </div>
      ) : (
        <p className="text-gray-400 text-center py-10">您的待看清單是空的。去逛逛電影並將它們加入清單吧！</p>
      )}
    </div>
  );
};

export default Watchlist;
