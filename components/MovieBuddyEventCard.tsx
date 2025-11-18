import React from 'react';
import { MovieBuddyEvent, Movie } from '../types';
import { UsersIcon, LocationIcon, ClockIcon } from './Icons';
import { getLanguageLabel, getScreenTypeLabel } from '../utils/showtime';

interface MovieBuddyEventCardProps {
  event: MovieBuddyEvent;
  movie: Movie;
  onSelectEvent: (eventId: string) => void;
}

const MovieBuddyEventCard: React.FC<MovieBuddyEventCardProps> = ({ event, movie, onSelectEvent }) => {
  return (
    <div
      className="group bg-gray-800 rounded-lg overflow-hidden flex cursor-pointer hover:bg-gray-700/80 transition-all duration-300"
      onClick={() => onSelectEvent(event.id)}
    >
      <div className="w-1/3 flex-shrink-0">
        <img src={movie.posterUrl} alt={movie.title} className="w-full h-full object-cover" />
      </div>
      <div className="p-4 flex flex-col justify-between w-2/3">
        <div>
          <h3 className="font-bold text-lg text-white group-hover:text-cyan-400 truncate">{event.title}</h3>
          <p className="text-sm text-gray-300 truncate">{movie.title}</p>
          <div className="mt-2 space-y-1 text-xs text-gray-400">
            <div className="flex items-center gap-1.5">
              <ClockIcon className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">{event.showtime.time}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <LocationIcon className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">{getScreenTypeLabel(event.showtime.screenType)} / {getLanguageLabel(event.showtime.language)}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end mt-2">
            <div className="flex items-center gap-1.5 px-3 py-1 bg-cyan-600/50 text-cyan-300 rounded-full">
                <UsersIcon className="w-4 h-4" />
                <span className="text-sm font-semibold">{event.participants.length} / {event.maxParticipants}</span>
            </div>
        </div>
      </div>
    </div>
  );
};

export default MovieBuddyEventCard;