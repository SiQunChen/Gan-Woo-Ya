import React from 'react';
import { Review } from '../types';
import StarRating from './StarRating';

interface ReviewListProps {
  reviews: Review[];
}

const ReviewList: React.FC<ReviewListProps> = ({ reviews }) => {
  if (reviews.length === 0) {
    return <p className="text-gray-400 text-center py-8">目前沒有任何評論。成為第一個！</p>;
  }

  return (
    <div className="space-y-6 mt-6">
      {reviews.map(review => (
        <div key={review.id} className="bg-gray-800/50 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-cyan-800 flex items-center justify-center font-bold text-cyan-300">
                    {review.username.charAt(0)}
                </div>
                <span className="font-semibold text-white">{review.username}</span>
            </div>
            <StarRating rating={review.rating} size="sm" />
          </div>
          <p className="text-gray-300">{review.comment}</p>
          <p className="text-xs text-gray-500 text-right mt-2">
            {new Date(review.createdAt).toLocaleDateString()}
          </p>
        </div>
      ))}
    </div>
  );
};

export default ReviewList;