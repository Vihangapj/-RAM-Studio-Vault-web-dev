import React, { useState } from 'react';
import { useForm, useFieldArray, type SubmitHandler, type Control, type UseFormRegister } from 'react-hook-form';
import { db, storage } from '../utils/firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { collection, addDoc, serverTimestamp, getDocs, orderBy, query, deleteDoc, doc, updateDoc, where } from 'firebase/firestore';
import Layout from '../components/Layout';
import AdminSidebar from '../components/AdminSidebar';
import { parseYoutubeId } from '../utils/youtube';
import { Plus, Trash2, Save, Loader2, Eye, Tag, X, Pencil, Filter, ChevronDown, ChevronUp, Link as LinkIcon, Cloud, Download, BarChart2, Layers, Home, Archive, Search, Settings2, Share2 } from 'lucide-react';
import VideoCard from '../components/VideoCard';
import CleanupManager from '../components/CleanupManager';
import SharePostGenerator from '../components/SharePostGenerator';
import type { Content, FilterCategory, FilterOption } from '../types/types';

// Extend Content type for Form (omit id, timestamps)
type ContentFormData = Omit<Content, 'id' | 'createdAt' | 'thumbnails'> & {
    thumbnails: { url: string }[];
    filters: Record<string, string[]>;
    showTitleOnThumbnail?: boolean;
    showTitleOnHero?: boolean;
};

// File Upload Component with Progress Bar
interface FileUploadButtonProps {
    onUpload: (file: File) => Promise<void>;
    isLoading: boolean;
    accept?: string;
    icon?: React.ReactNode;
    label?: string;
}

const FileUploadButton: React.FC<FileUploadButtonProps> = ({ onUpload, isLoading, accept = "*", icon, label = "Upload File" }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [progress, setProgress] = useState(0);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            setProgress(0);
            await onUpload(files[0]);
        }
    };

    const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.currentTarget.files;
        if (files && files.length > 0) {
            setProgress(0);
            await onUpload(files[0]);
        }
    };

    return (
        <div className="relative">
            <label
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`relative flex items-center justify-center gap-2 px-4 py-2 rounded border-2 border-dashed transition-all cursor-pointer ${isDragging
                    ? 'border-indigo-400 bg-indigo-500/10'
                    : 'border-zinc-700 hover:border-zinc-600'
                    } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
                <input
                    type="file"
                    accept={accept}
                    onChange={handleFileInput}
                    disabled={isLoading}
                    className="hidden"
                />
                {icon || <Cloud className="w-4 h-4" />}
                <span className="text-xs text-zinc-400">
                    {isLoading ? `Uploading... ${progress}%` : label}
                </span>
            </label>
            {isLoading && progress > 0 && (
                <div className="absolute bottom-0 left-0 h-1 bg-indigo-500 rounded-full transition-all" style={{ width: `${progress}%` }}></div>
            )}
        </div>
    );
};

// Component for managing lesson thumbnail and resources
interface LessonResourcesProps {
    control: Control<ContentFormData>;
    register: UseFormRegister<ContentFormData>;
    lessonIndex: number;
    onUploadLessonThumbnail: (file: File, lessonIndex: number) => Promise<void>;
    uploadingLessonThumbnail: { [key: number]: boolean };
}

const LessonResources: React.FC<LessonResourcesProps> = ({
    control,
    register,
    lessonIndex,
    onUploadLessonThumbnail,
    uploadingLessonThumbnail
}) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [showThumbnailUpload, setShowThumbnailUpload] = useState(false);

    const { fields, append, remove } = useFieldArray({
        control,
        name: `lessons.${lessonIndex}.resources` as const
    });

    return (
        <div className="ml-9 mt-3 space-y-3">
            {/* Lesson Thumbnail Section */}
            <div className="border border-zinc-700 rounded p-3 bg-zinc-900/50">
                <button
                    type="button"
                    onClick={() => setShowThumbnailUpload(!showThumbnailUpload)}
                    className="flex items-center gap-2 text-xs text-zinc-400 hover:text-white transition-colors mb-2"
                >
                    🖼️ Lesson Thumbnail
                    <ChevronDown className={`w-3 h-3 transition-transform ${showThumbnailUpload ? 'rotate-180' : ''}`} />
                </button>
                {showThumbnailUpload && (
                    <div className="flex gap-2 items-center">
                        <input
                            {...register(`lessons.${lessonIndex}.thumbnailUrl` as const)}
                            placeholder="Lesson thumbnail URL"
                            className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-white"
                        />
                        <FileUploadButton
                            onUpload={(file) => onUploadLessonThumbnail(file, lessonIndex)}
                            isLoading={uploadingLessonThumbnail[lessonIndex] || false}
                            accept="image/*"
                            icon={<Cloud className="w-3 h-3" />}
                            label="Upload"
                        />
                    </div>
                )}
            </div>

            {/* Lesson Resources Section */}
            <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-2 text-xs text-zinc-400 hover:text-white transition-colors"
            >
                <LinkIcon className="w-3 h-3" />
                <span>Resources ({fields.length})</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
            </button>

            {isExpanded && (
                <div className="mt-2 space-y-2">
                    {fields.map((field, resIndex) => (
                        <div key={field.id} className="flex gap-2">
                            <input
                                {...register(`lessons.${lessonIndex}.resources.${resIndex}.label` as const)}
                                placeholder="Label (e.g. Source Code)"
                                className="flex-1 bg-zinc-900 border border-zinc-700 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-white"
                            />
                            <input
                                {...register(`lessons.${lessonIndex}.resources.${resIndex}.url` as const)}
                                placeholder="URL"
                                className="flex-1 bg-zinc-900 border border-zinc-700 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-white"
                            />
                            <button type="button" onClick={() => remove(resIndex)} className="text-zinc-500 hover:text-red-400">
                                <Trash2 className="w-3 h-3" />
                            </button>
                        </div>
                    ))}
                    <button
                        type="button"
                        onClick={() => append({ label: '', url: '' })}
                        className="flex items-center gap-1 text-xs text-zinc-500 hover:text-white transition-colors"
                    >
                        <Plus className="w-3 h-3" />
                        Add Resource
                    </button>
                </div>
            )}
        </div>
    );
};

const Admin: React.FC = () => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [analyticsData, setAnalyticsData] = useState<Content[]>([]);
    const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [shareData, setShareData] = useState<{ title: string; thumbnailUrl?: string; type: string } | null>(null);

    // File upload states
    const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
    const [uploadingThumbnails, setUploadingThumbnails] = useState<{ [key: number]: boolean }>({});
    const [uploadingFiles, setUploadingFiles] = useState<{ [key: number]: boolean }>({});
    const [uploadingLessonThumbnail, setUploadingLessonThumbnail] = useState<{ [key: number]: boolean }>({});

    // Category Management State removed (Transitioned to Dynamic Filters)
    const [showThumbPicker, setShowThumbPicker] = useState(false);
    const [thumbPickerTargetIndex, setThumbPickerTargetIndex] = useState<number | null>(null);
    const [adminSection, setAdminSection] = useState<'overview' | 'vault' | 'slgdc' | 'home' | 'analytics' | 'addcontent' | 'cleanup' | 'filters'>('overview');
    const [draggedId, setDraggedId] = useState<string | null>(null);
    const [dragOverId, setDragOverId] = useState<string | null>(null);
    const [homeSelectedId, setHomeSelectedId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [showFiltersInForm, setShowFiltersInForm] = useState(false);

    // Filter states for Analytics/Overview
    const [destinationFilter, setDestinationFilter] = useState<'all' | 'vault' | 'slgdc'>('all');
    const [dynamicFilters, setDynamicFilters] = useState<Record<string, string[]>>({});
    const [showAnalyticsFilters, setShowAnalyticsFilters] = useState(false);

    const [filterCategories, setFilterCategories] = useState<FilterCategory[]>([]);
    const [newFilterCategoryName, setNewFilterCategoryName] = useState('');
    const [filterCategoryTarget, setFilterCategoryTarget] = useState<'vault' | 'slgdc'>('vault');
    const [newFilterOptionName, setNewFilterOptionName] = useState<{ [key: string]: string }>({});
    const [isSavingFilter, setIsSavingFilter] = useState(false);
    // Inline edit state for filter options
    const [editingOptionId, setEditingOptionId] = useState<string | null>(null);
    const [editingOptionCategoryId, setEditingOptionCategoryId] = useState<string | null>(null);
    const [editingOptionValue, setEditingOptionValue] = useState('');
    const [isSavingOptionEdit, setIsSavingOptionEdit] = useState(false);
    // Drag & drop state for categories
    const [draggedCategory, setDraggedCategory] = useState<string | null>(null);
    const [dragOverCategory, setDragOverCategory] = useState<string | null>(null);

    // Drag & drop state for filter options
    const [draggedOption, setDraggedOption] = useState<{ categoryId: string; optionId: string } | null>(null);
    const [dragOverOption, setDragOverOption] = useState<{ categoryId: string; optionId: string } | null>(null);

    const { register, control, handleSubmit, watch, reset, formState: { errors }, setValue } = useForm<ContentFormData>({
        defaultValues: {
            type: 'course',
            categories: [],
            destinations: ['vault'],
            resources: [],
            thumbnails: [],
            lessons: [],
            featured: false,
            trendingPriority: 0,
            filters: {},
            showTitleOnThumbnail: true,
            showTitleOnHero: true
        }
    });

    const thumbnailUrl = watch('thumbnailUrl');
    const contentType = watch('type');

    // Auto-dismiss toast messages
    React.useEffect(() => {
        if (message) {
            const timer = setTimeout(() => setMessage(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [message]);

    const filteredAnalytics = React.useMemo(() => {
        return analyticsData.filter(item => {
            // Search filter
            if (searchQuery.trim()) {
                const query = searchQuery.toLowerCase();
                if (!item.title.toLowerCase().includes(query)) {
                    return false;
                }
            }

            // Destination filter
            if (destinationFilter !== 'all') {
                const dests = (item as any).destinations ?? ((item as any).destination ? [(item as any).destination] : ['vault']);
                if (!dests.includes(destinationFilter)) return false;
            }

            // Dynamic filters
            const itemFilters = (item as any).filters || {};
            for (const [catId, selectedOptions] of Object.entries(dynamicFilters)) {
                if (selectedOptions.length > 0) {
                    const itemOptions = itemFilters[catId] || [];
                    const hasMatch = selectedOptions.some(optId => itemOptions.includes(optId));
                    if (!hasMatch) return false;
                }
            }

            return true;
        });
    }, [analyticsData, searchQuery, destinationFilter, dynamicFilters]);

    // Computed stats for dashboard (using filteredAnalytics)
    const stats = React.useMemo(() => {
        const totalItems = filteredAnalytics.length;
        const totalViews = filteredAnalytics.reduce((sum, i) => sum + (i.views || 0), 0);
        const featured = filteredAnalytics.filter(i => i.featured).length;

        // Count how many items have any filters
        const itemsWithFilters = filteredAnalytics.filter(i => (i as any).filters && Object.values((i as any).filters).flat().length > 0).length;

        // Count occurrences of each filter option id across filtered contents
        const optionCounts: Record<string, number> = {};
        filteredAnalytics.forEach(item => {
            const fil = (item as any).filters || {};
            const flatOpts = (Object.values(fil).flat() as string[]);
            flatOpts.forEach((optId) => {
                optionCounts[optId] = (optionCounts[optId] || 0) + 1;
            });
        });

        // Build a sorted list of top options
        const topOptions = Object.entries(optionCounts)
            .map(([id, count]) => ({ id, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        return { totalItems, totalViews, featured, itemsWithFilters, topOptions };
    }, [filteredAnalytics]);

    // Fetch Analytics & Categories
    React.useEffect(() => {
        const fetchData = async () => {
            try {
                // Analytics
                const q = query(collection(db, 'content'), orderBy('createdAt', 'desc'));
                const querySnapshot = await getDocs(q);
                const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Content));
                setAnalyticsData(data);


                // Fetch Filter Categories
                const filterSnapshot = await getDocs(collection(db, 'filterCategories'));
                const filterData = filterSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FilterCategory));
                filterData.sort((a, b) => (a.order || 0) - (b.order || 0));
                setFilterCategories(filterData);
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setIsLoadingAnalytics(false);
            }
        };
        fetchData();
    }, [message]); // Refresh on submissions

    // pool of existing uploaded images from analyticsData
    const existingImages = React.useMemo(() => {
        const setUrls = new Set<string>();
        analyticsData.forEach(item => {
            if ((item as any).thumbnailUrl) setUrls.add((item as any).thumbnailUrl);
            if ((item as any).thumbnails && Array.isArray((item as any).thumbnails)) {
                (item as any).thumbnails.forEach((t: string) => setUrls.add(t));
            }
            if (item.lessons && Array.isArray(item.lessons)) {
                item.lessons.forEach(lesson => {
                    if ((lesson as any).thumbnailUrl) setUrls.add((lesson as any).thumbnailUrl);
                });
            }
        });
        return Array.from(setUrls).filter(Boolean);
    }, [analyticsData]);


    const handleAddFilterCategory = async () => {
        if (!newFilterCategoryName.trim()) return;
        setIsSavingFilter(true);
        try {
            // Prevent duplicate category name for the same destination
            const exists = filterCategories.find(c => c.name.toLowerCase() === newFilterCategoryName.trim().toLowerCase() && (c.destinations || ['vault']).includes(filterCategoryTarget));
            if (exists) {
                setMessage({ type: 'error', text: 'A filter with that name already exists for this destination.' });
                setIsSavingFilter(false);
                return;
            }

            // Determine order value as the end of current list for this destination
            const sameDest = filterCategories.filter(c => (c.destinations || ['vault']).includes(filterCategoryTarget));
            const orderVal = sameDest.length;

            const categoryData = {
                name: newFilterCategoryName.trim(),
                options: [],
                destinations: [filterCategoryTarget],
                order: orderVal
            };
            const docRef = await addDoc(collection(db, 'filterCategories'), categoryData);
            setFilterCategories(prev => [...prev, { id: docRef.id, ...categoryData }]);
            setNewFilterCategoryName('');
            setMessage({ type: 'success', text: 'Filter category added.' });
        } catch (error: any) {
            setMessage({ type: 'error', text: 'Failed to add filter category: ' + error.message });
        } finally {
            setIsSavingFilter(false);
        }
    };

    const handleDeleteFilterCategory = async (id: string, name: string) => {
        if (!window.confirm(`Delete filter category "${name}"?`)) return;
        try {
            await deleteDoc(doc(db, 'filterCategories', id));
            setFilterCategories(prev => prev.filter(c => c.id !== id));
            setMessage({ type: 'success', text: 'Filter category deleted.' });
        } catch (error: any) {
            setMessage({ type: 'error', text: 'Failed to delete filter category: ' + error.message });
        }
    };

    const handleAddFilterOption = async (categoryId: string) => {
        const optionName = newFilterOptionName[categoryId];
        if (!optionName || !optionName.trim()) return;

        const category = filterCategories.find(c => c.id === categoryId);
        if (!category) return;

        setIsSavingFilter(true);
        try {
            const newOption: FilterOption = {
                id: Math.random().toString(36).substring(2, 9),
                label: optionName.trim()
            };
            const updatedOptions = [...category.options, newOption];

            await updateDoc(doc(db, 'filterCategories', categoryId), {
                options: updatedOptions
            });

            setFilterCategories(prev => prev.map(c =>
                c.id === categoryId ? { ...c, options: updatedOptions } : c
            ));
            setNewFilterOptionName(prev => ({ ...prev, [categoryId]: '' }));
            setMessage({ type: 'success', text: 'Option added.' });
        } catch (error: any) {
            setMessage({ type: 'error', text: 'Failed to add option: ' + error.message });
        } finally {
            setIsSavingFilter(false);
        }
    };

    const handleDeleteFilterOption = async (categoryId: string, optionId: string) => {
        const category = filterCategories.find(c => c.id === categoryId);
        if (!category) return;

        if (!window.confirm('Delete this option?')) return;

        try {
            const updatedOptions = category.options.filter(o => o.id !== optionId);
            await updateDoc(doc(db, 'filterCategories', categoryId), {
                options: updatedOptions
            });
            setFilterCategories(prev => prev.map(c =>
                c.id === categoryId ? { ...c, options: updatedOptions } : c
            ));
            setMessage({ type: 'success', text: 'Option deleted.' });
        } catch (error: any) {
            setMessage({ type: 'error', text: 'Failed to delete option: ' + error.message });
        }
    };

    // Reorder options inside a filter category and persist to Firestore
    const saveFilterOptionOrder = async (categoryId: string, orderedOptionIds: string[]) => {
        const category = filterCategories.find(c => c.id === categoryId);
        if (!category) return;
        try {
            const updatedOptions = orderedOptionIds.map(id => category.options.find(o => o.id === id)!).filter(Boolean);
            await updateDoc(doc(db, 'filterCategories', categoryId), { options: updatedOptions });
            setFilterCategories(prev => prev.map(c => c.id === categoryId ? { ...c, options: updatedOptions } : c));
            setMessage({ type: 'success', text: 'Filter order saved.' });
        } catch (error: any) {
            console.error('Failed to save filter option order', error);
            setMessage({ type: 'error', text: 'Failed to save filter option order: ' + error.message });
        }
    };

    // Persist order of filter categories (by document id) for the active destination
    const saveFilterCategoryOrder = async (orderedIds: string[]) => {
        try {
            const updates: Promise<any>[] = [];
            orderedIds.forEach((id, idx) => {
                updates.push(updateDoc(doc(db, 'filterCategories', id), { order: idx }));
            });
            if (updates.length > 0) await Promise.all(updates);
            setMessage({ type: 'success', text: 'Filter categories order saved.' });
        } catch (error: any) {
            console.error('Failed to save filter category order', error);
            setMessage({ type: 'error', text: 'Failed to save filter category order: ' + error.message });
        }
    };

    const startEditingFilterOption = (categoryId: string, optionId: string, currentLabel: string) => {
        setEditingOptionCategoryId(categoryId);
        setEditingOptionId(optionId);
        setEditingOptionValue(currentLabel);
    };

    const cancelEditingFilterOption = () => {
        setEditingOptionCategoryId(null);
        setEditingOptionId(null);
        setEditingOptionValue('');
    };

    const saveEditingFilterOption = async (categoryId: string, optionId: string) => {
        const category = filterCategories.find(c => c.id === categoryId);
        if (!category) return;
        const newLabel = editingOptionValue.trim();
        if (!newLabel) return setMessage({ type: 'error', text: 'Option label cannot be empty.' });

        setIsSavingOptionEdit(true);
        try {
            const updatedOptions = category.options.map(o => o.id === optionId ? { ...o, label: newLabel } : o);
            await updateDoc(doc(db, 'filterCategories', categoryId), { options: updatedOptions });
            setFilterCategories(prev => prev.map(c => c.id === categoryId ? { ...c, options: updatedOptions } : c));
            setMessage({ type: 'success', text: 'Option updated.' });
            cancelEditingFilterOption();
        } catch (error: any) {
            console.error('Failed to update option', error);
            setMessage({ type: 'error', text: 'Failed to update option: ' + error.message });
        } finally {
            setIsSavingOptionEdit(false);
        }
    };

    // File Upload Handler - Improved with Progress
    const handleThumbnailUpload = async (file: File) => {
        if (!file) return;
        setUploadingThumbnail(true);
        try {
            const timestamp = Date.now();
            const fileName = `thumbnails/${timestamp}_${file.name}`;
            const storageRef = ref(storage, fileName);

            // Upload file
            const uploadTask = await uploadBytes(storageRef, file);

            // Get download URL
            const downloadURL = await getDownloadURL(uploadTask.ref);

            // Set form value using setValue
            setValue('thumbnailUrl', downloadURL);

            setMessage({ type: 'success', text: 'Thumbnail uploaded successfully!' });
        } catch (error: any) {
            console.error('Upload error:', error);
            setMessage({ type: 'error', text: 'Failed to upload thumbnail: ' + error.message });
        } finally {
            setUploadingThumbnail(false);
        }
    };

    // Upload additional thumbnails
    const handleAdditionalThumbnailUpload = async (file: File, fieldIndex: number) => {
        if (!file) return;

        setUploadingThumbnails(prev => ({ ...prev, [fieldIndex]: true }));
        try {
            const timestamp = Date.now();
            const fileName = `thumbnails/${timestamp}_${file.name}`;
            const storageRef = ref(storage, fileName);

            // Upload file
            const uploadTask = await uploadBytes(storageRef, file);

            // Get download URL
            const downloadURL = await getDownloadURL(uploadTask.ref);

            // Set the form field value using react-hook-form's setValue
            setValue(`thumbnails.${fieldIndex}.url` as const, downloadURL);
            setMessage({ type: 'success', text: 'Thumbnail uploaded successfully!' });
        } catch (error: any) {
            console.error('Upload error:', error);
            setMessage({ type: 'error', text: 'Failed to upload thumbnail: ' + error.message });
        } finally {
            setUploadingThumbnails(prev => ({ ...prev, [fieldIndex]: false }));
        }
    };

    // Upload file to Firebase Storage and get download link
    const handleFileUpload = async (file: File, fieldIndex: number) => {
        if (!file) return;

        setUploadingFiles(prev => ({ ...prev, [fieldIndex]: true }));
        try {
            const timestamp = Date.now();
            const fileName = `files/${timestamp}_${file.name}`;
            const storageRef = ref(storage, fileName);

            // Upload file and track progress
            const uploadTask = await uploadBytes(storageRef, file);

            // Get download URL
            const downloadURL = await getDownloadURL(uploadTask.ref);

            // Update form field using setValue
            setValue(`resources.${fieldIndex}.url` as const, downloadURL);

            setMessage({ type: 'success', text: 'File uploaded successfully!' });
        } catch (error: any) {
            console.error('Upload error:', error);
            setMessage({ type: 'error', text: 'Failed to upload file: ' + error.message });
        } finally {
            setUploadingFiles(prev => ({ ...prev, [fieldIndex]: false }));
        }
    };

    // Upload lesson thumbnail
    const handleUploadLessonThumbnail = async (file: File, lessonIndex: number) => {
        if (!file) return;

        setUploadingLessonThumbnail(prev => ({ ...prev, [lessonIndex]: true }));
        try {
            const timestamp = Date.now();
            const fileName = `thumbnails/${timestamp}_${file.name}`;
            const storageRef = ref(storage, fileName);

            // Upload file
            const uploadTask = await uploadBytes(storageRef, file);

            // Get download URL
            const downloadURL = await getDownloadURL(uploadTask.ref);

            // Set the form field value using React Hook Form's setValue
            setValue(`lessons.${lessonIndex}.thumbnailUrl` as const, downloadURL);
            setMessage({ type: 'success', text: 'Lesson thumbnail uploaded!' });
        } catch (error: any) {
            console.error('Upload error:', error);
            setMessage({ type: 'error', text: 'Failed to upload lesson thumbnail: ' + error.message });
        } finally {
            setUploadingLessonThumbnail(prev => ({ ...prev, [lessonIndex]: false }));
        }
    };

    // Field Arrays
    const { fields: resourceFields, append: appendResource, remove: removeResource } = useFieldArray({
        control,
        name: "resources"
    });

    const { fields: lessonFields, append: appendLesson, remove: removeLesson } = useFieldArray({
        control,
        name: "lessons"
    });

    const { fields: thumbnailFields, append: appendThumbnail, remove: removeThumbnail } = useFieldArray({
        control,
        name: "thumbnails"
    });

    const onSubmit: SubmitHandler<ContentFormData> = async (data) => {
        setIsSubmitting(true);
        setMessage(null);
        try {
            // Clean up data (remove lessons if video type)
            const cleanData: any = { ...data };
            if (cleanData.type === 'video') {
                delete cleanData.lessons;
            }
            // Normalize YouTube IDs (accept full URLs or raw IDs)
            if (cleanData.youtubeId) {
                const pid = parseYoutubeId(cleanData.youtubeId);
                if (pid) cleanData.youtubeId = pid;
            }
            // Normalize lessons youtubeIds
            if (cleanData.lessons && Array.isArray(cleanData.lessons)) {
                cleanData.lessons = cleanData.lessons.map((ls: any) => {
                    if (ls.youtubeId) {
                        const pid = parseYoutubeId(ls.youtubeId);
                        if (pid) ls.youtubeId = pid;
                    }
                    return ls;
                });
            }

            // Map thumbnails back to string[]
            cleanData.thumbnails = data.thumbnails?.map((t: any) => t.url) || [];

            if (editingId) {
                // Get existing content to compare lessons
                const existingContent = analyticsData.find(c => c.id === editingId);
                const existingLessonIds = new Set(existingContent?.lessons?.map(l => l.youtubeId) || []);

                // Update existing document
                // remove legacy destination if present and ensure destinations array
                if (cleanData.destination && !cleanData.destinations) {
                    cleanData.destinations = [cleanData.destination];
                    delete cleanData.destination;
                }

                // Track new lessons
                const newLessons = cleanData.lessons?.filter((l: any) => !existingLessonIds.has(l.youtubeId)) || [];

                // Add createdAt to new lessons
                if (cleanData.lessons) {
                    cleanData.lessons = cleanData.lessons.map((l: any) => {
                        if (!existingLessonIds.has(l.youtubeId)) {
                            return { ...l, createdAt: Date.now() };
                        }
                        return l;
                    });
                }

                await updateDoc(doc(db, 'content', editingId), {
                    ...cleanData,
                    // Don't overwrite views or createdAt
                });

                // Trigger notifications for each new lesson
                for (const lesson of newLessons) {
                    const lessonIndex = cleanData.lessons.findIndex((l: any) => l.youtubeId === lesson.youtubeId);
                    await addDoc(collection(db, 'notifications'), {
                        type: 'lesson',
                        contentId: editingId,
                        title: lesson.title,
                        courseTitle: cleanData.title,
                        lessonIndex: lessonIndex,
                        thumbnailUrl: lesson.thumbnailUrl || cleanData.thumbnailUrl,
                        createdAt: serverTimestamp()
                    });
                }

                setMessage({ type: 'success', text: 'Content updated successfully.' });
                setEditingId(null);
            } else {
                // Create new document
                if (cleanData.destination && !cleanData.destinations) {
                    cleanData.destinations = [cleanData.destination];
                    delete cleanData.destination;
                }

                // Add createdAt to all lessons for new content
                if (cleanData.lessons) {
                    cleanData.lessons = cleanData.lessons.map((l: any) => ({
                        ...l,
                        createdAt: Date.now()
                    }));
                }

                const docRef = await addDoc(collection(db, 'content'), {
                    ...cleanData,
                    views: 0,
                    createdAt: serverTimestamp()
                });

                // Trigger notification for new content
                await addDoc(collection(db, 'notifications'), {
                    type: 'content',
                    contentId: docRef.id,
                    title: cleanData.title,
                    courseTitle: cleanData.title,
                    thumbnailUrl: cleanData.thumbnailUrl,
                    createdAt: serverTimestamp()
                });

                setMessage({ type: 'success', text: 'Content successfully saved.' });
            }

            reset({
                title: '',
                description: '',
                categories: [],
                destinations: ['vault'],
                type: 'course',
                youtubeId: '',
                resources: [],
                thumbnails: [],
                lessons: [],
                filters: {},
                showTitleOnThumbnail: true,
                showTitleOnHero: true
            });
        } catch (error: any) {
            console.error(error);
            setMessage({ type: 'error', text: 'Error saving content: ' + error.message });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEdit = (content: Content) => {
        setEditingId(content.id);
        setAdminSection('addcontent');
        reset({
            title: content.title,
            description: content.description,
            categories: content.categories || [],
            destinations: ((content as any).destinations) || ((content as any).destination ? [(content as any).destination] : ['vault']),
            type: content.type,
            thumbnailUrl: content.thumbnailUrl,
            youtubeId: content.youtubeId,
            resources: content.resources || [],
            thumbnails: content.thumbnails?.map(t => ({ url: t })) || [],
            lessons: content.lessons || [],
            featured: content.featured || false,
            trendingPriority: (content as any).trendingPriority || 0,
            filters: content.filters || {},
            showTitleOnThumbnail: content.showTitleOnThumbnail !== false,
            showTitleOnHero: content.showTitleOnHero !== false
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDeleteContent = async (id: string, title: string, content?: Content) => {
        if (!window.confirm(`Are you sure you want to delete "${title}"? This will also delete all associated images from storage.`)) return;
        try {
            // Delete all associated images from Firebase Storage
            if (content) {
                const urlsToDelete: string[] = [];

                // Collect main thumbnail
                if (content.thumbnailUrl) urlsToDelete.push(content.thumbnailUrl);

                // Collect additional thumbnails
                if (content.thumbnails && Array.isArray(content.thumbnails)) {
                    urlsToDelete.push(...content.thumbnails);
                }

                // Collect lesson thumbnails
                if (content.lessons && Array.isArray(content.lessons)) {
                    content.lessons.forEach(lesson => {
                        if (lesson.thumbnailUrl) {
                            urlsToDelete.push(lesson.thumbnailUrl);
                        }
                    });
                }

                // Collect resource URLs
                if (content.resources && Array.isArray(content.resources)) {
                    content.resources.forEach(resource => {
                        if (resource.url) urlsToDelete.push(resource.url);
                    });
                }

                // Collect lesson resource URLs
                if (content.lessons && Array.isArray(content.lessons)) {
                    content.lessons.forEach(lesson => {
                        if (lesson.resources && Array.isArray(lesson.resources)) {
                            lesson.resources.forEach(resource => {
                                if (resource.url) urlsToDelete.push(resource.url);
                            });
                        }
                    });
                }

                // Delete each file from storage
                for (const fileUrl of urlsToDelete) {
                    try {
                        // Extract the file path from the download URL
                        const urlObj = new URL(fileUrl);
                        const pathWithParams = urlObj.pathname.split('/o/')[1];
                        if (pathWithParams) {
                            const filePath = decodeURIComponent(pathWithParams.split('?')[0]);
                            const fileRef = ref(storage, filePath);
                            await deleteObject(fileRef);
                        }
                    } catch (err) {
                        // Silently skip if file deletion fails
                        console.warn('Failed to delete file:', fileUrl, err);
                    }
                }
            }

            // Delete associated notifications
            try {
                const notifQ = query(collection(db, 'notifications'), where('contentId', '==', id));
                const notifSnapshot = await getDocs(notifQ);
                const notifDeletes: Promise<void>[] = [];
                notifSnapshot.forEach((doc) => {
                    notifDeletes.push(deleteDoc(doc.ref));
                });
                await Promise.all(notifDeletes);
                console.log(`Deleted ${notifDeletes.length} associated notifications.`);
            } catch (err) {
                console.error("Error deleting associated notifications:", err);
            }

            // Delete the document from Firestore
            await deleteDoc(doc(db, 'content', id));
            setAnalyticsData(prev => prev.filter(c => c.id !== id));
            setMessage({ type: 'success', text: `Deleted "${title}" and all associated files.` });
        } catch (error: any) {
            setMessage({ type: 'error', text: 'Error deleting content: ' + error.message });
        }
    };

    // Persist trending order to Firestore
    const saveTrendingOrder = async (orderedList: Content[]) => {
        try {
            const updates: Promise<any>[] = [];
            orderedList.forEach((item, idx) => {
                const newPriority = Math.max(0, 100 - idx);
                if ((item as any).trendingPriority !== newPriority) {
                    const itemRef = doc(db, 'content', item.id);
                    updates.push(updateDoc(itemRef, { trendingPriority: newPriority }));
                }
            });
            if (updates.length > 0) await Promise.all(updates);
            setMessage({ type: 'success', text: 'Trending order updated.' });
        } catch (error: any) {
            console.error('Failed to save trending order', error);
            setMessage({ type: 'error', text: 'Failed to save trending order: ' + error.message });
        }
    };

    // Set a content item as featured (hero) and persist
    const setAsHero = async (item: Content) => {
        try {
            // Find existing featured in analyticsData
            const currentFeatured = analyticsData.find(c => (c as any).featured);
            const ops: Promise<any>[] = [];
            if (currentFeatured && currentFeatured.id !== item.id) {
                ops.push(updateDoc(doc(db, 'content', currentFeatured.id), { featured: false }));
            }
            ops.push(updateDoc(doc(db, 'content', item.id), { featured: true }));
            await Promise.all(ops);
            // Update local state
            setAnalyticsData(prev => prev.map(p => ({
                ...(p as any),
                featured: p.id === item.id
            })) as any);
            setMessage({ type: 'success', text: `${item.title} set as Hero.` });
        } catch (error: any) {
            console.error('Failed to set hero', error);
            setMessage({ type: 'error', text: 'Failed to set hero: ' + error.message });
        }
    };

    // Add item to trending (set a default priority; do NOT modify destinations)
    const addToTrending = async (item: Content) => {
        try {
            const itemRef = doc(db, 'content', item.id);
            const priority = (item as any).trendingPriority && (item as any).trendingPriority > 0 ? (item as any).trendingPriority : 50;
            await updateDoc(itemRef, { trendingPriority: priority });
            setAnalyticsData(prev => prev.map(p => p.id === item.id ? { ...p, trendingPriority: priority } as any : p));
            setMessage({ type: 'success', text: `${item.title} added to Trending.` });
        } catch (error: any) {
            console.error('Failed to add to trending', error);
            setMessage({ type: 'error', text: 'Failed to add to trending: ' + error.message });
        }
    };

    // Remove item from trending (clear priority)
    const removeFromTrending = async (item: Content) => {
        let prevState: Content[] | null = null;
        try {
            // Optimistically update UI (capture previous state for revert)
            prevState = analyticsData;
            setAnalyticsData(prev => prev.map(p => p.id === item.id ? { ...p, trendingPriority: 0 } as any : p));

            const itemRef = doc(db, 'content', item.id);
            await updateDoc(itemRef, { trendingPriority: 0 });
            setMessage({ type: 'success', text: `${item.title} removed from Trending.` });
        } catch (error: any) {
            console.error('Failed to remove from trending', error);
            setMessage({ type: 'error', text: 'Failed to remove from trending: ' + error.message });
            // revert optimistic update
            try {
                if (prevState) setAnalyticsData(prevState);
            } catch (e) {
                // ignore revert errors
            }
        }
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        reset({
            title: '',
            description: '',
            categories: [],
            destinations: ['vault'],
            type: 'course',
            thumbnailUrl: '',
            youtubeId: '',
            resources: [],
            thumbnails: [],
            lessons: [],
            featured: false,
            trendingPriority: 0,
            filters: {},
            showTitleOnThumbnail: true,
            showTitleOnHero: true
        });
    };

    const handlePrepareAddContent = () => {
        handleCancelEdit();
        setAdminSection('addcontent');
    };

    const vaultItems = analyticsData.filter(c => {
        const dests = (c as any).destinations ?? ((c as any).destination ? [(c as any).destination] : ['vault']);
        return dests.includes('vault');
    });

    const slgdcItems = analyticsData.filter(c => {
        const dests = (c as any).destinations ?? ((c as any).destination ? [(c as any).destination] : ['vault']);
        return dests.includes('slgdc');
    });

    return (
        <Layout>
            <div className="pt-24 pb-20 px-4 md:px-8 min-h-screen">
                <div className="max-w-7xl mx-auto flex gap-6">
                    <AdminSidebar
                        current={adminSection}
                        onChange={(id) => {
                            if (id === 'addcontent') {
                                handlePrepareAddContent();
                            } else {
                                setAdminSection(id);
                            }
                        }}
                    />
                    <div className="flex-1 max-w-6xl">
                        <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

                        {adminSection === 'cleanup' && (
                            <CleanupManager />
                        )}

                        {adminSection === 'overview' && (
                            <>
                                {/* Filter Bar */}
                                <div className="mb-8 p-4 bg-zinc-900 border border-zinc-800 rounded-xl flex flex-wrap items-center justify-between gap-4">
                                    <div className="flex flex-wrap items-center gap-4">
                                        {/* Destination Selector */}
                                        <div className="flex bg-zinc-800 rounded-lg p-1 border border-zinc-700">
                                            <button onClick={() => setDestinationFilter('all')} className={`px-4 py-1.5 rounded-md text-[10px] font-bold transition-all uppercase tracking-wider ${destinationFilter === 'all' ? 'bg-indigo-600 text-white shadow-lg' : 'text-zinc-400 hover:text-white'}`}>ALL</button>
                                            <button onClick={() => setDestinationFilter('vault')} className={`px-4 py-1.5 rounded-md text-[10px] font-bold transition-all uppercase tracking-wider ${destinationFilter === 'vault' ? 'bg-indigo-600 text-white shadow-lg' : 'text-zinc-400 hover:text-white'}`}>VAULT</button>
                                            <button onClick={() => setDestinationFilter('slgdc')} className={`px-4 py-1.5 rounded-md text-[10px] font-bold transition-all uppercase tracking-wider ${destinationFilter === 'slgdc' ? 'bg-indigo-600 text-white shadow-lg' : 'text-zinc-400 hover:text-white'}`}>SLGDC</button>
                                        </div>

                                        {/* Dynamic Filter Toggle */}
                                        <button
                                            onClick={() => setShowAnalyticsFilters(!showAnalyticsFilters)}
                                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-bold border transition-all uppercase tracking-wider ${showAnalyticsFilters ? 'bg-indigo-500/20 border-indigo-500 text-indigo-400' : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white'}`}
                                        >
                                            <Filter className="w-3.5 h-3.5" />
                                            Filters
                                            {Object.values(dynamicFilters).flat().length > 0 && (
                                                <span className="ml-1 bg-indigo-500 text-white w-4 h-4 rounded-full flex items-center justify-center text-[8px]">
                                                    {Object.values(dynamicFilters).flat().length}
                                                </span>
                                            )}
                                        </button>

                                        {Object.values(dynamicFilters).flat().length > 0 && (
                                            <button
                                                onClick={() => setDynamicFilters({})}
                                                className="text-[10px] font-bold text-zinc-500 hover:text-white uppercase tracking-widest ml-2"
                                            >
                                                Clear
                                            </button>
                                        )}
                                    </div>

                                    <div className="relative">
                                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            placeholder="Search in results..."
                                            className="bg-zinc-800 border border-zinc-700 rounded-lg text-sm pl-9 pr-3 py-2 text-white focus:outline-none focus:border-indigo-500 w-48 transition-colors"
                                        />
                                    </div>
                                </div>

                                {showAnalyticsFilters && (
                                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-8 animate-in fade-in slide-in-from-top-2 duration-300">
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {filterCategories
                                                .filter(cat => destinationFilter === 'all' || (cat.destinations || ['vault']).includes(destinationFilter))
                                                .map(category => (
                                                    <div key={category.id} className="space-y-3">
                                                        <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{category.name}</h4>
                                                        <div className="flex flex-wrap gap-2">
                                                            {category.options.map(option => (
                                                                <button
                                                                    key={option.id}
                                                                    onClick={() => {
                                                                        setDynamicFilters(prev => {
                                                                            const current = prev[category.id] || [];
                                                                            const next = current.includes(option.id)
                                                                                ? current.filter(id => id !== option.id)
                                                                                : [...current, option.id];
                                                                            return { ...prev, [category.id]: next };
                                                                        });
                                                                    }}
                                                                    className={`px-3 py-1 rounded-full text-[10px] font-bold border transition-all ${(dynamicFilters[category.id] || []).includes(option.id)
                                                                        ? 'bg-indigo-500 border-indigo-400 text-white'
                                                                        : 'bg-zinc-800/50 border-zinc-700 text-zinc-400 hover:border-zinc-500'
                                                                        }`}
                                                                >
                                                                    {option.label}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))
                                            }
                                            {filterCategories.filter(cat => destinationFilter === 'all' || (cat.destinations || ['vault']).includes(destinationFilter)).length === 0 && (
                                                <div className="col-span-full text-center py-4 text-zinc-500 text-xs italic">No matching filters found.</div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Statistics Cards */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                                    <div className="bg-gradient-to-br from-indigo-600/20 to-purple-600/20 border border-indigo-500/30 rounded-xl p-5">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs text-indigo-300 font-medium">Total Content</span>
                                            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                                                <Eye className="w-4 h-4 text-indigo-400" />
                                            </div>
                                        </div>
                                        <p className="text-3xl font-bold text-white">{stats.totalItems}</p>
                                        <p className="text-xs text-zinc-500 mt-1">Items in database</p>
                                    </div>
                                    <div className="bg-gradient-to-br from-emerald-600/20 to-teal-600/20 border border-emerald-500/30 rounded-xl p-5">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs text-emerald-300 font-medium">Total Views</span>
                                            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                                                <BarChart2 className="w-4 h-4 text-emerald-400" />
                                            </div>
                                        </div>
                                        <p className="text-3xl font-bold text-white">{stats.totalViews.toLocaleString()}</p>
                                        <p className="text-xs text-zinc-500 mt-1">Across all content</p>
                                    </div>
                                    <div className="bg-gradient-to-br from-amber-600/20 to-orange-600/20 border border-amber-500/30 rounded-xl p-5">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs text-amber-300 font-medium">Filters</span>
                                            <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                                                <Layers className="w-4 h-4 text-amber-400" />
                                            </div>
                                        </div>
                                        <p className="text-3xl font-bold text-white">{stats.itemsWithFilters ?? 0}</p>
                                        <p className="text-xs text-zinc-500 mt-1">
                                            {stats.topOptions && stats.topOptions.length > 0 ? (
                                                stats.topOptions.slice(0, 3).map((o: any, idx: number) => {
                                                    // resolve label from filterCategories
                                                    let label = o.id;
                                                    for (const fc of filterCategories) {
                                                        const found = (fc.options || []).find((opt: any) => opt.id === o.id);
                                                        if (found) { label = found.label; break; }
                                                    }
                                                    return `${label} (${o.count})` + (idx < Math.min(2, stats.topOptions.length - 1) ? ', ' : '');
                                                })
                                            ) : 'No filters used yet'}
                                        </p>
                                    </div>
                                    <div className="bg-gradient-to-br from-rose-600/20 to-pink-600/20 border border-rose-500/30 rounded-xl p-5">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs text-rose-300 font-medium">Featured</span>
                                            <div className="w-8 h-8 rounded-lg bg-rose-500/20 flex items-center justify-center">
                                                <Tag className="w-4 h-4 text-rose-400" />
                                            </div>
                                        </div>
                                        <p className="text-3xl font-bold text-white">{stats.featured}</p>
                                        <p className="text-xs text-zinc-500 mt-1">Hero spotlight</p>
                                    </div>
                                </div>

                                {/* Quick Actions */}
                                <div className="flex flex-wrap gap-3 mb-8">
                                    <button
                                        onClick={handlePrepareAddContent}
                                        className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
                                    >
                                        <Plus className="w-4 h-4" /> Add New Content
                                    </button>
                                    <button
                                        onClick={() => setAdminSection('home')}
                                        className="bg-zinc-800 hover:bg-zinc-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 border border-zinc-700"
                                    >
                                        <Home className="w-4 h-4" /> Manage Home Page
                                    </button>
                                </div>

                                {/* Content Grid */}
                                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                        <Archive className="w-5 h-5 text-indigo-400" /> Recent Content
                                    </h2>
                                    {filteredAnalytics.length === 0 ? (
                                        <div className="text-zinc-500 text-center py-8">No matching items found.</div>
                                    ) : (
                                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                            {filteredAnalytics.slice(0, 10).map(item => (
                                                <div key={item.id} className="group">
                                                    <VideoCard content={item} onClick={() => { setEditingId(item.id || null); handleEdit(item); }} />
                                                    <div className="flex items-center justify-between mt-2">
                                                        <div className="text-zinc-400 text-xs truncate flex-1">{item.title}</div>
                                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button 
                                                                onClick={() => setShareData({ 
                                                                    title: item.title, 
                                                                    thumbnailUrl: item.thumbnailUrl, 
                                                                    type: item.type 
                                                                })} 
                                                                className="p-1 text-zinc-500 hover:text-indigo-400 rounded transition-colors" 
                                                                title="Share"
                                                            >
                                                                <Share2 className="w-3 h-3" />
                                                            </button>
                                                            <button onClick={() => handleEdit(item)} className="p-1 text-zinc-500 hover:text-white rounded" title="Edit"><Pencil className="w-3 h-3" /></button>
                                                            <button onClick={() => handleDeleteContent(item.id, item.title, item)} className="p-1 text-zinc-500 hover:text-red-400 rounded" title="Delete"><Trash2 className="w-3 h-3" /></button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </>
                        )}

                        {adminSection === 'vault' && (
                            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-8">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-xl font-bold flex items-center gap-2">
                                        <Archive className="w-5 h-5 text-indigo-400" /> Vault Management
                                    </h2>
                                    <button
                                        onClick={handlePrepareAddContent}
                                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
                                    >
                                        <Plus className="w-4 h-4" /> Add Content
                                    </button>
                                </div>
                                {vaultItems.length === 0 ? (
                                    <div className="text-center py-12">
                                        <Archive className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                                        <p className="text-zinc-500 mb-4">No items found in the Vault.</p>
                                        <button
                                            onClick={handlePrepareAddContent}
                                            className="text-indigo-400 hover:text-indigo-300 text-sm"
                                        >
                                            Add your first content →
                                        </button>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                        {vaultItems.map(item => (
                                            <div key={item.id} className="group">
                                                <VideoCard content={item} onClick={() => { setEditingId(item.id || null); handleEdit(item); setAdminSection('addcontent'); }} />
                                                <div className="flex items-center justify-between mt-2">
                                                    <div className="text-zinc-400 text-xs truncate flex-1 pr-2">{item.title}</div>
                                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={() => setShareData({ 
                                                                title: item.title, 
                                                                thumbnailUrl: item.thumbnailUrl, 
                                                                type: item.type 
                                                            })}
                                                            className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-indigo-400 rounded transition-colors"
                                                            title="Share"
                                                        >
                                                            <Share2 className="w-3 h-3" />
                                                        </button>
                                                        <button
                                                            onClick={() => { handleEdit(item); setAdminSection('addcontent'); }}
                                                            className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded transition-colors"
                                                            title="Edit"
                                                        >
                                                            <Pencil className="w-3 h-3" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteContent(item.id, item.title, item)}
                                                            className="p-1.5 bg-zinc-800 hover:bg-red-900/50 text-zinc-400 hover:text-red-400 rounded transition-colors"
                                                            title="Delete"
                                                        >
                                                            <Trash2 className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {adminSection === 'slgdc' && (
                            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-8">
                                <h2 className="text-xl font-bold mb-4">SLGDC Management</h2>
                                {slgdcItems.length === 0 ? (
                                    <div className="text-zinc-500">No SLGDC items found.</div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 pb-6">
                                        {slgdcItems.map(item => (
                                            <div key={item.id}>
                                                <VideoCard content={item} onClick={() => { setEditingId(item.id || null); handleEdit(item); }} />
                                                <div className="flex items-center justify-between mt-2">
                                                    <div className="text-zinc-400 text-sm truncate">{item.title}</div>
                                                    <div className="flex gap-2">
                                                        <button 
                                                            onClick={() => setShareData({ 
                                                                title: item.title, 
                                                                thumbnailUrl: item.thumbnailUrl, 
                                                                type: item.type 
                                                            })} 
                                                            className="text-zinc-500 hover:text-indigo-400 transition-colors" 
                                                            title="Share"
                                                        >
                                                            <Share2 className="w-4 h-4" />
                                                        </button>
                                                        <button onClick={() => handleEdit(item)} className="text-zinc-500 hover:text-white" title="Edit"><Pencil className="w-4 h-4" /></button>
                                                        <button onClick={() => handleDeleteContent(item.id, item.title, item)} className="text-zinc-500 hover:text-red-400" title="Delete"><Trash2 className="w-4 h-4" /></button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {adminSection === 'analytics' && (
                            <>
                                {/* Analytics Section */}
                                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-8">
                                    <div className="flex items-center justify-between mb-4">
                                        <h2 className="text-xl font-bold flex items-center gap-2">
                                            <Eye className="w-5 h-5" /> Analytics Overview
                                        </h2>
                                        <div className="flex flex-wrap items-center gap-4">
                                            {/* Destination Selector */}
                                            <div className="flex bg-zinc-800 rounded-lg p-1 border border-zinc-700">
                                                <button onClick={() => setDestinationFilter('all')} className={`px-4 py-1.5 rounded-md text-[10px] font-bold transition-all uppercase tracking-wider ${destinationFilter === 'all' ? 'bg-indigo-600 text-white shadow-lg' : 'text-zinc-400 hover:text-white'}`}>ALL</button>
                                                <button onClick={() => setDestinationFilter('vault')} className={`px-4 py-1.5 rounded-md text-[10px] font-bold transition-all uppercase tracking-wider ${destinationFilter === 'vault' ? 'bg-indigo-600 text-white shadow-lg' : 'text-zinc-400 hover:text-white'}`}>VAULT</button>
                                                <button onClick={() => setDestinationFilter('slgdc')} className={`px-4 py-1.5 rounded-md text-[10px] font-bold transition-all uppercase tracking-wider ${destinationFilter === 'slgdc' ? 'bg-indigo-600 text-white shadow-lg' : 'text-zinc-400 hover:text-white'}`}>SLGDC</button>
                                            </div>

                                            {/* Dynamic Filter Toggle */}
                                            <button
                                                onClick={() => setShowAnalyticsFilters(!showAnalyticsFilters)}
                                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-bold border transition-all uppercase tracking-wider ${showAnalyticsFilters ? 'bg-indigo-500/20 border-indigo-500 text-indigo-400' : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white'}`}
                                            >
                                                <Filter className="w-3.5 h-3.5" />
                                                Filters
                                            </button>

                                            {/* Search Input */}
                                            <div className="relative">
                                                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                                                <input
                                                    type="text"
                                                    value={searchQuery}
                                                    onChange={(e) => setSearchQuery(e.target.value)}
                                                    placeholder="Search content..."
                                                    className="bg-zinc-800 border border-zinc-700 rounded-lg text-sm pl-9 pr-3 py-2 text-white focus:outline-none focus:border-indigo-500 w-48 transition-colors"
                                                />
                                            </div>
                                        </div>

                                        {showAnalyticsFilters && (
                                            <div className="w-full bg-zinc-800/50 border border-zinc-700 rounded-xl p-4 mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                                    {filterCategories
                                                        .filter(cat => destinationFilter === 'all' || (cat.destinations || ['vault']).includes(destinationFilter))
                                                        .map(category => (
                                                            <div key={category.id} className="space-y-2">
                                                                <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{category.name}</h4>
                                                                <div className="flex flex-wrap gap-1.5">
                                                                    {category.options.map(option => (
                                                                        <button
                                                                            key={option.id}
                                                                            onClick={() => {
                                                                                setDynamicFilters(prev => {
                                                                                    const current = prev[category.id] || [];
                                                                                    const next = current.includes(option.id)
                                                                                        ? current.filter(id => id !== option.id)
                                                                                        : [...current, option.id];
                                                                                    return { ...prev, [category.id]: next };
                                                                                });
                                                                            }}
                                                                            className={`px-2 py-0.5 rounded text-[9px] font-bold border transition-all ${(dynamicFilters[category.id] || []).includes(option.id)
                                                                                ? 'bg-indigo-500 border-indigo-400 text-white'
                                                                                : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-500'
                                                                                }`}
                                                                        >
                                                                            {option.label}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        ))
                                                    }
                                                </div>
                                                {Object.values(dynamicFilters).flat().length > 0 && (
                                                    <div className="mt-4 pt-3 border-t border-zinc-700 flex justify-end">
                                                        <button
                                                            onClick={() => setDynamicFilters({})}
                                                            className="text-[9px] font-bold text-zinc-500 hover:text-white uppercase tracking-widest"
                                                        >
                                                            Clear All Filters
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-sm text-zinc-400">
                                            <thead className="bg-zinc-800/50 text-zinc-200 uppercase text-xs">
                                                <tr>
                                                    <th className="px-4 py-3 rounded-tl-lg">Title</th>
                                                    <th className="px-4 py-3">Destinations</th>
                                                    <th className="px-4 py-3">Featured</th>
                                                    <th className="px-4 py-3">Priority</th>
                                                    <th className="px-4 py-3 text-right">Views</th>
                                                    <th className="px-4 py-3 rounded-tr-lg text-right">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {isLoadingAnalytics ? (
                                                    <tr><td colSpan={6} className="p-4 text-center">Loading data...</td></tr>
                                                ) : filteredAnalytics.length === 0 ? (
                                                    <tr><td colSpan={6} className="p-4 text-center">No content found.</td></tr>
                                                ) : (
                                                    filteredAnalytics.map(item => (
                                                        <tr key={item.id} className="border-b border-zinc-800 hover:bg-zinc-800/20 transition-colors">
                                                            <td className="px-4 py-3 font-medium text-white">{item.title}</td>
                                                            <td className="px-4 py-3">
                                                                <div className="flex items-center gap-2">
                                                                    {(((item as any).destinations) || ((item as any).destination ? [(item as any).destination] : ['vault'])).map((d: string) => (
                                                                        <span key={d} className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${d === 'slgdc' ? 'bg-yellow-300 text-black' : 'bg-indigo-500/20 text-indigo-300'}`}>
                                                                            {d}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                {item.featured ? (
                                                                    <span className="bg-yellow-500/20 text-yellow-300 text-[10px] px-2 py-0.5 rounded uppercase font-bold">
                                                                        Hero
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-zinc-500 text-[10px]">—</span>
                                                                )}
                                                            </td>
                                                            <td className="px-4 py-3 text-center text-white font-mono">
                                                                {(item as any).trendingPriority || 0}
                                                            </td>
                                                            <td className="px-4 py-3 text-right text-white font-mono">{item.views || 0}</td>
                                                            <td className="px-4 py-3 text-right">
                                                                <div className="flex items-center justify-end gap-2">
                                                                    <div className="flex items-center gap-2">
                                                                        {((item as any).trendingPriority && (item as any).trendingPriority > 0) ? (
                                                                            <button
                                                                                onClick={() => removeFromTrending(item)}
                                                                                className="p-1 rounded hover:bg-red-700/20 text-red-400"
                                                                                title="Remove from Trending"
                                                                            >
                                                                                <Trash2 className="w-4 h-4" />
                                                                            </button>
                                                                        ) : (
                                                                            <button
                                                                                onClick={() => addToTrending(item)}
                                                                                className="p-1 rounded hover:bg-emerald-700/20 text-emerald-300"
                                                                                title="Add to Trending"
                                                                            >
                                                                                <Plus className="w-4 h-4" />
                                                                            </button>
                                                                        )}

                                                                        <button
                                                                            onClick={() => setAsHero(item)}
                                                                            className="p-1 rounded hover:bg-yellow-700/20 text-yellow-300"
                                                                            title="Set as Hero"
                                                                        >
                                                                            <Tag className="w-4 h-4" />
                                                                        </button>

                                                                        <button
                                                                            onClick={() => setShareData({ 
                                                                                title: item.title, 
                                                                                thumbnailUrl: item.thumbnailUrl, 
                                                                                type: item.type 
                                                                            })}
                                                                            className="text-zinc-500 hover:text-indigo-400 transition-colors"
                                                                            title="Share"
                                                                        >
                                                                            <Share2 className="w-4 h-4" />
                                                                        </button>

                                                                        <button
                                                                            onClick={() => handleEdit(item)}
                                                                            className="text-zinc-500 hover:text-white transition-colors"
                                                                            title="Edit"
                                                                        >
                                                                            <Pencil className="w-4 h-4" />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleDeleteContent(item.id, item.title, item)}
                                                                            className="text-zinc-500 hover:text-red-400 transition-colors"
                                                                            title="Delete"
                                                                        >
                                                                            <Trash2 className="w-4 h-4" />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </>
                        )}

                        {adminSection === 'home' && (
                            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-8">
                                <h2 className="text-xl font-bold mb-4">Home Page Management</h2>
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="text-lg font-semibold mb-2">Hero Section</h3>
                                        {(() => {
                                            const vaultContents = analyticsData.filter(c => {
                                                const dests = (c as any).destinations ?? ((c as any).destination ? [(c as any).destination] : ['vault']);
                                                return dests.includes('vault');
                                            }).sort((a, b) => {
                                                const aPriority = (a as any).trendingPriority || 0;
                                                const bPriority = (b as any).trendingPriority || 0;
                                                if (aPriority !== bPriority) return bPriority - aPriority;
                                                return (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0);
                                            });
                                            const featured = vaultContents.find(c => c.featured);
                                            return featured ? (
                                                <div className="bg-zinc-800 p-4 rounded flex items-center gap-4">
                                                    <img src={featured.thumbnailUrl} alt={featured.title} className="w-16 h-16 object-cover rounded" />
                                                    <div>
                                                        <h4 className="font-medium">{featured.title}</h4>
                                                        <p className="text-sm text-zinc-400">{featured.type}</p>
                                                    </div>
                                                    <button
                                                        onClick={() => handleEdit(featured)}
                                                        className="ml-auto bg-zinc-700 hover:bg-zinc-600 px-3 py-1 rounded text-sm"
                                                    >
                                                        Change
                                                    </button>
                                                </div>
                                            ) : (
                                                <p className="text-zinc-500">No featured content set. Edit a vault content and check "Feature in Hero section".</p>
                                            );
                                        })()}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold mb-2">Trending in Vault (Top 10)</h3>
                                        <div className="space-y-2">
                                            {/* Quick selector to add content to Trending or Hero */}
                                            <div className="flex gap-2 items-center mb-3">
                                                <select
                                                    value={homeSelectedId || ''}
                                                    onChange={(e) => setHomeSelectedId(e.target.value || null)}
                                                    className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-white focus:outline-none"
                                                >
                                                    <option value="">Select content to control...</option>
                                                    {analyticsData.map(c => (
                                                        <option key={c.id} value={c.id}>{c.title}</option>
                                                    ))}
                                                </select>
                                                <button
                                                    onClick={async () => {
                                                        if (!homeSelectedId) return setMessage({ type: 'error', text: 'Select content first.' });
                                                        const item = analyticsData.find(a => a.id === homeSelectedId);
                                                        if (!item) return setMessage({ type: 'error', text: 'Content not found.' });
                                                        await addToTrending(item);
                                                    }}
                                                    className="bg-emerald-600/20 text-emerald-200 px-3 py-2 rounded text-sm"
                                                >
                                                    Add to Trending
                                                </button>
                                                <button
                                                    onClick={async () => {
                                                        if (!homeSelectedId) return setMessage({ type: 'error', text: 'Select content first.' });
                                                        const item = analyticsData.find(a => a.id === homeSelectedId);
                                                        if (!item) return setMessage({ type: 'error', text: 'Content not found.' });
                                                        await setAsHero(item);
                                                    }}
                                                    className="bg-yellow-600/20 text-yellow-200 px-3 py-2 rounded text-sm"
                                                >
                                                    Set as Hero
                                                </button>
                                            </div>
                                            {(() => {
                                                const vaultContents = analyticsData.filter(c => {
                                                    const dests = (c as any).destinations ?? ((c as any).destination ? [(c as any).destination] : ['vault']);
                                                    return dests.includes('vault') && ((c as any).trendingPriority || 0) > 0;
                                                }).sort((a, b) => {
                                                    const aPriority = (a as any).trendingPriority || 0;
                                                    const bPriority = (b as any).trendingPriority || 0;
                                                    if (aPriority !== bPriority) return bPriority - aPriority;
                                                    return (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0);
                                                }).slice(0, 10);

                                                const onDragStart = (e: React.DragEvent, id: string) => {
                                                    setDraggedId(id);
                                                    e.dataTransfer.effectAllowed = 'move';
                                                };

                                                const onDragOver = (e: React.DragEvent, id: string) => {
                                                    e.preventDefault();
                                                    setDragOverId(id);
                                                };

                                                const onDrop = async (e: React.DragEvent, id: string) => {
                                                    e.preventDefault();
                                                    if (!draggedId) return;
                                                    if (draggedId === id) return;
                                                    const list = vaultContents.slice();
                                                    const fromIdx = list.findIndex(i => i.id === draggedId);
                                                    const toIdx = list.findIndex(i => i.id === id);
                                                    if (fromIdx === -1 || toIdx === -1) return;
                                                    const [moved] = list.splice(fromIdx, 1);
                                                    list.splice(toIdx, 0, moved);
                                                    // update local analyticsData trendingPriority according to new order
                                                    const updated = analyticsData.map(a => {
                                                        const newIndex = list.findIndex(i => i.id === a.id);
                                                        if (newIndex === -1) return a;
                                                        return { ...a, trendingPriority: Math.max(0, 100 - newIndex) };
                                                    });
                                                    setAnalyticsData(updated as any);
                                                    setDraggedId(null);
                                                    setDragOverId(null);
                                                    // persist changes
                                                    await saveTrendingOrder(list);
                                                };

                                                if (vaultContents.length === 0) return <p className="text-zinc-500">No vault content available.</p>;
                                                return vaultContents.map((item, index) => (
                                                    <div
                                                        key={item.id}
                                                        draggable
                                                        onDragStart={(e) => onDragStart(e, item.id)}
                                                        onDragOver={(e) => onDragOver(e, item.id)}
                                                        onDrop={(e) => onDrop(e, item.id)}
                                                        className={`bg-zinc-800 p-3 rounded flex items-center gap-3 ${dragOverId === item.id ? 'ring-2 ring-indigo-500' : ''}`}
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            {(item as any).trendingPriority && (item as any).trendingPriority > 0 ? (
                                                                <button onClick={() => removeFromTrending(item)} className="p-1 rounded hover:bg-red-700/20 text-red-400" title="Remove from Trending">
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            ) : (
                                                                <div className="w-5" />
                                                            )}
                                                            <button draggable onDragStart={(e) => onDragStart(e, item.id)} className="cursor-grab p-1 text-zinc-400" title="Drag to reorder">
                                                                <span className="text-xl leading-none">≡</span>
                                                            </button>
                                                        </div>
                                                        <span className="text-zinc-400 font-mono w-6">#{index + 1}</span>
                                                        <img src={item.thumbnailUrl} alt={item.title} className="w-12 h-12 object-cover rounded" />
                                                        <div className="flex-1">
                                                            <h4 className="font-medium text-sm">{item.title}</h4>
                                                            <p className="text-xs text-zinc-400">Priority: {(item as any).trendingPriority || 0}</p>
                                                        </div>
                                                        <button
                                                            onClick={() => handleEdit(item)}
                                                            className="bg-zinc-700 hover:bg-zinc-600 px-2 py-1 rounded text-xs"
                                                        >
                                                            Edit
                                                        </button>
                                                        {(item as any).trendingPriority && (item as any).trendingPriority > 0 ? (
                                                            <button
                                                                onClick={() => removeFromTrending(item)}
                                                                className="ml-2 p-1 rounded hover:bg-red-700/20 text-red-400"
                                                                title="Remove from Trending"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        ) : (
                                                            <button
                                                                onClick={() => addToTrending(item)}
                                                                className="ml-2 p-1 rounded hover:bg-emerald-700/20 text-emerald-300"
                                                                title="Add to Trending"
                                                            >
                                                                <Plus className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => setAsHero(item)}
                                                            className="ml-2 p-1 rounded hover:bg-yellow-700/20 text-yellow-300"
                                                            title="Set as Hero"
                                                        >
                                                            <Tag className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ));
                                            })()}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {adminSection === 'filters' && (
                            <div className="space-y-6">
                                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                                        <Filter className="w-5 h-5 text-indigo-400" /> Filter Configuration
                                    </h2>

                                    <div className="flex flex-col gap-4 mb-8">
                                        <div className="flex gap-3">
                                            <input
                                                value={newFilterCategoryName}
                                                onChange={(e) => setNewFilterCategoryName(e.target.value)}
                                                placeholder="New Category Name (e.g. Type, Industry)"
                                                className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                                            />
                                            <button
                                                onClick={handleAddFilterCategory}
                                                disabled={isSavingFilter || !newFilterCategoryName.trim()}
                                                className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors disabled:opacity-50"
                                            >
                                                {isSavingFilter ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Add Category
                                            </button>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="text-xs text-zinc-500 uppercase font-bold tracking-widest">Available in:</span>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => setFilterCategoryTarget('vault')}
                                                    className={`px-3 py-1 rounded text-[10px] font-bold uppercase transition-colors ${filterCategoryTarget === 'vault' ? 'bg-indigo-600 text-white' : 'bg-zinc-800 text-zinc-500'}`}
                                                >
                                                    Vault
                                                </button>
                                                <button
                                                    onClick={() => setFilterCategoryTarget('slgdc')}
                                                    className={`px-3 py-1 rounded text-[10px] font-bold uppercase transition-colors ${filterCategoryTarget === 'slgdc' ? 'bg-indigo-600 text-white' : 'bg-zinc-800 text-zinc-500'}`}
                                                >
                                                    SLGDC
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-6">
                                        {filterCategories.filter(c => (c.destinations || ['vault']).includes(filterCategoryTarget)).map(category => (
                                            <div key={category.id} draggable onDragStart={(e) => { setDraggedCategory(category.id); e.dataTransfer.effectAllowed = 'move'; }} onDragOver={(e) => { e.preventDefault(); setDragOverCategory(category.id); }} onDrop={async (e) => {
                                                e.preventDefault();
                                                if (!draggedCategory) return;
                                                if (draggedCategory === category.id) return;
                                                const list = filterCategories.filter(c => (c.destinations || ['vault']).includes(filterCategoryTarget));
                                                const fromIdx = list.findIndex(i => i.id === draggedCategory);
                                                const toIdx = list.findIndex(i => i.id === category.id);
                                                if (fromIdx === -1 || toIdx === -1) return;
                                                const moved = list.splice(fromIdx, 1)[0];
                                                list.splice(toIdx, 0, moved);
                                                // update order values locally
                                                const updated = filterCategories.map(fc => {
                                                    if ((fc.destinations || ['vault']).includes(filterCategoryTarget)) {
                                                        const idx = list.findIndex(l => l.id === fc.id);
                                                        return { ...fc, order: idx === -1 ? fc.order : idx };
                                                    }
                                                    return fc;
                                                });
                                                setFilterCategories(updated.sort((a, b) => (a.order || 0) - (b.order || 0)));
                                                // persist order for this destination
                                                await saveFilterCategoryOrder(list.map(i => i.id));
                                                setDraggedCategory(null);
                                                setDragOverCategory(null);
                                            }} className={`bg-zinc-800/50 border border-zinc-700 rounded-xl overflow-hidden ${dragOverCategory === category.id ? 'ring-2 ring-indigo-500' : ''}`}>
                                                <div className="bg-zinc-800 px-4 py-3 border-b border-zinc-700 flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <Settings2 className="w-4 h-4 text-zinc-400" />
                                                        <h3 className="font-bold text-white uppercase tracking-wider text-xs">{category.name}</h3>
                                                        <div className="flex gap-1 ml-2">
                                                            {category.destinations?.map(d => (
                                                                <span key={d} className="text-[8px] bg-zinc-700 text-zinc-400 px-1.5 py-0.5 rounded uppercase font-bold">{d}</span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => handleDeleteFilterCategory(category.id, category.name)}
                                                        className="text-zinc-500 hover:text-red-400 p-1"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                                <div className="p-4">
                                                    <div className="flex flex-wrap gap-2 mb-4">
                                                        {category.options.map(option => (
                                                            <div
                                                                key={option.id}
                                                                draggable
                                                                onDragStart={(e) => { setDraggedOption({ categoryId: category.id, optionId: option.id }); e.dataTransfer.effectAllowed = 'move'; }}
                                                                onDragOver={(e) => { e.preventDefault(); setDragOverOption({ categoryId: category.id, optionId: option.id }); }}
                                                                onDrop={async (e) => {
                                                                    e.preventDefault();
                                                                    if (!draggedOption) return;
                                                                    if (draggedOption.categoryId !== category.id) return;
                                                                    if (draggedOption.optionId === option.id) return;
                                                                    const opts = category.options.slice();
                                                                    const fromIdx = opts.findIndex(o => o.id === draggedOption.optionId);
                                                                    const toIdx = opts.findIndex(o => o.id === option.id);
                                                                    if (fromIdx === -1 || toIdx === -1) return;
                                                                    const [moved] = opts.splice(fromIdx, 1);
                                                                    opts.splice(toIdx, 0, moved);
                                                                    // persist order for this category
                                                                    await saveFilterOptionOrder(category.id, opts.map(o => o.id));
                                                                    setDraggedOption(null);
                                                                    setDragOverOption(null);
                                                                }}
                                                                className={`flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 px-3 py-1.5 rounded-full text-xs font-medium ${dragOverOption && dragOverOption.optionId === option.id && dragOverOption.categoryId === category.id ? 'ring-2 ring-indigo-500' : ''}`}
                                                            >
                                                                {editingOptionId === option.id && editingOptionCategoryId === category.id ? (
                                                                    <div className="flex items-center gap-2">
                                                                        <input
                                                                            value={editingOptionValue}
                                                                            onChange={(e) => setEditingOptionValue(e.target.value)}
                                                                            className="bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs text-white focus:outline-none"
                                                                        />
                                                                        <button
                                                                            onClick={() => saveEditingFilterOption(category.id, option.id)}
                                                                            disabled={isSavingOptionEdit}
                                                                            className="bg-indigo-600 text-white px-2 py-1 rounded text-xs font-medium disabled:opacity-50"
                                                                        >
                                                                            {isSavingOptionEdit ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Save'}
                                                                        </button>
                                                                        <button onClick={cancelEditingFilterOption} className="text-zinc-400 hover:text-white text-xs">Cancel</button>
                                                                    </div>
                                                                ) : (
                                                                    <>
                                                                        <span>{option.label}</span>
                                                                        <button
                                                                            onClick={() => startEditingFilterOption(category.id, option.id, option.label)}
                                                                            className="text-indigo-400 hover:text-indigo-300"
                                                                            title="Edit"
                                                                        >
                                                                            <Pencil className="w-3 h-3" />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleDeleteFilterOption(category.id, option.id)}
                                                                            className="hover:text-red-400 text-indigo-500"
                                                                        >
                                                                            <X className="w-3 h-3" />
                                                                        </button>
                                                                    </>
                                                                )}
                                                            </div>
                                                        ))}
                                                        {category.options.length === 0 && (
                                                            <span className="text-zinc-500 text-xs italic">No options added yet</span>
                                                        )}
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <input
                                                            value={newFilterOptionName[category.id] || ''}
                                                            onChange={(e) => setNewFilterOptionName(prev => ({ ...prev, [category.id]: e.target.value }))}
                                                            placeholder="Add option..."
                                                            className="flex-1 bg-zinc-900 border border-zinc-700 rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                                                        />
                                                        <button
                                                            onClick={() => handleAddFilterOption(category.id)}
                                                            className="bg-zinc-700 hover:bg-zinc-600 text-white px-3 py-1.5 rounded text-xs font-bold transition-colors"
                                                        >
                                                            Add
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Thumbnail Picker Modal */}
                        {showThumbPicker && (
                            <div className="fixed inset-0 z-[80] bg-black/70 flex items-center justify-center p-6" onClick={() => setShowThumbPicker(false)}>
                                <div className="bg-zinc-900 rounded-lg p-4 max-w-4xl w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="text-lg font-bold">Choose Existing Image</h3>
                                        <button onClick={() => setShowThumbPicker(false)} className="text-zinc-400 hover:text-white">Close</button>
                                    </div>
                                    {existingImages.length === 0 ? (
                                        <div className="text-zinc-500">No existing images found.</div>
                                    ) : (
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                            {existingImages.map((url, i) => (
                                                <button key={i} className="overflow-hidden rounded bg-zinc-800 p-1" onClick={() => {
                                                    if (thumbPickerTargetIndex === null) {
                                                        setValue('thumbnailUrl', url);
                                                    } else {
                                                        setValue(`thumbnails.${thumbPickerTargetIndex}.url` as const, url);
                                                    }
                                                    setShowThumbPicker(false);
                                                }}>
                                                    <img src={url} alt={`thumb-${i}`} className="w-full h-28 object-cover rounded" />
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Fixed Toast Notification */}
                        {message && (
                            <div className="fixed bottom-6 right-6 z-[100] animate-in slide-in-from-bottom-5 fade-in duration-300">
                                <div className={`flex items-center gap-3 px-5 py-4 rounded-xl shadow-2xl border backdrop-blur-sm ${message.type === 'success'
                                    ? 'bg-emerald-950/90 border-emerald-500/30 text-emerald-300'
                                    : 'bg-red-950/90 border-red-500/30 text-red-300'
                                    }`}>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${message.type === 'success' ? 'bg-emerald-500/20' : 'bg-red-500/20'
                                        }`}>
                                        {message.type === 'success' ? (
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        ) : (
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        )}
                                    </div>
                                    <span className="text-sm font-medium max-w-xs">{message.text}</span>
                                    <button
                                        onClick={() => setMessage(null)}
                                        className="ml-2 text-zinc-400 hover:text-white transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Show Manage Categories and Add Content only in Content Management tab */}
                        {adminSection === 'addcontent' && (
                            <form onSubmit={handleSubmit(onSubmit)} className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
                                {/* Form Header */}
                                <div className="bg-zinc-800/50 px-6 py-4 border-b border-zinc-700">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${editingId ? 'bg-indigo-500/20' : 'bg-emerald-500/20'}`}>
                                                {editingId ? <Pencil className="w-5 h-5 text-indigo-400" /> : <Plus className="w-5 h-5 text-emerald-400" />}
                                            </div>
                                            <div>
                                                <h2 className="text-lg font-bold text-white">
                                                    {editingId ? 'Edit Content' : 'Add New Content'}
                                                </h2>
                                                <p className="text-xs text-zinc-500">
                                                    {editingId ? 'Modify existing content details' : 'Fill in the details below to add new content'}
                                                </p>
                                            </div>
                                        </div>
                                        {editingId && (
                                            <button
                                                type="button"
                                                onClick={handleCancelEdit}
                                                className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 rounded-lg text-sm flex items-center gap-2 transition-colors"
                                            >
                                                <X className="w-4 h-4" /> Cancel
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="p-6 space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-zinc-300">Title</label>
                                            <input
                                                {...register("title", { required: "Title is required" })}
                                                className="w-full bg-zinc-800 border border-zinc-700 rounded p-2.5 text-white focus:outline-none focus:border-white transition-colors"
                                                placeholder="Content Title"
                                            />
                                            {errors.title && <span className="text-red-400 text-xs">{errors.title.message}</span>}
                                        </div>

                                        {/* Categories removed - managed via Dynamic Filters instead */}

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-zinc-300">Destination</label>
                                            <div className="flex items-center gap-4">
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        name="destination"
                                                        value="vault"
                                                        onChange={() => {
                                                            const prevDest = watch('destinations')?.[0];
                                                            if (prevDest !== 'vault') {
                                                                setValue('destinations', ['vault']);
                                                                // Clear categories when destination changes
                                                                setValue('categories', []);
                                                            }
                                                        }}
                                                        checked={(watch('destinations') || []).includes('vault')}
                                                        className="w-4 h-4 accent-white"
                                                    />
                                                    <span className="text-sm text-zinc-300">Vault</span>
                                                </label>
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        name="destination"
                                                        value="slgdc"
                                                        onChange={() => {
                                                            const prevDest = watch('destinations')?.[0];
                                                            if (prevDest !== 'slgdc') {
                                                                setValue('destinations', ['slgdc']);
                                                                // Clear categories when destination changes
                                                                setValue('categories', []);
                                                            }
                                                        }}
                                                        checked={(watch('destinations') || []).includes('slgdc')}
                                                        className="w-4 h-4 accent-white"
                                                    />
                                                    <span className="text-sm text-zinc-300">SLGDC</span>
                                                </label>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-zinc-300">Hero Section</label>
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    {...register('featured')}
                                                    className="w-4 h-4 accent-white"
                                                />
                                                <span className="text-sm text-zinc-300">Feature in Hero section</span>
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer mt-2">
                                                <input
                                                    type="checkbox"
                                                    {...register('showTitleOnHero')}
                                                    className="w-4 h-4 accent-white"
                                                />
                                                <span className="text-sm text-zinc-300">Show title in Hero</span>
                                            </label>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-zinc-300">Thumbnail Display</label>
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    {...register('showTitleOnThumbnail')}
                                                    className="w-4 h-4 accent-white"
                                                />
                                                <span className="text-sm text-zinc-300">Show title on thumbnail</span>
                                            </label>
                                            <p className="text-xs text-zinc-500">Uncheck to hide the title overlay on the video card thumbnail</p>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-zinc-300">Trending Priority</label>
                                            <input
                                                type="number"
                                                {...register('trendingPriority', { valueAsNumber: true })}
                                                className="w-full bg-zinc-800 border border-zinc-700 rounded p-2.5 text-white focus:outline-none focus:border-white transition-colors"
                                                placeholder="0"
                                                min="0"
                                            />
                                            <p className="text-xs text-zinc-500">Higher number = appears first in Trending in Vault (only for vault content)</p>
                                        </div>

                                        {/* Content Type removed - default type preserved in form state */}

                                        <div className="md:col-span-2 space-y-4">
                                            <button
                                                type="button"
                                                onClick={() => setShowFiltersInForm(!showFiltersInForm)}
                                                className="flex items-center gap-2 text-sm font-bold text-zinc-400 hover:text-white transition-colors uppercase tracking-widest bg-zinc-800/50 px-4 py-2 rounded-lg border border-zinc-700 w-full justify-between group"
                                            >
                                                <span className="flex items-center gap-2">
                                                    <Filter className="w-4 h-4 text-indigo-400" />
                                                    Dynamic Filters
                                                    {Object.values(watch('filters') || {}).flat().length > 0 && (
                                                        <span className="ml-2 bg-indigo-600 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                                                            {Object.values(watch('filters') || {}).flat().length} Selected
                                                        </span>
                                                    )}
                                                </span>
                                                {showFiltersInForm ? <ChevronUp className="w-4 h-4 group-hover:text-indigo-400" /> : <ChevronDown className="w-4 h-4 group-hover:text-indigo-400" />}
                                            </button>

                                            {showFiltersInForm && (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-zinc-800/50 mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                                    {/* Dynamic Filters */}
                                                    {filterCategories.length > 0 && filterCategories
                                                        .filter(cat => (cat.destinations || ['vault']).includes(watch('destinations')?.[0] || 'vault'))
                                                        .map(category => (
                                                            <div key={category.id} className="space-y-2 md:col-span-1">
                                                                <label className="text-sm font-medium text-zinc-300">{category.name}</label>
                                                                <div className="grid grid-cols-1 gap-2 bg-zinc-800/30 p-3 rounded border border-zinc-700 max-h-40 overflow-y-auto">
                                                                    {category.options.map(option => (
                                                                        <label key={option.id} className="flex items-center gap-2 cursor-pointer hover:bg-zinc-700/30 p-1.5 rounded transition">
                                                                            <input
                                                                                type="checkbox"
                                                                                value={option.id}
                                                                                onChange={(e) => {
                                                                                    const currentFilters = watch("filters") || {};
                                                                                    const categoryFilters = currentFilters[category.id] || [];
                                                                                    if (e.target.checked) {
                                                                                        setValue("filters", {
                                                                                            ...currentFilters,
                                                                                            [category.id]: [...categoryFilters, option.id]
                                                                                        });
                                                                                    } else {
                                                                                        setValue("filters", {
                                                                                            ...currentFilters,
                                                                                            [category.id]: categoryFilters.filter((id) => id !== option.id)
                                                                                        });
                                                                                    }
                                                                                }}
                                                                                checked={(watch("filters")?.[category.id] || []).includes(option.id)}
                                                                                className="w-4 h-4 accent-white"
                                                                            />
                                                                            <span className="text-xs text-zinc-300">{option.label}</span>
                                                                        </label>
                                                                    ))}
                                                                    {category.options.length === 0 && (
                                                                        <span className="text-zinc-500 text-[10px] italic">No options defined</span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}
                                                </div>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-zinc-300">Thumbnail URL</label>
                                            <div className="space-y-2">
                                                <div className="flex gap-2">
                                                    <input
                                                        {...register("thumbnailUrl", { required: "Thumbnail is required" })}
                                                        className="flex-1 bg-zinc-800 border border-zinc-700 rounded p-2.5 text-white focus:outline-none focus:border-white transition-colors"
                                                        placeholder="https://..."
                                                    />
                                                    <FileUploadButton
                                                        onUpload={handleThumbnailUpload}
                                                        isLoading={uploadingThumbnail}
                                                        accept="image/*"
                                                        icon={<Cloud className="w-4 h-4" />}
                                                        label={uploadingThumbnail ? "Uploading..." : "Upload"}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => { setThumbPickerTargetIndex(null); setShowThumbPicker(true); }}
                                                        className="bg-zinc-800 border border-zinc-700 px-3 rounded text-sm text-zinc-300 hover:bg-zinc-700"
                                                    >
                                                        Choose
                                                    </button>
                                                </div>
                                                {errors.thumbnailUrl && <span className="text-red-400 text-xs">{errors.thumbnailUrl.message}</span>}
                                            </div>
                                            {thumbnailUrl && (
                                                <div className="mt-2 relative aspect-video rounded overflow-hidden border border-zinc-700 bg-black">
                                                    <img src={thumbnailUrl} alt="Preview" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
                                                    <span className="absolute bottom-1 right-1 bg-black/70 text-white text-[10px] px-1 rounded">Preview</span>
                                                </div>
                                            )}

                                            {/* Additional Thumbnails */}
                                            <div className="space-y-2 mt-4">
                                                <label className="text-sm font-medium text-zinc-300 flex items-center justify-between">
                                                    Additional Thumbnails
                                                    <button
                                                        type="button"
                                                        onClick={() => appendThumbnail({ url: '' })}
                                                        className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                                                    >
                                                        <Plus className="w-3 h-3" /> Add
                                                    </button>
                                                </label>
                                                <div className="space-y-2">
                                                    {thumbnailFields.map((field, index) => (
                                                        <div key={field.id} className="flex gap-2">
                                                            <input
                                                                {...register(`thumbnails.${index}.url` as const)}
                                                                placeholder={`Thumbnail URL ${index + 1}`}
                                                                className="flex-1 bg-zinc-800 border border-zinc-700 rounded p-2 text-sm focus:outline-none focus:border-white"
                                                            />
                                                            <FileUploadButton
                                                                onUpload={(file) => handleAdditionalThumbnailUpload(file, index)}
                                                                isLoading={uploadingThumbnails[index] || false}
                                                                accept="image/*"
                                                                icon={<Cloud className="w-3 h-3" />}
                                                                label="Upload"
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => { setThumbPickerTargetIndex(index); setShowThumbPicker(true); }}
                                                                className="bg-zinc-800 border border-zinc-700 px-3 rounded text-sm text-zinc-300 hover:bg-zinc-700"
                                                            >
                                                                Choose
                                                            </button>
                                                            <button type="button" onClick={() => removeThumbnail(index)} className="text-zinc-500 hover:text-red-400 flex-shrink-0">
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-2 md:col-span-2">
                                            <label className="text-sm font-medium text-zinc-300">Description</label>
                                            <textarea
                                                {...register("description", { required: "Description is required" })}
                                                rows={3}
                                                className="w-full bg-zinc-800 border border-zinc-700 rounded p-2.5 text-white focus:outline-none focus:border-white transition-colors"
                                                placeholder="Brief description..."
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-zinc-300">Intro YouTube ID or URL</label>
                                            <input
                                                {...register("youtubeId", { required: "YouTube ID or URL is required" })}
                                                className="w-full bg-zinc-800 border border-zinc-700 rounded p-2.5 text-white focus:outline-none focus:border-white transition-colors"
                                                placeholder="e.g. https://youtu.be/dQw4w9WgXcQ or dQw4w9WgXcQ"
                                            />
                                        </div>
                                    </div>

                                    {/* Resources Section */}
                                    <div className="border-t border-zinc-800 pt-6">
                                        <h3 className="text-lg font-bold mb-4 flex items-center justify-between">
                                            Resources (Links & Files)
                                            <button
                                                type="button"
                                                onClick={() => appendResource({ label: '', url: '' })}
                                                className="text-xs bg-zinc-800 hover:bg-zinc-700 px-3 py-1 rounded flex items-center gap-1 transition-colors"
                                            >
                                                <Plus className="w-3 h-3" /> Add Resource
                                            </button>
                                        </h3>

                                        <div className="space-y-3">
                                            {resourceFields.map((field, index) => (
                                                <div key={field.id} className="space-y-2">
                                                    <div className="flex gap-3 items-center">
                                                        <input
                                                            {...register(`resources.${index}.label` as const, { required: true })}
                                                            placeholder="Label (e.g. Source Code, PDF, Video)"
                                                            className="flex-1 bg-zinc-800 border border-zinc-700 rounded p-2 text-sm focus:outline-none focus:border-white"
                                                        />
                                                        <button type="button" onClick={() => removeResource(index)} className="text-zinc-500 hover:text-red-400 flex-shrink-0">
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                    <div className="flex gap-2 items-start ml-0">
                                                        <input
                                                            {...register(`resources.${index}.url` as const, { required: true })}
                                                            placeholder="URL or paste file link here"
                                                            className="flex-1 bg-zinc-800 border border-zinc-700 rounded p-2 text-sm focus:outline-none focus:border-white"
                                                        />
                                                        <FileUploadButton
                                                            onUpload={(file) => handleFileUpload(file, index)}
                                                            isLoading={uploadingFiles[index] || false}
                                                            accept="*"
                                                            icon={<Download className="w-4 h-4" />}
                                                            label="Upload"
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Course-like Lessons Section (course, devlog, session) */}
                                    {(contentType === 'course' || contentType === 'devlog' || contentType === 'session') && (
                                        <div className="border-t border-zinc-800 pt-6">
                                            <h3 className="text-lg font-bold mb-4 flex items-center justify-between">
                                                Course Lessons
                                                <button
                                                    type="button"
                                                    onClick={() => appendLesson({ title: '', youtubeId: '' })}
                                                    className="text-xs bg-zinc-800 hover:bg-zinc-700 px-3 py-1 rounded flex items-center gap-1 transition-colors"
                                                >
                                                    <Plus className="w-3 h-3" /> Add Lesson
                                                </button>
                                            </h3>

                                            <div className="space-y-4">
                                                {lessonFields.map((field, index) => (
                                                    <div key={field.id} className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4">
                                                        <div className="flex gap-3 items-center mb-3">
                                                            <span className="text-zinc-500 text-sm w-6">{index + 1}.</span>
                                                            <input
                                                                {...register(`lessons.${index}.title` as const, { required: true })}
                                                                placeholder="Lesson Title"
                                                                className="flex-1 bg-zinc-800 border border-zinc-700 rounded p-2 text-sm focus:outline-none focus:border-white"
                                                                onBlur={() => {
                                                                    // Update the title in state if needed for preview
                                                                }}
                                                            />
                                                            <input
                                                                {...register(`lessons.${index}.youtubeId` as const, { required: true })}
                                                                placeholder="YouTube ID or URL"
                                                                className="w-48 bg-zinc-800 border border-zinc-700 rounded p-2 text-sm focus:outline-none focus:border-white"
                                                            />
                                                            <button 
                                                                type="button" 
                                                                onClick={() => {
                                                                    const lesson = watch(`lessons.${index}`);
                                                                    if (lesson) {
                                                                        setShareData({
                                                                            title: lesson.title || 'Untitled Lesson',
                                                                            thumbnailUrl: lesson.thumbnailUrl,
                                                                            type: 'Lesson'
                                                                        });
                                                                    }
                                                                }}
                                                                className="p-2 text-zinc-400 hover:text-indigo-400 rounded-full hover:bg-zinc-700 transition-colors"
                                                                title="Share Lesson"
                                                            >
                                                                <Share2 className="w-4 h-4" />
                                                            </button>
                                                            <button type="button" onClick={() => removeLesson(index)} className="text-zinc-500 hover:text-red-400 flex-shrink-0">
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>

                                                        {/* Lesson Resources & Thumbnail */}
                                                        <LessonResources
                                                            control={control}
                                                            register={register}
                                                            lessonIndex={index}
                                                            onUploadLessonThumbnail={handleUploadLessonThumbnail}
                                                            uploadingLessonThumbnail={uploadingLessonThumbnail}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="pt-4 flex justify-end">
                                        <button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className={`px-8 py-3 rounded font-bold hover:bg-zinc-200 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${editingId ? 'bg-indigo-500 hover:bg-indigo-400 text-white' : 'bg-white text-black'}`}
                                        >
                                            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                            {editingId ? 'Update Content' : 'Publish Content'}
                                        </button>
                                    </div>

                                </div>
                            </form>
                        )}
                    </div>
                </div>
            </div>
            {shareData && (
                <SharePostGenerator
                    title={shareData.title}
                    thumbnailUrl={shareData.thumbnailUrl}
                    type={shareData.type}
                    onClose={() => setShareData(null)}
                />
            )}
        </Layout>
    );
};

export default Admin;
