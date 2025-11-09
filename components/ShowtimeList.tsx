import React, { useState, useMemo } from 'react';
import { Showtime, Theater, TimeOfDay, PriceSort } from '../types';
import Filters from './Filters';
import ShowtimeItem from './ShowtimeItem';

interface ShowtimeListProps {
  showtimes: Showtime[];
  theaters: Theater[];
  onSelectTheater: (theater: Theater) => void;
}

const getTimeOfDay = (time: string): TimeOfDay => {
  const hour = parseInt(time.split(':')[0], 10);
  if (hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  if (hour < 22) return 'evening';
  return 'late-night';
};

const ShowtimeList: React.FC<ShowtimeListProps> = ({ showtimes, theaters, onSelectTheater }) => {
  const [selectedTimes, setSelectedTimes] = useState<Set<TimeOfDay>>(new Set());
  const [selectedScreen, setSelectedScreen] = useState<string>('all');
  const [selectedLang, setSelectedLang] = useState<string>('all');
  const [priceSort, setPriceSort] = useState<PriceSort>('default');
  
  const screenTypes = useMemo(() => ['all', ...Array.from(new Set(showtimes.map(s => s.screenType)))], [showtimes]);
  const languages = useMemo(() => ['all', ...Array.from(new Set(showtimes.map(s => s.language)))], [showtimes]);

  const filteredShowtimes = useMemo(() => {
    let sorted = [...showtimes];
    if (priceSort === 'asc') {
        sorted.sort((a,b) => a.price - b.price);
    }

    return sorted.filter(s => {
      const timeOfDay = getTimeOfDay(s.time);
      const timeMatch = selectedTimes.size === 0 || selectedTimes.has(timeOfDay);
      const screenMatch = selectedScreen === 'all' || s.screenType === selectedScreen;
      const langMatch = selectedLang === 'all' || s.language === selectedLang;
      return timeMatch && screenMatch && langMatch;
    });
  }, [showtimes, selectedTimes, selectedScreen, selectedLang, priceSort]);

  const showtimesByTheater = useMemo(() => {
    const grouped: { [key: string]: Showtime[] } = {};
    filteredShowtimes.forEach(showtime => {
      if (!grouped[showtime.theaterId]) {
        grouped[showtime.theaterId] = [];
      }
      grouped[showtime.theaterId].push(showtime);
    });
    return Object.entries(grouped).map(([theaterId, times]) => ({
      theater: theaters.find(t => t.id === theaterId),
      showtimes: priceSort === 'asc' ? times : times.sort((a,b) => a.time.localeCompare(b.time)),
    })).filter(item => item.theater);
  }, [filteredShowtimes, theaters, priceSort]);

  return (
    <div className="space-y-6">
      <Filters
        selectedTimes={selectedTimes}
        setSelectedTimes={setSelectedTimes}
        screenTypes={screenTypes}
        selectedScreen={selectedScreen}
        setSelectedScreen={setSelectedScreen}
        languages={languages}
        selectedLang={selectedLang}
        setSelectedLang={setSelectedLang}
        priceSort={priceSort}
        setPriceSort={setPriceSort}
      />
      {showtimesByTheater.length > 0 ? (
        showtimesByTheater.map(({ theater, showtimes }) =>
          theater ? (
            <div key={theater.id} className="bg-gray-800/50 p-4 sm:p-6 rounded-lg">
              <div
                className="flex justify-between items-center mb-4 cursor-pointer"
                onClick={() => onSelectTheater(theater)}
              >
                <div>
                  <h3 className="text-xl font-bold text-white hover:text-cyan-400 transition-colors">{theater.name}</h3>
                  <p className="text-sm text-gray-400">{theater.address}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {showtimes.map(showtime => (
                  <ShowtimeItem key={showtime.id} showtime={showtime} bookingUrl={theater.bookingUrl} />
                ))}
              </div>
            </div>
          ) : null
        )
      ) : (
        <div className="text-center py-10 text-gray-400">
            <p>沒有符合篩選條件的場次。</p>
            <p className="text-sm">請試著放寬您的篩選條件。</p>
        </div>
      )}
    </div>
  );
};

export default ShowtimeList;