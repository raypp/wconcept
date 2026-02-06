import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './Button';
import { Input } from './Input';
import { api } from '../lib/api';
import type { Creator } from '../lib/types';
import { X, Plus } from 'lucide-react';

export function TrackingForm() {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        startDate: '',
        endDate: '',
        currentKeyword: '',
        keywords: [] as string[],
        currentCreatorName: '',
        currentCreatorHandle: '',
        creators: [] as Creator[],
    });

    const handleAddKeyword = () => {
        if (formData.currentKeyword.trim()) {
            setFormData((prev) => ({
                ...prev,
                keywords: [...prev.keywords, prev.currentKeyword.trim()],
                currentKeyword: '',
            }));
        }
    };

    const removeKeyword = (index: number) => {
        setFormData((prev) => ({
            ...prev,
            keywords: prev.keywords.filter((_, i) => i !== index),
        }));
    };

    const handleAddCreator = () => {
        if (formData.currentCreatorName && formData.currentCreatorHandle) {
            const newCreator: Creator = {
                id: Math.random().toString(), // Helper ID for demo
                name: formData.currentCreatorName,
                handle: formData.currentCreatorHandle,
                platform: 'instagram', // Default for demo
                followers: 0, // Placeholder
            };
            setFormData((prev) => ({
                ...prev,
                creators: [...prev.creators, newCreator],
                currentCreatorName: '',
                currentCreatorHandle: '',
            }));
        }
    };

    const removeCreator = (index: number) => {
        setFormData((prev) => ({
            ...prev,
            creators: prev.creators.filter((_, i) => i !== index),
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await api.createTracking({
                title: formData.title,
                startDate: formData.startDate,
                endDate: formData.endDate,
                keywords: formData.keywords,
                creators: formData.creators,
            });
            navigate('/');
        } catch (error) {
            console.error('Failed to create tracking', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8 bg-white p-8 rounded-lg shadow-sm border border-gray-100">

            {/* 1. Basic Info */}
            <section className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Tracking Info</h3>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Campaign Title</label>
                    <Input
                        required
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="e.g., 2024 Summer Sale"
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                        <Input
                            type="date"
                            required
                            value={formData.startDate}
                            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                        <Input
                            type="date"
                            required
                            value={formData.endDate}
                            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                        />
                    </div>
                </div>
            </section>

            {/* 2. Keywords */}
            <section className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Keywords</h3>
                <div className="flex gap-2">
                    <Input
                        placeholder="Enter hash tags or keywords (e.g. #OOTD)"
                        value={formData.currentKeyword}
                        onChange={(e) => setFormData({ ...formData, currentKeyword: e.target.value })}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddKeyword())}
                    />
                    <Button type="button" onClick={handleAddKeyword} variant="secondary">Add</Button>
                </div>
                <div className="flex flex-wrap gap-2">
                    {formData.keywords.map((kw, i) => (
                        <span key={i} className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-800">
                            {kw}
                            <button type="button" onClick={() => removeKeyword(i)} className="text-gray-500 hover:text-red-500">
                                <X className="h-3 w-3" />
                            </button>
                        </span>
                    ))}
                </div>
            </section>

            {/* 3. Creators */}
            <section className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Target Creators</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                        placeholder="Creator Name"
                        value={formData.currentCreatorName}
                        onChange={(e) => setFormData({ ...formData, currentCreatorName: e.target.value })}
                    />
                    <div className="flex gap-2">
                        <Input
                            placeholder="Instagram Handle (e.g., @user)"
                            value={formData.currentCreatorHandle}
                            onChange={(e) => setFormData({ ...formData, currentCreatorHandle: e.target.value })}
                        />
                        <Button type="button" onClick={handleAddCreator} variant="secondary"><Plus className="h-4 w-4" /></Button>
                    </div>
                </div>
                <ul className="divide-y divide-gray-100 border rounded-md">
                    {formData.creators.length === 0 && <li className="p-4 text-sm text-gray-500 text-center">No creators added yet.</li>}
                    {formData.creators.map((creator, i) => (
                        <li key={i} className="flex items-center justify-between p-3">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-500">
                                    {creator.platform[0].toUpperCase()}
                                </div>
                                <div>
                                    <p className="font-medium text-sm">{creator.name}</p>
                                    <p className="text-xs text-gray-500">{creator.handle}</p>
                                </div>
                            </div>
                            <button type="button" onClick={() => removeCreator(i)} className="p-1 text-gray-400 hover:text-red-500">
                                <X className="h-4 w-4" />
                            </button>
                        </li>
                    ))}
                </ul>
            </section>

            <div className="flex justify-end gap-3 border-t pt-6">
                <Button type="button" variant="ghost" onClick={() => navigate('/')}>Cancel</Button>
                <Button type="submit" disabled={isLoading} className="w-32">
                    {isLoading ? 'Creating...' : 'Create Tracking'}
                </Button>
            </div>
        </form>
    );
}
