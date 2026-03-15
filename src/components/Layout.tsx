import React from 'react';
import Navbar from './Navbar';

interface LayoutProps {
    children: React.ReactNode;
    hideFooter?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, hideFooter = false }) => {
    return (
        <div className="min-h-screen w-full bg-black text-white relative">
            <Navbar />
            <main className="relative z-0">
                {children}
            </main>
            {!hideFooter && (
                <footer className="py-20 text-center text-zinc-600 text-sm border-t border-zinc-900 mt-32">
                    <p>© {new Date().getFullYear()} RAM Studios Vault. All rights reserved.</p>
                </footer>
            )}
        </div>
    );
};

export default Layout;
