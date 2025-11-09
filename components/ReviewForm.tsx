import React, { useState } from 'react';
import StarRating from './StarRating';

interface ReviewFormProps {
  onSubmit: (rating: number, comment: string) => void;
}

const ReviewForm: React.FC<ReviewFormProps> = ({ onSubmit }) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating > 0 && comment.trim()) {
      onSubmit(rating, comment.trim());
      setRating(0);
      setComment('');
    } else {
        alert("請選擇評分並留下您的評論！")
    }
  };

  return (
    <div className="bg-gray-800 p-4 rounded-lg mb-6">
      <h3 className="text-lg font-semibold text-white mb-2">留下您的評論</h3>
      <form onSubmit={handleSubmit}>
        <div 
            className="flex items-center mb-4"
            onMouseLeave={() => setHoverRating(0)}
        >
          <StarRating rating={hoverRating || rating} setRating={(r) => {setRating(r); setHoverRating(r)}} size="md" />
        </div>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="分享您的觀影心得..."
          className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          rows={3}
        ></textarea>
        <div className="text-right mt-2">
          <button
            type="submit"
            className="px-4 py-2 bg-cyan-600 text-white font-semibold rounded-full hover:bg-cyan-500 transition-colors disabled:bg-gray-500"
            disabled={!comment.trim() || rating === 0}
          >
            送出評論
          </button>
        </div>
      </form>
    </div>
  );
};

export default ReviewForm;