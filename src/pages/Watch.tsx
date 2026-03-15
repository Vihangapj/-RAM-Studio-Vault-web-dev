import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import Layout from '../components/Layout';
import { db } from '../utils/firebase';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import type { Content } from '../types/types';
import ResourceList from '../components/ResourceList';
import CoursePlaylist from '../components/CoursePlaylist';

const Watch: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [content, setContent] = useState<Content | null>(null);
    const [activeLessonIndex, setActiveLessonIndex] = useState(0);

    const location = useLocation();

    useEffect(() => {
        const fetchContent = async () => {
            if (!id) return;
            try {
                const docRef = doc(db, 'content', id);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const data = { id: docSnap.id, ...docSnap.data() } as Content;
                    setContent(data);

                    // Determine initial lesson index from location state or query param
                    let initialIndex = 0;
                    const stateInitial = (location.state as any)?.initialLesson;
                    if (typeof stateInitial === 'number' && data.lessons) {
                        initialIndex = Math.max(0, Math.min(stateInitial, data.lessons.length - 1));
                    } else {
                        const sp = new URLSearchParams(location.search);
                        const p = sp.get('lesson');
                        if (p !== null && !isNaN(Number(p)) && data.lessons) {
                            const parsed = Math.max(0, Math.min(Number(p), data.lessons.length - 1));
                            initialIndex = parsed;
                        }
                    }

                    setActiveLessonIndex(initialIndex);

                    // Increment views
                    await updateDoc(docRef, {
                        views: increment(1)
                    });
                }
            } catch (error) {
                console.error("Error fetching video:", error);
            }
        };

        fetchContent();
    }, [id]);

    if (!content) {
        return (
            <Layout>
                <div className="min-h-screen flex items-center justify-center">
                    <p>Loading...</p>
                </div>
            </Layout>
        );
    }

    // Determine current video ID
    const currentVideoId = content.type === 'course' && content.lessons
        ? content.lessons[activeLessonIndex]?.youtubeId
        : content.youtubeId;

    const currentTitle = content.type === 'course' && content.lessons
        ? content.lessons[activeLessonIndex]?.title
        : content.title;

    return (
        <Layout hideFooter={true}>
            {/* max-w-screen-2xl මගින් content එකට ඉතා වැඩි පළලක් ලබා දෙයි */}
            <div className="pt-24 px-4 md:px-8 min-h-screen max-w-screen-2xl mx-auto">

                {/* Gap එක 10 දක්වා වැඩි කර වීඩියෝව සහ ලිස්ට් එක අතර පැහැදිලි බවක් ලබා දී ඇත */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    
                    {/* Video Column: columns 12න් 8ක් ලබා දී ඇත */}
                    <div className="lg:col-span-8 lg:sticky lg:top-24 space-y-6">
                        {/* 16:9 Player Container - max-h ඉවත් කළේ width එකට සාපේක්ෂව වීඩියෝව ලොකු වීමටයි */}
                        <div className="relative aspect-video bg-zinc-900 rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/10">
                            <iframe
                                src={`https://www.youtube.com/embed/${currentVideoId}?autoplay=0&modestbranding=1&rel=0`}
                                title={currentTitle}
                                className="w-full h-full border-0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            />
                        </div>

                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold mb-2">{currentTitle}</h1>
                            {content.type === 'course' && (
                                <p className="text-zinc-400 text-sm mb-4">
                                    {content.title} • Lesson {activeLessonIndex + 1} of {content.lessons?.length}
                                </p>
                            )}
                            <p className="text-zinc-300 leading-relaxed max-w-4xl">
                                {content.description}
                            </p>
                        </div>
                    </div>

                    {/* Sidebar Column: columns 12න් 4ක් ලබා දී ඇත */}
                    <div className="lg:col-span-4 space-y-6">
                        {content.type === 'course' && content.lessons && (
                            <CoursePlaylist
                                lessons={content.lessons}
                                currentIndex={activeLessonIndex}
                                onSelect={setActiveLessonIndex}
                            />
                        )}

                        {content.type === 'course' && content.lessons?.[activeLessonIndex]?.resources &&
                            content.lessons[activeLessonIndex].resources!.length > 0 && (
                                <ResourceList
                                    resources={content.lessons[activeLessonIndex].resources!}
                                    title="Lesson Resources"
                                />
                            )}

                        {content.resources && content.resources.length > 0 && (
                            <ResourceList
                                resources={content.resources}
                                title={content.type === 'course' ? 'Course Resources' : 'Resources'}
                            />
                        )}
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default Watch;