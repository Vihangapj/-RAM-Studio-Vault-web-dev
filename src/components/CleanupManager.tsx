import React, { useState } from 'react';
import { db, storage } from '../utils/firebase';
import { ref, listAll, deleteObject, getMetadata } from 'firebase/storage';
import { collection, getDocs, query } from 'firebase/firestore';
import { Trash2, RefreshCw, AlertTriangle, CheckCircle, FileX, Loader2 } from 'lucide-react';

interface UnusedFile {
    fullPath: string;
    name: string;
    url: string;
    size: number;
    timeCreated: string;
}

const CleanupManager: React.FC = () => {
    const [isScanning, setIsScanning] = useState(false);
    const [unusedFiles, setUnusedFiles] = useState<UnusedFile[]>([]);
    const [checkedFiles, setCheckedFiles] = useState<Set<string>>(new Set());
    const [isDeleting, setIsDeleting] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info', text: string } | null>(null);

    const scanForUnusedFiles = async () => {
        setIsScanning(true);
        setMessage({ type: 'info', text: 'Scanning Firestore and Storage... This may take a moment.' });
        setUnusedFiles([]);
        setCheckedFiles(new Set());

        try {
            // 1. Fetch all Content from Firestore
            const contentRefs = new Set<string>();
            const q = query(collection(db, 'content'));
            const snapshot = await getDocs(q);

            snapshot.forEach(doc => {
                const data = doc.data();

                // Collect main thumbnails
                if (data.thumbnailUrl) contentRefs.add(extractPathFromUrl(data.thumbnailUrl));
                if (data.thumbnails && Array.isArray(data.thumbnails)) {
                    data.thumbnails.forEach((t: string) => contentRefs.add(extractPathFromUrl(t)));
                }

                // Collect lesson thumbnails
                if (data.lessons && Array.isArray(data.lessons)) {
                    data.lessons.forEach((l: any) => {
                        if (l.thumbnailUrl) contentRefs.add(extractPathFromUrl(l.thumbnailUrl));

                        // Collect lesson resources
                        if (l.resources && Array.isArray(l.resources)) {
                            l.resources.forEach((r: any) => {
                                if (r.url) contentRefs.add(extractPathFromUrl(r.url));
                            });
                        }
                    });
                }

                // Collect main resources
                if (data.resources && Array.isArray(data.resources)) {
                    data.resources.forEach((r: any) => {
                        if (r.url) contentRefs.add(extractPathFromUrl(r.url));
                    });
                }
            });

            console.log("Found referenced paths:", contentRefs);

            // 2. Fetch all files from Storage (thumbnails/ and files/)
            const storageFiles: UnusedFile[] = [];
            const foldersToScan = ['thumbnails', 'files'];

            for (const folder of foldersToScan) {
                const folderRef = ref(storage, folder);
                const res = await listAll(folderRef);

                for (const itemRef of res.items) {
                    const path = itemRef.fullPath;

                    // Check if this path is referenced in Firestore
                    // We check if the set HAS the path. 
                    // Note: decodeURIComponent might be needed if URLs are encoded, 
                    // but extractPathFromUrl handles basic parsing. 
                    // Let's be safe and try to match flexibly if needed, but exact match is best.

                    if (!contentRefs.has(path)) {
                        // It's UNUSED! Get metadata for display
                        const metadata = await getMetadata(itemRef);
                        const url = await getDownloadURL_Safe(itemRef); // Helper to get URL if needed for preview

                        storageFiles.push({
                            fullPath: path,
                            name: itemRef.name,
                            url: url || '',
                            size: metadata.size,
                            timeCreated: metadata.timeCreated
                        });
                    }
                }
            }

            setUnusedFiles(storageFiles);
            if (storageFiles.length === 0) {
                setMessage({ type: 'success', text: 'Great! No unused files found.' });
            } else {
                setMessage({ type: 'info', text: `Found ${storageFiles.length} unused files.` });
            }

        } catch (error: any) {
            console.error(error);
            setMessage({ type: 'error', text: 'Scan failed: ' + error.message });
        } finally {
            setIsScanning(false);
        }
    };

    // Helper to extract storage path from download URL
    const extractPathFromUrl = (url: string): string => {
        if (!url) return '';
        try {
            // Firebase URLs: https://firebasestorage.googleapis.com/v0/b/BUCKET/o/PATH?token=...
            const urlObj = new URL(url);
            if (urlObj.hostname.includes('firebasestorage')) {
                const pathWithToken = urlObj.pathname.split('/o/')[1];
                if (pathWithToken) {
                    return decodeURIComponent(pathWithToken);
                }
            }
        } catch (e) {
            console.warn("Invalid URL parsing", url);
        }
        return url; // Return as is if not standard firebase url (though it won't match storage path then)
    };

    // Helper to get download URL safely
    const getDownloadURL_Safe = async (ref: any) => {
        try {
            const { getDownloadURL } = await import('firebase/storage');
            return await getDownloadURL(ref);
        } catch (e) {
            return null;
        }
    };

    const handleCheck = (fullPath: string) => {
        const newSet = new Set(checkedFiles);
        if (newSet.has(fullPath)) {
            newSet.delete(fullPath);
        } else {
            newSet.add(fullPath);
        }
        setCheckedFiles(newSet);
    };

    const handleSelectAll = () => {
        if (checkedFiles.size === unusedFiles.length) {
            setCheckedFiles(new Set());
        } else {
            const newSet = new Set<string>();
            unusedFiles.forEach(f => newSet.add(f.fullPath));
            setCheckedFiles(newSet);
        }
    };

    const handleDelete = async () => {
        if (checkedFiles.size === 0) return;
        if (!window.confirm(`Are you sure you want to PERMANENTLY DELETE ${checkedFiles.size} files? This cannot be undone.`)) return;

        setIsDeleting(true);
        try {
            const promises = Array.from(checkedFiles).map(path => {
                const r = ref(storage, path);
                return deleteObject(r);
            });
            await Promise.all(promises);

            setMessage({ type: 'success', text: `Successfully deleted ${checkedFiles.size} files.` });

            // Remove deleted from list
            setUnusedFiles(prev => prev.filter(f => !checkedFiles.has(f.fullPath)));
            setCheckedFiles(new Set());

        } catch (error: any) {
            console.error(error);
            setMessage({ type: 'error', text: 'Deletion partially or fully failed: ' + error.message });
        } finally {
            setIsDeleting(false);
        }
    };

    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    return (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <FileX className="w-5 h-5 text-red-400" />
                        Storage Cleanup
                    </h2>
                    <p className="text-sm text-zinc-400 mt-1">
                        Identify and remove images/files that are no longer referenced by any content.
                    </p>
                </div>
                <button
                    onClick={scanForUnusedFiles}
                    disabled={isScanning}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isScanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                    {isScanning ? 'Scanning...' : 'Scan Now'}
                </button>
            </div>

            {message && (
                <div className={`p-4 rounded-lg mb-6 flex items-start gap-3 ${message.type === 'error' ? 'bg-red-500/10 text-red-200 border border-red-500/20' :
                        message.type === 'success' ? 'bg-green-500/10 text-green-200 border border-green-500/20' :
                            'bg-blue-500/10 text-blue-200 border border-blue-500/20'
                    }`}>
                    {message.type === 'error' ? <AlertTriangle className="w-5 h-5 shrink-0" /> :
                        message.type === 'success' ? <CheckCircle className="w-5 h-5 shrink-0" /> :
                            <RefreshCw className="w-5 h-5 shrink-0" />}
                    <span className="text-sm">{message.text}</span>
                </div>
            )}

            {unusedFiles.length > 0 && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between bg-zinc-950/50 p-3 rounded-lg border border-zinc-800">
                        <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                checked={checkedFiles.size === unusedFiles.length && unusedFiles.length > 0}
                                onChange={handleSelectAll}
                                className="w-4 h-4 rounded border-zinc-700 bg-zinc-800 text-indigo-600 focus:ring-indigo-500/20"
                            />
                            <span className="text-sm text-zinc-300">
                                {checkedFiles.size} selected ({formatSize(unusedFiles.filter(f => checkedFiles.has(f.fullPath)).reduce((acc, curr) => acc + curr.size, 0))})
                            </span>
                        </div>
                        {checkedFiles.size > 0 && (
                            <button
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="flex items-center gap-2 text-red-400 hover:text-red-300 text-sm font-medium transition-colors disabled:opacity-50"
                            >
                                <Trash2 className="w-4 h-4" />
                                {isDeleting ? 'Deleting...' : 'Delete Selected'}
                            </button>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {unusedFiles.map((file) => (
                            <div
                                key={file.fullPath}
                                onClick={() => handleCheck(file.fullPath)}
                                className={`group relative border rounded-lg overflow-hidden cursor-pointer transition-all ${checkedFiles.has(file.fullPath)
                                        ? 'border-indigo-500 bg-indigo-500/5'
                                        : 'border-zinc-800 bg-zinc-900 hover:border-zinc-700'
                                    }`}
                            >
                                <div className="absolute top-2 left-2 z-10">
                                    <input
                                        type="checkbox"
                                        checked={checkedFiles.has(file.fullPath)}
                                        onChange={() => { }} // Handled by parent div
                                        className="w-4 h-4 rounded border-zinc-700 bg-zinc-800 text-indigo-600 focus:ring-indigo-500/20"
                                    />
                                </div>
                                <div className="aspect-video bg-zinc-950 flex items-center justify-center overflow-hidden">
                                    {file.fullPath.startsWith('thumbnails') ? (
                                        <img src={file.url} alt="Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="text-zinc-600">
                                            <FileX className="w-12 h-12" />
                                        </div>
                                    )}
                                </div>
                                <div className="p-3">
                                    <div className="text-xs font-mono text-zinc-400 truncate mb-1" title={file.name}>
                                        {file.name}
                                    </div>
                                    <div className="flex items-center justify-between text-[10px] text-zinc-500">
                                        <span>{formatSize(file.size)}</span>
                                        <span>{new Date(file.timeCreated).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CleanupManager;
