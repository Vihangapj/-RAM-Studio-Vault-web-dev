import React, { useRef } from 'react';
import type { Content } from '../types/types';
import VideoCard from './VideoCard';
import VideoCardSkeleton from './VideoCardSkeleton';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ContentRowProps {
    title: string;
    contents: Content[];
    loading?: boolean;
    onClick?: (content: Content) => void;
}

const ContentRow: React.FC<ContentRowProps> = ({ title, contents, loading = false, onClick }) => {
    const rowRef = useRef<HTMLDivElement>(null);

    const slide = (shift: number) => {
        if (rowRef.current) {
            rowRef.current.scrollBy({ left: shift, behavior: 'smooth' });
        }
    };

    if (!loading && contents.length === 0) {
        return null;
    }

    return (
        <div className="py-0 relative group/row">
            
            {/* Title: ප්ලැට්ෆෝම් එකේ ලෝගෝ එකට හරියටම යටින් එන්න px-4 md:px-8 එකතු කළා */}
            <h2 className="text-xl md:text-2xl font-gunterz-black text-white mb-0 tracking-tight hover:text-zinc-200 transition-colors cursor-pointer inline-block px-4 md:px-8 pt-2 pb-1">
                {title}
            </h2>

            <div className="relative overflow-visible">
                <ChevronLeft
                    className="absolute left-0 top-1/2 -translate-y-1/2 z-40 w-10 h-20 bg-black/50 hover:bg-black/70 text-white cursor-pointer opacity-0 group-row-hover:opacity-100 transition-opacity hidden md:flex items-center justify-center"
                    onClick={() => slide(-400)}
                />

                {/* Cards Container: මුල් කාඩ් එක ලෝගෝ එකට සමාන්තරව ආරම්භ වීමට px-4 md:px-8 එකතු කළා */}
                <div
                    ref={rowRef}
                    className="flex flex-nowrap items-stretch gap-4 overflow-x-auto overflow-y-visible scrollbar-hide scroll-smooth px-4 md:px-8 pt-1 pb-1"
                >
                    {loading
                        ? Array.from({ length: 6 }).map((_, i) => (
                            <VideoCardSkeleton key={i} />
                        ))
                        : contents.map((content) => (
                            <VideoCard 
                                key={content.id} 
                                content={content} 
                                onClick={onClick ? () => onClick(content) : undefined} 
                            />
                        ))
                    }
                </div>

                <ChevronRight
                    className="absolute right-0 top-1/2 -translate-y-1/2 z-40 w-10 h-20 bg-black/50 hover:bg-black/70 text-white cursor-pointer opacity-0 group-row-hover:opacity-100 transition-opacity hidden md:flex items-center justify-center"
                    onClick={() => slide(400)}
                />
            </div>
        </div>
    );
};

export default ContentRow;