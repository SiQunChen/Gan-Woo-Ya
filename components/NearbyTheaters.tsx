
import React, { useState, useEffect } from 'react';
import { Theater } from '../types';
import { getAllTheaters } from '../services/api';
import Spinner from './Spinner';
import { LocationIcon } from './Icons';

interface NearbyTheatersProps {
  onSelectTheater: (theater: Theater) => void;
}

// Haversine formula to calculate distance
const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
};


const NearbyTheaters: React.FC<NearbyTheatersProps> = ({ onSelectTheater }) => {
  const [theaters, setTheaters] = useState<(Theater & { distance: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNearbyTheaters = () => {
      if (!navigator.geolocation) {
        setError("您的瀏覽器不支援定位功能。");
        setLoading(false);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          const allTheaters = await getAllTheaters();
          const theatersWithDistance = allTheaters
            .map(theater => ({
              ...theater,
              distance: getDistance(latitude, longitude, theater.location.lat, theater.location.lng)
            }))
            .sort((a, b) => a.distance - b.distance);
          
          setTheaters(theatersWithDistance);
          setLoading(false);
        },
        (err) => {
          setError(`無法取得您的位置：${err.message}`);
          setLoading(false);
        }
      );
    };

    fetchNearbyTheaters();
  }, []);

  if (loading) {
    return (
      <div className="text-center py-10">
        <Spinner />
        <p className="mt-4 text-gray-400">正在取得您的位置並搜尋附近影城...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-3xl font-bold mb-6 flex items-center">
        <LocationIcon className="w-8 h-8 mr-3 text-cyan-400" />
        附近的電影院
      </h2>
      <div className="space-y-4">
        {theaters.map(theater => (
          <div
            key={theater.id}
            onClick={() => onSelectTheater(theater)}
            className="bg-gray-800 p-4 rounded-lg flex justify-between items-center cursor-pointer hover:bg-gray-700 transition-colors"
          >
            <div>
              <h3 className="text-xl font-semibold text-white">{theater.name}</h3>
              <p className="text-gray-400">{theater.address}</p>
            </div>
            <div className="text-right flex-shrink-0 ml-4">
                <span className="text-lg font-bold text-cyan-400">{theater.distance.toFixed(1)} km</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NearbyTheaters;
