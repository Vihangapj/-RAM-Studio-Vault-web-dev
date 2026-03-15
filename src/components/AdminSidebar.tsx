import React from 'react';
import { Home, Archive, Layers, BarChart2, Filter, Plus, Trash2, FileText, Eye } from 'lucide-react';

interface Props {
    current: 'overview' | 'vault' | 'slgdc' | 'home' | 'addcontent' | 'filters' | 'cleanup' | 'analytics';
    onChange: (s: Props['current']) => void;
}

const AdminSidebar: React.FC<Props> = ({ current, onChange }) => {
    const menuSections = [
        {
            label: 'NAVIGATION',
            items: [
                { id: 'overview' as const, label: 'Dashboard', description: 'Quick Stats', icon: BarChart2 },
                { id: 'analytics' as const, label: 'Analytics', description: 'Content Overview', icon: Eye }
            ]
        },
        {
            label: 'CONTENT',
            items: [
                { id: 'vault' as const, label: 'Vault', description: 'Manage vault content', icon: Archive },
                { id: 'slgdc' as const, label: 'SLGDC', description: 'SLGDC content', icon: Layers },
                { id: 'home' as const, label: 'Home Page', description: 'Hero & Trending', icon: Home },
                { id: 'addcontent' as const, label: 'Add Content', description: 'Create new items', icon: Plus },
                { id: 'filters' as const, label: 'Filters', description: 'Manage dynamic filters', icon: Filter }
            ]
        },
        {
            label: 'MAINTENANCE',
            items: [
                { id: 'cleanup' as const, label: 'Cleanup', description: 'Storage cleanup', icon: Trash2 }
            ]
        }
    ];

    const NavItem: React.FC<{ 
        active?: boolean; 
        onClick: () => void; 
        icon: React.ComponentType<{ className?: string }>;
        label: string;
        description: string;
    }> = ({ active, onClick, icon: Icon, label, description }) => (
        <button 
            onClick={onClick} 
            className={`w-full flex items-start gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 group ${
                active 
                    ? 'bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-lg shadow-purple-500/30 border border-purple-400/30' 
                    : 'text-gray-300 hover:bg-gray-800/50 border border-transparent'
            }`}
        >
            <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 transition-transform ${active ? 'text-white' : 'text-gray-400 group-hover:text-gray-300'}`} />
            <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold ${active ? 'text-white' : 'text-gray-300'}`}>{label}</p>
                <p className={`text-xs ${active ? 'text-purple-100' : 'text-gray-500'}`}>{description}</p>
            </div>
        </button>
    );

    return (
        <aside className="w-64 hidden md:block bg-gray-900/50 border-r border-gray-800">
            <div className="sticky top-20 h-[calc(100vh-80px)] overflow-y-auto flex flex-col">
                {/* Admin Header */}
                <div className="p-6 border-b border-gray-800/50">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-purple-600 to-purple-500 flex items-center justify-center">
                            <FileText className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-sm font-bold text-white">Admin Panel</h2>
                            <p className="text-xs text-gray-400">Content Management</p>
                        </div>
                    </div>
                </div>

                {/* Navigation Sections */}
                <div className="flex-1 overflow-y-auto px-4 py-6 space-y-8">
                    {menuSections.map((section) => (
                        <div key={section.label} className="space-y-3">
                            <p className="px-2 text-xs font-bold uppercase tracking-widest text-gray-500">
                                {section.label}
                            </p>
                            <div className="space-y-2">
                                {section.items.map((item) => (
                                    <NavItem
                                        key={item.id}
                                        active={current === item.id}
                                        onClick={() => onChange(item.id)}
                                        icon={item.icon}
                                        label={item.label}
                                        description={item.description}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Admin Profile */}
                <div className="p-4 border-t border-gray-800/50">
                    <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                            A
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-white truncate">Admin</p>
                            <p className="text-xs text-gray-500 truncate">Logged in</p>
                        </div>
                    </div>
                </div>
            </div>
        </aside>
    );
};

export default AdminSidebar;
