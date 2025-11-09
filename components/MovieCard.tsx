
import React from 'react';
import { Movie } from '../types';

interface MovieCardProps {
  movie: Movie;
  onSelectMovie: (movie: Movie) => void;
}

const MovieCard: React.FC<MovieCardProps> = ({ movie, onSelectMovie }) => {
  return (
    <div 
      className="group cursor-pointer"
      onClick={() => onSelectMovie(movie)}
    >
      <div className="aspect-[2/3] overflow-hidden rounded-lg bg-gray-800">
        <img
          src={movie.posterUrl}
          alt={movie.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>
      <h3 className="mt-2 text-sm font-semibold text-white truncate group-hover:text-cyan-400">{movie.title}</h3>
      <p className="text-xs text-gray-400 truncate">{movie.englishTitle}</p>
    </div>
  );
};

export default MovieCard;
