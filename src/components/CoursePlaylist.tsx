import React from 'react';
import type { Lesson } from '../types/types';
import { PlayCircle } from 'lucide-react';

interface CoursePlaylistProps {
    lessons: Lesson[];
    currentIndex: number;
    onSelect: (index: number) => void;
}

const CoursePlaylist: React.FC<CoursePlaylistProps> = ({ lessons, currentIndex, onSelect }) => {
    return (
        <div className="bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden">
            <div className="p-4 border-b border-zinc-800 bg-zinc-900/50">
                <h3 className="text-lg font-bold text-white">Course Syllabus</h3>
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
                            <div className={`mt-0.5 ${isActive ? 'text-white' : 'text-zinc-600'}`}>
                                {isActive ? <PlayCircle className="w-5 h-5" /> : <div className="w-5 h-5 rounded-full border border-zinc-600 flex items-center justify-center text-[10px]">{idx + 1}</div>}
                            </div>
                            <div>
                                <h4 className="text-sm font-medium line-clamp-1">{lesson.title}</h4>
                                <div className="text-xs text-zinc-500 mt-1">10:00</div>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default CoursePlaylist;
