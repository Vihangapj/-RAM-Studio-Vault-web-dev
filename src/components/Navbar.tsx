import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Search, Menu, X } from 'lucide-react';
import logo from '../assets/logo.png';

const Navbar: React.FC = () => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    
    const { isAdmin } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const isActive = (path: string) => location.pathname === path;

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
            setSearchQuery('');
            setIsMobileMenuOpen(false);
        }
    };

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 0);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // මෙනුව ඇරෙනකොට පිටුපස scroll එක disable කිරීම
    useEffect(() => {
        if (isMobileMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
    }, [isMobileMenuOpen]);

    return (
        <>
            <nav
                className={`fixed top-0 w-full z-50 transition-all duration-300 h-16 md:h-20 ${
                    isScrolled
                        ? 'bg-black/95 backdrop-blur-md'
                        : 'bg-gradient-to-b from-black/90 to-transparent'
                }`}
            >
                <div className="max-w-[1800px] mx-auto h-full px-4 md:px-8 flex items-center justify-between">
                    
                    <div className="flex items-center h-full gap-4 md:gap-10">
                        <Link to="/" className="flex items-center mr-4">
                            <img src={logo} alt="RAM Studio Vault" className="h-8 md:h-10 w-auto" />
                        </Link>

                        {/* Desktop Links */}
                        <div className="hidden md:flex items-center h-full text-xs lg:text-sm font-gunterz-bold-italic tracking-wider uppercase">
                            <Link 
                                to="/courses" 
                                className={`relative h-full flex items-center px-8 transition-colors duration-300 group overflow-hidden ${
                                    isActive('/courses') ? 'text-black' : 'text-zinc-300 hover:text-black'
                                }`}
                            >
                                <span className="relative z-10">Courses</span>
                                <span className={`absolute inset-0 bg-white transition-transform duration-300 ease-out ${
                                    isActive('/courses') 
                                    ? 'scale-y-100' 
                                    : 'scale-y-0 origin-top group-hover:scale-y-100 group-hover:origin-bottom'
                                }`}></span>
                            </Link>

                            {isAdmin && (
                                <Link 
                                    to="/admin" 
                                    className={`relative h-full flex items-center px-8 transition-colors duration-300 group overflow-hidden ${
                                        isActive('/admin') ? 'text-white' : 'text-red-500 hover:text-white'
                                    }`}
                                >
                                    <span className="relative z-10">Admin</span>
                                    <span className={`absolute inset-0 bg-red-600 transition-transform duration-300 ease-out ${
                                        isActive('/admin') 
                                        ? 'scale-y-100' 
                                        : 'scale-y-0 origin-top group-hover:scale-y-100 group-hover:origin-bottom'
                                    }`}></span>
                                </Link>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-3 md:gap-6">
                        {/* Desktop Search */}
                        <form onSubmit={handleSearch} className="relative group hidden md:block">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-white transition-colors" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search..."
                                className="bg-zinc-800/50 border border-zinc-700/50 rounded-full pl-9 pr-4 py-2 text-sm w-36 focus:w-64 focus:bg-zinc-800 focus:border-zinc-500 transition-all focus:outline-none text-white placeholder-zinc-500"
                            />
                        </form>

                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setIsMobileMenuOpen(true)}
                            className="md:hidden p-2 text-zinc-300 hover:text-white"
                        >
                            <Menu className="w-6 h-6" />
                        </button>
                    </div>
                </div>
            </nav>

            {/* --- Mobile Side Menu --- */}
            
            {/* Backdrop Overlay */}
            <div 
                className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] transition-opacity duration-300 md:hidden ${
                    isMobileMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
            />

            {/* Side Drawer */}
            <div className={`fixed top-0 right-0 h-full w-[280px] bg-zinc-950 z-[70] shadow-2xl transition-transform duration-300 ease-in-out transform md:hidden ${
                isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
            }`}>
                <div className="flex flex-col h-full p-6">
                    {/* Close Button */}
                    <div className="flex justify-end mb-8">
                        <button onClick={() => setIsMobileMenuOpen(false)} className="text-zinc-400 hover:text-white">
                            <X className="w-7 h-7" />
                        </button>
                    </div>

                    {/* Mobile Search Input */}
                    <form onSubmit={handleSearch} className="mb-10 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search content..."
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-zinc-600 text-white placeholder-zinc-600"
                        />
                    </form>

                    {/* Navigation Links */}
                    <div className="space-y-6">
                        <Link 
                            to="/courses" 
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={`block text-lg font-gunterz-bold-italic tracking-wider uppercase ${
                                isActive('/courses') ? 'text-white border-l-4 border-white pl-4' : 'text-zinc-400 pl-4'
                            }`}
                        >
                            Courses
                        </Link>
                        
                        {isAdmin && (
                            <Link 
                                to="/admin" 
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={`block text-lg font-gunterz-bold-italic tracking-wider uppercase ${
                                    isActive('/admin') ? 'text-red-600 border-l-4 border-red-600 pl-4' : 'text-red-500/70 pl-4'
                                }`}
                            >
                                Admin Panel
                            </Link>
                        )}
                    </div>

                    {/* Footer Info (Optional) */}
                    <div className="mt-auto pt-10">
                        <p className="text-[10px] text-zinc-600 uppercase tracking-[0.2em]">RAM Studio Vault v1.0</p>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Navbar;