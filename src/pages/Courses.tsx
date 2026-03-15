import React from 'react';
import Layout from '../components/Layout';
import { db } from '../utils/firebase';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import type { Content } from '../types/types';
import VideoCard from '../components/VideoCard';
import VideoCardSkeleton from '../components/VideoCardSkeleton';
import CourseDetailsModal from '../components/CourseDetailsModal';

const Courses: React.FC = () => {
    const [courses, setCourses] = React.useState<Content[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [selectedCourse, setSelectedCourse] = React.useState<Content | null>(null);
    const [showModal, setShowModal] = React.useState(false);
    const [categories, setCategories] = React.useState<string[]>([]);
    const [selectedCategories, setSelectedCategories] = React.useState<string[]>([]);

    React.useEffect(() => {
        const fetchCourses = async () => {
            try {
                // Fix: Use client-side filtering to avoid Firestore Index creation errors for "where + orderBy"
                const q = query(collection(db, 'content'), orderBy('createdAt', 'desc'));
                const querySnapshot = await getDocs(q);
                const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Content));
                const coursesOnly = data.filter(item => {
                    if (item.type !== 'course') return false;
                    const dests = (item as any).destinations ?? ((item as any).destination ? [(item as any).destination] : []);
                    return dests.includes('vault');
                });
                setCourses(coursesOnly);
                
                // Extract unique categories from all courses (they can have multiple categories)
                const uniqueCategories = Array.from(new Set(
                    coursesOnly.flatMap(course => course.categories || [])
                )).filter(Boolean);
                setCategories(uniqueCategories as string[]);
            } catch (error) {
                console.error("Error fetching courses:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchCourses();
    }, []);

    const toggleCategory = (category: string) => {
        setSelectedCategories(prev => 
            prev.includes(category) 
                ? prev.filter(c => c !== category)
                : [...prev, category]
        );
    };

    const filteredCourses = selectedCategories.length > 0 
        ? courses.filter(course => 
            (course.categories || []).some(cat => selectedCategories.includes(cat))
        )
        : courses;

    return (
        <Layout>
            <div className="pt-24 pb-20 px-4 min-h-screen">
                {/* Category Filter Bar */}
                {categories.length > 0 && (
                    <div className="mb-8 flex flex-wrap gap-3">
                        <button
                            onClick={() => setSelectedCategories([])}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                                selectedCategories.length === 0
                                    ? 'bg-white text-black'
                                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                            }`}
                        >
                            All Categories
                        </button>
                        {categories.map(category => (
                            <button
                                key={category}
                                onClick={() => toggleCategory(category)}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                                    selectedCategories.includes(category)
                                        ? 'bg-white text-black'
                                        : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                                }`}
                            >
                                {category}
                            </button>
                        ))}
                    </div>
                )}

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 pb-20 px-4">
                        {Array.from({ length: 12 }).map((_, i) => (
                            <div key={i}>
                                <VideoCardSkeleton />
                            </div>
                        ))}
                    </div>
                ) : filteredCourses.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 pb-20 px-4">
                        {filteredCourses.map(course => (
                            <div key={course.id}>
                                <VideoCard
                                    content={course}
                                    onClick={(content) => {
                                        setSelectedCourse(content);
                                        setShowModal(true);
                                    }}
                                />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-zinc-500">No courses found in the selected categories.</div>
                )}
            </div>

            {/* Course Details Modal */}
            {selectedCourse && (
                <CourseDetailsModal
                    content={selectedCourse}
                    isOpen={showModal}
                    onClose={() => {
                        setShowModal(false);
                        setSelectedCourse(null);
                    }}
                />
            )}
        </Layout>
    );
};

export default Courses;
