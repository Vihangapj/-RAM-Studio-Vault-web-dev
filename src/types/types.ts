export type ContentType = 'video' | 'course';

export interface Resource {
    label: string;
    url: string;
}

export interface Lesson {
    title: string;
    youtubeId: string;
    resources?: Resource[];
}

export interface Content {
    id: string; // Firestore Document ID
    title: string;
    description: string;
    category: string;
    type: ContentType;
    thumbnailUrl: string;
    youtubeId: string; // Trailer or Main Video
    resources: Resource[];
    lessons?: Lesson[]; // Only for 'course'
    createdAt?: any; // Firestore Timestamp
    featured?: boolean; // Optional: for Hero section
    views?: number;
}
