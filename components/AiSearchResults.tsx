import React, { useState, useEffect } from 'react';
import { Movie, Theater } from '../types';
import { interpretSearchQuery } from '../services/geminiService';
import { search, getShowtimesByMovieId, getTheatersByIds, getAllMovies } from '../services/api';
import Spinner from './Spinner';
import MovieCard from './MovieCard';
import { LocationIcon } from './Icons';

interface TheaterCardProps {
  theater: Theater & { distance?: number };
  onSelectTheater: (theater: Theater) => void;
}

const TheaterCard: React.FC<TheaterCardProps> = ({ theater, onSelectTheater }) => {
  return (
    <div 
      className="group cursor-pointer bg-gray-800 p-4 rounded-lg hover:bg-gray-700 transition-colors h-full flex flex-col justify-between"
      onClick={() => onSelectTheater(theater)}
    >
      <div>
        <h3 className="text-md font-semibold text-white truncate group-hover:text-cyan-400">{theater.name}</h3>
        <div className="flex items-center mt-2 text-xs text-gray-400">
          <LocationIcon className="w-4 h-4 mr-1 flex-shrink-0" />
          <p className="truncate">{theater.address}</p>
        </div>
      </div>
      {theater.distance !== undefined && (
        <div className="text-right mt-2">
            <span className="text-lg font-bold text-cyan-400">{theater.distance.toFixed(1)} km</span>
        </div>
      )}
    </div>
  );
};


interface AiSearchResultsProps {
  query: string;
  onSelectMovie: (movie: Movie) => void;
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

const AiSearchResults: React.FC<AiSearchResultsProps> = ({ query, onSelectMovie, onSelectTheater }) => {
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState('AI 正在分析您的請求...');
    const [error, setError] = useState<string | null>(null);

    const [movieResults, setMovieResults] = useState<Movie[]>([]);
    const [theaterResults, setTheaterResults] = useState<(Theater & { distance?: number })[]>([]);
    const [resultTitle, setResultTitle] = useState(`AI 搜尋結果： "${query}"`);

    useEffect(() => {
        const processAiSearch = async () => {
            try {
                const aiResponse = await interpretSearchQuery(query);

                if (aiResponse.intent === 'find_movie_and_nearby_theaters' && aiResponse.movieTitle) {
                    setStatus('正在尋找電影與鄰近的電影院...');
                    setResultTitle(`正在上映「${aiResponse.movieTitle}」的鄰近電影院`);

                    // 1. Find movie
                    const { movies } = await search(aiResponse.movieTitle);
                    if (movies.length === 0) {
                        setError(`抱歉，我找不到電影「${aiResponse.movieTitle}」。`);
                        setLoading(false);
                        return;
                    }
                    const targetMovie = movies[0];
                    setMovieResults([targetMovie]);

                    // 2. Get user location
                    setStatus('正在請求您的位置...');
                    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
                    });
                    const { latitude, longitude } = position.coords;

                    // 3. Find showtimes and theaters
                    setStatus('正在尋找場次...');
                    const showtimes = await getShowtimesByMovieId(targetMovie.id);
                    if (showtimes.length === 0) {
                        setError(`目前沒有「${targetMovie.title}」的上映場次。`);
                        setLoading(false);
                        return;
                    }
                    
                    const theaterIds = [...new Set(showtimes.map(s => s.theaterId))];
                    const theaters = await getTheatersByIds(theaterIds);
                    
                    // 4. Calculate distances and sort
                    setStatus('正在計算距離...');
                    const theatersWithDistance = theaters.map(theater => ({
                        ...theater,
                        distance: getDistance(latitude, longitude, theater.location.lat, theater.location.lng)
                    })).sort((a, b) => a.distance - b.distance);

                    setTheaterResults(theatersWithDistance);

                } else if (aiResponse.intent === 'recommend_movies') {
                    setStatus('AI 正在為您準備電影推薦...');
                    const genre = aiResponse.genre;
                    setResultTitle(genre ? `為您推薦的「${genre}」類型電影` : 'AI 為您推薦的電影');

                    const allMovies = await getAllMovies();
                    const nowPlaying = allMovies.filter(m => m.bookingOpen);

                    let recommendedMovies: Movie[];

                    if (genre) {
                        recommendedMovies = nowPlaying.filter(m => m.genres.includes(genre));
                        if(recommendedMovies.length === 0) {
                           setError(`抱歉，目前沒有上映中的「${genre}」類型電影。`);
                        }
                    } else {
                        // Recommend a few currently playing movies if no genre is specified
                        recommendedMovies = nowPlaying.slice(0, 5);
                    }
                    setMovieResults(recommendedMovies);

                } else { // Fallback to simple search
                    setStatus('正在搜尋電影與電影院...');
                    const searchTerm = aiResponse.query || query;
                    setResultTitle(`關於「${searchTerm}」的搜尋結果`);
                    const { movies, theaters } = await search(searchTerm);
                    setMovieResults(movies);
                    setTheaterResults(theaters);
                }

            } catch (e: any) {
                if (e.code && e.code === 1) { // Geolocation permission denied
                     setError('我們需要您的位置資訊才能找到鄰近的電影院。請在瀏覽器設定中允許位置存取後再試一次。');
                } else {
                     setError('AI 搜尋時發生錯誤。請試試看較簡單的關鍵字。');
                     console.error(e);
                }
            } finally {
                setLoading(false);
            }
        };

        processAiSearch();
    }, [query]);

    if (loading) {
        return (
            <div className="text-center py-10">
                <Spinner />
                <p className="mt-4 text-gray-400">{status}</p>
            </div>
        );
    }
    
    if (error) {
        return <div className="text-center py-10 text-red-400">{error}</div>;
    }

    const hasResults = movieResults.length > 0 || theaterResults.length > 0;

    return (
        <div>
            <h2 className="text-3xl font-bold mb-6">
                {resultTitle}
            </h2>
            {hasResults ? (
                <div className="space-y-12">
                    {movieResults.length > 0 && (
                        <section>
                            <h3 className="text-2xl font-bold mb-4 border-b-2 border-cyan-500 pb-2">電影</h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                                {movieResults.map(movie => (
                                <MovieCard key={movie.id} movie={movie} onSelectMovie={onSelectMovie} />
                                ))}
                            </div>
                        </section>
                    )}
                    {theaterResults.length > 0 && (
                        <section>
                            <h3 className="text-2xl font-bold mb-4 border-b-2 border-cyan-500 pb-2">電影院</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                {theaterResults.map(theater => (
                                <TheaterCard key={theater.id} theater={theater} onSelectTheater={onSelectTheater} />
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            ) : (
                <p className="text-gray-400 text-center py-10">抱歉，我找不到任何符合您需求的結果。</p>
            )}
        </div>
    );
};

export default AiSearchResults;