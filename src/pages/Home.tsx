import React from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import Hero from '../components/Hero';
import ContentRow from '../components/ContentRow';
import Loading from '../components/Loading';
import CourseDetailsModal from '../components/CourseDetailsModal';
import { db } from '../utils/firebase';
import { collection, getDocs, orderBy, query, limit } from 'firebase/firestore';
import type { Content } from '../types/types';

const Home: React.FC = () => {
    const [contents, setContents] = React.useState<Content[]>([]);

    const [filterCategories, setFilterCategories] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [selectedCourse, setSelectedCourse] = React.useState<Content | null>(null);
    const [showModal, setShowModal] = React.useState(false);
    const navigate = useNavigate();

    const handleContentClick = (content: Content) => {
        const isCourseLike = Array.isArray((content as any).lessons) && (content as any).lessons.length > 0;
        if (isCourseLike) {
            setSelectedCourse(content);
            setShowModal(true);
        } else {
            navigate(`/watch/${content.id}`);
        }
    };

    React.useEffect(() => {
        const fetchData = async () => {
            try {
                const q = query(collection(db, 'content'), orderBy('createdAt', 'desc'), limit(50));
                const querySnapshot = await getDocs(q);
                const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Content));
                setContents(data);

                // Fetch dynamic filter categories and options
                try {
                    const filterSnapshot = await getDocs(collection(db, 'filterCategories'));
                    const filterData = filterSnapshot.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
                    filterData.sort((a, b) => (a.order || 0) - (b.order || 0));
                    setFilterCategories(filterData);
                } catch (err) {
                    console.warn('Failed to fetch filterCategories', err);
                }

            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const vaultContents = contents.filter(c => {
        const dests = (c as any).destinations ?? ((c as any).destination ? [(c as any).destination] : []);
        return dests.includes('vault');
    }).sort((a, b) => {
        const aPriority = (a as any).trendingPriority || 0;
        const bPriority = (b as any).trendingPriority || 0;
        if (aPriority !== bPriority) return bPriority - aPriority; // higher priority first
        return (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0); // newer first
    });

    const featured = vaultContents.find(c => c.featured) || vaultContents[0] || contents[0];
    const slgdcContents = contents.filter(c => {
        const dests = (c as any).destinations ?? ((c as any).destination ? [(c as any).destination] : []);
        return dests.includes('slgdc');
    });

    const trendingContents = contents
        .filter(c => ((c as any).trendingPriority || 0) > 0)
        .sort((a, b) => {
            const aPriority = (a as any).trendingPriority || 0;
            const bPriority = (b as any).trendingPriority || 0;
            if (aPriority !== bPriority) return bPriority - aPriority;
            return (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0);
        })
        .slice(0, 10);

    if (loading) {
        return <Loading />;
    }

    return (
        <Layout>
            <Hero featuredContent={featured} onPlayClick={handleContentClick} />

            {/* මෙතනට Navbar එකේ width එකට සමාන max-w-[1800px] mx-auto එකතු කළා */}
            <div className="max-w-[1800px] mx-auto pb-20 -mt-8 relative z-20 md:-mt-40 space-y-4 md:space-y-8">
                {contents.length > 0 ? (
                    <>
                        <ContentRow title="Trending" contents={trendingContents} onClick={handleContentClick} />

                        {filterCategories
                            .filter(fc => (fc.destinations || ['vault']).includes('vault'))
                            .map(fc => (
                                <React.Fragment key={fc.id}>
                                    {fc.options && fc.options.map((opt: any) => {
                                        const optContents = vaultContents.filter(c => {
                                            const cFilters = (c as any).filters || {};
                                            const vals = cFilters[fc.id] || [];
                                            return Array.isArray(vals) && vals.includes(opt.id);
                                        });
                                        if (optContents.length === 0) return null;
                                        return <ContentRow key={`${fc.id}-${opt.id}`} title={`${opt.label}`} contents={optContents} onClick={handleContentClick} />;
                                    })}
                                </React.Fragment>
                            ))}

                        {slgdcContents.length > 0 && <ContentRow title="SLGDC" contents={slgdcContents} onClick={handleContentClick} />}
                    </>
                ) : (
                    <div className="text-center text-zinc-500 py-20">No content available. Check back later.</div>
                )}
            </div>

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

export default Home;