import React from 'react';
import { motion } from 'framer-motion';
import type { Content } from '../types/types';
import { Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface VideoCardProps {
    content: Content;
    onClick?: (content: Content) => void;
}

const VideoCard: React.FC<VideoCardProps> = ({ content, onClick }) => {
    const navigate = useNavigate();
    const [imageError, setImageError] = React.useState(false);
    const [currentThumbIndex, setCurrentThumbIndex] = React.useState(0);
    const [isHovered, setIsHovered] = React.useState(false);
    const intervalRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

    React.useEffect(() => {
        if (isHovered && content.thumbnails && content.thumbnails.length > 0) {
            intervalRef.current = setInterval(() => {
                setCurrentThumbIndex(prev => {
                    const totalImages = (content.thumbnails?.length || 0) + 1;
                    return (prev + 1) % totalImages;
                });
            }, 1000); // Fast cycle on hover
        } else {
            setCurrentThumbIndex(0);
            if (intervalRef.current) clearInterval(intervalRef.current);
        }
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isHovered, content.thumbnails]);

    const displayThumb = React.useMemo(() => {
        const allImages = [content.thumbnailUrl, ...(content.thumbnails || [])];
        return allImages[currentThumbIndex] || content.thumbnailUrl;
    }, [content.thumbnailUrl, content.thumbnails, currentThumbIndex]);

    const handleClick = () => {
        if (onClick) {
            onClick(content);
        } else {
            navigate(`/watch/${content.id}`);
        }
    };

    return (
        <div
            className="block flex-shrink-0 cursor-pointer"
            style={{ width: '280px', minWidth: '280px' }}
            onClick={handleClick}
        >
            <motion.div
                className="relative w-full rounded-lg overflow-hidden bg-zinc-800 cursor-pointer group"
                style={{ aspectRatio: '16/9' }}
                onHoverStart={() => setIsHovered(true)}
                onHoverEnd={() => setIsHovered(false)}
                whileHover={{
                    scale: 1.05,
                    zIndex: 20,
                    transition: { duration: 0.2, ease: 'easeOut' }
                }}
            >
                {/* Thumbnail Image */}
                {content.thumbnailUrl && !imageError ? (
                    <img
                        src={displayThumb}
                        alt={content.title}
                        loading="lazy"
                        onError={() => setImageError(true)}
                        className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300"
                    />
                ) : (
                    <div className="absolute inset-0 w-full h-full bg-zinc-800 flex items-center justify-center">
                        <div className="text-center">
                            <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-zinc-700 flex items-center justify-center">
                                <Play className="w-5 h-5 text-zinc-500" />
                            </div>
                            <span className="text-zinc-500 font-medium text-xs uppercase tracking-wider">{content.title?.slice(0, 20) || 'No Title'}</span>
                        </div>
                    </div>
                )}

                {/* Always visible gradient overlay for title */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                {/* Title always visible at bottom */}
                <div className="absolute bottom-0 left-0 right-0 p-3">
                    <h3 className="text-white font-semibold text-sm drop-shadow-md line-clamp-1">{content.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-white/20 text-white uppercase">
                            {content.type === 'course' ? 'Course' : 'Video'}
                        </span>
                        {content.category && (
                            <span className="text-[10px] text-zinc-400">{content.category}</span>
                        )}
                    </div>
                </div>

                {/* Hover Overlay with Play Button */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-black transform scale-90 group-hover:scale-100 transition-transform duration-200">
                        <Play className="w-5 h-5 fill-black ml-0.5" />
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default VideoCard;
