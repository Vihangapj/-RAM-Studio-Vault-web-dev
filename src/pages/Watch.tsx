import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
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

    useEffect(() => {
        const fetchContent = async () => {
            if (!id) return;
            try {
                const docRef = doc(db, 'content', id);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const data = { id: docSnap.id, ...docSnap.data() } as Content;
                    setContent(data);

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
            <div className="pt-24 px-4 min-h-screen">

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                    {/* Main Player Column - Sticky on large screens */}
                    <div className="lg:col-span-3 lg:sticky lg:top-24 space-y-6">
                        {/* 16:9 Player Container */}
                        <div className="relative aspect-video bg-zinc-900 rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/10 max-h-[28rem]">
                            <iframe
                                src={`https://www.youtube.com/embed/${currentVideoId}?autoplay=0&modestbranding=1&rel=0`}
                                title={currentTitle}
                                className="w-full h-full"
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
                            <p className="text-zinc-300 leading-relaxed max-w-3xl">
                                {content.description}
                            </p>
                        </div>
                    </div>

                    {/* Sidebar Column */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Course Playlist */}
                        {content.type === 'course' && content.lessons && (
                            <CoursePlaylist
                                lessons={content.lessons}
                                currentIndex={activeLessonIndex}
                                onSelect={setActiveLessonIndex}
                            />
                        )}

                        {/* Lesson Resources (for courses) */}
                        {content.type === 'course' && content.lessons?.[activeLessonIndex]?.resources &&
                            content.lessons[activeLessonIndex].resources!.length > 0 && (
                                <ResourceList
                                    resources={content.lessons[activeLessonIndex].resources!}
                                    title="Lesson Resources"
                                />
                            )}

                        {/* Course/Video Resources */}
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
