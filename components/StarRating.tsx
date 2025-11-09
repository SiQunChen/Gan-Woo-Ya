import React from 'react';
import { StarIcon } from './Icons';

interface StarRatingProps {
  rating: number;
  setRating?: (rating: number) => void;
  size?: 'sm' | 'md' | 'lg';
}

const StarRating: React.FC<StarRatingProps> = ({ rating, setRating, size = 'md' }) => {
  const sizeClasses = {
      sm: 'w-4 h-4',
      md: 'w-6 h-6',
      lg: 'w-8 h-8'
  }
  return (
    <div className="flex items-center">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!setRating}
          onClick={() => setRating && setRating(star)}
          onMouseOver={() => setRating && setRating(star)}
          className={`
            ${sizeClasses[size]}
            ${star <= rating ? 'text-yellow-400' : 'text-gray-600'}
            ${setRating ? 'cursor-pointer' : ''}
          `}
        >
          <StarIcon />
        </button>
      ))}
    </div>
  );
};

export default StarRating;