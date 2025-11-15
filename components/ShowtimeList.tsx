import React, { useState, useMemo, useEffect } from 'react';
import { Showtime, Theater, TimeOfDay, PriceSort } from '../types';
import Filters from './Filters';
import ShowtimeItem from './ShowtimeItem';
import { getDateKey, formatDateLabel } from '../utils/showtime';

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
  const [priceSort, setPriceSort] = useState<PriceSort>('distance');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState<'idle' | 'loading' | 'granted' | 'denied' | 'unsupported'>('idle');
  
  const screenTypes = useMemo(() => ['all', ...Array.from(new Set(showtimes.map(s => s.screenType)))], [showtimes]);
  const languages = useMemo(() => ['all', ...Array.from(new Set(showtimes.map(s => s.language)))], [showtimes]);
  const dateOptions = useMemo(() => {
    const uniqueDates = Array.from(
      new Set(
        showtimes
          .map(s => getDateKey(s.time))
          .filter((value): value is string => Boolean(value))
      )
    ) as string[];
    uniqueDates.sort();

    return uniqueDates.map(value => ({ value, label: formatDateLabel(value) }));
  }, [showtimes]);

  useEffect(() => {
    if (dateOptions.length === 0) {
      setSelectedDate('');
      return;
    }
    const hasSelected = dateOptions.some(option => option.value === selectedDate);
    if (!hasSelected) {
      setSelectedDate(dateOptions[0].value);
    }
  }, [dateOptions, selectedDate]);

  useEffect(() => {
    const fallbackToTimeSort = () => {
      setPriceSort(prev => (prev === 'distance' ? 'time' : prev));
    };

    if (typeof window === 'undefined' || typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      setLocationStatus('unsupported');
      fallbackToTimeSort();
      return;
    }
    setLocationStatus('loading');
    navigator.geolocation.getCurrentPosition(
      position => {
        setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
        setLocationStatus('granted');
      },
      error => {
        console.warn('Unable to retrieve location for showtime sorting:', error);
        setLocationStatus('denied');
        fallbackToTimeSort();
      },
      { timeout: 10000 }
    );
  }, []);

  const filteredShowtimes = useMemo(() => {
    return showtimes.filter(s => {
      const timeOfDay = getTimeOfDay(s.time);
      const timeMatch = selectedTimes.size === 0 || selectedTimes.has(timeOfDay);
      const screenMatch = selectedScreen === 'all' || s.screenType === selectedScreen;
      const langMatch = selectedLang === 'all' || s.language === selectedLang;
      const dateKey = getDateKey(s.time);
      const dateMatch = !selectedDate || dateKey === selectedDate;
      return timeMatch && screenMatch && langMatch && dateMatch;
    });
  }, [showtimes, selectedTimes, selectedScreen, selectedLang, selectedDate]);

  const theaterDistances = useMemo(() => {
    if (!userLocation) return new Map<string, number>();
    const toRad = (value: number) => (value * Math.PI) / 180;
    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
      const R = 6371;
      const dLat = toRad(lat2 - lat1);
      const dLon = toRad(lon2 - lon1);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
          Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    };

    const map = new Map<string, number>();
    theaters.forEach(theater => {
      if (theater.location) {
        const distance = calculateDistance(
          userLocation.lat,
          userLocation.lng,
          theater.location.lat,
          theater.location.lng
        );
        map.set(theater.source_id, distance);
      }
    });
    return map;
  }, [theaters, userLocation]);

  const showtimesByTheater = useMemo(() => {
    const grouped: { [key: string]: Showtime[] } = {};
    filteredShowtimes.forEach(showtime => {
      if (!grouped[showtime.theaterId]) {
        grouped[showtime.theaterId] = [];
      }
      grouped[showtime.theaterId].push(showtime);
    });
    const entries = Object.entries(grouped).map(([theaterId, times]) => {
      const theater = theaters.find(t => t.source_id === theaterId);
      if (!theater) {
        return null;
      }
      const showtimesSorted = priceSort === 'price'
        ? [...times].sort((a, b) => a.price - b.price)
        : [...times].sort((a, b) => a.time.localeCompare(b.time));
      const distance = theaterDistances.get(theaterId) ?? Number.POSITIVE_INFINITY;
      return { theater, showtimes: showtimesSorted, distance };
    }).filter((item): item is { theater: Theater; showtimes: Showtime[]; distance: number } => Boolean(item));

    if (priceSort === 'distance') {
      entries.sort((a, b) => a.distance - b.distance);
    }

    return entries;
  }, [filteredShowtimes, theaters, priceSort, theaterDistances]);

  return (
    <div className="space-y-6">
      <Filters
        dateOptions={dateOptions}
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
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
        isDistanceAvailable={!!userLocation && locationStatus === 'granted'}
        locationStatus={locationStatus}
      />
      {priceSort === 'distance' && locationStatus === 'loading' && (
        <p className="text-sm text-gray-400">正在取得定位資料以便排序…</p>
      )}
      {priceSort === 'distance' && locationStatus === 'denied' && (
        <p className="text-sm text-rose-400">定位權限被拒，已改為依時間排序。</p>
      )}
      {priceSort === 'distance' && locationStatus === 'unsupported' && (
        <p className="text-sm text-orange-400">此裝置不支援定位，請改用時間或票價排序。</p>
      )}
      {showtimesByTheater.length > 0 ? (
        showtimesByTheater.map(({ theater, showtimes, distance }) =>
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
                {priceSort === 'distance' && Number.isFinite(distance) && (
                  <span className="text-sm font-semibold text-cyan-400">
                    {distance.toFixed(1)} km
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {showtimes.map(showtime => (
                  <ShowtimeItem key={showtime.id} showtime={showtime} />
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