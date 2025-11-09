import React from 'react';
import { Showtime } from '../types';

interface ShowtimeItemProps {
  showtime: Showtime;
  bookingUrl: string;
}

const ShowtimeItem: React.FC<ShowtimeItemProps> = ({ showtime, bookingUrl }) => {
  return (
    <a
      href={bookingUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative flex flex-col items-center justify-center w-28 h-24 bg-gray-700 text-white rounded-md hover:bg-cyan-600 transition-colors duration-200 text-center p-1"
    >
      <span className="text-xl font-bold">{showtime.time}</span>
      <div className="mt-1">
          <span className="font-semibold text-base">
              ${showtime.price}
          </span>
      </div>
      <span className="text-xs text-gray-400 group-hover:text-white mt-1">
        {showtime.language === 'English' ? '英文版' : '中文版'} / {showtime.screenType}
      </span>
    </a>
  );
};

export default ShowtimeItem;