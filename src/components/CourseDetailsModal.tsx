import React from 'react';
import type { Content } from '../types/types';
import { X, Play, ExternalLink, Clock, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';

interface CourseDetailsModalProps {
    content: Content;
    isOpen: boolean;
    onClose: () => void;
}

const CourseDetailsModal: React.FC<CourseDetailsModalProps> = ({ content, isOpen, onClose }) => {
    if (!isOpen) return null;

    const totalLessons = content.lessons?.length || 0;
    // Calculate total duration if lessons have durationSeconds
    const lessonDurations = content.lessons?.map(l => l.durationSeconds).filter(Boolean) as number[] | undefined;
    const totalDurationSeconds = lessonDurations && lessonDurations.length > 0
        ? lessonDurations.reduce((a, b) => a + b, 0)
        : undefined;

    const formatDuration = (seconds?: number) => {
        if (seconds === undefined) return '—';
        if (seconds >= 3600) {
            const h = Math.floor(seconds / 3600);
            const m = Math.floor((seconds % 3600) / 60);
            return `${h}h ${m}m`;
        }
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

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
                            src={content.thumbnailUrl}
                            alt={content.title}
                            className="w-full h-64 object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent" />
                        <div className="absolute bottom-4 left-4 right-4">
                            <h1 className="text-3xl font-gunterz-black text-white mb-2">{content.title}</h1>
                            <div className="flex items-center gap-4 text-zinc-300">
                                <span className="flex items-center gap-1">
                                    <BookOpen className="w-4 h-4" />
                                    {totalLessons} Lessons
                                </span>
                                <span className="flex items-center gap-1">
                                    <Clock className="w-4 h-4" />
                                    {totalDurationSeconds !== undefined ? formatDuration(totalDurationSeconds) : '—'}
                                </span>
                                <span className="text-sm bg-zinc-800 px-2 py-1 rounded">
                                    {content.category}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-4 space-y-6">
                        {/* Description */}
                        <div>
                            <h2 className="text-xl font-gunterz-black text-white mb-3">About this course</h2>
                            <p className="text-zinc-300 leading-relaxed">{content.description}</p>
                        </div>

                        {/* Lessons Preview */}
                        {content.lessons && content.lessons.length > 0 && (
                            <div>
                                <h2 className="text-xl font-gunterz-black text-white mb-3">Course Syllabus</h2>
                                <div className="space-y-2 max-h-96 overflow-y-auto">
                                    {content.lessons.slice(0, 5).map((lesson, idx) => (
                                        <div key={idx} className="flex items-center gap-3 p-3 bg-zinc-800/50 rounded-lg">
                                            <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center text-sm font-medium">
                                                {idx + 1}
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="text-white font-medium">{lesson.title}</h3>
                                                <p className="text-zinc-400 text-sm">{lesson.durationSeconds ? formatDuration(lesson.durationSeconds) : '—'}</p>
                                            </div>
                                            {lesson.resources && lesson.resources.length > 0 && (
                                                <ExternalLink className="w-4 h-4 text-zinc-400" />
                                            )}
                                        </div>
                                    ))}
                                    {content.lessons.length > 5 && (
                                        <p className="text-zinc-400 text-sm text-center py-2">
                                            +{content.lessons.length - 5} more lessons
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Resources */}
                        {content.resources && content.resources.length > 0 && (
                            <div>
                                <h2 className="text-xl font-semibold text-white mb-3">Course Resources</h2>
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

                        {/* Action Buttons */}
                        <div className="flex gap-3 pt-4">
                            <Link
                                to={`/watch/${content.id}`}
                                onClick={onClose}
                                className="flex-1 bg-white text-black px-6 py-3 rounded-lg font-semibold hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2"
                            >
                                <Play className="w-5 h-5" />
                                Start Course
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CourseDetailsModal;