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

    React.useEffect(() => {
        const fetchCourses = async () => {
            try {
                // Fix: Use client-side filtering to avoid Firestore Index creation errors for "where + orderBy"
                const q = query(collection(db, 'content'), orderBy('createdAt', 'desc'));
                const querySnapshot = await getDocs(q);
                const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Content));
                const coursesOnly = data.filter(item => item.type === 'course');
                setCourses(coursesOnly);
            } catch (error) {
                console.error("Error fetching courses:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchCourses();
    }, []);

    return (
        <Layout>
            <div className="pt-24 pb-20 px-4 min-h-screen">

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 pb-20 px-4">
                        {Array.from({ length: 12 }).map((_, i) => (
                            <div key={i}>
                                <VideoCardSkeleton />
                            </div>
                        ))}
                    </div>
                ) : courses.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 pb-20 px-4">
                        {courses.map(course => (
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
                    <div className="text-zinc-500">No courses found.</div>
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
