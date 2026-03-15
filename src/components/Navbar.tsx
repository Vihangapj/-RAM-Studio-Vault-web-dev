import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Search, Menu, X, Bell } from 'lucide-react';
import logo from '../assets/logo.png';
import WhatsappIcon from '../assets/icon/WhatsappIcon.png';
import PatreonIcon from '../assets/icon/PatreonIcon.png';
import { db } from '../utils/firebase';
import { collection, query, orderBy, limit, onSnapshot, getDoc, doc } from 'firebase/firestore';
import { formatDistanceToNow } from 'date-fns';

const Navbar: React.FC = () => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

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

    // Fetch latest notifications from both 'notifications' and 'content' collections
    useEffect(() => {
        const qNotifications = query(
            collection(db, 'notifications'),
            orderBy('createdAt', 'desc'),
            limit(5)
        );
        const qContent = query(
            collection(db, 'content'),
            orderBy('createdAt', 'desc'),
            limit(5)
        );

        let notificationsItems: any[] = [];
        let contentItems: any[] = [];

        const updateCombined = async () => {
            // First, filter out any notifications that reference missing/deleted content
            const filteredNotifications = await Promise.all(
                notificationsItems.map(async (n) => {
                    if ((n.type === 'content' || n.type === 'lesson') && n.contentId) {
                        try {
                            const contentSnap = await getDoc(doc(db, 'content', n.contentId));
                            const contentData = contentSnap.data();

                            // Hydrate notification with latest content data
                            const updatedNotification = { ...n };

                            if (n.type === 'content') {
                                updatedNotification.title = contentData?.title || n.title;
                                updatedNotification.thumbnailUrl = contentData?.thumbnailUrl || n.thumbnailUrl;
                            } else if (n.type === 'lesson') {
                                updatedNotification.courseTitle = contentData?.title || n.courseTitle;

                                // Try to get latest lesson details if available
                                if (contentData?.lessons && Array.isArray(contentData.lessons) && typeof n.lessonIndex === 'number') {
                                    const lesson = contentData.lessons[n.lessonIndex];
                                    if (lesson) {
                                        updatedNotification.title = lesson.title || n.title;
                                        updatedNotification.thumbnailUrl = lesson.thumbnailUrl || contentData.thumbnailUrl || n.thumbnailUrl;
                                    }
                                }
                            }

                            return updatedNotification;
                        } catch (err) {
                            console.error('Error checking content existence for notification', n, err);
                            return null;
                        }
                    }
                    return n;
                })
            ).then(res => res.filter(Boolean));

            const combined = [...(filteredNotifications as any[])];

            contentItems.forEach(c => {
                const hasNotification = combined.some(n =>
                    n.contentId === c.id && n.type === 'content'
                );

                if (!hasNotification) {
                    combined.push({
                        id: c.id,
                        type: 'content',
                        contentId: c.id,
                        title: c.title,
                        thumbnailUrl: c.thumbnailUrl,
                        createdAt: c.createdAt
                    });
                }
            });

            // Filter out items without createdAt (avoids sorting errors) and sort
            const sorted = combined
                .filter(i => i && i.createdAt)
                .sort((a, b) => {
                    const timeA = a.createdAt?.toMillis?.() || 0;
                    const timeB = b.createdAt?.toMillis?.() || 0;
                    return timeB - timeA;
                })
                .slice(0, 5);

            setNotifications(sorted);
            setUnreadCount(sorted.length > 0 ? 1 : 0);
        };

        const unsubNotifications = onSnapshot(qNotifications, (snapshot) => {
            notificationsItems = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            updateCombined();
        }, (error) => {
            console.error("Error fetching notifications:", error);
        });

        const unsubContent = onSnapshot(qContent, (snapshot) => {
            contentItems = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            updateCombined();
        }, (error) => {
            console.error("Error fetching content notifications:", error);
        });

        return () => {
            unsubNotifications();
            unsubContent();
        };
    }, []);

    // Close notifications when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (isNotificationsOpen && !(event.target as Element).closest('.notifications-container')) {
                setIsNotificationsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isNotificationsOpen]);

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
                className={`fixed top-0 w-full z-50 transition-all duration-300 h-16 md:h-20 ${isScrolled
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
                                to="/vault"
                                className={`relative h-full flex items-center px-8 transition-colors duration-300 group overflow-hidden ${isActive('/vault') ? 'text-black' : 'text-zinc-300 hover:text-black'
                                    }`}
                            >
                                <span className="relative z-10">Vault</span>
                                <span className={`absolute inset-0 bg-white transition-transform duration-300 ease-out ${isActive('/vault')
                                    ? 'scale-y-100'
                                    : 'scale-y-0 origin-top group-hover:scale-y-100 group-hover:origin-bottom'
                                    }`}></span>
                            </Link>

                            <Link
                                to="/slgdc"
                                className="relative h-full flex items-center px-8 group overflow-hidden"
                            >
                                <span className={`relative z-10 transition-colors duration-200 ${isActive('/slgdc') ? 'text-black' : 'text-yellow-300 group-hover:text-black'}`}>SLGDC</span>
                                <span className={`absolute inset-0 bg-yellow-400 transition-transform duration-300 ease-out ${isActive('/slgdc') ? 'scale-y-100' : 'scale-y-0 origin-top group-hover:scale-y-100 group-hover:origin-bottom'
                                    }`}></span>
                            </Link>

                            <Link
                                to="/gallery"
                                className={`relative h-full flex items-center px-8 transition-colors duration-300 group overflow-hidden ${isActive('/gallery') ? 'text-white' : 'text-[#9D4EDD] hover:text-white'
                                    }`}
                            >
                                <span className="relative z-10">Gallery</span>
                                <span className={`absolute inset-0 bg-[#9D4EDD] transition-transform duration-300 ease-out ${isActive('/gallery')
                                    ? 'scale-y-100'
                                    : 'scale-y-0 origin-top group-hover:scale-y-100 group-hover:origin-bottom'
                                    }`}></span>
                            </Link>

                            <Link
                                to="/jobs"
                                className={`relative h-full flex items-center px-8 transition-colors duration-300 group overflow-hidden ${isActive('/jobs') ? 'text-white' : 'text-[#1491ea] hover:text-white'
                                    }`}
                            >
                                <span className="relative z-10">Jobs</span>
                                <span className={`absolute inset-0 bg-[#1491ea] transition-transform duration-300 ease-out ${isActive('/jobs')
                                    ? 'scale-y-100'
                                    : 'scale-y-0 origin-top group-hover:scale-y-100 group-hover:origin-bottom'
                                    }`}></span>
                            </Link>

                            <Link
                                to="/shop"
                                className={`relative h-full flex items-center px-8 transition-colors duration-300 group overflow-hidden ${isActive('/shop') ? 'text-white' : 'text-[#159a47] hover:text-white'
                                    }`}
                            >
                                <span className="relative z-10">Shop</span>
                                <span className={`absolute inset-0 bg-[#159a47] transition-transform duration-300 ease-out ${isActive('/shop')
                                    ? 'scale-y-100'
                                    : 'scale-y-0 origin-top group-hover:scale-y-100 group-hover:origin-bottom'
                                    }`}></span>
                            </Link>

                            {isAdmin && (
                                <Link
                                    to="/admin"
                                    className={`relative h-full flex items-center px-8 transition-colors duration-300 group overflow-hidden ${isActive('/admin') ? 'text-white' : 'text-red-400 hover:text-white'
                                        }`}
                                >
                                    <span className="relative z-10">Admin</span>
                                    <span className={`absolute inset-0 bg-red-500 transition-transform duration-300 ease-out ${isActive('/admin')
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
                        <div className="flex items-center gap-2 md:gap-4">
                            {/* Notification Button */}
                            <div className="relative notifications-container">
                                <button
                                    onClick={() => {
                                        setIsNotificationsOpen(!isNotificationsOpen);
                                        if (!isNotificationsOpen) setUnreadCount(0);
                                    }}
                                    className="p-2 text-zinc-300 hover:text-white transition-colors relative"
                                >
                                    <Bell className="w-5 h-5 md:w-6 md:h-6" />
                                    {unreadCount > 0 && (
                                        <span className="absolute top-1 right-1 w-2 h-2 bg-red-600 rounded-full border-2 border-black"></span>
                                    )}
                                </button>

                                {/* Notification Dropdown */}
                                {isNotificationsOpen && (
                                    <div className="fixed md:absolute top-[64px] md:top-full left-4 md:left-auto right-4 md:right-0 mt-2 md:w-96 bg-black border border-zinc-800 rounded shadow-2xl overflow-hidden z-[100] origin-top-right transition-all duration-200">
                                        <div className="p-3 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
                                            <h3 className="text-sm font-semibold text-white">Notifications</h3>
                                            <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Latest Content</span>
                                        </div>
                                        <div className="max-h-[400px] overflow-y-auto scrollbar-thin">
                                            {notifications.length > 0 ? (
                                                notifications.map((item) => (
                                                    <div
                                                        key={item.id}
                                                        onClick={() => {
                                                            setIsNotificationsOpen(false);
                                                            if (item.type === 'lesson') {
                                                                navigate(`/watch/${item.contentId}?lesson=${item.lessonIndex}`);
                                                            } else {
                                                                navigate(`/watch/${item.contentId}`);
                                                            }
                                                        }}
                                                        className="flex gap-3 p-3 hover:bg-zinc-900 transition-colors cursor-pointer group border-b border-zinc-900/50 last:border-0"
                                                    >
                                                        <div className="relative flex-shrink-0">
                                                            <div className="w-24 h-14 bg-zinc-800 rounded overflow-hidden shadow-lg group-hover:ring-1 ring-zinc-600 transition-all">
                                                                <img
                                                                    src={item.thumbnailUrl || logo}
                                                                    alt={item.title}
                                                                    className="w-full h-full object-cover"
                                                                    onError={(e) => {
                                                                        (e.target as HTMLImageElement).src = logo;
                                                                    }}
                                                                />
                                                            </div>
                                                            {item.type === 'lesson' && (
                                                                <div className="absolute -top-1 -right-1 bg-indigo-600 text-[8px] font-bold px-1 rounded uppercase tracking-tighter">
                                                                    Lesson
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex flex-col justify-center min-w-0">
                                                            <h4 className="text-sm font-medium text-zinc-200 line-clamp-2 group-hover:text-white leading-tight">
                                                                {item.type === 'lesson'
                                                                    ? `${item.courseTitle ? item.courseTitle + ': ' : ''}${item.title}`
                                                                    : item.title}
                                                            </h4>
                                                            <p className="text-[11px] text-zinc-500 mt-1">
                                                                {item.createdAt ? formatDistanceToNow(item.createdAt.toDate(), { addSuffix: true }) : 'Just now'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="p-8 text-center">
                                                    <p className="text-zinc-500 text-sm">No new notifications</p>
                                                </div>
                                            )}
                                        </div>
                                        {/* Removed 'View All Content' button per request */}
                                    </div>
                                )}
                            </div>

                            {/* WhatsApp Link */}
                            <a
                                href="https://chat.whatsapp.com/JQdFyZm0CIn3KVf62qApPv"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 text-zinc-300 hover:text-white transition-colors"
                            >
                                <img src={WhatsappIcon} alt="WhatsApp" className="w-5 h-5 md:w-6 md:h-6 object-contain" />
                            </a>

                            {/* Patreon Link */}
                            <a
                                href="https://www.patreon.com/cw/ramstudiosvault"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 text-zinc-300 hover:text-white transition-colors"
                            >
                                <img src={PatreonIcon} alt="Patreon" className="w-5 h-5 md:w-6 md:h-6 object-contain" />
                            </a>

                            {/* Mobile Menu Toggle */}
                            <button
                                onClick={() => setIsMobileMenuOpen(true)}
                                className="md:hidden p-2 text-zinc-300 hover:text-white"
                            >
                                <Menu className="w-6 h-6" />
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* --- Mobile Side Menu --- */}

            {/* Backdrop Overlay */}
            <div
                className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] transition-opacity duration-300 md:hidden ${isMobileMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
                    }`}
                onClick={() => setIsMobileMenuOpen(false)}
            />

            {/* Side Drawer */}
            <div className={`fixed top-0 right-0 h-full w-[280px] bg-zinc-950 z-[70] shadow-2xl transition-transform duration-300 ease-in-out transform md:hidden ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
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
                            to="/vault"
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={`block text-lg font-gunterz-bold-italic tracking-wider uppercase ${isActive('/vault') ? 'text-white border-l-4 border-white pl-4' : 'text-zinc-400 pl-4'
                                }`}
                        >
                            Vault
                        </Link>

                        <Link
                            to="/slgdc"
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={`relative group block text-lg font-gunterz-bold-italic tracking-wider uppercase px-4 py-2 overflow-hidden`}
                        >
                            <span className={`relative z-10 transition-colors duration-200 ${isActive('/slgdc') ? 'text-black' : 'text-yellow-300 group-hover:text-black'}`}>SLGDC</span>
                            <span className={`absolute inset-0 bg-yellow-400 transition-transform duration-300 ease-out ${isActive('/slgdc') ? 'scale-y-100' : 'scale-y-0 origin-top group-hover:scale-y-100 group-hover:origin-bottom'
                                }`}></span>
                        </Link>

                        <Link
                            to="/gallery"
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={`block text-lg font-gunterz-bold-italic tracking-wider uppercase ${isActive('/gallery') ? 'text-white border-l-4 border-[#9D4EDD] pl-4' : 'text-[#9D4EDD] pl-4'
                                }`}
                        >
                            Gallery
                        </Link>

                        <Link
                            to="/jobs"
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={`block text-lg font-gunterz-bold-italic tracking-wider uppercase ${isActive('/jobs') ? 'text-white border-l-4 border-[#1491ea] pl-4' : 'text-[#1491ea] pl-4'
                                }`}
                        >
                            Jobs
                        </Link>

                        <Link
                            to="/shop"
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={`block text-lg font-gunterz-bold-italic tracking-wider uppercase ${isActive('/shop') ? 'text-white border-l-4 border-[#159a47] pl-4' : 'text-[#159a47] pl-4'
                                }`}
                        >
                            Shop
                        </Link>

                        {isAdmin && (
                            <Link
                                to="/admin"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={`block text-lg font-gunterz-bold-italic tracking-wider uppercase ${isActive('/admin') ? 'text-white border-l-4 border-red-500 pl-4' : 'text-red-400 pl-4'
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