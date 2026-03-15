import React from 'react';
import Layout from '../components/Layout';

const Jobs: React.FC = () => {
    return (
        <Layout>
            <div className="pt-24 pb-20 px-4 min-h-screen flex items-center justify-center text-center">
                <h1 className="coming-soon-text" style={{ color: '#1491ea' }}>Coming Soon</h1>
            </div>
        </Layout>
    );
};

export default Jobs;
