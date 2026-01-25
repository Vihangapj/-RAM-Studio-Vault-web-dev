import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Search, Menu, X, BookOpen, Shield } from 'lucide-react';
import logo from '../assets/logo.png';

const Navbar: React.FC = () => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { isAdmin } = useAuth();
    const navigate = useNavigate();

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
            if (window.scrollY > 0) {
                setIsScrolled(true);
            } else {
                setIsScrolled(false);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Close mobile menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (isMobileMenuOpen && !target.closest('.mobile-menu') && !target.closest('.menu-toggle')) {
                setIsMobileMenuOpen(false);
            }
        };

        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [isMobileMenuOpen]);

    return (
        <>
            <nav
                className={`fixed top-0 w-full z-50 transition-all duration-300 ${isScrolled
                    ? 'bg-black/90 backdrop-blur-md'
                    : 'bg-gradient-to-b from-black/90 to-transparent'
                    }`}
            >
                <div className="max-w-[1800px] mx-auto px-4 md:px-8 py-3 md:py-4 flex items-center justify-between">
                    {/* Logo */}
                    <div className="flex items-center gap-4 md:gap-8">
                        <Link to="/" className="flex items-center">
                            <img src={logo} alt="RAM Studio Vault" className="h-8 md:h-10 w-auto" />
                        </Link>

                        {/* Desktop Navigation */}
                        <div className="hidden md:flex items-center gap-6 text-sm font-gunterz-bold-italic text-zinc-300">
                            <Link to="/courses" className="hover:text-white hover:bg-white/10 px-3 py-2 rounded transition-all">Courses</Link>
                            {isAdmin && (
                                <Link to="/admin" className="text-red-500 hover:text-red-400 hover:bg-red-500/10 px-3 py-2 rounded transition-all">
                                    Admin
                                </Link>
                            )}
                        </div>
                    </div>

                    {/* Right side - Search & Mobile Menu Toggle */}
                    <div className="flex items-center gap-3 md:gap-6 text-zinc-300">
                        {/* Desktop Search */}
                        <form onSubmit={handleSearch} className="relative group hidden md:block">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-white transition-colors" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search..."
                                className="bg-zinc-800/50 border border-zinc-700/50 rounded-full pl-9 pr-4 py-2 text-sm w-36 focus:w-64 focus:bg-zinc-800 focus:border-zinc-600 transition-all focus:outline-none text-white placeholder-zinc-500"
                            />
                        </form>

                        {/* Mobile Search Icon */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsMobileMenuOpen(true);
                            }}
                            className="md:hidden p-2 text-zinc-400 hover:text-white transition-colors"
                            aria-label="Search"
                        >
                            <Search className="w-5 h-5" />
                        </button>

                        {/* Mobile Menu Toggle */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsMobileMenuOpen(!isMobileMenuOpen);
                            }}
                            className="menu-toggle md:hidden p-2 text-zinc-400 hover:text-white transition-colors"
                            aria-label="Toggle Menu"
                        >
                            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>
            </nav>

            {/* Mobile Menu Overlay */}
            <div
                className={`mobile-menu fixed inset-0 z-40 md:hidden transition-all duration-300 ${isMobileMenuOpen ? 'visible' : 'invisible'
                    }`}
            >
                {/* Backdrop */}
                <div
                    className={`absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity duration-300 ${isMobileMenuOpen ? 'opacity-100' : 'opacity-0'
                        }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                />

                {/* Slide-in Menu */}
                <div
                    className={`absolute top-0 right-0 w-72 h-full bg-zinc-900 border-l border-white/10 transition-transform duration-300 ease-out ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
                        }`}
                >
                    {/* Menu Header */}
                    <div className="flex items-center justify-between p-4 border-b border-white/10">
                        <img src={logo} alt="RAM Studio Vault" className="h-8 w-auto" />
                        <button
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="p-2 text-zinc-400 hover:text-white transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Mobile Search */}
                    <div className="p-4 border-b border-white/10">
                        <form onSubmit={handleSearch} className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search videos..."
                                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-10 pr-4 py-3 text-sm focus:border-zinc-500 focus:outline-none text-white placeholder-zinc-500"
                            />
                        </form>
                    </div>

                    {/* Navigation Links */}
                    <div className="p-4 space-y-2">
                        <Link
                            to="/courses"
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-3 rounded-lg text-zinc-300 hover:text-white hover:bg-white/5 transition-all"
                        >
                            <BookOpen className="w-5 h-5" />
                            <span className="font-gunterz-bold-italic">Courses</span>
                        </Link>
                        {isAdmin && (
                            <Link
                                to="/admin"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="flex items-center gap-3 px-4 py-3 rounded-lg text-red-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                            >
                                <Shield className="w-5 h-5" />
                                <span className="font-gunterz-bold-italic">Admin Panel</span>
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default Navbar;
