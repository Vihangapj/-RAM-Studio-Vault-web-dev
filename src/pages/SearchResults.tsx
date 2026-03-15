import React from 'react';
import Layout from '../components/Layout';
import { db } from '../utils/firebase';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import type { Content } from '../types/types';
import VideoCard from '../components/VideoCard';
import VideoCardSkeleton from '../components/VideoCardSkeleton';
import { useSearchParams } from 'react-router-dom';
import CourseDetailsModal from '../components/CourseDetailsModal';

const SearchResults: React.FC = () => {
    const [searchParams] = useSearchParams();
    const qStr = searchParams.get('q') || '';
    const [results, setResults] = React.useState<Content[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [selectedCourse, setSelectedCourse] = React.useState<Content | null>(null);
    const [showModal, setShowModal] = React.useState(false);

    React.useEffect(() => {
        const fetchAndFilter = async () => {
            setLoading(true);
            try {
                // Fetch all content (Optimization: In a real app with >1000 docs, use Algolia or server-side search)
                const q = query(collection(db, 'content'), orderBy('createdAt', 'desc'));
                const querySnapshot = await getDocs(q);
                const allData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Content));

                const searchLower = qStr.toLowerCase();
                const filtered = allData.filter(item =>
                    (item.title?.toLowerCase() || '').includes(searchLower) ||
                    (item.description?.toLowerCase() || '').includes(searchLower) ||
                    ((item as any).categories ? (item as any).categories.join(' ').toLowerCase() : '').includes(searchLower)
                );
                setResults(filtered);
            } catch (error) {
                console.error("Error searching:", error);
            } finally {
                setLoading(false);
            }
        };

        if (qStr) {
            fetchAndFilter();
        } else {
            setResults([]);
            setLoading(false);
        }
    }, [qStr]);

    return (
        <Layout>
            <div className="pt-24 pb-20 px-4 min-h-screen">
                <h1 className="text-2xl md:text-3xl font-bold mb-8 text-white">
                    Search Results for "<span className="text-zinc-400">{qStr}</span>"
                </h1>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 pb-20 px-4">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <VideoCardSkeleton key={i} />
                        ))}
                    </div>
                ) : results.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 pb-20 px-4">
                        {results.map(item => (
                            <VideoCard key={item.id} content={item} onClick={(c) => { setSelectedCourse(c); setShowModal(true); }} />
                        ))}
                    </div>
                ) : (
                    <div className="text-zinc-500">No results found matching your query.</div>
                )}

                {selectedCourse && (
                    <CourseDetailsModal content={selectedCourse} isOpen={showModal} onClose={() => { setShowModal(false); setSelectedCourse(null); }} />
                )}
            </div>
        </Layout>
    );
};

export default SearchResults;
