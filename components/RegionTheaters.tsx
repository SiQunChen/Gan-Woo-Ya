
import React, { useState, useEffect } from 'react';
import { Theater } from '../types';
import { getAllTheaters } from '../services/api';
import Spinner from './Spinner';
import { LocationIcon } from './Icons';

interface RegionTheatersProps {
  region: string;
  onSelectTheater: (theater: Theater) => void;
}

const RegionTheaters: React.FC<RegionTheatersProps> = ({ region, onSelectTheater }) => {
  const [theaters, setTheaters] = useState<Theater[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTheaters = async () => {
        setLoading(true);
        const allTheaters = await getAllTheaters();
        const regionalTheaters = allTheaters.filter(t => t.region === region);
        setTheaters(regionalTheaters);
        setLoading(false);
    };

    fetchTheaters();
  }, [region]);

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
        <LocationIcon className="w-8 h-8 mr-3 text-cyan-400" />
        {region}地區的電影院
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
         <p className="text-gray-400 text-center py-10">此地區目前沒有合作的電影院。</p>
      )}
    </div>
  );
};

export default RegionTheaters;
