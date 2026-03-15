import React from 'react';
import Layout from '../components/Layout';

const Shop: React.FC = () => {
    return (
        <Layout>
            <div className="pt-24 pb-20 px-4 min-h-screen flex items-center justify-center text-center">
                <h1 className="coming-soon-text" style={{ color: '#159a47' }}>Coming Soon</h1>
            </div>
        </Layout>
    );
};

export default Shop;
