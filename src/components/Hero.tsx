import React from 'react';
import type { Content } from '../types/types';
import { Play, Info } from 'lucide-react';
import { Link } from 'react-router-dom';

interface HeroProps {
    featuredContent: Content | null; // Can be null if loading
}

const Hero: React.FC<HeroProps> = ({ featuredContent }) => {
    const [showTrailer, setShowTrailer] = React.useState(false);

    if (!featuredContent) {
        return (
            <div className="w-full h-[60vh] md:h-[80vh] bg-zinc-900 animate-pulse" />
        );
    }

    return (
        <div className="relative w-full h-[60vh] md:h-[80vh]">
            {/* Background Image/Video */}
            <img
                src={featuredContent.thumbnailUrl}
                alt={featuredContent.title}
                className="w-full h-full object-cover"
            />

            {/* Overlay Gradient (Bottom up and Left to right for text) */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-90" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/20 to-transparent" />

            {/* Hero Content */}
            <div className="absolute bottom-[20%] left-4 md:left-12 max-w-2xl px-4">
                <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 drop-shadow-lg tracking-tighter">
                    {featuredContent.title}
                </h1>
                <p className="text-zinc-200 text-sm md:text-lg mb-6 line-clamp-3 drop-shadow-md font-medium max-w-lg">
                    {featuredContent.description}
                </p>

                <div className="flex items-center gap-4">
                    <Link
                        to={`/watch/${featuredContent.id}`}
                        className="flex items-center gap-2 bg-white text-black px-6 py-2 md:px-8 md:py-3 rounded font-bold hover:bg-zinc-200 transition-colors"
                    >
                        <Play className="w-5 h-5 fill-black" />
                        Play
                    </Link>
                    <button
                        onClick={() => setShowTrailer(true)}
                        className="flex items-center gap-2 bg-zinc-600/80 text-white px-6 py-2 md:px-8 md:py-3 rounded font-bold hover:bg-zinc-600 transition-colors backdrop-blur-sm"
                    >
                        <Info className="w-5 h-5" />
                        Watch Trailer
                    </button>
                </div>
            </div>

            {/* Trailer Modal */}
            {showTrailer && (
                <div className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4">
                    <div className="relative w-full max-w-4xl aspect-video bg-black rounded-xl overflow-hidden shadow-2xl border border-zinc-800">
                        <button
                            onClick={() => setShowTrailer(false)}
                            className="absolute top-4 right-4 z-10 text-white bg-black/50 p-2 rounded-full hover:bg-white/20 transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                        </button>
                        <iframe
                            className="w-full h-full"
                            src={`https://www.youtube.com/embed/${featuredContent.youtubeId}?autoplay=1`}
                            title="Trailer"
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
