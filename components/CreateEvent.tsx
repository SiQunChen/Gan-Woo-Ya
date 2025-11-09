import React, { useState, useEffect, useMemo } from 'react';
import { Movie, Showtime, Theater } from '../types';
import { getShowtimesByMovieId, getTheatersByIds, createMovieBuddyEvent } from '../services/api';
import { useUser } from '../contexts/UserContext';
import Spinner from './Spinner';

interface CreateEventProps {
  movie: Movie;
  onEventCreated: (eventId: string) => void;
  onCancel: () => void;
}

interface ShowtimeByTheater {
  theater: Theater;
  showtimes: Showtime[];
}

const CreateEvent: React.FC<CreateEventProps> = ({ movie, onEventCreated, onCancel }) => {
  const { user } = useUser();
  const [showtimesByTheater, setShowtimesByTheater] = useState<ShowtimeByTheater[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    maxParticipants: 2,
    selectedShowtimeId: '',
  });

  useEffect(() => {
    const fetchShowtimes = async () => {
      setLoading(true);
      const fetchedShowtimes = await getShowtimesByMovieId(movie.id);
      const theaterIds = [...new Set(fetchedShowtimes.map(s => s.theaterId))];
      const fetchedTheaters = await getTheatersByIds(theaterIds);
      
      const grouped = fetchedTheaters.map(theater => ({
        theater,
        showtimes: fetchedShowtimes.filter(s => s.theaterId === theater.id).sort((a,b) => a.time.localeCompare(b.time)),
      })).filter(group => group.showtimes.length > 0);

      setShowtimesByTheater(grouped);
      setLoading(false);
    };
    fetchShowtimes();
  }, [movie.id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === 'maxParticipants' ? parseInt(value, 10) : value }));
  };
  
  const handleShowtimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData(prev => ({ ...prev, selectedShowtimeId: e.target.value }));
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !formData.selectedShowtimeId || !formData.title.trim()) {
        alert('請填寫活動標題並選擇一個場次！');
        return;
    }

    setIsSubmitting(true);
    
    let selectedShowtime: Showtime | undefined;
    let selectedTheater: Theater | undefined;

    for (const group of showtimesByTheater) {
        const found = group.showtimes.find(s => s.id === formData.selectedShowtimeId);
        if (found) {
            selectedShowtime = found;
            selectedTheater = group.theater;
            break;
        }
    }
    
    if (!selectedShowtime || !selectedTheater) {
        alert('選擇的場次無效，請重新選擇。');
        setIsSubmitting(false);
        return;
    }

    try {
        const newEvent = await createMovieBuddyEvent({
            movieId: movie.id,
            theaterId: selectedTheater.id,
            showtime: selectedShowtime,
            organizer: {
                userId: user.id,
                username: user.name,
                avatarUrl: user.avatarUrl,
                viewingHabitTags: user.viewingHabitTags,
                trustScore: user.trustScore,
            },
            title: formData.title.trim(),
            description: formData.description.trim(),
            maxParticipants: formData.maxParticipants,
        });
        alert('揪團活動已成功建立！');
        onEventCreated(newEvent.id);
    } catch (error) {
        console.error("Failed to create event:", error);
        alert('建立活動時發生錯誤，請稍後再試。');
        setIsSubmitting(false);
    }
  };
  
  const isFormValid = formData.title.trim() !== '' && formData.selectedShowtimeId !== '';

  return (
    <div>
      <h2 className="text-3xl font-bold mb-6">發起新的揪團：<span className="text-cyan-400">{movie.title}</span></h2>
      {loading ? (
        <div className="flex justify-center items-center h-64"><Spinner /></div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-xl font-semibold text-white mb-4">1. 活動資訊</h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-300">活動標題</label>
                <input type="text" id="title" name="title" value={formData.title} onChange={handleInputChange} required className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 mt-1 focus:outline-none focus:ring-2 focus:ring-cyan-500" />
              </div>
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-300">活動簡介 (選填)</label>
                <textarea id="description" name="description" value={formData.description} onChange={handleInputChange} rows={3} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 mt-1 focus:outline-none focus:ring-2 focus:ring-cyan-500"></textarea>
              </div>
              <div>
                <label htmlFor="maxParticipants" className="block text-sm font-medium text-gray-300">人數上限 (含自己)</label>
                <input type="number" id="maxParticipants" name="maxParticipants" value={formData.maxParticipants} onChange={handleInputChange} min="2" max="10" className="w-32 bg-gray-700 border border-gray-600 text-white rounded-md p-2 mt-1 focus:outline-none focus:ring-2 focus:ring-cyan-500" />
              </div>
            </div>
          </div>
          
          <div className="bg-gray-800 p-6 rounded-lg">
             <h3 className="text-xl font-semibold text-white mb-4">2. 選擇場次</h3>
             <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                {showtimesByTheater.map(({ theater, showtimes }) => (
                    <div key={theater.id}>
                        <h4 className="font-bold text-cyan-400">{theater.name}</h4>
                        <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                           {showtimes.map(showtime => (
                                <label key={showtime.id} className={`p-2 rounded-md border-2 text-center cursor-pointer transition-colors ${formData.selectedShowtimeId === showtime.id ? 'bg-cyan-500 border-cyan-400' : 'bg-gray-700 border-gray-700 hover:border-gray-500'}`}>
                                    <input type="radio" name="selectedShowtimeId" value={showtime.id} checked={formData.selectedShowtimeId === showtime.id} onChange={handleShowtimeChange} className="sr-only" />
                                    <div className="font-bold text-lg">{showtime.time}</div>
                                    <div className="text-sm">${showtime.price}</div>
                                    <div className="text-xs text-gray-300">{showtime.language.slice(0,1)} / {showtime.screenType}</div>
                                </label>
                           ))}
                        </div>
                    </div>
                ))}
             </div>
          </div>

          <div className="flex justify-end gap-4">
            <button type="button" onClick={onCancel} className="px-6 py-3 bg-gray-600 text-white font-semibold rounded-full hover:bg-gray-500 transition-colors">
              取消
            </button>
            <button type="submit" disabled={!isFormValid || isSubmitting} className="px-6 py-3 bg-cyan-600 text-white font-semibold rounded-full hover:bg-cyan-500 transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed">
              {isSubmitting ? <Spinner size="sm" /> : '建立揪團'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default CreateEvent;
