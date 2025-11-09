import React from 'react';
import { TimeOfDay, PriceSort } from '../types';

interface FiltersProps {
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
}

const timeOptions: { label: string; value: TimeOfDay }[] = [
  { label: '早場 (12:00前)', value: 'morning' },
  { label: '下午 (12-18)', value: 'afternoon' },
  { label: '晚上 (18-22)', value: 'evening' },
  { label: '午夜 (22:00後)', value: 'late-night' },
];

const Filters: React.FC<FiltersProps> = ({ 
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
            {screenTypes.map(type => <option key={type} value={type}>{type === 'all' ? '全部' : type}</option>)}
        </select>
      </div>
       <div className="w-full sm:w-auto flex items-center">
        <label className="font-semibold text-white mr-3">語言:</label>
        <select value={selectedLang} onChange={e => setSelectedLang(e.target.value)} className={baseSelectClass}>
            {languages.map(lang => <option key={lang} value={lang}>{lang === 'all' ? '全部' : lang}</option>)}
        </select>
      </div>
       <div className="w-full sm:w-auto flex items-center">
        <label className="font-semibold text-white mr-3">排序:</label>
        <select value={priceSort} onChange={e => setPriceSort(e.target.value as PriceSort)} className={baseSelectClass}>
            <option value="default">依時間</option>
            <option value="asc">依票價 (低到高)</option>
        </select>
      </div>
    </div>
  );
};

export default Filters;