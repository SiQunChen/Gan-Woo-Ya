import React, { useState, useEffect } from 'react';
import { Movie, Theater } from '../types';
import { search } from '../services/api';
import MovieCard from './MovieCard';
import Spinner from './Spinner';
import { LocationIcon } from './Icons';

interface TheaterCardProps {
  theater: Theater;
  onSelectTheater: (theater: Theater) => void;
}

const TheaterCard: React.FC<TheaterCardProps> = ({ theater, onSelectTheater }) => {
  return (
    <div 
      className="group cursor-pointer bg-gray-800 p-4 rounded-lg hover:bg-gray-700 transition-colors h-full flex flex-col justify-center"
      onClick={() => onSelectTheater(theater)}
    >
      <h3 className="text-md font-semibold text-white truncate group-hover:text-cyan-400">{theater.name}</h3>
      <div className="flex items-center mt-2 text-xs text-gray-400">
        <LocationIcon className="w-4 h-4 mr-1 flex-shrink-0" />
        <p className="truncate">{theater.address}</p>
      </div>
    </div>
  );
};


interface SearchResultsProps {
  query: string;
  onSelectMovie: (movie: Movie) => void;
  onSelectTheater: (theater: Theater) => void;
}

const SearchResults: React.FC<SearchResultsProps> = ({ query, onSelectMovie, onSelectTheater }) => {
  const [movieResults, setMovieResults] = useState<Movie[]>([]);
  const [theaterResults, setTheaterResults] = useState<Theater[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      const { movies, theaters } = await search(query);
      setMovieResults(movies);
      setTheaterResults(theaters);
      setLoading(false);
    };
    fetchResults();
  }, [query]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner />
      </div>
    );
  }
  
  const hasResults = movieResults.length > 0 || theaterResults.length > 0;

  return (
    <div>
      <h2 className="text-3xl font-bold mb-6">
        搜尋結果：<span className="text-cyan-400">"{query}"</span>
      </h2>
      {hasResults ? (
        <div className="space-y-12">
          {movieResults.length > 0 && (
            <section>
              <h3 className="text-2xl font-bold mb-4 border-b-2 border-cyan-500 pb-2">電影</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {movieResults.map(movie => (
                  <MovieCard key={movie.id} movie={movie} onSelectMovie={onSelectMovie} />
                ))}
              </div>
            </section>
          )}
          {theaterResults.length > 0 && (
             <section>
              <h3 className="text-2xl font-bold mb-4 border-b-2 border-cyan-500 pb-2">電影院</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {theaterResults.map(theater => (
                  <TheaterCard key={theater.id} theater={theater} onSelectTheater={onSelectTheater} />
                ))}
              </div>
            </section>
          )}
        </div>
      ) : (
        <p className="text-gray-400 text-center py-10">找不到相關電影或電影院，請試試其他關鍵字。</p>
      )}
    </div>
  );
};

export default SearchResults;