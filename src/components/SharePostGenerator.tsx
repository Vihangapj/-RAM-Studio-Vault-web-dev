import React, { useRef, useState } from 'react';
import { X, Download, Share2, Loader2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import logoUrl from '../assets/logo.png'; // Assuming a logo exists in assets

interface SharePostGeneratorProps {
    title: string;
    thumbnailUrl?: string;
    type: string;
    onClose: () => void;
}

const SharePostGenerator: React.FC<SharePostGeneratorProps> = ({ title, thumbnailUrl, type, onClose }) => {
    const [customText, setCustomText] = useState('New content available now! Check it out.');
    const [isGenerating, setIsGenerating] = useState(false);
    const canvasRef = useRef<HTMLDivElement>(null);
    const [isImgLoading, setIsImgLoading] = useState(false); // Default to false since we show direct URL first
    const [imgSrc, setImgSrc] = useState<string>(thumbnailUrl || '');
    const [isProxied, setIsProxied] = useState(false);

    React.useEffect(() => {
        let isMounted = true;
        
        // Reset state when thumbnail changes
        setImgSrc(thumbnailUrl || '');
        setIsProxied(false);
        setIsImgLoading(false);

        const loadProxiedImg = async () => {
            if (!thumbnailUrl) return;
            
            // We don't set isImgLoading to true here because we want to show the direct URL in the meantime
            
            const fetchAsDataUrl = async (proxyUrl: string, timeout = 10000) => {
                const controller = new AbortController();
                const timer = setTimeout(() => controller.abort(), timeout);
                
                try {
                    const response = await fetch(proxyUrl, { signal: controller.signal });
                    clearTimeout(timer);
                    if (!response.ok) throw new Error(`HTTP ${response.status}`);
                    
                    const blob = await response.blob();
                    return new Promise<string>((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onloadend = () => resolve(reader.result as string);
                        reader.onerror = reject;
                        reader.readAsDataURL(blob);
                    });
                } catch (e) {
                    clearTimeout(timer);
                    throw e;
                }
            };

            const proxies = [
                `https://images.weserv.nl/?url=${encodeURIComponent(thumbnailUrl)}&output=webp&q=80`,
                `https://api.allorigins.win/raw?url=${encodeURIComponent(thumbnailUrl)}`
            ];

            for (const proxyUrl of proxies) {
                try {
                    const dataUrl = await fetchAsDataUrl(proxyUrl);
                    if (isMounted) {
                        setImgSrc(dataUrl);
                        setIsProxied(true);
                        console.log('Successfully loaded proxied image for download compatibility');
                        return;
                    }
                } catch (err) {
                    console.warn(`Proxy failed: ${proxyUrl}`, err);
                }
            }
            
            console.warn('All proxies failed, download might have CORS issues');
        };
        
        loadProxiedImg();
        return () => { isMounted = false; };
    }, [thumbnailUrl]);

    const handleDownload = async () => {
        if (!canvasRef.current) return;
        setIsGenerating(true);
        try {
            const canvas = await html2canvas(canvasRef.current, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#18181b',
                logging: false,
            });

            const image = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.href = image;
            link.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_share_post.png`;
            link.click();
        } catch (error) {
            console.error('Failed to generate image', error);
            alert('Failed to generate image. Please try again.');
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-4 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300">
            <div className="bg-zinc-900 border-t border-zinc-800 md:border md:rounded-2xl w-full max-w-5xl flex flex-col md:flex-row overflow-hidden shadow-2xl animate-in slide-in-from-bottom md:zoom-in-95 duration-300 h-full md:h-auto max-h-screen">
                
                {/* Left Side: Settings */}
                <div className="w-full md:w-1/3 p-4 md:p-6 border-b md:border-b-0 md:border-r border-zinc-800 flex flex-col bg-zinc-900/50 overflow-y-auto shrink-0 order-2 md:order-1">
                    <div className="hidden md:flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <Share2 className="w-5 h-5 text-indigo-400" />
                            Share Post
                        </h2>
                        <button onClick={onClose} className="p-2 text-zinc-400 hover:text-white rounded-full hover:bg-zinc-800 transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="space-y-6 flex-1">
                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-2">Content Title</label>
                            <input
                                type="text"
                                value={title}
                                disabled
                                className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-lg px-4 py-2 text-zinc-500 opacity-80 cursor-not-allowed"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-2">Custom Message</label>
                            <textarea
                                value={customText}
                                onChange={(e) => setCustomText(e.target.value)}
                                rows={4}
                                placeholder="Add a custom message to your post..."
                                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                            />
                        </div>
                        
                        <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-4 text-sm text-indigo-200">
                            Create a stunning promotional image for your content to share on social media. 
                        </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-zinc-800">
                        <button
                            onClick={handleDownload}
                            disabled={isGenerating}
                            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isGenerating ? (
                                <><Loader2 className="w-5 h-5 animate-spin" /> Generating PNG...</>
                            ) : (
                                <><Download className="w-5 h-5" /> Download Post PNG</>
                            )}
                        </button>
                        {!isProxied && !isGenerating && (
                            <p className="text-[10px] text-zinc-500 mt-2 text-center flex items-center justify-center gap-1">
                                <Loader2 className="w-3 h-3 animate-spin" /> Optimizing for high-quality download...
                            </p>
                        )}
                    </div>
                </div>

                {/* Right Side: Preview */}
                <div className="w-full md:w-2/3 p-10 md:p-12 bg-black/40 flex items-center justify-center relative overflow-hidden order-1 md:order-2 flex-1 min-h-[450px]">
                    
                    {/* Mobile Header */}
                    <div className="absolute top-0 left-0 right-0 p-4 flex md:hidden items-center justify-between bg-zinc-900/80 backdrop-blur border-b border-zinc-800 z-50">
                        <div className="flex items-center gap-2 font-bold text-sm">
                            <Share2 className="w-4 h-4 text-indigo-400" /> Post Preview
                        </div>
                        <button onClick={onClose} className="p-1.5 text-zinc-400 hover:text-white">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="scale-[0.8] sm:scale-100 flex items-center justify-center">
                        {/* The square Canvas to capture */}
                        <div 
                            ref={canvasRef}
                            className="bg-zinc-900 border border-zinc-700 overflow-hidden relative shadow-2xl"
                            style={{ width: '400px', height: '400px', minWidth: '400px', minHeight: '400px' }}
                        >
                            {/* Background subtle elements - Replaced radial with linear for better capture compatibility */}
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-purple-500/5 pointer-events-none"></div>

                            {/* Layout */}
                            <div className="absolute inset-0 flex flex-col">
                                {/* Header: Logo and Brand */}
                                <div className="h-[60px] px-6 flex items-center justify-center z-10 w-full shrink-0">
                                    <div className="p-1 rounded-lg">
                                        <img src={logoUrl} alt="Logo" className="h-8 object-contain" />
                                    </div>
                                </div>

                                {/* Body: Thumbnail */}
                                <div className="h-[200px] px-6 flex items-center justify-center z-10 w-full shrink-0">
                                     <div className="w-full h-full rounded-xl overflow-hidden border border-zinc-700/50 shadow-2xl relative group bg-zinc-800 flex items-center justify-center">
                                        {isImgLoading && (
                                            <Loader2 className="absolute z-20 w-8 h-8 text-zinc-500 animate-spin" />
                                        )}
                                        {imgSrc && (
                                            <img
                                                src={imgSrc}
                                                alt={title}
                                                className={`w-full h-full object-cover relative z-10 transition-opacity duration-300 ${isImgLoading ? 'opacity-0' : 'opacity-100'}`}
                                                onLoad={() => setIsImgLoading(false)}
                                            />
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10"></div>
                                        <div className="absolute bottom-3 left-3 flex items-center gap-2 z-20">
                                            <span className="bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider shadow-sm">
                                                {type}
                                            </span>
                                        </div>
                                     </div>
                                </div>

                                {/* Footer: Title and Custom Text */}
                                <div className="h-[140px] px-6 py-4 z-10 w-full shrink-0 flex flex-col justify-start items-center overflow-hidden">
                                    <h2 className="text-2xl font-bold text-white text-center leading-[1.2] mb-2">
                                        {title}
                                    </h2>
                                    {customText && (
                                        <p className="text-sm text-zinc-300 text-center leading-[1.4] opacity-90">
                                            {customText}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SharePostGenerator;
