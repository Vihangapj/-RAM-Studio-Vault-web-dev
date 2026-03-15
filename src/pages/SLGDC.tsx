import React, { useState, useMemo } from 'react';
import Layout from '../components/Layout';
import { db } from '../utils/firebase';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import type { Content } from '../types/types';
import VideoCard from '../components/VideoCard';
import VideoCardSkeleton from '../components/VideoCardSkeleton';
import CourseDetailsModal from '../components/CourseDetailsModal';
import FilterSidebar from '../components/FilterSidebar';
import { Filter, X } from 'lucide-react';

const SLGDC: React.FC = () => {
    const [courses, setCourses] = useState<Content[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCourse, setSelectedCourse] = useState<Content | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({});
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    React.useEffect(() => {
        const fetchCourses = async () => {
            try {
                const q = query(collection(db, 'content'), orderBy('createdAt', 'desc'));
                const querySnapshot = await getDocs(q);
                const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Content));
                const slgdcOnly = data.filter(item => {
                    const isCourseLike = item.type === 'course' || item.type === 'devlog' || item.type === 'session';
                    if (!isCourseLike) return false;
                    const dests = (item as any).destinations ?? ((item as any).destination ? [(item as any).destination] : []);
                    return dests.includes('slgdc');
                });
                setCourses(slgdcOnly);
            } catch (error) {
                console.error('Error fetching SLGDC content:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchCourses();
    }, []);

    // Filtering logic: AND across categories, OR within categories
    const filtered = useMemo(() => {
        if (Object.keys(activeFilters).length === 0) return courses;

        return courses.filter(item => {
            return Object.entries(activeFilters).every(([categoryId, selectedOptions]) => {
                if (selectedOptions.length === 0) return true;
                const itemFilterOptions = item.filters?.[categoryId] || [];
                return selectedOptions.some(optId => itemFilterOptions.includes(optId));
            });
        });
    }, [courses, activeFilters]);

    // Calculate counts for all options based on current filtered set
    const contentCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        courses.forEach(item => {
            if (item.filters) {
                Object.values(item.filters).forEach(optionIds => {
                    optionIds.forEach(id => {
                        counts[id] = (counts[id] || 0) + 1;
                    });
                });
            }
        });
        return counts;
    }, [courses]);

    return (
        <Layout>
            <div className="pt-24 pb-20 px-4 md:px-8 min-h-screen max-w-[1800px] mx-auto">
                <div className="flex flex-col md:flex-row relative">
                    {/* Content Grid (Left side) */}
                    <div className="flex-1">
                        <div className="mb-6 flex items-center justify-end">
                            <div className="flex items-center gap-4">
                                <p className="text-zinc-500 text-sm">{filtered.length} Courses</p>
                                <button
                                    onClick={() => setIsFilterOpen(!isFilterOpen)}
                                    className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl text-xs font-bold text-black hover:bg-zinc-200 transition-all shadow-lg shadow-white/5"
                                >
                                    {isFilterOpen ? <X className="w-3.5 h-3.5" /> : <Filter className="w-3.5 h-3.5" />}
                                    {isFilterOpen ? 'Filters' : 'Filters'}
                                </button>
                            </div>
                        </div>

                        {loading ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-20">
                                {Array.from({ length: 8 }).map((_, i) => (
                                    <div key={i}><VideoCardSkeleton /></div>
                                ))}
                            </div>
                        ) : filtered.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-20">
                                {filtered.map(course => (
                                    <div key={course.id}>
                                        <VideoCard content={course} onClick={(c) => { setSelectedCourse(c); setShowModal(true); }} variant="fluid" />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 bg-zinc-900/30 rounded-3xl border border-dashed border-zinc-800">
                                <p className="text-zinc-500 mb-2">No SLGDC items match your filters.</p>
                                <button
                                    onClick={() => setActiveFilters({})}
                                    className="text-indigo-400 hover:text-indigo-300 text-sm font-medium"
                                >
                                    Clear all filters
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Desktop Sidebar (Right side - sticky position) */}
                    <div className={`hidden md:block sticky top-24 h-[calc(100vh-120px)] transition-all duration-300 origin-right overflow-x-hidden ${isFilterOpen ? 'w-[280px] ml-8 opacity-100' : 'w-0 ml-0 opacity-0'}`}>
                        <div className="p-6 h-full flex flex-col bg-zinc-950 border border-zinc-800/50 rounded-3xl shadow-2xl overflow-y-auto">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    <Filter className="w-5 h-5 text-indigo-400" />
                                    Filters
                                </h3>
                                <button
                                    onClick={() => setIsFilterOpen(false)}
                                    className="p-2 -mr-2 text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-lg transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                                <FilterSidebar
                                    activeFilters={activeFilters}
                                    onFilterChange={setActiveFilters}
                                    contentCount={contentCounts}
                                    destination="slgdc"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Filter Sidebar Drawer (Mobile) */}
                    <div
                        className={`fixed inset-0 z-[100] transition-opacity duration-300 md:hidden ${isFilterOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}
                    >
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsFilterOpen(false)} />
                        <div className={`absolute right-0 top-16 md:top-20 bottom-0 w-[300px] bg-zinc-950 shadow-2xl transition-transform duration-300 transform ${isFilterOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                            <div className="p-6 h-full flex flex-col">
                                <div className="flex justify-between items-center mb-8">
                                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                        <Filter className="w-5 h-5 text-indigo-400" />
                                        Filters
                                    </h3>
                                    <button onClick={() => setIsFilterOpen(false)} className="p-2 text-zinc-400 hover:text-white">
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>
                                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                                    <FilterSidebar
                                        activeFilters={activeFilters}
                                        onFilterChange={setActiveFilters}
                                        contentCount={contentCounts}
                                        destination="slgdc"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Desktop backdrop removed so filters appear as a side panel, not a popup */}

                    {selectedCourse && (
                        <CourseDetailsModal content={selectedCourse} isOpen={showModal} onClose={() => { setShowModal(false); setSelectedCourse(null); }} />
                    )}
                </div>
            </div>
        </Layout>
    );
};

export default SLGDC;
