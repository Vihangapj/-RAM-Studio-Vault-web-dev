import React from 'react';
import Layout from '../components/Layout';
import Hero from '../components/Hero';
import ContentRow from '../components/ContentRow';
import { db } from '../utils/firebase';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import type { Content } from '../types/types';

const Home: React.FC = () => {
    const [contents, setContents] = React.useState<Content[]>([]);
    const [categories, setCategories] = React.useState<string[]>([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch Content
                const q = query(collection(db, 'content'), orderBy('createdAt', 'desc'));
                const querySnapshot = await getDocs(q);
                const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Content));
                setContents(data);

                // Fetch Categories
                const catSnapshot = await getDocs(collection(db, 'categories'));
                const catData = catSnapshot.docs.map(doc => doc.id);
                // Fallback if empty to ensure some structure, or just use what's there
                if (catData.length === 0) {
                    setCategories(['Development', 'Design']);
                } else {
                    setCategories(catData);
                }

            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const featured = contents.find(c => c.featured) || contents[0];

    const assets = contents.filter(c => c.category === 'Assets');


    // Skeleton Rows for "Netflix-like" loading
    // Skeleton Rows for "Netflix-like" loading
    if (loading) {
        return (
            <Layout>
                <Hero featuredContent={null} />
                <div className="pb-20 -mt-20 relative z-20 md:-mt-32 space-y-2 md:space-y-4">
                    <ContentRow title="Trending in Vault" contents={[]} loading={true} />
                    <ContentRow title="Development" contents={[]} loading={true} />
                    <ContentRow title="Design" contents={[]} loading={true} />
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <Hero featuredContent={featured} />

            <div className="pb-20 -mt-20 relative z-20 md:-mt-32 space-y-2 md:space-y-4">
                {contents.length > 0 ? (
                    <>
                        <ContentRow title="Trending in Vault" contents={contents.slice(0, 10)} />

                        {/* Dynamic Categories */}
                        {categories.map(cat => {
                            const catContents = contents.filter(c => c.category === cat);
                            if (catContents.length === 0) return null;
                            return <ContentRow key={cat} title={cat} contents={catContents} />;
                        })}
                        
                        {assets.length > 0 && <ContentRow title="Vault Assets" contents={assets} />}
                    </>
                ) : (
                    <div className="text-center text-zinc-500 py-20">No content available. Check back later.</div>
                )}
            </div>
        </Layout>
    );
};

export default Home;
