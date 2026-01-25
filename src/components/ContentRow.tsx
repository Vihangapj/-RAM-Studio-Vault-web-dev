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

    // Don't render if no content and not loading
    if (!loading && contents.length === 0) {
        return null;
    }

    return (
        <div className="py-2 relative group/row">
            <h2 className="text-xl md:text-2xl font-gunterz-black text-white mb-2 tracking-tight hover:text-zinc-200 transition-colors cursor-pointer inline-block px-4 py-2">
                {title}
            </h2>

            <div className="relative overflow-visible">
                <ChevronLeft
                    className="absolute left-0 top-1/2 -translate-y-1/2 z-40 w-10 h-20 bg-black/50 hover:bg-black/70 text-white cursor-pointer opacity-0 group-row-hover:opacity-100 transition-opacity hidden md:flex items-center justify-center "
                    onClick={() => slide(-400)}
                />

                <div
                    ref={rowRef}
                    className="flex flex-nowrap items-stretch gap-4 overflow-x-auto overflow-y-visible scrollbar-hide scroll-smooth px-4 py-4"
                >
                    {loading
                        ? Array.from({ length: 6 }).map((_, i) => (
                            <VideoCardSkeleton key={i} />
                        ))
                        : contents.map((content) => (
                            <VideoCard key={content.id} content={content} onClick={onClick ? () => onClick(content) : undefined} />
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
