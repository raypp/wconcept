import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import type { TrackingConfig } from '../lib/types';
import { Plus, FileSearch } from 'lucide-react';

export function TrackingList() {
    const [trackings, setTrackings] = useState<TrackingConfig[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const loadTrackings = async () => {
            try {
                const data = await api.getTrackings();
                setTrackings(data);
            } catch (error) {
                console.error('Failed to load trackings', error);
            } finally {
                setIsLoading(false);
            }
        };
        loadTrackings();
    }, []);

    const getStatusBadge = (status: string) => {
        const styles = {
            active: 'bg-green-100 text-green-700',
            completed: 'bg-gray-100 text-gray-600',
            pending: 'bg-yellow-100 text-yellow-700',
        };
        const labels = {
            active: '수집 중',
            completed: '수집 완료',
            pending: '대기 중',
        };
        return (
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles] || styles.pending}`}>
                {labels[status as keyof typeof labels] || status}
            </span>
        );
    };

    const formatDate = (start: string, end: string) => {
        const formatSingle = (d: string) => {
            const date = new Date(d);
            return `${String(date.getFullYear()).slice(2)}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
        };
        return `${formatSingle(start)} ~ ${formatSingle(end)}`;
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-gray-500">로딩 중...</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-gray-900">콘텐츠 트래킹</h1>
                    <p className="text-sm text-gray-500 mt-1">등록된 트래킹 캠페인을 관리합니다.</p>
                </div>
                <button
                    onClick={() => navigate('/tracking/new')}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-800 transition-colors"
                >
                    <Plus className="h-4 w-4" />
                    새 트래킹
                </button>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-4 text-left font-medium text-gray-500">제목</th>
                            <th className="px-6 py-4 text-left font-medium text-gray-500">수집 상태</th>
                            <th className="px-6 py-4 text-right font-medium text-gray-500">콘텐츠 수</th>
                            <th className="px-6 py-4 text-left font-medium text-gray-500">콘텐츠 유형</th>
                            <th className="px-6 py-4 text-left font-medium text-gray-500">수집 기간</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {trackings.map((tracking) => (
                            <tr
                                key={tracking.id}
                                className="hover:bg-gray-50 cursor-pointer transition-colors"
                                onClick={() => navigate(`/tracking/${tracking.id}`)}
                            >
                                <td className="px-6 py-4">
                                    <span className="font-medium text-gray-900">{tracking.title}</span>
                                </td>
                                <td className="px-6 py-4">
                                    {getStatusBadge(tracking.status)}
                                </td>
                                <td className="px-6 py-4 text-right text-gray-900">
                                    {tracking.contentCount?.toLocaleString() || '-'}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-col gap-1">
                                        {tracking.contentTypes?.map((type, i) => (
                                            <span key={i} className="text-gray-600 text-xs">{type}</span>
                                        ))}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-gray-600">
                                    {formatDate(tracking.startDate, tracking.endDate)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {trackings.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                        <FileSearch className="h-12 w-12 mb-4 text-gray-300" />
                        <p>등록된 트래킹이 없습니다.</p>
                        <button
                            onClick={() => navigate('/tracking/new')}
                            className="mt-4 text-sm text-blue-600 hover:underline"
                        >
                            새 트래킹 만들기
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
