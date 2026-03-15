import React from 'react';

const VideoCardSkeleton: React.FC = () => {
    return (
        <div
            className="flex-shrink-0 bg-zinc-800 animate-pulse rounded-lg"
            style={{ width: '280px', minWidth: '280px', aspectRatio: '16/9' }}
        />
    );
};

export default VideoCardSkeleton;
