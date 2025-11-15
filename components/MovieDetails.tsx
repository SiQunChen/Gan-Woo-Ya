import React, { useState, useEffect, useCallback } from 'react';
import { Movie, Theater, Showtime, Review, MovieBuddyEvent } from '../types';
import { getShowtimesByMovieId, getTheatersByIds, getReviewsByMovieId, addReview, getMovieBuddyEventsByMovieId } from '../services/api';
import ShowtimeList from './ShowtimeList';
import Spinner from './Spinner';
import { ClockIcon, DirectorIcon, ActorsIcon, RatingIcon, BookmarkIcon, CalendarIcon, StarIcon, UsersIcon, HeartIcon } from './Icons';
import { useUser } from '../contexts/UserContext';
import StarRating from './StarRating';
import ReviewList from './ReviewList';
import ReviewForm from './ReviewForm';
import MovieBuddyEventCard from './MovieBuddyEventCard';
import { getRatingInfo } from '../utils/ratings';

// Helper: normalize various YouTube URL forms to an embed URL.
const getYouTubeEmbedUrl = (url?: string) => {
  if (!url) return null;
  try {
    const u = new URL(url);
    const host = u.hostname.replace('www.', '');

    // If already an embed URL with a plausible id path, accept it
    if (host.includes('youtube.com') && u.pathname.startsWith('/embed/')) {
      return url;
    }

    // watch?v=VIDEO_ID
    if (host.includes('youtube.com') && u.searchParams.has('v')) {
      const id = u.searchParams.get('v');
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }

    // youtu.be/VIDEO_ID or youtube.com/shorts/VIDEO_ID
    const pathParts = u.pathname.split('/').filter(Boolean);
    if (host === 'youtu.be' && pathParts.length >= 1) {
      return `https://www.youtube.com/embed/${pathParts[0]}`;
    }

    if (host.includes('youtube.com') && (pathParts[0] === 'shorts' || pathParts[0] === 'watch')) {
      const id = pathParts[1] || u.searchParams.get('v');
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }

    // If it's already a direct embed-like path but with a non-ID (e.g. 'insidious'), bail out
    return null;
  } catch (e) {
    return null;
  }
};

interface MovieDetailsProps {
  movie: Movie;
  onSelectTheater: (theater: Theater) => void;
  onSelectEvent: (eventId: string) => void;
  onCreateEvent: (movie: Movie) => void;
}

const MovieDetails: React.FC<MovieDetailsProps> = ({ movie, onSelectTheater, onSelectEvent, onCreateEvent }) => {
  const [showtimes, setShowtimes] = useState<Showtime[]>([]);
  const [theaters, setTheaters] = useState<Theater[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [events, setEvents] = useState<MovieBuddyEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [notified, setNotified] = useState(false);
  const [isSynopsisExpanded, setSynopsisExpanded] = useState(false);
  const { user, isInWatchlist, toggleWatchlist, isCollectedMovie, toggleCollectedMovie, login } = useUser();

  const movieSourceId = movie.source_id;
  const ratingInfo = getRatingInfo(movie.rating);
  const inWatchlist = user ? isInWatchlist(movieSourceId) : false;
  const isCollected = user ? isCollectedMovie(movieSourceId) : false;

  const fetchMovieData = useCallback(async () => {
      setLoading(true);
    const [fetchedShowtimes, fetchedReviews, fetchedEvents] = await Promise.all([
      getShowtimesByMovieId(movieSourceId),
      getReviewsByMovieId(movieSourceId),
      getMovieBuddyEventsByMovieId(movieSourceId),
      ]);
      const theaterIds = [...new Set(fetchedShowtimes.map(s => s.theaterId))];
      const fetchedTheaters = await getTheatersByIds(theaterIds);
      
      setShowtimes(fetchedShowtimes);
      setTheaters(fetchedTheaters);
      setReviews(fetchedReviews);
      setEvents(fetchedEvents);
      setLoading(false);
  }, [movieSourceId]);

  useEffect(() => {
    fetchMovieData();
  }, [fetchMovieData]);

  const handleToggleWatchlist = () => {
    if (user) {
  toggleWatchlist(movieSourceId);
    } else {
      alert("請先登入才能將電影加入待看清單！");
      login();
    }
  };

  const handleToggleCollected = () => {
      if(user) {
          toggleCollectedMovie(movieSourceId);
      } else {
          alert("請先登入才能收藏電影！");
          login();
      }
  }
  
  const handleNotifyClick = () => {
    setNotified(true);
    alert(`感謝您的關注！\n當「${movie.title}」開放訂票時，我們會通知您。`);
  }

  const handleReviewSubmit = async (rating: number, comment: string) => {
    if (user && comment) {
        await addReview({ movieId: movieSourceId, userId: user.id, username: user.name, rating, comment });
        fetchMovieData(); // Re-fetch reviews
    }
  };

  const handleCreateEvent = () => {
    if (!user) {
      alert("請先登入才能發起揪團！");
      login();
      return;
    }
    if (!user.isVerified) {
      alert("為了社群安全，發起揪團前請先至您的個人檔案頁面完成手機實名驗證。");
      return;
    }
    onCreateEvent(movie);
  };
  
  const averageRating = reviews.length > 0 ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length : 0;

  return (
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row gap-8">
        <div className="md:w-1/3 flex-shrink-0 flex flex-col justify-center">
          <img src={movie.posterUrl} alt={movie.title} className="w-full rounded-lg shadow-lg" />
        </div>
        <div className="md:w-2/3 flex flex-col">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-extrabold text-white">{movie.title}</h1>
              <h2 className="text-xl text-gray-400 mb-4">{movie.englishTitle}</h2>
            </div>
            <div className="flex items-center">
                <button onClick={handleToggleCollected} className="group flex-shrink-0 text-gray-400 hover:text-red-500 transition-colors p-2" title={isCollected ? "從收藏移除" : "加入收藏"}>
                    <HeartIcon className={`w-8 h-8 ${isCollected ? 'text-red-500 fill-current' : ''}`} />
                </button>
                <button onClick={handleToggleWatchlist} className="group flex-shrink-0 text-gray-400 hover:text-cyan-400 transition-colors p-2" title={inWatchlist ? "從待看清單移除" : "加入待看清單"}>
                    <BookmarkIcon className={`w-8 h-8 ${inWatchlist ? 'text-cyan-500 fill-current' : ''}`} />
                </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mb-4 text-gray-300">
            <div className="flex items-center" title="平均評分">
              <StarRating rating={averageRating} />
              <span className="ml-2 font-bold">{averageRating.toFixed(1)}</span>
              <span className="ml-1 text-sm text-gray-400">({reviews.length} 則評論)</span>
            </div>
            <div className="flex items-center">
              <ClockIcon className="w-5 h-5 mr-1" />
              <span>{movie.duration} 分鐘</span>
            </div>
            <div className="flex items-center text-sm text-gray-200">
              <RatingIcon className="w-5 h-5 mr-2 flex-shrink-0" />
              <div className="flex flex-col items-start text-left leading-tight">
                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold tracking-wide uppercase ${ratingInfo.badgeClass}`}>
                  {ratingInfo.shortLabel} / {ratingInfo.code}
                </span>
                <span className="text-xs text-gray-400 mt-0.5">{ratingInfo.rule}</span>
              </div>
            </div>
          </div>

          {movie.synopsis && (
            <div className="mt-2">
              <div
                className={`relative text-gray-300 leading-relaxed transition-all duration-300 ${
                  isSynopsisExpanded ? '' : 'max-h-24 overflow-hidden pr-2'
                }`}
              >
                <p>{movie.synopsis}</p>
                {!isSynopsisExpanded && movie.synopsis.length > 220 && (
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-gray-900 via-gray-900/70 to-transparent" />
                )}
              </div>
              {movie.synopsis.length > 220 && (
                <button
                  type="button"
                  onClick={() => setSynopsisExpanded(prev => !prev)}
                  className="mt-3 text-cyan-400 font-semibold hover:text-cyan-300 transition-colors"
                  aria-expanded={isSynopsisExpanded}
                >
                  {isSynopsisExpanded ? '收合簡介 ▲' : '閱讀更多 ▼'}
                </button>
              )}
            </div>
          )}

          <div className="mt-6 space-y-3 text-gray-300">
            <div className="flex items-start">
              <DirectorIcon className="w-5 h-5 mt-1 mr-2 flex-shrink-0 text-cyan-400" />
              <div className="flex flex-wrap gap-2 text-gray-300">
                <strong className="whitespace-nowrap">導演：</strong>
                <span>{movie.director}</span>
              </div>
            </div>
            <div className="flex items-start">
              <ActorsIcon className="w-5 h-5 mt-1 mr-2 flex-shrink-0 text-cyan-400" />
              <div className="flex flex-1 flex-wrap gap-2 text-gray-300 min-w-0">
                <strong className="whitespace-nowrap">演員：</strong>
                <span className="flex-1 min-w-0 leading-relaxed">{movie.actors.join('、')}</span>
              </div>
            </div>
          </div>
            
          {movie.bookingOpen && (
            <div className="mt-6 md:mt-auto">
                {/* Use a responsive wrapper to preserve 16:9 aspect ratio even if Tailwind's aspect plugin isn't available */}
                <div className="relative w-full rounded-lg overflow-hidden" style={{ paddingTop: '56.25%' }}>
                    {/* Normalize trailer URL to an embeddable YouTube URL when possible. If normalization fails, show an external link. */}
                    {(() => {
                      const embed = getYouTubeEmbedUrl(movie.trailerUrl);
                      if (embed) {
                        return (
                          <iframe
                            src={embed}
                            title={`${movie.title} Trailer`}
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            className="absolute top-0 left-0 w-full h-full"
                          />
                        );
                      }
                      // Fallback: show a link that opens the trailer in a new tab (useful for non-embeddable or malformed URLs)
                      return (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 text-gray-300 p-4">
                          <div className="text-center">
                            <p className="mb-2">此預告片無法內嵌播放（來源網址可能不是 YouTube embed 或影片不允許嵌入）。</p>
                            <a href={movie.trailerUrl} target="_blank" rel="noopener noreferrer" className="underline text-cyan-400">在新分頁打開預告片</a>
                          </div>
                        </div>
                      );
                    })()}
                </div>
            </div>
          )}
        </div>
      </div>
      
      {movie.bookingOpen ? (
        <>
          <div>
            <h2 className="text-3xl font-bold mb-4">場次資訊</h2>
            {loading ? (
              <div className="flex justify-center items-center h-40"><Spinner /></div>
            ) : (
              <ShowtimeList showtimes={showtimes} theaters={theaters} onSelectTheater={onSelectTheater} />
            )}
          </div>

          <div>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-3xl font-bold flex items-center gap-3">
                    <UsersIcon className="w-8 h-8" />
                    看看誰也想看？ (公開揪團)
                </h2>
                <button 
                    onClick={handleCreateEvent}
                    className="px-4 py-2 bg-cyan-600 text-white font-semibold rounded-full hover:bg-cyan-500 transition-colors"
                >
                    + 發起揪團
                </button>
            </div>
             {loading ? (
              <div className="flex justify-center items-center h-40"><Spinner /></div>
            ) : events.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {events.map(event => (
                  <MovieBuddyEventCard key={event.id} event={event} movie={movie} onSelectEvent={onSelectEvent} />
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-center py-8">目前還沒有人發起這個電影的揪團，成為第一個吧！</p>
            )}
          </div>
        </>
      ) : (
         <div className="text-center bg-gray-800 p-8 rounded-lg">
            <h2 className="text-3xl font-bold mb-2 text-cyan-400">即將上映</h2>
            <p className="text-xl text-gray-300 flex items-center justify-center gap-2">
                <CalendarIcon className="w-6 h-6" />
                <span>上映日期：{movie.releaseDate}</span>
            </p>
             <button
              onClick={handleNotifyClick}
              disabled={notified}
              className="mt-6 px-6 py-3 bg-teal-600 text-white font-semibold rounded-full hover:bg-teal-500 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
            >
              {notified ? '✓ 已設定通知' : '開放訂票時通知我'}
            </button>
         </div>
      )}

      <div>
        <h2 className="text-3xl font-bold mb-4">評論區</h2>
        {user && <ReviewForm onSubmit={handleReviewSubmit} />}
        <ReviewList reviews={reviews} />
      </div>

    </div>
  );
};

export default MovieDetails;
