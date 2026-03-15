import React, { useEffect, useState } from 'react';
import { db } from '../utils/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { FilterCategory } from '../types/types';

interface FilterSidebarProps {
    onFilterChange: (selectedFilters: Record<string, string[]>) => void;
    activeFilters: Record<string, string[]>;
    contentCount?: Record<string, number>; // Map of Option ID to count
    destination?: 'vault' | 'slgdc';
}

const FilterSidebar: React.FC<FilterSidebarProps> = ({ onFilterChange, activeFilters, contentCount = {}, destination }) => {
    const [categories, setCategories] = useState<FilterCategory[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

    useEffect(() => {
        const fetchFilters = async () => {
            try {
                const snapshot = await getDocs(collection(db, 'filterCategories'));
                let data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FilterCategory));

                if (destination) {
                    data = data.filter(cat => (cat.destinations || ['vault']).includes(destination));
                }

                setCategories(data);

                // Expand all by default
                const expanded: Record<string, boolean> = {};
                data.forEach(cat => expanded[cat.id] = true);
                setExpandedCategories(expanded);
            } catch (error) {
                console.error("Error fetching filters:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchFilters();
    }, []);

    const toggleCategory = (id: string) => {
        setExpandedCategories(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const handleOptionToggle = (categoryId: string, optionId: string) => {
        const currentOptions = activeFilters[categoryId] || [];
        let newOptions;

        if (currentOptions.includes(optionId)) {
            newOptions = currentOptions.filter(id => id !== optionId);
        } else {
            newOptions = [...currentOptions, optionId];
        }

        const newFilters = { ...activeFilters };
        if (newOptions.length > 0) {
            newFilters[categoryId] = newOptions;
        } else {
            delete newFilters[categoryId];
        }

        onFilterChange(newFilters);
    };

    const clearAll = () => {
        onFilterChange({});
    };

    if (isLoading) {
        return (
            <div className="w-64 space-y-4 animate-pulse">
                {[1, 2, 3].map(i => (
                    <div key={i} className="space-y-2">
                        <div className="h-4 bg-zinc-800 rounded w-1/2"></div>
                        <div className="space-y-1">
                            <div className="h-3 bg-zinc-900 rounded w-3/4"></div>
                            <div className="h-3 bg-zinc-900 rounded w-2/3"></div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    const hasActiveFilters = Object.keys(activeFilters).length > 0;

    return (
        <aside className="w-full space-y-8 pr-2">
            <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-bold flex items-center gap-2">
                    <span className="sr-only">Filters</span>
                </h2>
                {hasActiveFilters && (
                    <button
                        onClick={clearAll}
                        className="text-[10px] font-google-sans font-normal text-zinc-500 hover:text-white uppercase tracking-wider transition-colors"
                    >
                        Clear All
                    </button>
                )}
            </div>

            <div className="space-y-6">
                {categories.map(category => (
                    <div key={category.id} className="space-y-3">
                        <button
                            onClick={() => toggleCategory(category.id)}
                            className="flex items-center justify-between w-full group"
                        >
                            <span className="text-xs font-google-sans font-normal text-zinc-400 uppercase tracking-widest group-hover:text-zinc-200 transition-colors">
                                {category.name}
                            </span>
                            {expandedCategories[category.id] ? (
                                <ChevronUp className="w-3 h-3 text-zinc-600 group-hover:text-zinc-400" />
                            ) : (
                                <ChevronDown className="w-3 h-3 text-zinc-600 group-hover:text-zinc-400" />
                            )}
                        </button>

                        {expandedCategories[category.id] && (
                            <div className="space-y-1 ml-1">
                                {category.options.map(option => {
                                    const isSelected = (activeFilters[category.id] || []).includes(option.id);
                                    const count = contentCount[option.id] || 0;

                                    return (
                                        <label
                                            key={option.id}
                                            className={`flex items-center justify-between group cursor-pointer py-1.5 px-2 rounded-lg transition-all ${isSelected ? 'bg-indigo-500/10 text-white' : 'hover:bg-zinc-800/50 text-zinc-400 hover:text-zinc-200'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${isSelected ? 'bg-indigo-500 border-indigo-500' : 'border-zinc-700 bg-zinc-900'
                                                    }`}></div>
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => handleOptionToggle(category.id, option.id)}
                                                    className="hidden"
                                                />
                                                <span className="text-sm font-google-sans font-normal">{option.label}</span>
                                            </div>
                                            {count > 0 && (
                                                <span className="text-[10px] font-mono text-zinc-600 group-hover:text-zinc-500">
                                                    ({count})
                                                </span>
                                            )}
                                        </label>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {categories.length === 0 && (
                <div className="text-center py-8 border border-dashed border-zinc-800 rounded-xl">
                    <p className="text-xs text-zinc-600 italic">No filters configured</p>
                </div>
            )}
        </aside>
    );
};

export default FilterSidebar;
