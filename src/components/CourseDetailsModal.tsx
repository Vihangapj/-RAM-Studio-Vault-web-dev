import React from 'react';
import { db } from '../utils/firebase';
import { collection, getDocs } from 'firebase/firestore';

import type { Content } from '../types/types';

import { X, Play, ExternalLink, Clock, BookOpen, Video } from 'lucide-react';
import { Link } from 'react-router-dom';
import { parseYoutubeId } from '../utils/youtube';



interface CourseDetailsModalProps {

    content: Content;

    isOpen: boolean;

    onClose: () => void;

}



const CourseDetailsModal: React.FC<CourseDetailsModalProps> = ({ content, isOpen, onClose }) => {

    const [selectedThumbIndex, setSelectedThumbIndex] = React.useState(0);

    const [showAllLessons, setShowAllLessons] = React.useState(false);
    const [filterMap, setFilterMap] = React.useState<Record<string, string>>({});
    const [showTrailer, setShowTrailer] = React.useState(false);

    React.useEffect(() => {
        let mounted = true;
        const fetchFilters = async () => {
            try {
                const snap = await getDocs(collection(db, 'filterCategories'));
                const map: Record<string, string> = {};
                snap.docs.forEach(d => {
                    const data = d.data() as any;
                    (data.options || []).forEach((opt: any) => {
                        map[opt.id] = opt.label;
                    });
                });
                if (mounted) setFilterMap(map);
            } catch (err) {
                // ignore
            }
        };
        fetchFilters();
        return () => { mounted = false; };
    }, []);

    // Early return AFTER all hooks
    if (!isOpen) return null;



    const totalLessons = content.lessons?.length || 0;

    // Calculate total duration if lessons have durationSeconds

    const lessonDurations = content.lessons?.map(l => l.durationSeconds).filter(Boolean) as number[] | undefined;

    const totalDurationSeconds = lessonDurations && lessonDurations.length > 0

        ? lessonDurations.reduce((a, b) => a + b, 0)

        : undefined;



    const formatDuration = (seconds?: number) => {

        if (seconds === undefined) return '';

        if (seconds >= 3600) {

            const h = Math.floor(seconds / 3600);

            const m = Math.floor((seconds % 3600) / 60);

            return `${h}h ${m}m`;

        }

        const m = Math.floor(seconds / 60);

        const s = seconds % 60;

        return `${m}:${s.toString().padStart(2, '0')}`;

    };



    const allImages = [content.thumbnailUrl, ...(content.thumbnails || [])];



    React.useEffect(() => {

        if (isOpen) {

            document.body.style.overflow = 'hidden';

        } else {

            document.body.style.overflow = 'unset';

        }

        return () => {

            document.body.style.overflow = 'unset';

        };

    }, [isOpen]);



    React.useEffect(() => {

        setSelectedThumbIndex(0);

    }, [content.id]);



    return (

        <div className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4" onClick={onClose}>

            <div className="relative w-full max-w-4xl max-h-[90vh] bg-zinc-900 rounded-xl overflow-hidden shadow-2xl border border-zinc-800 mt-20" onClick={(e) => e.stopPropagation()}>

                {/* Close Button */}

                <button

                    onClick={onClose}

                    className="absolute top-4 right-4 z-10 text-white bg-black/50 p-2 rounded-full hover:bg-white/20 transition-colors"

                >

                    <X className="w-5 h-5" />

                </button>



                <div className="overflow-y-auto max-h-[90vh]">

                    {/* Hero Section */}

                    <div className="relative">

                        <img

                            src={allImages[selectedThumbIndex]}

                            alt={content.title}

                            className="w-full h-64 object-cover"

                        />

                        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent" />

                        {/* Title and Metadata - Conditionally rendered */}
                        {(content.showTitleOnThumbnail !== false) && (
                            <div className="absolute bottom-4 left-4 right-4">

                                <h1 className="text-3xl font-gunterz-black text-white mb-3">{content.title}</h1>

                                <div className="flex items-center gap-4 text-zinc-300 mb-3">

                                    <span className="flex items-center gap-1">

                                        <BookOpen className="w-4 h-4" />

                                        {totalLessons} Lessons

                                    </span>

                                    {totalDurationSeconds !== undefined && (

                                        <span className="flex items-center gap-1">

                                            <Clock className="w-4 h-4" />

                                            {formatDuration(totalDurationSeconds)}

                                        </span>

                                    )}

                                    {(content as any).filters && Object.values((content as any).filters).flat().length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                            {((Object.values((content as any).filters) as any[]).flat() as string[])
                                                .map(id => filterMap[id] || id)
                                                .map((label, idx) => (
                                                    <span key={idx} className="text-sm bg-zinc-800 px-2 py-1 rounded">{label}</span>
                                                ))}
                                        </div>
                                    )}

                                </div>

                            </div>
                        )}



                        {/* Thumbnails strip */}

                        {allImages.length > 1 && (

                            <div className="absolute -bottom-8 left-4 right-4">

                                <div className="flex items-center gap-2 overflow-x-auto py-2">

                                    {allImages.map((img, idx) => (

                                        <button

                                            key={idx}

                                            onClick={() => setSelectedThumbIndex(idx)}

                                            className={`w-20 h-12 rounded overflow-hidden border-2 ${selectedThumbIndex === idx ? 'border-white' : 'border-transparent'} focus:outline-none`}

                                        >

                                            <img src={img} alt={`${content.title}-thumb-${idx}`} className="w-full h-full object-cover" />

                                        </button>

                                    ))}

                                </div>

                            </div>

                        )}

                    </div>



                    {/* Content */}

                    <div className="p-4 space-y-6">

                        {/* Description */}

                        <div>

                            <div className="flex items-start justify-end mb-3 gap-3">
                                <Link
                                    to={`/watch/${content.id}?lesson=0`}
                                    onClick={onClose}
                                    className="inline-flex items-center gap-2 bg-white text-black px-6 py-2 rounded-lg font-gunterz-bold-italic hover:bg-zinc-200 transition-colors gs-btn"
                                >
                                    <Play className="w-5 h-5 fill-current" />
                                    Start
                                </Link>

                                <button
                                    onClick={() => setShowTrailer(true)}
                                    className="inline-flex items-center gap-2 bg-zinc-800 text-white px-6 py-2 rounded-lg font-gunterz-bold-italic hover:bg-zinc-700 transition-colors gs-btn"
                                >
                                    <Video className="w-5 h-5" />
                                    Intro
                                </button>
                            </div>

                            <p className="text-zinc-300 leading-relaxed">{content.description}</p>

                        </div>



                        {/* Lessons Preview */}

                        {content.lessons && content.lessons.length > 0 && (

                            <div>

                                <div className="flex items-center justify-between mb-4">

                                    <h2 className="text-xl font-google-sans font-normal text-white uppercase tracking-wider">Lessons</h2>

                                    <span className="text-zinc-500 text-sm">{content.lessons.length} Episodes</span>

                                </div>

                                <div className="space-y-4">

                                    {(showAllLessons ? content.lessons : content.lessons.slice(0, 5)).map((lesson, idx) => (

                                        <Link

                                            key={idx}

                                            to={`/watch/${content.id}?lesson=${idx}`}

                                            onClick={onClose}

                                            className="group block"

                                        >

                                            <div className="flex items-center gap-3 sm:gap-6 p-3 sm:p-4 bg-zinc-800/20 rounded-xl hover:bg-zinc-800/40 transition-all duration-300 border border-zinc-800/50 hover:border-zinc-700">

                                                {/* Lesson Index */}

                                                <div className="text-lg sm:text-2xl font-inter font-bold text-zinc-600 group-hover:text-zinc-400 transition-colors w-6 sm:w-8 text-center shrink-0">

                                                    {idx + 1}

                                                </div>



                                                {/* Lesson Thumbnail */}

                                                <div className="relative flex-shrink-0 w-24 h-16 sm:w-40 sm:h-24 rounded-lg overflow-hidden border border-zinc-800 group-hover:border-zinc-600 transition-colors shadow-lg">

                                                    {lesson.thumbnailUrl ? (

                                                        <img

                                                            src={lesson.thumbnailUrl}

                                                            alt={lesson.title}

                                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"

                                                        />

                                                    ) : (

                                                        <div className="w-full h-full bg-zinc-800 flex items-center justify-center">

                                                            <Play className="w-8 h-8 text-zinc-600" />

                                                        </div>

                                                    )}

                                                    {/* Play Overlay */}

                                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 flex items-center justify-center transition-all">

                                                        <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">

                                                            <Play className="w-5 h-5 text-white fill-current" />

                                                        </div>

                                                    </div>

                                                </div>



                                                {/* Lesson Details */}

                                                <div className="flex-1 min-w-0 overflow-hidden">

                                                    <h3 className="text-white text-lg font-google-sans font-normal truncate mb-1">

                                                        {lesson.title}

                                                    </h3>

                                                    <div className="flex items-center gap-2">

                                                        {lesson.resources && lesson.resources.length > 0 && (

                                                            <span className="inline-flex items-center gap-1 text-[10px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded border border-indigo-500/20 font-medium">

                                                                <ExternalLink className="w-3 h-3" />

                                                                RESOURCES

                                                            </span>

                                                        )}

                                                    </div>

                                                </div>

                                            </div>

                                        </Link>

                                    ))}



                                    {content.lessons.length > 5 && (

                                        <button

                                            onClick={() => setShowAllLessons(!showAllLessons)}

                                            className="w-full py-4 flex items-center justify-center gap-2 text-zinc-400 hover:text-white transition-colors bg-zinc-800/10 rounded-xl border border-dashed border-zinc-800 hover:border-zinc-700 mt-4 group"

                                        >

                                            <span className="font-google-sans font-bold text-sm uppercase tracking-widest">

                                                {showAllLessons ? 'Show Less' : `View More (${content.lessons.length - 5} More Episodes)`}

                                            </span>



                                            <div className={`transition-transform duration-300 ${showAllLessons ? 'rotate-180' : ''}`}>

                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">

                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />

                                                </svg>

                                            </div>

                                        </button>

                                    )}

                                </div>

                            </div>

                        )}





                        {/* Resources */}

                        {content.resources && content.resources.length > 0 && (

                            <div>

                                <h2 className="text-xl font-semibold text-white mb-3">Resources</h2>

                                <div className="space-y-2">

                                    {content.resources.map((resource, idx) => (

                                        <a

                                            key={idx}

                                            href={resource.url}

                                            target="_blank"

                                            rel="noopener noreferrer"

                                            className="flex items-center gap-3 p-3 bg-zinc-800/50 rounded-lg hover:bg-zinc-800 transition-colors"

                                        >

                                            <ExternalLink className="w-4 h-4 text-zinc-400" />

                                            <span className="text-zinc-300">{resource.label}</span>

                                        </a>

                                    ))}

                                </div>

                            </div>

                        )}

                    </div>

                </div>

                {/* Video Overlay */}
                {showTrailer && (
                    <div className="fixed inset-0 z-[70] bg-black/95 flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={() => { setShowTrailer(false); }}>
                        <div className="relative w-full max-w-4xl aspect-video bg-black rounded-xl overflow-hidden shadow-2xl border border-zinc-800" onClick={(e) => e.stopPropagation()}>
                            <button
                                onClick={() => { setShowTrailer(false); }}
                                className="absolute top-4 right-4 z-10 text-white bg-black/50 p-2 rounded-full hover:bg-white/20 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                            <iframe
                                className="w-full h-full"
                                src={`https://www.youtube.com/embed/${parseYoutubeId(content.youtubeId || '')}?autoplay=1`}
                                title="Intro"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            />
                        </div>
                    </div>
                )}

            </div>

        </div >

    );

};



export default CourseDetailsModal;