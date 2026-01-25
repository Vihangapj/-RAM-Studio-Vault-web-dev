import React from 'react';
import logo from '../assets/logo.png';

const Loading: React.FC = () => {
    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center">
            <img src={logo} alt="Logo" className="h-16 mb-8" />
            <div className="w-64 h-1 bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-white rounded-full animate-pulse" style={{ width: '100%' }}></div>
            </div>
        </div>
    );
};

export default Loading;