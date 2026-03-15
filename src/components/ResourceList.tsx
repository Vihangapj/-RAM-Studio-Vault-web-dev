import React from 'react';
import type { Resource } from '../types/types';
import { Download, FileText } from 'lucide-react';

interface ResourceListProps {
    resources: Resource[];
    title?: string;
}

const ResourceList: React.FC<ResourceListProps> = ({ resources, title = 'Vault Assets' }) => {
    if (!resources || resources.length === 0) return null;

    return (
        <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-800">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Download className="w-5 h-5 text-zinc-400" />
                {title}
            </h3>
            <div className="space-y-3">
                {resources.map((resource, idx) => (
                    <a
                        key={idx}
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 rounded-md bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700/50 hover:border-zinc-700 transition-all group"
                    >
                        <div className="w-8 h-8 rounded bg-zinc-900 flex items-center justify-center group-hover:bg-white group-hover:text-black transition-colors">
                            <FileText className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-medium text-zinc-300 group-hover:text-white">
                            {resource.label}
                        </span>
                    </a>
                ))}
            </div>
        </div>
    );
};

export default ResourceList;
