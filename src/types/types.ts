export type ContentType = 'video' | 'course' | 'devlog' | 'session';

export interface Resource {
    label: string;
    url: string;
}

export interface Lesson {
    title: string;
    youtubeId: string;
    thumbnailUrl?: string; // Lesson thumbnail
    resources?: Resource[];
    durationSeconds?: number; // optional: duration in seconds (if available)
    createdAt?: any; // Firestore Timestamp for when the lesson was added
}

export type NotificationType = 'content' | 'lesson';

export interface Notification {
    id?: string;
    type: NotificationType;
    contentId: string;
    title: string;
    lessonIndex?: number;
    courseTitle?: string; // Original content title
    thumbnailUrl: string;
    createdAt: any;
}

export interface FilterOption {
    id: string;
    label: string;
    count?: number; // Optional: to show number of items as in the image
}

export interface FilterCategory {
    id: string;
    name: string;
    options: FilterOption[];
    destinations?: ('vault' | 'slgdc')[];
    order?: number;
}

export interface Content {
    id: string; // Firestore Document ID
    title: string;
    description: string;
    categories: string[]; // Multiple categories support
    // destinations: where the content should appear; supports multiple (e.g. both vault and slgdc)
    destinations?: ('vault' | 'slgdc')[];
    type: ContentType;
    thumbnailUrl: string;
    thumbnails?: string[]; // Multiple thumbnails support
    youtubeId: string; // Trailer or Main Video
    resources: Resource[];
    lessons?: Lesson[]; // Only for 'course'
    createdAt?: any; // Firestore Timestamp
    featured?: boolean; // Optional: for Hero section
    trendingPriority?: number; // Optional: for ordering in trending (higher = appears first)
    views?: number;
    filters?: Record<string, string[]>; // Map of Category ID to Option IDs
    showTitleOnThumbnail?: boolean; // Toggle title visibility on thumbnail
    showTitleOnHero?: boolean; // Toggle title visibility on Hero section
}
