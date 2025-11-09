import React, { useState, useEffect } from 'react';
import { SparklesIcon, LocationIcon } from './Icons';
import { Movie } from '../types';
import { getAllMovies } from '../services/api';
import MovieCard from './MovieCard';
import Spinner from './Spinner';

interface HomeProps {
  onSearch: (query: string) => void;
  onShowNearby: () => void;
  onSelectMovie: (movie: Movie) => void;
}

const Home: React.FC<HomeProps> = ({ onSearch, onShowNearby, onSelectMovie }) => {
  const [query, setQuery] = useState('');
  const [upcomingMovies, setUpcomingMovies] = useState<Movie[]>([]);
  const [nowPlayingMovies, setNowPlayingMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMovies = async () => {
      setLoading(true);
      const allMovies = await getAllMovies();
      const today = new Date().toISOString().split('T')[0];
      setNowPlayingMovies(allMovies.filter(m => m.releaseDate <= today && m.bookingOpen));
      setUpcomingMovies(allMovies.filter(m => m.releaseDate > today || !m.bookingOpen));
      setLoading(false);
    }
    fetchMovies();
  }, []);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if(query.trim()){
      onSearch(query.trim());
    }
  };

  return (
    <div className="flex flex-col items-center justify-center text-center h-full pt-10 sm:pt-16">
      <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight">
        <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-teal-500">
          想看什麼？
        </span>
        <br />
        直接開口問我吧！
      </h1>
      <p className="mt-4 max-w-2xl text-lg text-gray-400">
        不只能搜尋，試試看更聰明的問法，例如：
        <br />
        <span className="text-white font-semibold">「我想看哥吉拉，找最近的電影院」</span>
      </p>

      <div className="mt-10 w-full max-w-2xl">
        <form onSubmit={handleSubmit} className="relative mb-4">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="例如：哥吉拉與金剛，離我最近的電影院"
            className="w-full bg-gray-800 border-2 border-gray-700 text-white rounded-full py-4 pl-6 pr-20 text-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all"
          />
          <button type="submit" className="absolute inset-y-0 right-0 px-6 flex items-center text-cyan-400 hover:text-cyan-300">
            <SparklesIcon className="w-7 h-7" />
          </button>
        </form>

        <button
          onClick={onShowNearby}
          className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3 bg-transparent border-2 border-teal-500 text-teal-400 rounded-full font-semibold hover:bg-teal-500 hover:text-white transition-colors duration-300"
        >
          <LocationIcon className="w-5 h-5 mr-2" />
          搜尋附近電影院
        </button>
      </div>

      <div className="w-full max-w-7xl mt-20 text-left">
          {loading ? (
             <div className="flex justify-center items-center h-64"><Spinner /></div>
          ) : (
            <>
              {nowPlayingMovies.length > 0 && (
                <section>
                  <h2 className="text-3xl font-bold mb-6 border-b-2 border-cyan-500 pb-2">現正熱映</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                      {nowPlayingMovies.map(movie => (
                          <MovieCard key={movie.id} movie={movie} onSelectMovie={onSelectMovie} />
                      ))}
                  </div>
                </section>
              )}
              {upcomingMovies.length > 0 && (
                <section className="mt-12">
                   <h2 className="text-3xl font-bold mb-6 border-b-2 border-teal-500 pb-2">即將上映</h2>
                   <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                      {upcomingMovies.map(movie => (
                          <MovieCard key={movie.id} movie={movie} onSelectMovie={onSelectMovie} />
                      ))}
                  </div>
                </section>
              )}
            </>
          )}
      </div>

    </div>
  );
};

export default Home;