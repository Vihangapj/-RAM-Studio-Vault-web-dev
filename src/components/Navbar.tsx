import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
// Icons are imported here
import { Search, Menu, X, BookOpen, Shield } from 'lucide-react';
import logo from '../assets/logo.png';

const Navbar: React.FC = () => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    
    const { isAdmin } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Check if current path matches the link
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

    return (
        <>
            <nav
                className={`fixed top-0 w-full z-50 transition-all duration-300 h-16 md:h-20 ${
                    isScrolled
                        ? 'bg-black/95 backdrop-blur-md' // No white line at bottom
                        : 'bg-gradient-to-b from-black/90 to-transparent'
                }`}
            >
                <div className="max-w-[1800px] mx-auto h-full px-4 md:px-8 flex items-center justify-between">
                    
                    {/* LEFT SIDE: Logo & Desktop Links */}
                    <div className="flex items-center h-full gap-4 md:gap-10">
                        <Link to="/" className="flex items-center mr-4">
                            <img src={logo} alt="RAM Studio Vault" className="h-8 md:h-10 w-auto" />
                        </Link>

                        <div className="hidden md:flex items-center h-full text-xs lg:text-sm font-gunterz-bold-italic tracking-wider uppercase">
                            <Link 
                                to="/courses" 
                                className={`h-full flex items-center px-8 transition-all duration-200 ${
                                    isActive('/courses') 
                                    ? 'bg-white text-black' 
                                    : 'text-zinc-300 hover:bg-white/10 hover:text-white'
                                }`}
                            >
                                Courses
                            </Link>

                            {isAdmin && (
                                <Link 
                                    to="/admin" 
                                    className={`h-full flex items-center px-8 transition-all duration-200 ${
                                        isActive('/admin') 
                                        ? 'bg-red-600 text-white' 
                                        : 'text-red-500 hover:bg-red-600/10'
                                    }`}
                                >
                                    Admin
                                </Link>
                            )}
                        </div>
                    </div>

                    {/* RIGHT SIDE: Search & Mobile Toggle */}
                    <div className="flex items-center gap-3 md:gap-6">
                        <form onSubmit={handleSearch} className="relative group hidden md:block">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-white transition-colors" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search..."
                                className="bg-zinc-800/50 border border-zinc-700/50 rounded-none pl-9 pr-4 py-2 text-sm w-36 focus:w-64 focus:bg-zinc-800 focus:border-zinc-500 transition-all focus:outline-none text-white placeholder-zinc-500"
                            />
                        </form>

                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="md:hidden p-2 text-zinc-400 hover:text-white transition-colors"
                        >
                            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>
            </nav>

            {/* MOBILE MENU */}
            <div
                className={`fixed inset-0 z-40 md:hidden transition-all duration-300 ${
                    isMobileMenuOpen ? 'visible opacity-100' : 'invisible opacity-0'
                }`}
            >
                <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setIsMobileMenuOpen(false)} />

                <div className={`absolute top-0 right-0 w-72 h-full bg-zinc-900 border-l border-white/10 transform transition-transform duration-300 ${
                    isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
                }`}>
                    <div className="p-6 flex flex-col gap-4 mt-20">
                        {/* BookOpen icon used here to fix unused import error */}
                        <Link 
                            to="/courses" 
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={`flex items-center gap-3 p-4 rounded-lg font-gunterz-bold-italic uppercase transition-colors ${
                                isActive('/courses') ? 'bg-white text-black' : 'text-zinc-300 bg-white/5'
                            }`}
                        >
                            <BookOpen className="w-5 h-5" />
                            <span>Courses</span>
                        </Link>

                        {/* Shield icon used here to fix unused import error */}
                        {isAdmin && (
                            <Link 
                                to="/admin" 
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={`flex items-center gap-3 p-4 rounded-lg font-gunterz-bold-italic uppercase transition-colors ${
                                    isActive('/admin') ? 'bg-red-600 text-white' : 'text-red-500 bg-red-500/10'
                                }`}
                            >
                                <Shield className="w-5 h-5" />
                                <span>Admin Panel</span>
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default Navbar;