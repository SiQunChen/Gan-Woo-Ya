import React from 'react';
import { TimeOfDay, PriceSort } from '../types';
import { getLanguageLabel, getScreenTypeLabel } from '../utils/showtime';

interface FiltersProps {
  dateOptions: { value: string; label: string }[];
  selectedDate: string;
  onDateChange: (value: string) => void;
  selectedTimes: Set<TimeOfDay>;
  setSelectedTimes: React.Dispatch<React.SetStateAction<Set<TimeOfDay>>>;
  screenTypes: string[];
  selectedScreen: string;
  setSelectedScreen: (value: string) => void;
  languages: string[];
  selectedLang: string;
  setSelectedLang: (value:string) => void;
  priceSort: PriceSort;
  setPriceSort: (value: PriceSort) => void;
  isDistanceAvailable: boolean;
  locationStatus: 'idle' | 'loading' | 'granted' | 'denied' | 'unsupported';
}

const timeOptions: { label: string; value: TimeOfDay }[] = [
  { label: '早場 (12:00前)', value: 'morning' },
  { label: '下午 (12-18)', value: 'afternoon' },
  { label: '晚上 (18-22)', value: 'evening' },
  { label: '午夜 (22:00後)', value: 'late-night' },
];

const Filters: React.FC<FiltersProps> = ({ 
  dateOptions,
  selectedDate,
  onDateChange,
    selectedTimes, 
    setSelectedTimes,
    screenTypes,
    selectedScreen,
    setSelectedScreen,
    languages,
    selectedLang,
    setSelectedLang,
  priceSort,
  setPriceSort,
  isDistanceAvailable,
  locationStatus,
}) => {
  const handleTimeToggle = (time: TimeOfDay) => {
    const newSelection = new Set(selectedTimes);
    if (newSelection.has(time)) {
      newSelection.delete(time);
    } else {
      newSelection.add(time);
    }
    setSelectedTimes(newSelection);
  };

  const baseButtonClass = "px-4 py-2 text-sm font-medium rounded-full transition-colors border-2";
  const activeButtonClass = "bg-cyan-500 border-cyan-500 text-white";
  const inactiveButtonClass = "bg-gray-700 border-gray-700 text-gray-300 hover:border-gray-500";
  
  const baseSelectClass = "bg-gray-700 border-2 border-gray-700 text-gray-300 rounded-full py-2 px-4 focus:outline-none focus:ring-2 focus:ring-cyan-500";

  return (
    <div className="bg-gray-800 p-4 rounded-lg flex flex-col sm:flex-row flex-wrap gap-4 items-center">
      {dateOptions.length > 0 && (
        <div className="w-full">
          <label className="font-semibold text-white mr-3">日期:</label>
          <div className="mt-2 flex gap-2 flex-wrap overflow-x-auto pb-1">
            {dateOptions.map(option => (
              <button
                key={option.value}
                onClick={() => onDateChange(option.value)}
                className={`${baseButtonClass} ${selectedDate === option.value ? activeButtonClass : inactiveButtonClass}`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="w-full sm:w-auto">
        <label className="font-semibold text-white mr-3">時段:</label>
        <div className="inline-flex gap-2 flex-wrap mt-2 sm:mt-0">
            {timeOptions.map(({ label, value }) => (
                <button
                key={value}
                onClick={() => handleTimeToggle(value)}
                className={`${baseButtonClass} ${selectedTimes.has(value) ? activeButtonClass : inactiveButtonClass}`}
                >
                {label}
                </button>
            ))}
        </div>
      </div>
      <div className="w-full sm:w-auto flex items-center">
        <label className="font-semibold text-white mr-3">影廳:</label>
        <select value={selectedScreen} onChange={e => setSelectedScreen(e.target.value)} className={baseSelectClass}>
            {screenTypes.map(type => (
              <option key={type} value={type}>
                {type === 'all' ? '全部' : getScreenTypeLabel(type)}
              </option>
            ))}
        </select>
      </div>
       <div className="w-full sm:w-auto flex items-center">
        <label className="font-semibold text-white mr-3">語言:</label>
        <select value={selectedLang} onChange={e => setSelectedLang(e.target.value)} className={baseSelectClass}>
            {languages.map(lang => (
              <option key={lang} value={lang}>
                {lang === 'all' ? '全部' : getLanguageLabel(lang)}
              </option>
            ))}
        </select>
      </div>
       <div className="w-full sm:w-auto flex items-center">
        <label className="font-semibold text-white mr-3">排序:</label>
        <select value={priceSort} onChange={e => setPriceSort(e.target.value as PriceSort)} className={baseSelectClass}>
            <option value="distance">依距離 (最近優先)</option>
            <option value="time">依時間</option>
            <option value="price">依票價 (低到高)</option>
        </select>
      </div>
      {!isDistanceAvailable && (
        <div className="text-xs text-gray-400 w-full">
          {locationStatus === 'loading' && '正在取得您的位置，以便依距離排序…'}
          {locationStatus === 'denied' && '定位被拒絕，請在瀏覽器設定中允許位置存取以啟用距離排序。'}
          {locationStatus === 'unsupported' && '此裝置不支援定位，距離排序將無法使用。'}
          {locationStatus === 'idle' && '啟用定位後即可依距離排序。'}
        </div>
      )}
    </div>
  );
};

export default Filters;