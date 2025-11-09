import React, { useState, useRef, useEffect } from 'react';
import { FilmIcon, SparklesIcon, ChevronDownIcon, UserIcon, BookmarkIcon } from './Icons';
import { useUser } from '../contexts/UserContext';

interface HeaderProps {
  onSearch: (query: string) => void;
  onLogoClick: () => void;
  onSelectRegion: (region: string) => void;
  onShowCollection: () => void;
  onShowProfile: () => void;
}

const Header: React.FC<HeaderProps> = ({ onSearch, onLogoClick, onSelectRegion, onShowCollection, onShowProfile }) => {
  const [query, setQuery] = useState('');
  const [isRegionDropdownOpen, setIsRegionDropdownOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const regionDropdownRef = useRef<HTMLDivElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const { user, login, logout } = useUser();

  const regions = ['北部', '中部', '南部', '東部', '離島'];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (regionDropdownRef.current && !regionDropdownRef.current.contains(event.target as Node)) {
        setIsRegionDropdownOpen(false);
      }
       if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setIsUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
      setQuery('');
    }
  };

  const handleRegionSelect = (region: string) => {
    onSelectRegion(region);
    setIsRegionDropdownOpen(false);
  };
  
  const handleShowCollection = () => {
      setIsUserDropdownOpen(false);
      onShowCollection();
  }

  const handleShowProfile = () => {
    setIsUserDropdownOpen(false);
    onShowProfile();
  }

  const handleLogout = () => {
    setIsUserDropdownOpen(false);
    logout();
  }

  return (
    <header className="sticky top-0 bg-gray-900 bg-opacity-80 backdrop-blur-md z-50 shadow-lg shadow-cyan-500/10">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center gap-4">
        <div 
          className="flex items-center space-x-2 cursor-pointer"
          onClick={onLogoClick}
        >
          <FilmIcon className="w-8 h-8 text-cyan-400" />
          <h1 className="text-2xl font-bold text-white hidden sm:block">甘有影</h1>
        </div>
        
        <div className="flex-1 flex justify-end items-center gap-2">
          <form onSubmit={handleSubmit} className="flex items-center gap-2 w-full max-w-sm">
              <div className="relative flex-grow">
                  <input
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="AI 搜尋電影或影城..."
                      className="w-full bg-gray-800 border border-gray-700 text-white rounded-full py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <SparklesIcon className="w-5 h-5 text-cyan-400" />
                  </div>
              </div>
              <div className="relative" ref={regionDropdownRef}>
                  <button
                      type="button"
                      onClick={() => setIsRegionDropdownOpen(!isRegionDropdownOpen)}
                      className="flex items-center px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-full hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 whitespace-nowrap"
                  >
                      地區
                      <ChevronDownIcon className={`w-5 h-5 ml-2 transition-transform ${isRegionDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isRegionDropdownOpen && (
                      <div className="absolute mt-2 w-36 bg-gray-800 border border-gray-700 rounded-md shadow-lg z-20 right-0">
                          <ul className="py-1">
                              {regions.map(region => (
                                  <li key={region}>
                                  <button
                                      onClick={() => handleRegionSelect(region)}
                                      className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-cyan-600 hover:text-white"
                                  >
                                      {region}
                                  </button>
                                  </li>
                              ))}
                          </ul>
                      </div>
                  )}
              </div>
          </form>

          <div className="relative" ref={userDropdownRef}>
            {user ? (
                 <button
                    onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                    className="flex items-center justify-center w-10 h-10 bg-gray-800 border border-gray-700 rounded-full hover:border-cyan-500"
                >
                    <img src={user.avatarUrl} alt={user.name} className="w-8 h-8 rounded-full" />
                </button>
            ) : (
                <button
                    onClick={login}
                    className="px-4 py-2 bg-cyan-600 text-white font-semibold rounded-full hover:bg-cyan-500 transition-colors"
                >
                    登入
                </button>
            )}
             {user && isUserDropdownOpen && (
                <div className="absolute mt-2 w-48 bg-gray-800 border border-gray-700 rounded-md shadow-lg z-20 right-0">
                    <div className="px-4 py-3 border-b border-gray-700">
                        <p className="text-sm text-white font-semibold">Hi, {user.name}</p>
                    </div>
                    <ul className="py-1">
                        <li><button onClick={handleShowProfile} className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-cyan-600 hover:text-white flex items-center gap-2"><UserIcon className="w-5 h-5" />個人檔案</button></li>
                        <li><button onClick={handleShowCollection} className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-cyan-600 hover:text-white flex items-center gap-2"><BookmarkIcon className="w-5 h-5" />我的收藏</button></li>
                        <li><button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-cyan-600 hover:text-white">登出</button></li>
                    </ul>
                </div>
             )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;