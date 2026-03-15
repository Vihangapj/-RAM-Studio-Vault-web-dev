import { useEffect, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const WelcomePopup = () => {
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        // Check if user has seen the popup in this session
        const hasSeenPopup = sessionStorage.getItem('hasSeenWelcomePopup');
        if (!hasSeenPopup) {
            // Small delay to ensure smooth entrance animation if we add one, 
            // and to let the site load a bit.
            const timer = setTimeout(() => {
                setIsOpen(true);
            }, 500);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleClose = () => {
        setIsOpen(false);
        sessionStorage.setItem('hasSeenWelcomePopup', 'true');
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
                    onClick={handleClose}
                >
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                        className="relative w-full max-w-2xl bg-zinc-900 rounded-xl overflow-hidden shadow-2xl border border-zinc-800"
                        onClick={(e) => e.stopPropagation()}
                    >

                        {/* Content */}
                        <div className="p-6 sm:p-8">
                            <h2 className="text-2xl sm:text-3xl font-google-sans text-white mb-4 text-center">
                                Welcome to the RAM Studios Vault!
                            </h2>

                            <div className="space-y-4 text-zinc-300 font-google-sans leading-relaxed">
                                <p>
                                    Skip the pricey certificates and dive straight into the skills that actually matter.
                                    We built this vault to help the Sri Lankan creative community master Games, Animation,
                                    and Visualization without the fluff. In this industry, your portfolio is everything.
                                    We’re here to help you build yours through hands-on learning.
                                </p>

                                <div className="bg-zinc-800/50 p-4 rounded-lg border border-zinc-700/50">
                                    <h3 className="text-white font-bold mb-2">Quick Notes:</h3>
                                    <ul className="list-disc list-inside space-y-1 text-sm sm:text-base">
                                        <li>
                                            <span className="text-indigo-400 font-semibold">Alpha Mode:</span> We’re constantly updating to keep your learning experience smooth.
                                        </li>
                                        <li>
                                            Need help? Join our <a
                                                href="https://chat.whatsapp.com/JQdFyZm0CIn3KVf62qApPv"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-green-400 hover:text-green-300 underline decoration-green-400/50 hover:decoration-green-300 transition-all inline-flex items-center gap-1"
                                            >
                                                WhatsApp community <ExternalLink className="w-3 h-3" />
                                            </a> for direct support.
                                        </li>
                                    </ul>
                                </div>
                            </div>

                            <div className="mt-8 flex justify-center">
                                <button
                                    onClick={handleClose}
                                    className="bg-white text-black px-8 py-3 rounded-lg font-google-sans hover:bg-zinc-200 transition-transform hover:scale-105 active:scale-95 duration-200"
                                >
                                    Start Learning
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default WelcomePopup;
