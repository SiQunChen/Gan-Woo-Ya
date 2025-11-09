import React, { useState, useEffect } from 'react';
import { MovieBuddyEvent, Movie, Theater } from '../types';
import { getMovieBuddyEventById, getMovieById, getTheaterById } from '../services/api';
import Spinner from './Spinner';
import { useUser } from '../contexts/UserContext';
import { ClockIcon, FilmIcon, LocationIcon, StarIcon, UsersIcon } from './Icons';

interface MovieBuddyEventDetailsProps {
  eventId: string;
  onSelectMovie: (movie: Movie) => void;
  onSelectTheater: (theater: Theater) => void;
}

const MovieBuddyEventDetails: React.FC<MovieBuddyEventDetailsProps> = ({ eventId, onSelectMovie, onSelectTheater }) => {
  const [event, setEvent] = useState<MovieBuddyEvent | null>(null);
  const [movie, setMovie] = useState<Movie | null>(null);
  const [theater, setTheater] = useState<Theater | null>(null);
  const [loading, setLoading] = useState(true);
  const { user, isJoinedEvent, toggleJoinedEvent, login } = useUser();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const fetchedEvent = await getMovieBuddyEventById(eventId);
      if (fetchedEvent) {
        setEvent(fetchedEvent);
        const [fetchedMovie, fetchedTheater] = await Promise.all([
          getMovieById(fetchedEvent.movieId),
          getTheaterById(fetchedEvent.theaterId)
        ]);
        setMovie(fetchedMovie || null);
        setTheater(fetchedTheater || null);
      }
      setLoading(false);
    };
    fetchData();
  }, [eventId]);
  
  const handleJoinToggle = () => {
      if (!user) {
          alert('請先登入才能加入揪團！');
          login();
          return;
      }
      if (!user.isVerified) {
          alert('為了社群安全，加入揪團前請先至您的個人檔案頁面完成手機實名驗證。');
          return;
      }
      toggleJoinedEvent(eventId);
  }

  const handleReport = () => {
    if (window.confirm('您確定要檢舉並封鎖此使用者嗎？此動作無法復原。')) {
      alert('已成功檢舉並封鎖該使用者。我們將會審核此事件。');
    }
  }

  if (loading) return <div className="flex justify-center items-center h-96"><Spinner /></div>;
  if (!event || !movie || !theater) return <p className="text-center text-gray-400">找不到揪團資訊。</p>;
  
  const isEventFull = event.participants.length >= event.maxParticipants;
  const hasJoined = isJoinedEvent(event.id);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-1">
        <img src={movie.posterUrl} alt={movie.title} className="w-full rounded-lg shadow-lg cursor-pointer" onClick={() => onSelectMovie(movie)} />
        <div className="mt-4 bg-gray-800 p-4 rounded-lg">
           <h3 className="text-xl font-bold text-white cursor-pointer hover:text-cyan-400" onClick={() => onSelectMovie(movie)}>{movie.title}</h3>
           <p className="text-gray-400">{movie.englishTitle}</p>
           <div className="mt-3 space-y-2 text-gray-300">
               <div className="flex items-center gap-2"><ClockIcon className="w-5 h-5 text-cyan-400" /> <span>{event.showtime.time} ({event.showtime.language === 'English' ? '英文版' : '中文版'})</span></div>
               <div className="flex items-center gap-2"><LocationIcon className="w-5 h-5 text-cyan-400" /> <span className="cursor-pointer hover:underline" onClick={() => onSelectTheater(theater)}>{theater.name}</span></div>
               <div className="flex items-center gap-2"><FilmIcon className="w-5 h-5 text-cyan-400" /> <span>{event.showtime.screenType}</span></div>
           </div>
        </div>
      </div>
      <div className="lg:col-span-2">
        <h1 className="text-4xl font-extrabold text-white">{event.title}</h1>
        <div className="flex items-center gap-2 mt-2">
            <UsersIcon className="w-6 h-6 text-cyan-400" />
            <span className="text-2xl font-bold text-white">{event.participants.length} / {event.maxParticipants} 人</span>
        </div>
        <p className="mt-4 text-gray-300 leading-relaxed">{event.description}</p>
        
        <div className="mt-8">
            <h2 className="text-2xl font-bold mb-4 border-b-2 border-cyan-500 pb-2">主揪 (Movie Persona)</h2>
            <div className="bg-gray-800/50 p-4 rounded-lg flex items-center gap-4">
                <img src={event.organizer.avatarUrl} alt={event.organizer.username} className="w-16 h-16 rounded-full" />
                <div>
                    <h3 className="text-xl font-semibold text-white">{event.organizer.username}</h3>
                    <div className="flex items-center gap-2 text-yellow-400 mt-1">
                        <StarIcon className="w-5 h-5" /> <span className="font-bold">信任分數: {event.organizer.trustScore.toFixed(1)}</span>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                        {event.organizer.viewingHabitTags.map(tag => (
                            <span key={tag} className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded-full">{tag}</span>
                        ))}
                    </div>
                </div>
            </div>
        </div>

         <div className="mt-8">
            <h2 className="text-2xl font-bold mb-4 border-b-2 border-cyan-500 pb-2">參加者</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {event.participants.map(p => (
                    <div key={p.userId} className="text-center">
                        <img src={p.avatarUrl} alt={p.username} className="w-16 h-16 rounded-full mx-auto" />
                        <p className="mt-2 text-sm text-gray-300 truncate">{p.username}</p>
                    </div>
                ))}
            </div>
        </div>

        <div className="mt-8 text-center">
            <button 
                onClick={handleJoinToggle}
                disabled={!hasJoined && isEventFull}
                className="w-full max-w-sm px-8 py-4 text-xl font-bold text-white rounded-full transition-colors duration-300 disabled:bg-gray-600 disabled:cursor-not-allowed
                           bg-cyan-600 hover:bg-cyan-500"
            >
                {hasJoined ? '退出揪團' : (isEventFull ? '已額滿' : '加入揪團')}
            </button>
        </div>

        <div className="mt-8 bg-gray-800 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-2">團內聊天室 (示意)</h3>
            <div className="h-40 bg-gray-900 rounded p-2 text-sm text-gray-400 overflow-y-auto">
                <p><span className="font-semibold text-cyan-400">{event.organizer.username}:</span> 大家好！票我會先買好，當天在門口集合喔！</p>
                <p><span className="font-semibold text-cyan-400">{event.participants.find(p => p.userId !== event.organizer.userId)?.username || ''}:</span> 收到！</p>
            </div>
             <div className="text-right mt-2">
                <button onClick={handleReport} className="text-xs text-gray-500 hover:text-red-400 underline">檢舉並封鎖</button>
            </div>
        </div>

      </div>
    </div>
  );
};

export default MovieBuddyEventDetails;
