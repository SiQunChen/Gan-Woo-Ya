import React, { useState, useEffect } from 'react';
import { Theater } from '../types';
import { getTheatersByIds } from '../services/api';
import { useUser } from '../contexts/UserContext';
import Spinner from './Spinner';
import { HeartIcon } from './Icons';

interface FavoritesProps {
  onSelectTheater: (theater: Theater) => void;
}

const Favorites: React.FC<FavoritesProps> = ({ onSelectTheater }) => {
  const [theaters, setTheaters] = useState<Theater[]>([]);
  const [loading, setLoading] = useState(true);
  const { favoriteTheaterIds } = useUser();

  useEffect(() => {
    const fetchFavoriteTheaters = async () => {
      setLoading(true);
      // Fix: Use spread syntax to convert Set to array to ensure correct type inference for `getTheatersByIds`.
      const theaterIds = [...favoriteTheaterIds];
      if (theaterIds.length > 0) {
        const favoriteTheaters = await getTheatersByIds(theaterIds);
        setTheaters(favoriteTheaters);
      } else {
        setTheaters([]);
      }
      setLoading(false);
    };
    fetchFavoriteTheaters();
  }, [favoriteTheaterIds]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner />
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-3xl font-bold mb-6 flex items-center">
        <HeartIcon className="w-8 h-8 mr-3 text-red-500" />
        我的最愛影城
      </h2>
      {theaters.length > 0 ? (
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
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-400 text-center py-10">您尚未將任何影城加入最愛。</p>
      )}
    </div>
  );
};

export default Favorites;
