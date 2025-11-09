import React, { createContext, useState, useContext, ReactNode } from 'react';
import { User } from '../types';

interface UserContextType {
  user: User | null;
  login: () => void;
  logout: () => void;
  isFavoriteTheater: (theaterId: string) => boolean;
  toggleFavoriteTheater: (theaterId: string) => void;
  isInWatchlist: (movieId: string) => boolean;
  toggleWatchlist: (movieId: string) => void;
  isCollectedMovie: (movieId: string) => boolean;
  toggleCollectedMovie: (movieId: string) => void;
  isJoinedEvent: (eventId: string) => boolean;
  toggleJoinedEvent: (eventId: string) => void;
  verifyUser: () => void;
  updateUserProfile: (updates: Partial<Pick<User, 'name' | 'email' | 'avatarUrl'>>) => void;
  favoriteTheaterIds: Set<string>;
  movieWatchlistIds: Set<string>;
  collectedMovieIds: Set<string>;
  joinedEventIds: Set<string>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

// Mock user data
const MOCK_USER: User = {
  id: 'u1',
  name: '使用者',
  email: 'user@example.com',
  avatarUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026704d',
  favoriteTheaterIds: new Set(['t1', 't6']),
  movieWatchlistIds: new Set(['m2', 'm4']),
  collectedMovieIds: new Set(['m1']),
  viewingHabitTags: ['#安靜觀影', '#映後愛討論', '#準時入場'],
  trustScore: 4.7,
  isVerified: false, // User starts as unverified
};

export const UserProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [joinedEventIds, setJoinedEventIds] = useState(new Set<string>(['mbe3']));

  const login = () => {
      setUser(MOCK_USER);
      setJoinedEventIds(new Set<string>(['mbe3']));
  };
  const logout = () => {
      setUser(null);
      setJoinedEventIds(new Set<string>());
  };

  const isFavoriteTheater = (theaterId: string) => {
    return user?.favoriteTheaterIds.has(theaterId) ?? false;
  };

  const toggleFavoriteTheater = (theaterId: string) => {
    setUser(currentUser => {
      if (!currentUser) return null;
      const newFavorites = new Set(currentUser.favoriteTheaterIds);
      if (newFavorites.has(theaterId)) {
        newFavorites.delete(theaterId);
      } else {
        newFavorites.add(theaterId);
      }
      return { ...currentUser, favoriteTheaterIds: newFavorites };
    });
  };
  
  const isInWatchlist = (movieId: string) => {
    return user?.movieWatchlistIds.has(movieId) ?? false;
  };

  const toggleWatchlist = (movieId: string) => {
    setUser(currentUser => {
      if (!currentUser) return null;
      const newWatchlist = new Set(currentUser.movieWatchlistIds);
      if (newWatchlist.has(movieId)) {
        newWatchlist.delete(movieId);
      } else {
        newWatchlist.add(movieId);
      }
      return { ...currentUser, movieWatchlistIds: newWatchlist };
    });
  };

  const isCollectedMovie = (movieId: string) => {
    return user?.collectedMovieIds.has(movieId) ?? false;
  };

  const toggleCollectedMovie = (movieId: string) => {
    setUser(currentUser => {
      if (!currentUser) return null;
      const newCollection = new Set(currentUser.collectedMovieIds);
      if (newCollection.has(movieId)) {
        newCollection.delete(movieId);
      } else {
        newCollection.add(movieId);
      }
      return { ...currentUser, collectedMovieIds: newCollection };
    });
  };

  const isJoinedEvent = (eventId: string) => {
      return joinedEventIds.has(eventId);
  }

  const toggleJoinedEvent = (eventId: string) => {
      setJoinedEventIds(currentIds => {
          const newIds = new Set(currentIds);
          if (newIds.has(eventId)) {
              newIds.delete(eventId);
          } else {
              newIds.add(eventId);
          }
          // Note: In a real app, you'd also need to update the participant list in the event itself.
          // This is a simplified client-side mock.
          return newIds;
      });
  }
  
  const verifyUser = () => {
      setUser(currentUser => {
          if (!currentUser) return null;
          return { ...currentUser, isVerified: true };
      })
  }
  
  const updateUserProfile = (updates: Partial<Pick<User, 'name' | 'email' | 'avatarUrl'>>) => {
    setUser(currentUser => {
        if (!currentUser) return null;
        return { ...currentUser, ...updates };
    });
  };

  const value = {
    user,
    login,
    logout,
    isFavoriteTheater,
    toggleFavoriteTheater,
    isInWatchlist,
    toggleWatchlist,
    isCollectedMovie,
    toggleCollectedMovie,
    isJoinedEvent,
    toggleJoinedEvent,
    verifyUser,
    updateUserProfile,
    favoriteTheaterIds: user?.favoriteTheaterIds ?? new Set<string>(),
    movieWatchlistIds: user?.movieWatchlistIds ?? new Set<string>(),
    collectedMovieIds: user?.collectedMovieIds ?? new Set<string>(),
    joinedEventIds,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
