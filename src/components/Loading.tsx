import React, { useState, useEffect } from 'react';
import logo from '../assets/logo.png';

const Loading: React.FC = () => {
    const [width, setWidth] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setWidth(prev => (prev + 2) % 101);
        }, 30);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center">
            <img src={logo} alt="Logo" className="h-16 mb-8" />
            <div className="w-64 h-1 bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-white via-zinc-200 to-white rounded-full transition-all duration-75" style={{ width: `${width}%` }}></div>
            </div>
        </div>
    );
};

export default Loading;