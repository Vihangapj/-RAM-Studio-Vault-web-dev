import React, { useState } from 'react';
import { useForm, useFieldArray, type SubmitHandler, type Control, type UseFormRegister } from 'react-hook-form';
import { db } from '../utils/firebase';
import { collection, addDoc, serverTimestamp, getDocs, orderBy, query, deleteDoc, doc, setDoc, updateDoc } from 'firebase/firestore';
import Layout from '../components/Layout';
import { Plus, Trash2, Save, Loader2, Eye, Tag, X, Pencil, Filter, ChevronDown, Link as LinkIcon } from 'lucide-react';
import type { Content } from '../types/types';

// Extend Content type for Form (omit id, timestamps)
// Extend Content type for Form (omit id, timestamps)
type ContentFormData = Omit<Content, 'id' | 'createdAt' | 'thumbnails'> & {
    thumbnails: { url: string }[];
};

// Component for managing resources per lesson
interface LessonResourcesProps {
    control: Control<ContentFormData>;
    register: UseFormRegister<ContentFormData>;
    lessonIndex: number;
}

const LessonResources: React.FC<LessonResourcesProps> = ({ control, register, lessonIndex }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const { fields, append, remove } = useFieldArray({
        control,
        name: `lessons.${lessonIndex}.resources` as const
    });

    return (
        <div className="ml-9 mt-2">
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
    const [filterType, setFilterType] = useState<'all' | 'course'>('all');
    const [editingId, setEditingId] = useState<string | null>(null);

    // Category Management State
    const [categories, setCategories] = useState<string[]>([]);
    const [newCategory, setNewCategory] = useState('');
    const [isAddingCategory, setIsAddingCategory] = useState(false);

    const { register, control, handleSubmit, watch, reset, formState: { errors } } = useForm<ContentFormData>({
        defaultValues: {
            type: 'course',
            resources: [],
            thumbnails: [],
            lessons: []
        }
    });

    const thumbnailUrl = watch('thumbnailUrl');
    const contentType = watch('type');

    // Fetch Analytics & Categories
    React.useEffect(() => {
        const fetchData = async () => {
            try {
                // Analytics
                const q = query(collection(db, 'content'), orderBy('createdAt', 'desc'));
                const querySnapshot = await getDocs(q);
                const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Content));
                setAnalyticsData(data);

                // Categories (stored as documents in 'categories' collection, docId = category name)
                const catSnapshot = await getDocs(collection(db, 'categories'));
                const catData = catSnapshot.docs.map(doc => doc.id);
                if (catData.length === 0) {
                    // Default categories if none exist
                    setCategories(['Development', 'Design', 'Assets', 'Productivity']);
                } else {
                    setCategories(catData);
                }
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setIsLoadingAnalytics(false);
            }
        };
        fetchData();
    }, [message, isAddingCategory]); // Refresh on submissions

    const handleAddCategory = async () => {
        if (!newCategory.trim()) return;
        setIsAddingCategory(true);
        try {
            // Use category name as document ID to prevent duplicates
            await setDoc(doc(db, 'categories', newCategory.trim()), {
                createdAt: serverTimestamp()
            });
            setNewCategory('');
            setMessage({ type: 'success', text: `Category "${newCategory}" added.` });
        } catch (error: any) {
            setMessage({ type: 'error', text: 'Failed to add category: ' + error.message });
        } finally {
            setIsAddingCategory(false);
        }
    };

    const handleDeleteCategory = async (cat: string) => {
        if (!window.confirm(`Delete category "${cat}"?`)) return;
        try {
            await deleteDoc(doc(db, 'categories', cat));
            // Optimistic update
            setCategories(prev => prev.filter(c => c !== cat));
            setMessage({ type: 'success', text: `Category "${cat}" removed.` });
        } catch (error: any) {
            setMessage({ type: 'error', text: 'Failed to delete category: ' + error.message });
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
            // Map thumbnails back to string[]
            cleanData.thumbnails = data.thumbnails?.map((t: any) => t.url) || [];

            if (editingId) {
                // Update existing document
                await updateDoc(doc(db, 'content', editingId), {
                    ...cleanData,
                    // Don't overwrite views or createdAt
                });
                setMessage({ type: 'success', text: 'Content updated successfully.' });
                setEditingId(null);
            } else {
                // Create new document
                await addDoc(collection(db, 'content'), {
                    ...cleanData,
                    views: 0,
                    createdAt: serverTimestamp()
                });
                setMessage({ type: 'success', text: 'Content successfully saved to Vault.' });
            }

            reset({
                title: '',
                description: '',
                category: '',
                type: 'course',
                youtubeId: '',
                resources: [],
                thumbnails: [],
                lessons: []
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
        reset({
            title: content.title,
            description: content.description,
            category: content.category,
            type: content.type,
            thumbnailUrl: content.thumbnailUrl,
            youtubeId: content.youtubeId,
            resources: content.resources || [],
            thumbnails: content.thumbnails?.map(t => ({ url: t })) || [],
            lessons: content.lessons || []
        });
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    };

    const handleDeleteContent = async (id: string, title: string) => {
        if (!window.confirm(`Are you sure you want to delete "${title}"?`)) return;
        try {
            await deleteDoc(doc(db, 'content', id));
            setAnalyticsData(prev => prev.filter(c => c.id !== id));
            setMessage({ type: 'success', text: `Deleted "${title}".` });
        } catch (error: any) {
            setMessage({ type: 'error', text: 'Error deleting content: ' + error.message });
        }
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        reset({
            title: '',
            description: '',
            category: '',
            type: 'course',
            thumbnailUrl: '',
            youtubeId: '',
            resources: [],
            thumbnails: [],
            lessons: []
        });
    };

    const filteredAnalytics = analyticsData.filter(item => {
        if (filterType === 'all') return true;
        return item.type === filterType;
    });

    return (
        <Layout>
            <div className="pt-24 pb-20 px-4 md:px-8 max-w-6xl mx-auto min-h-screen">
                <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

                {/* Analytics Section */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <Eye className="w-5 h-5" /> Analytics Overview
                        </h2>
                        <div className="flex items-center gap-2">
                            <Filter className="w-4 h-4 text-zinc-500" />
                            <select
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value as any)}
                                className="bg-zinc-800 border border-zinc-700 rounded text-xs px-2 py-1 text-white focus:outline-none"
                            >
                                <option value="all">All Items</option>
                                <option value="course">Courses Only</option>
                            </select>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-zinc-400">
                            <thead className="bg-zinc-800/50 text-zinc-200 uppercase text-xs">
                                <tr>
                                    <th className="px-4 py-3 rounded-tl-lg">Title</th>
                                    <th className="px-4 py-3">Type</th>
                                    <th className="px-4 py-3">Category</th>
                                    <th className="px-4 py-3 text-right">Views</th>
                                    <th className="px-4 py-3 rounded-tr-lg text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoadingAnalytics ? (
                                    <tr><td colSpan={5} className="p-4 text-center">Loading data...</td></tr>
                                ) : filteredAnalytics.length === 0 ? (
                                    <tr><td colSpan={5} className="p-4 text-center">No content found.</td></tr>
                                ) : (
                                    filteredAnalytics.map(item => (
                                        <tr key={item.id} className="border-b border-zinc-800 hover:bg-zinc-800/20 transition-colors">
                                            <td className="px-4 py-3 font-medium text-white">{item.title}</td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${item.type === 'course' ? 'bg-indigo-500/20 text-indigo-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
                                                    {item.type}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">{item.category}</td>
                                            <td className="px-4 py-3 text-right text-white font-mono">{item.views || 0}</td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleEdit(item)}
                                                        className="text-zinc-500 hover:text-white transition-colors"
                                                        title="Edit"
                                                    >
                                                        <Pencil className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteContent(item.id, item.title)}
                                                        className="text-zinc-500 hover:text-red-400 transition-colors"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {message && (
                    <div className={`p-4 rounded mb-6 ${message.type === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        {message.text}
                    </div>
                )}

                {/* Category Management */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-8">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <Tag className="w-5 h-5" /> Manage Categories
                    </h2>
                    <div className="flex flex-wrap gap-3 mb-4">
                        {categories.map(cat => (
                            <span key={cat} className="bg-zinc-800 text-zinc-200 px-3 py-1 rounded-full text-sm flex items-center gap-2 border border-zinc-700">
                                {cat}
                                <button onClick={() => handleDeleteCategory(cat)} className="hover:text-red-400">
                                    <X className="w-3 h-3" />
                                </button>
                            </span>
                        ))}
                    </div>
                    <div className="flex gap-2">
                        <input
                            value={newCategory}
                            onChange={(e) => setNewCategory(e.target.value)}
                            placeholder="New Category Name"
                            className="bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-white"
                        />
                        <button
                            onClick={handleAddCategory}
                            disabled={isAddingCategory || !newCategory.trim()}
                            className="bg-white text-black px-4 py-2 rounded text-sm font-bold hover:bg-zinc-200 disabled:opacity-50"
                        >
                            {isAddingCategory ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                        </button>
                    </div>
                </div>

                {/* Content Form */}
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 bg-zinc-900 p-8 rounded-xl border border-zinc-800">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold">
                            {editingId ? 'Edit Content' : 'Add New Content'}
                        </h2>
                        {editingId && (
                            <button
                                type="button"
                                onClick={handleCancelEdit}
                                className="text-sm text-red-400 hover:text-red-300 underline"
                            >
                                Cancel Edit
                            </button>
                        )}
                    </div>

                    {/* Basic Info */}
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

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-300">Category</label>
                            <select
                                {...register("category", { required: "Category is required" })}
                                className="w-full bg-zinc-800 border border-zinc-700 rounded p-2.5 text-white focus:outline-none focus:border-white transition-colors"
                            >
                                <option value="">Select Category</option>
                                {categories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>

                        <input type="hidden" {...register("type")} value="course" />

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-300">Thumbnail URL</label>
                            <input
                                {...register("thumbnailUrl", { required: "Thumbnail is required" })}
                                className="w-full bg-zinc-800 border border-zinc-700 rounded p-2.5 text-white focus:outline-none focus:border-white transition-colors"
                                placeholder="https://..."
                            />
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
                                            <button type="button" onClick={() => removeThumbnail(index)} className="text-zinc-500 hover:text-red-400">
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
                            <label className="text-sm font-medium text-zinc-300">Trailer YouTube ID</label>
                            <input
                                {...register("youtubeId", { required: "ID is required" })}
                                className="w-full bg-zinc-800 border border-zinc-700 rounded p-2.5 text-white focus:outline-none focus:border-white transition-colors"
                                placeholder="e.g. dQw4w9WgXcQ"
                            />
                        </div>
                    </div>

                    {/* Resources Section */}
                    <div className="border-t border-zinc-800 pt-6">
                        <h3 className="text-lg font-bold mb-4 flex items-center justify-between">
                            Resources
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
                                <div key={field.id} className="flex gap-3">
                                    <input
                                        {...register(`resources.${index}.label` as const, { required: true })}
                                        placeholder="Label (e.g. Source Code)"
                                        className="flex-1 bg-zinc-800 border border-zinc-700 rounded p-2 text-sm focus:outline-none focus:border-white"
                                    />
                                    <input
                                        {...register(`resources.${index}.url` as const, { required: true })}
                                        placeholder="URL"
                                        className="flex-1 bg-zinc-800 border border-zinc-700 rounded p-2 text-sm focus:outline-none focus:border-white"
                                    />
                                    <button type="button" onClick={() => removeResource(index)} className="text-zinc-500 hover:text-red-400">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Course Lessons Section */}
                    {contentType === 'course' && (
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
                                            />
                                            <input
                                                {...register(`lessons.${index}.youtubeId` as const, { required: true })}
                                                placeholder="YouTube ID"
                                                className="w-32 bg-zinc-800 border border-zinc-700 rounded p-2 text-sm focus:outline-none focus:border-white"
                                            />
                                            <button type="button" onClick={() => removeLesson(index)} className="text-zinc-500 hover:text-red-400">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>

                                        {/* Lesson Resources */}
                                        <LessonResources control={control} register={register} lessonIndex={index} />
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

                </form>
            </div>
        </Layout>
    );
};

export default Admin;
