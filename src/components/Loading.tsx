import React from 'react';
import logo from '../assets/logo.png';

const Loading: React.FC = () => {
    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center">
            <img src={logo} alt="Logo" className="h-16 mb-8" />

            <div className="w-64 h-1 bg-zinc-800 rounded-full overflow-hidden mt-4 relative preloader-track">
                <div className="h-full rounded-full preloader-anim" />
            </div>
        </div>
    );
};

export default Loading;