import React from 'react';
import Layout from '../components/Layout';

const Gallery: React.FC = () => {
    return (
        <Layout>
            <div className="pt-24 pb-20 px-4 min-h-screen flex items-center justify-center text-center">
                <h1 className="coming-soon-text" style={{ color: '#9D4EDD' }}>Coming Soon</h1>
            </div>
        </Layout>
    );
};

export default Gallery;
