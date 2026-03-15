import React from 'react';
import type { Content } from '../types/types';
import { Play, Video, X } from 'lucide-react';
import { parseYoutubeId } from '../utils/youtube';

interface HeroProps {
    featuredContent: Content | null;
    onPlayClick?: (content: Content) => void;
}

const Hero: React.FC<HeroProps> = ({ featuredContent, onPlayClick }) => {
    const [showTrailer, setShowTrailer] = React.useState(false);
    const [currentImageIndex, setCurrentImageIndex] = React.useState(0);

    React.useEffect(() => {
        if (showTrailer) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [showTrailer]);

    React.useEffect(() => {
        if (featuredContent?.thumbnails && featuredContent.thumbnails.length > 0) {
            const timer = setInterval(() => {
                setCurrentImageIndex((prev) => (prev + 1) % (featuredContent.thumbnails!.length + 1));
            }, 20000);
            return () => clearInterval(timer);
        }
    }, [featuredContent]);

    const displayImage = React.useMemo(() => {
        if (!featuredContent) return '';
        const allImages = [featuredContent.thumbnailUrl, ...(featuredContent.thumbnails || [])];
        return allImages[currentImageIndex] || featuredContent.thumbnailUrl;
    }, [featuredContent, currentImageIndex]);

    if (!featuredContent) {
        return <div className="w-full h-[60vh] md:h-[80vh] bg-zinc-900 animate-pulse" />;
    }

    return (
        <div className="relative w-full h-[55vh] sm:h-[60vh] md:h-[80vh]">
            {/* Background Image Layers */}
            <div className="absolute inset-0 bg-black overflow-hidden">
                {/* Blurred Background Layer for Mobile */}
                <img
                    src={displayImage}
                    className="absolute inset-0 w-full h-full object-cover blur-3xl opacity-40 block md:hidden scale-110"
                    alt=""
                />

                {/* Previous Image Layer */}
                <img
                    key={`prev-${currentImageIndex}`}
                    src={[featuredContent.thumbnailUrl, ...(featuredContent.thumbnails || [])][(currentImageIndex - 1 + (featuredContent.thumbnails?.length || 0) + 1) % ((featuredContent.thumbnails?.length || 0) + 1)]}
                    alt=""
                    className="absolute inset-0 w-full h-full object-contain md:object-cover object-center opacity-0"
                />
                {/* Current Image Layer */}
                <img
                    key={`curr-${currentImageIndex}`}
                    src={displayImage}
                    alt={featuredContent.title}
                    className="absolute inset-0 w-full h-full object-contain md:object-cover object-center animate-hero-fade"
                />
            </div>

            {/* Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/20 to-transparent" />

            {/* Hero Content - Alignment Fixed Here */}
            <div className="absolute bottom-[10%] md:bottom-[25%] lg:bottom-[30%] left-0 w-full z-30">
                <div className="max-w-[1800px] mx-auto px-4 md:px-8">
                    <div className="max-w-2xl">
                        {(featuredContent.showTitleOnHero !== false) && (
                            <h1 className="text-2xl md:text-6xl font-gunterz-bold text-white mb-3 md:mb-8 drop-shadow-lg tracking-tighter">
                                {featuredContent.title}
                            </h1>
                        )}
                        <p className="text-zinc-200 text-xs md:text-lg mb-6 md:mb-10 line-clamp-2 drop-shadow-md font-medium max-w-lg">
                            {featuredContent.description}
                        </p>

                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => onPlayClick && featuredContent && onPlayClick(featuredContent)}
                                className="flex items-center gap-2 bg-white text-black px-6 py-2 md:px-8 md:py-3 rounded font-gunterz-bold-italic hover:bg-zinc-200 transition-colors gs-btn"
                            >
                                <Play className="w-5 h-5 fill-black" />
                                Play
                            </button>
                            <button
                                onClick={() => setShowTrailer(true)}
                                className="flex items-center gap-2 bg-zinc-800 text-white px-6 py-2 md:px-8 md:py-3 rounded font-gunterz-bold-italic hover:bg-zinc-700 transition-colors gs-btn"
                            >
                                <Video className="w-5 h-5" />
                                Intro
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Trailer Modal */}
            {showTrailer && (
                <div className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4" onClick={() => setShowTrailer(false)}>
                    <div className="relative w-full max-w-4xl aspect-video bg-black rounded-xl overflow-hidden shadow-2xl border border-zinc-800" onClick={(e) => e.stopPropagation()}>
                        <button
                            onClick={() => setShowTrailer(false)}
                            className="absolute top-4 right-4 z-10 text-white bg-black/50 p-2 rounded-full hover:bg-white/20 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <iframe
                            className="w-full h-full"
                            src={`https://www.youtube.com/embed/${parseYoutubeId(featuredContent.youtubeId) || featuredContent.youtubeId}?autoplay=1`}
                            title="Intro"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default Hero;