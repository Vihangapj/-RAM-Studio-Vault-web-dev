import React from 'react';
import type { Lesson } from '../types/types';

interface CoursePlaylistProps {
    lessons: Lesson[];
    currentIndex: number;
    onSelect: (index: number) => void;
}

const CoursePlaylist: React.FC<CoursePlaylistProps> = ({ lessons, currentIndex, onSelect }) => {
    return (
        <div className="bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden">
            <div className="p-4 border-b border-zinc-800 bg-zinc-900/50">
                <h3 className="text-lg font-google-sans font-normal text-white">Playlist</h3>
                <p className="text-xs text-zinc-500">{lessons.length} Lessons</p>
            </div>

            <div className="max-h-[400px] overflow-y-auto scrollbar-hide">
                {lessons.map((lesson, idx) => {
                    const isActive = idx === currentIndex;
                    return (
                        <button
                            key={idx}
                            onClick={() => onSelect(idx)}
                            className={`w-full text-left p-4 flex items-start gap-3 border-b border-zinc-800/50 transition-colors ${isActive
                                ? 'bg-zinc-800 text-white'
                                : 'hover:bg-zinc-800/50 text-zinc-400 hover:text-white'
                                }`}
                        >
                            <div className="flex-1 min-w-0 py-1">
                                <h4 className="text-sm font-google-sans font-normal line-clamp-1">{lesson.title}</h4>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default CoursePlaylist;
