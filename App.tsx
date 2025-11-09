import React, { useState, useCallback } from 'react';
import { View, Movie, Theater, MovieBuddyEvent } from './types';
import Header from './components/Header';
import Home from './components/Home';
import MovieDetails from './components/MovieDetails';
import TheaterDetails from './components/TheaterDetails';
import NearbyTheaters from './components/NearbyTheaters';
import RegionTheaters from './components/RegionTheaters';
import SearchResults from './components/SearchResults';
import AiSearchResults from './components/AiSearchResults';
import Footer from './components/Footer';
import Collection from './components/Collection';
import MovieBuddyEventDetails from './components/MovieBuddyEventDetails';
import Profile from './components/Profile';
import CreateEvent from './components/CreateEvent';

const App: React.FC = () => {
  const [view, setView] = useState<View>(View.Home);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [selectedTheater, setSelectedTheater] = useState<Theater | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [eventCreationMovie, setEventCreationMovie] = useState<Movie | null>(null);

  const handleSelectMovie = useCallback((movie: Movie) => {
    setSelectedMovie(movie);
    setView(View.MovieDetails);
  }, []);

  const handleSelectTheater = useCallback((theater: Theater) => {
    setSelectedTheater(theater);
    setView(View.TheaterDetails);
  }, []);

  const handleSelectEvent = useCallback((eventId: string) => {
    setSelectedEventId(eventId);
    setView(View.MovieBuddyEventDetails);
  }, []);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    setView(View.AiSearchResults);
  }, []);
  
  const resetToHome = useCallback(() => {
    setView(View.Home);
    setSelectedMovie(null);
    setSelectedTheater(null);
    setSelectedEventId(null);
    setSearchQuery('');
    setSelectedRegion(null);
    setEventCreationMovie(null);
  }, []);

  const showNearbyTheaters = useCallback(() => {
    setView(View.NearbyTheaters);
  }, []);
  
  const handleSelectRegion = useCallback((region: string) => {
    setSelectedRegion(region);
    setView(View.RegionTheaters);
  }, []);

  const showCollection = useCallback(() => setView(View.Collection), []);
  const showProfile = useCallback(() => setView(View.Profile), []);

  const handleShowCreateEventForm = useCallback((movie: Movie) => {
    setEventCreationMovie(movie);
    setView(View.CreateEvent);
  }, []);

  const handleEventCreated = useCallback((eventId: string) => {
    setEventCreationMovie(null);
    setSelectedEventId(eventId);
    setView(View.MovieBuddyEventDetails);
  }, []);

  const renderContent = () => {
    switch (view) {
      case View.MovieDetails:
        return selectedMovie && <MovieDetails movie={selectedMovie} onSelectTheater={handleSelectTheater} onSelectEvent={handleSelectEvent} onCreateEvent={handleShowCreateEventForm} />;
      case View.TheaterDetails:
        return selectedTheater && <TheaterDetails theater={selectedTheater} onSelectMovie={handleSelectMovie} />;
      case View.NearbyTheaters:
        return <NearbyTheaters onSelectTheater={handleSelectTheater} />;
      case View.RegionTheaters:
        return selectedRegion && <RegionTheaters region={selectedRegion} onSelectTheater={handleSelectTheater} />;
      case View.SearchResults:
        return <SearchResults query={searchQuery} onSelectMovie={handleSelectMovie} onSelectTheater={handleSelectTheater} />;
      case View.AiSearchResults:
        return <AiSearchResults query={searchQuery} onSelectMovie={handleSelectMovie} onSelectTheater={handleSelectTheater} />;
      case View.Collection:
        return <Collection onSelectMovie={handleSelectMovie} onSelectTheater={handleSelectTheater} onSelectEvent={handleSelectEvent} />;
      case View.MovieBuddyEventDetails:
        return selectedEventId && <MovieBuddyEventDetails eventId={selectedEventId} onSelectMovie={handleSelectMovie} onSelectTheater={handleSelectTheater} />;
      case View.Profile:
        return <Profile />;
      case View.CreateEvent:
        return eventCreationMovie && <CreateEvent movie={eventCreationMovie} onEventCreated={handleEventCreated} onCancel={resetToHome} />;
      case View.Home:
      default:
        return <Home onSearch={handleSearch} onShowNearby={showNearbyTheaters} onSelectMovie={handleSelectMovie} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col font-sans">
      <Header 
        onSearch={handleSearch} 
        onLogoClick={resetToHome} 
        onSelectRegion={handleSelectRegion}
        onShowCollection={showCollection}
        onShowProfile={showProfile}
      />
      <main className="flex-grow container mx-auto px-4 py-8">
        {renderContent()}
      </main>
      <Footer />
    </div>
  );
};

export default App;