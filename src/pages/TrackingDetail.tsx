import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronDown, TrendingUp, Instagram, Youtube, Eye, Heart, Search, X, ExternalLink, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { api, MOCK_SUMMARY, MOCK_DAILY_DATA, MOCK_CREATORS, MOCK_CONTENTS } from '../lib/api';
import type { TrackingConfig } from '../lib/types';
import { MetricCard } from '../components/MetricCard';
import { MultiSelectDropdown } from '../components/MultiSelectDropdown';
import { Bar, Line, ComposedChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { ko } from 'date-fns/locale';

export function TrackingDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [tracking, setTracking] = useState<TrackingConfig | null>(null);
    const [trackings, setTrackings] = useState<TrackingConfig[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showDropdown, setShowDropdown] = useState(false);
    const [contentSort, setContentSort] = useState<{ key: string, direction: 'asc' | 'desc' }>({ key: 'views', direction: 'desc' });
    const [selectedContentTypes, setSelectedContentTypes] = useState<string[]>([]);
    const [creatorSort, setCreatorSort] = useState<{ key: string, direction: 'asc' | 'desc' }>({ key: 'avgViews', direction: 'desc' });
    const [hoveredContent, setHoveredContent] = useState<string | null>(null);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [rankingDateRange, setRankingDateRange] = useState<[Date | null, Date | null]>([null, null]);
    const [rankingStartDate, rankingEndDate] = rankingDateRange;
    const [chartMetric, setChartMetric] = useState('조회 수');
    const [isCumulativeView, setIsCumulativeView] = useState(false);
    const [activeRankingTab, setActiveRankingTab] = useState<'content' | 'creator'>('content');
    const [chartContentTypes, setChartContentTypes] = useState<string[]>([]);
    const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);
    const [startDate, endDate] = dateRange;
    const [showRisingModal, setShowRisingModal] = useState(false);
    const [selectedCreators, setSelectedCreators] = useState<string[]>([]);
    const [followerMin, setFollowerMin] = useState<number | ''>('');
    const [followerMax, setFollowerMax] = useState<number | ''>('');
    const [creatorViewMode, setCreatorViewMode] = useState<'avg' | 'sum'>('avg');
    const [showContentTypeDropdown, setShowContentTypeDropdown] = useState(false);
    const [showRankingContentTypeDropdown, setShowRankingContentTypeDropdown] = useState(false);
    const [expandedCreatorId, setExpandedCreatorId] = useState<string | null>(null);
    const [selectedContentIds, setSelectedContentIds] = useState<Set<string>>(new Set());

    const [contentPage, setContentPage] = useState(1);
    const [creatorPage, setCreatorPage] = useState(1);
    const ITEMS_PER_PAGE = 100;

    const summary = MOCK_SUMMARY;
    const chartData = MOCK_DAILY_DATA;
    const creators = MOCK_CREATORS;
    const contents = MOCK_CONTENTS;

    // Highlight contents: sorted by current metric, top 10
    const highlightContents = useMemo(() => {
        const metricKey = chartMetric === '좋아요' ? 'likes' :
            chartMetric === '댓글' ? 'comments' :
                chartMetric === '공유' ? 'shares' :
                    chartMetric === '인게이지먼트' ? 'engagement' :
                        'views';
        return [...contents]
            .sort((a, b) => (b[metricKey as keyof typeof b] as number) - (a[metricKey as keyof typeof a] as number))
            .slice(0, 10);
    }, [contents, chartMetric]);

    // Rising contents: top risingContentCount by views (급상승 = 조회수 증가율 높은 순, mock에서는 상위 N개)
    const risingContents = useMemo(() => {
        return [...contents]
            .sort((a, b) => b.views - a.views)
            .slice(0, summary.risingContentCount);
    }, [contents, summary.risingContentCount]);

    // Calculate content type breakdown
    const contentTypeStats = useMemo(() => {
        const typeCount: Record<string, number> = {};
        contents.forEach(content => {
            const type = content.type.includes('릴스') ? '릴스'
                : content.type.includes('피드') ? '피드'
                    : content.type.includes('쇼츠') ? '쇼츠'
                        : content.type.includes('영상') ? '영상'
                            : '기타';
            typeCount[type] = (typeCount[type] || 0) + 1;
        });
        const total = contents.length;
        return Object.entries(typeCount).map(([type, count]) => ({
            type,
            count,
            ratio: Math.round((count / total) * 100)
        })).sort((a, b) => b.count - a.count);
    }, [contents]);

    const handleContentSort = (key: string) => {
        setContentSort(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
        }));
    };

    const handleCreatorSort = (key: string) => {
        setCreatorSort(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
        }));
    };

    const SortIcon = ({ columnKey, currentSort }: { columnKey: string, currentSort: { key: string, direction: 'asc' | 'desc' } }) => {
        if (currentSort.key !== columnKey) return <ArrowUpDown className="w-3 h-3 ml-1 text-gray-400 inline" />;
        return currentSort.direction === 'desc' ? <ArrowDown className="w-3 h-3 ml-1 text-gray-800 inline" /> : <ArrowUp className="w-3 h-3 ml-1 text-gray-800 inline" />;
    };


    // All account names (union of content creators and creator list)
    const allCreatorNames = useMemo(() => {
        const fromContents = new Set(contents.map(c => c.creator));
        const fromCreators = new Set(creators.map(c => c.name));
        return Array.from(new Set([...fromContents, ...fromCreators])).sort();
    }, [contents, creators]);

    // Filter and Sort Contents
    const filteredAndSortedContents = useMemo(() => {
        let result = [...contents];

        // Filter by Content Date
        if (rankingStartDate && rankingEndDate) {
            result = result.filter(content => {
                const contentDate = new Date(content.uploadDate);
                // Zero out time for inclusive comparison
                const start = new Date(rankingStartDate).setHours(0, 0, 0, 0);
                const end = new Date(rankingEndDate).setHours(23, 59, 59, 999);
                return contentDate.getTime() >= start && contentDate.getTime() <= end;
            });
        }

        // Filter by Content Type
        if (selectedContentTypes.length > 0) {
            result = result.filter(content => {
                const type = content.type;
                return selectedContentTypes.some(startType => type.includes(startType.split('(')[0]));
            });
        }

        // Filter by Creator
        if (selectedCreators.length > 0) {
            result = result.filter(content => selectedCreators.includes(content.creator));
        }

        // Filter by Follower range
        if (followerMin !== '') {
            result = result.filter(c => c.followers >= (followerMin as number));
        }
        if (followerMax !== '') {
            result = result.filter(c => c.followers <= (followerMax as number));
        }

        // Sort
        result.sort((a, b) => {
            let aVal: any = a[contentSort.key as keyof typeof a];
            let bVal: any = b[contentSort.key as keyof typeof b];

            if (contentSort.key === 'uploadDate') {
                aVal = new Date(a.uploadDate).getTime();
                bVal = new Date(b.uploadDate).getTime();
            }

            if (aVal === bVal) return 0;
            const modifier = contentSort.direction === 'desc' ? -1 : 1;
            return (aVal > bVal ? 1 : -1) * modifier;
        });

        return result;
    }, [contents, contentSort, selectedContentTypes, selectedCreators, followerMin, followerMax, rankingStartDate, rankingEndDate]);

    // Paginated Contents
    const paginatedContents = useMemo(() => {
        const start = (contentPage - 1) * ITEMS_PER_PAGE;
        return filteredAndSortedContents.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredAndSortedContents, contentPage]);

    const totalContentPages = Math.ceil(filteredAndSortedContents.length / ITEMS_PER_PAGE);

    // Sort Creators (with optional filter)
    const sortedCreators = useMemo(() => {
        let result = [...creators];

        // Filter by creator name
        if (selectedCreators.length > 0) {
            result = result.filter(c => selectedCreators.includes(c.name));
        }

        // Filter by content type (creator has matching content type)
        if (selectedContentTypes.length > 0) {
            result = result.filter(c =>
                c.contentTypes?.some(ct =>
                    selectedContentTypes.some(st => ct.includes(st.split('(')[0]) || st.includes(ct))
                )
            );
        }

        // Filter by follower range
        if (followerMin !== '') {
            result = result.filter(c => c.followers >= (followerMin as number));
        }
        if (followerMax !== '') {
            result = result.filter(c => c.followers <= (followerMax as number));
        }

        result.sort((a, b) => {
            const getVal = (c: typeof creators[0]) => {
                if (creatorSort.key === 'followers') return c.followers;
                if (creatorSort.key === 'contentCount') return c.contentCount || 0;
                if (creatorSort.key === 'name') return c.name;

                const count = c.contentCount || 1;
                const avgVal = (c[creatorSort.key as keyof typeof c] as number) || 0;
                return creatorViewMode === 'avg' ? avgVal : avgVal * count;
            };

            const aVal = getVal(a);
            const bVal = getVal(b);

            if (aVal === bVal) return 0;
            const modifier = creatorSort.direction === 'desc' ? -1 : 1;
            return (aVal > bVal ? 1 : -1) * modifier;
        });
        return result;
    }, [creators, creatorSort, selectedCreators, selectedContentTypes, followerMin, followerMax, creatorViewMode]);

    // Paginated Creators
    const paginatedCreators = useMemo(() => {
        const start = (creatorPage - 1) * ITEMS_PER_PAGE;
        return sortedCreators.slice(start, start + ITEMS_PER_PAGE);
    }, [sortedCreators, creatorPage]);

    const totalCreatorPages = Math.ceil(sortedCreators.length / ITEMS_PER_PAGE);

    // Calculate total stats for new section
    const totalStats = useMemo(() => {
        return contents.reduce((acc, content) => {
            const engagement = (content.likes || 0) + (content.comments || 0) + (content.shares || 0) + (content.saves || 0);
            return {
                likes: acc.likes + (content.likes || 0),
                comments: acc.comments + (content.comments || 0),
                views: acc.views + (content.views || 0),
                shares: acc.shares + (content.shares || 0),
                engagement: acc.engagement + engagement
            };
        }, { likes: 0, comments: 0, views: 0, shares: 0, engagement: 0 });
    }, [contents]);

    // Calculate cumulative data
    const cumulativeData = useMemo(() => {
        let cumViews = 0, cumLikes = 0, cumComments = 0, cumShares = 0, cumEngagement = 0, cumUploads = 0;
        return chartData.map(entry => {
            cumViews += entry.views;
            cumLikes += entry.likes;
            cumComments += entry.comments;
            cumShares += entry.shares ?? 0;
            cumEngagement += entry.engagement;
            cumUploads += entry.uploads;
            return {
                date: entry.date,
                views: cumViews,
                likes: cumLikes,
                comments: cumComments,
                shares: cumShares,
                engagement: cumEngagement,
                uploads: cumUploads,
            };
        });
    }, [chartData]);

    const handleBarClick = (data: any) => {
        // data is the entry object directly when clicked on Bar/Cell
        if (data && data.date) {
            const date = data.date;
            setSelectedDate(prev => prev === date ? null : date);
        }
    };

    // Custom Tooltip Component
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (!active || !payload || !payload.length) return null;

        const currentData = payload[0].payload;
        const metricKey = chartMetric === '좋아요' ? 'likes' :
            chartMetric === '댓글' ? 'comments' :
                chartMetric === '공유' ? 'shares' :
                    chartMetric === '인게이지먼트' ? 'engagement' : 'views';
        const currentValue = currentData[metricKey];

        // Find previous day's data
        const dataSource = isCumulativeView ? cumulativeData : chartData;
        const currentIndex = dataSource.findIndex((d: any) => d.date === label);
        const prevData = currentIndex > 0 ? dataSource[currentIndex - 1] : null;
        const prevValue = prevData ? prevData[metricKey] : null;

        // Calculate % change
        let changePercent: number | null = null;
        let isIncrease = true;
        if (prevValue !== null && prevValue !== 0) {
            changePercent = ((currentValue - prevValue) / prevValue) * 100;
            isIncrease = changePercent >= 0;
        }

        // Get upload counts
        const dailyEntry = chartData.find((d: any) => d.date === label);
        const cumEntry = cumulativeData.find((d: any) => d.date === label);
        const newUploads = dailyEntry ? dailyEntry.uploads : 0;
        const totalUploads = cumEntry ? cumEntry.uploads : 0;

        // Format date as yyyy-mm-dd
        const [month, day] = label.split('-');
        const formattedDate = `2025-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;

        return (
            <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-100">
                <div className="text-sm font-medium text-gray-900 mb-1">
                    {formattedDate}
                </div>
                <div className="text-sm font-medium text-gray-900 mb-1">
                    {chartMetric}: {currentValue.toLocaleString()}
                </div>
                <div className="text-xs text-gray-600 mb-1">
                    집계 콘텐츠 수: {totalUploads} (신규:{newUploads})
                </div>
                {changePercent !== null && (
                    <div className={`text-xs ${isIncrease ? 'text-red-500' : 'text-blue-500'}`}>
                        전일 대비 {Math.abs(changePercent).toFixed(1)}% {isIncrease ? '상승▲' : '하락▼'}
                    </div>
                )}
            </div>
        );
    };


    useEffect(() => {
        const loadData = async () => {
            try {
                const [trackingData, allTrackings] = await Promise.all([
                    api.getTrackingById(id || ''),
                    api.getTrackings()
                ]);
                setTracking(trackingData || null);
                setTrackings(allTrackings);
            } catch (error) {
                console.error('Failed to load tracking', error);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, [id]);

    if (isLoading) {
        return <div className="flex items-center justify-center h-64 text-gray-500">로딩 중...</div>;
    }

    if (!tracking) {
        return <div className="flex items-center justify-center h-64 text-gray-500">트래킹을 찾을 수 없습니다.</div>;
    }

    const contentTypeOptions = ['전체', '인스타그램 피드', '인스타그램 릴스', '유튜브 영상(롱폼)', '유튜브 쇼츠'];

    const getPlatformIcon = (platform: string) => {
        if (platform.includes('인스타그램')) {
            return <Instagram className="h-3.5 w-3.5 text-pink-500" />;
        }
        return <Youtube className="h-3.5 w-3.5 text-red-500" />;
    };

    const getContentTypeBadge = (type: string) => {
        const colors: Record<string, string> = {
            '인스타그램 피드': 'bg-pink-100 text-pink-700',
            '인스타그램 릴스': 'bg-purple-100 text-purple-700',
            '유튜브 영상(롱폼)': 'bg-red-100 text-red-700',
            '유튜브 쇼츠': 'bg-orange-100 text-orange-700',
        };
        return (
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[type] || 'bg-gray-100 text-gray-600'}`}>
                {type}
            </span>
        );
    };

    return (
        <div className="space-y-8">
            {/* Header with Dropdown Navigation */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/tracking')}
                    className="text-sm text-gray-500 hover:text-gray-700"
                >
                    콘텐츠 트래킹
                </button>
                <span className="text-gray-300">/</span>
                <div className="relative">
                    <button
                        onClick={() => setShowDropdown(!showDropdown)}
                        className="flex items-center gap-2 px-4 py-2 bg-white border rounded-lg text-sm font-medium hover:bg-gray-50"
                    >
                        {tracking.title}
                        <ChevronDown className="h-4 w-4 text-gray-400" />
                    </button>
                    {showDropdown && (
                        <div className="absolute top-full left-0 mt-1 w-64 bg-white border rounded-lg shadow-lg z-10">
                            {trackings.map((t) => (
                                <button
                                    key={t.id}
                                    onClick={() => {
                                        navigate(`/tracking/${t.id}`);
                                        setShowDropdown(false);
                                    }}
                                    className={`w-full px-4 py-3 text-left text-sm hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg ${t.id === id ? 'bg-gray-50 font-medium' : ''
                                        }`}
                                >
                                    {t.title}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* 현황 Section */}
            <section className="bg-white rounded-lg border p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold text-gray-900">현황</h2>
                </div>
                <div className="grid grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-500 mb-1">참여 크리에이터 수</p>
                        <p className="text-2xl font-bold text-gray-900">{summary.creatorCount}<span className="text-sm font-normal">명</span></p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-500 mb-1">수집 기간</p>
                        <p className="text-sm font-medium text-gray-900">{summary.collectionPeriod}</p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-500 mb-1">콘텐츠 수</p>
                        <p className="text-2xl font-bold text-gray-900">{summary.contentCount}<span className="text-sm font-normal">개</span></p>
                    </div>
                    <div
                        className="text-center p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-green-50 transition-colors group relative"
                        onClick={() => setShowRisingModal(true)}
                    >
                        <div className="flex items-center justify-center gap-1 mb-1">
                            <p className="text-xs text-gray-500">급상승 콘텐츠 수</p>
                        </div>
                        <div className="flex items-center justify-center gap-1">
                            <TrendingUp className="h-4 w-4 text-green-500" />
                            <p className="text-2xl font-bold text-gray-900">{summary.risingContentCount}<span className="text-sm font-normal">개</span></p>
                            <Search className="h-3.5 w-3.5 text-gray-400 group-hover:text-green-600 transition-colors" />
                        </div>
                    </div>
                </div>
            </section>

            {/* 콘텐츠 성과 요약 Section */}
            <section className="bg-white rounded-lg border p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-6">콘텐츠 성과 요약</h2>

                {/* 콘텐츠당 유형 비율 */}
                <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-4">콘텐츠당 유형 비율</h3>
                    <div className="flex items-center gap-6">
                        {contentTypeStats.map((stat) => (
                            <div key={stat.type} className="flex items-center gap-3">
                                <div className="flex items-center gap-2">
                                    <span className={`w-3 h-3 rounded-full ${stat.type === '릴스' ? 'bg-pink-500' :
                                        stat.type === '피드' ? 'bg-blue-500' :
                                            stat.type === '쇼츠' ? 'bg-red-500' :
                                                stat.type === '영상' ? 'bg-purple-500' :
                                                    'bg-gray-400'
                                        }`}></span>
                                    <span className="text-sm font-medium text-gray-900">{stat.type}</span>
                                </div>
                                <span className="text-sm text-gray-500">{stat.count}개</span>
                                <span className="text-sm font-bold text-gray-900">{stat.ratio}%</span>
                            </div>
                        ))}
                    </div>
                    {/* Progress bar */}
                    <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden flex">
                        {contentTypeStats.map((stat) => (
                            <div
                                key={stat.type}
                                className={`h-full ${stat.type === '릴스' ? 'bg-pink-500' :
                                    stat.type === '피드' ? 'bg-blue-500' :
                                        stat.type === '쇼츠' ? 'bg-red-500' :
                                            stat.type === '영상' ? 'bg-purple-500' :
                                                'bg-gray-400'
                                    }`}
                                style={{ width: `${stat.ratio}%` }}
                            ></div>
                        ))}
                    </div>
                </div>

                {/* 평균 성과 */}
                <div className="mt-8">
                    <h3 className="text-sm font-medium text-gray-700 mb-4">평균 성과</h3>
                    <div className="grid grid-cols-5 gap-4">
                        <MetricCard label="평균 조회 수" value={summary.avgViews.toLocaleString()} unit="회" />
                        <MetricCard label="평균 좋아요 수" value={summary.avgLikes.toLocaleString()} unit="개" />
                        <MetricCard label="평균 댓글 수" value={summary.avgComments.toLocaleString()} unit="개" />
                        <MetricCard label="평균 공유 수" value={summary.avgShares.toLocaleString()} unit="회" />
                        <MetricCard label="평균 인게이지먼트" value={summary.avgEngagement.toLocaleString()} unit="개" />
                    </div>
                </div>

                {/* 누적 성과 */}
                <div className="mt-8">
                    <h3 className="text-sm font-medium text-gray-700 mb-4">누적 성과</h3>
                    <div className="grid grid-cols-5 gap-4">
                        <MetricCard label="총 조회 수" value={totalStats.views.toLocaleString()} unit="회" />
                        <MetricCard label="총 좋아요 수" value={totalStats.likes.toLocaleString()} unit="개" />
                        <MetricCard label="총 댓글 수" value={totalStats.comments.toLocaleString()} unit="개" />
                        <MetricCard label="총 공유 수" value={totalStats.shares.toLocaleString()} unit="회" />
                        <MetricCard label="총 인게이지먼트" value={totalStats.engagement.toLocaleString()} unit="개" />
                    </div>
                </div>
            </section>

            {/* 콘텐츠 성과 추이 Section */}
            <section className="bg-white rounded-lg border p-6">
                <div className="flex items-center justify-between mb-2">
                    <h2 className="text-lg font-bold text-gray-900">콘텐츠 성과 추이</h2>
                    <a
                        href="https://featuring.co"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors"
                    >
                        콘텐츠별 상세 트래킹 바로가기(피처링)
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                    </a>
                </div>
                <p className="text-sm text-gray-500 mb-6">
                    참여 크리에이터들이 수집 기간 내 발행한 콘텐츠의 일별 성과 데이터를 확인할 수 있습니다.
                </p>

                {/* Chart Controls */}
                <div className="mb-4">
                    {/* Compact single-row filter bar */}
                    <div className="flex items-center justify-between mb-4 gap-3">
                        {/* Left side: Date range + Content type dropdown */}
                        <div className="flex items-center gap-2">
                            {/* Date Range Picker */}
                            <div className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg bg-white hover:border-gray-300 transition-colors">
                                <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <DatePicker
                                    selectsRange={true}
                                    startDate={startDate}
                                    endDate={endDate}
                                    onChange={(update) => setDateRange(update as [Date | null, Date | null])}
                                    locale={ko}
                                    dateFormat="yyyy.MM.dd"
                                    className="text-xs text-gray-700 bg-transparent w-40 focus:outline-none cursor-pointer"
                                    placeholderText="기간 선택"
                                />
                            </div>

                            {/* Divider */}
                            <div className="w-px h-5 bg-gray-200" />

                            {/* Content Type Dropdown */}
                            <div className="relative">
                                <button
                                    onClick={() => setShowContentTypeDropdown(prev => !prev)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg bg-white hover:border-gray-300 transition-colors text-xs text-gray-700"
                                >
                                    <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                                    </svg>
                                    <span>콘텐츠 타입: </span>
                                    <span className="font-medium">
                                        {chartContentTypes.length === 0 ? '전체' : chartContentTypes.length === 1
                                            ? (chartContentTypes[0].includes('릴스') ? '릴스' : chartContentTypes[0].includes('피드') ? '피드' : chartContentTypes[0].includes('쇼츠') ? '쇼츠' : '영상')
                                            : `${chartContentTypes.length}개 선택`}
                                    </span>
                                    <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                                </button>
                                {showContentTypeDropdown && (
                                    <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 w-48 py-1">
                                        <button
                                            onClick={() => { setChartContentTypes([]); setShowContentTypeDropdown(false); }}
                                            className={`w-full px-3 py-2 text-left text-xs hover:bg-gray-50 transition-colors ${chartContentTypes.length === 0 ? 'font-medium text-gray-900' : 'text-gray-600'}`}
                                        >
                                            전체
                                        </button>
                                        {['인스타그램 피드', '인스타그램 릴스', '유튜브 영상(롱폼)', '유튜브 쇼츠'].map((type) => {
                                            const isSelected = chartContentTypes.includes(type);
                                            return (
                                                <button
                                                    key={type}
                                                    onClick={() => {
                                                        setChartContentTypes(prev =>
                                                            prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
                                                        );
                                                    }}
                                                    className="w-full px-3 py-2 text-left text-xs hover:bg-gray-50 transition-colors flex items-center justify-between"
                                                >
                                                    <span className={isSelected ? 'font-medium text-gray-900' : 'text-gray-600'}>{type}</span>
                                                    {isSelected && (
                                                        <svg className="w-3.5 h-3.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right side: 일간/누적 toggle + Metric toggle */}
                        <div className="flex items-center gap-2">
                            {/* 일간 / 누적 toggle */}
                            <div className="flex bg-gray-100 p-0.5 rounded-lg">
                                <button
                                    onClick={() => setIsCumulativeView(false)}
                                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${!isCumulativeView
                                        ? 'bg-white text-gray-900 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    일별 집계
                                </button>
                                <button
                                    onClick={() => setIsCumulativeView(true)}
                                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${isCumulativeView
                                        ? 'bg-white text-gray-900 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    누적 집계
                                </button>
                            </div>

                            {/* Metric Toggle */}
                            <div className="flex bg-gray-100 p-0.5 rounded-lg">
                                {['조회수', '좋아요', '댓글', '공유'].map((label) => {
                                    const metricKey = label === '조회수' ? '조회 수' : label;
                                    return (
                                        <button
                                            key={label}
                                            onClick={() => setChartMetric(metricKey)}
                                            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${chartMetric === metricKey
                                                ? 'bg-white text-gray-900 shadow-sm'
                                                : 'text-gray-500 hover:text-gray-700'
                                                }`}
                                        >
                                            {label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                    <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            {isCumulativeView ? (
                                <ComposedChart
                                    data={cumulativeData}
                                    margin={{ top: 10, right: 30, left: 0, bottom: 5 }}
                                >
                                    <XAxis
                                        dataKey="date"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#9ca3af', fontSize: 11 }}
                                    />
                                    <YAxis
                                        yAxisId="left"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#9ca3af', fontSize: 11 }}
                                        orientation="right"
                                    />

                                    <Tooltip
                                        content={<CustomTooltip />}
                                        cursor={{ fill: 'transparent' }}
                                    />
                                    <Line
                                        yAxisId="left"
                                        type="monotone"
                                        dataKey={
                                            chartMetric === '좋아요' ? 'likes' :
                                                chartMetric === '댓글' ? 'comments' :
                                                    chartMetric === '공유' ? 'shares' :
                                                        chartMetric === '인게이지먼트' ? 'engagement' :
                                                            'views'
                                        }
                                        stroke="#ff5452"
                                        strokeWidth={2}
                                        dot={{ fill: '#ff5452', strokeWidth: 2, r: 4 }}
                                        activeDot={{ r: 6, fill: '#E11D48' }}
                                    />

                                </ComposedChart>
                            ) : (
                                <ComposedChart
                                    data={chartData}
                                    margin={{ top: 10, right: 30, left: 0, bottom: 5 }}
                                >
                                    <XAxis
                                        dataKey="date"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#9ca3af', fontSize: 11 }}
                                    />
                                    <YAxis
                                        yAxisId="left"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#9ca3af', fontSize: 11 }}
                                        orientation="right"
                                    />

                                    <Tooltip
                                        content={<CustomTooltip />}
                                        cursor={{ fill: 'transparent' }}
                                    />
                                    <Bar
                                        yAxisId="left"
                                        dataKey={
                                            chartMetric === '좋아요' ? 'likes' :
                                                chartMetric === '댓글' ? 'comments' :
                                                    chartMetric === '공유' ? 'shares' :
                                                        chartMetric === '인게이지먼트' ? 'engagement' :
                                                            'views'
                                        }
                                        radius={[4, 4, 0, 0]}
                                        barSize={32}
                                        cursor="pointer"
                                        onClick={handleBarClick}
                                    >
                                        {chartData.map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={selectedDate === entry.date ? '#E11D48' : '#ff5452'}
                                                opacity={selectedDate && selectedDate !== entry.date ? 0.3 : 1}
                                            />
                                        ))}
                                    </Bar>

                                </ComposedChart>
                            )}
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Highlight Contents List */}
                <div className="mt-6 pt-6 border-t">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold text-gray-900">
                            {selectedDate ? `${selectedDate} 하이라이트` : '하이라이트(전체 기간 중)'} <span className="text-gray-400 font-normal">Top 10 ({chartMetric} 순)</span>
                        </h3>
                        {selectedDate && (
                            <button
                                onClick={() => setSelectedDate(null)}
                                className="text-xs text-gray-400 hover:text-gray-600"
                            >
                                전체 보기
                            </button>
                        )}
                    </div>

                    <div className="flex gap-3 overflow-x-auto pb-4" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                        <style>{`
                            .scrollbar-hide::-webkit-scrollbar {
                                display: none;
                            }
                        `}</style>
                        {highlightContents.map((content, index) => (
                            <div
                                key={content.id}
                                className="flex-shrink-0 w-36 bg-white border rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                                onClick={() => window.open(content.url, '_blank')}
                            >
                                <div className="p-2 border-b flex items-center gap-1.5">
                                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-pink-300 to-orange-200 flex items-center justify-center text-white text-[8px] font-bold flex-shrink-0">
                                        {content.creator.charAt(0).toUpperCase()}
                                    </div>
                                    <span className="text-[10px] font-medium text-gray-900 truncate">
                                        {content.creator}
                                    </span>
                                </div>

                                <div className="relative aspect-square bg-gray-100">
                                    <img
                                        src={content.thumbnail}
                                        alt=""
                                        className="w-full h-full object-cover"
                                    />
                                    {/* Rank Badge */}
                                    <div className="absolute top-1 left-1">
                                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${index < 3 ? 'bg-yellow-400 text-yellow-900' : 'bg-gray-700 text-white'}`}>
                                            {index + 1}등
                                        </span>
                                    </div>
                                    <div className="absolute bottom-1 right-1">
                                        <span className="px-1 py-0.5 rounded text-[8px] font-medium bg-black/60 text-white">
                                            {content.type.includes('릴스') ? '릴스' : content.type.includes('피드') ? '피드' : content.type.includes('쇼츠') ? '쇼츠' : '영상'}
                                        </span>
                                    </div>
                                </div>

                                <div className="p-2">
                                    <p className="text-[9px] text-gray-500 mb-0.5">
                                        {content.type.includes('릴스') ? '인스타그램 릴스' : content.type.includes('피드') ? '인스타그램 피드' : content.type.includes('쇼츠') ? '유튜브 쇼츠' : '유튜브 영상'}
                                    </p>
                                    <p className="text-[10px] text-gray-700 line-clamp-2 leading-tight">
                                        {content.description}
                                    </p>
                                    <p className="text-[9px] text-gray-400 mt-1">{content.uploadDate}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 랭킹 Section with Tabs */}
            <section className="bg-white rounded-lg border p-6">
                {/* ────────────────────────────────────────────
                    공통 필터 (탭 위)
                ──────────────────────────────────────────── */}
                <div className="mb-6 space-y-3">
                    <h2 className="text-base font-bold text-gray-900">랭킹</h2>
                    <p className="text-xs text-gray-500">발행된 콘텐츠와 크리에이터 랭킹을 한 눈에 볼 수 있습니다.</p>

                    {/* 공통 필터 — 한 줄 compact */}
                    <div className="flex items-center gap-2 flex-wrap">
                        {/* 기간 */}
                        <div className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg bg-white hover:border-gray-300 transition-colors">
                            <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <DatePicker
                                selectsRange={true}
                                startDate={rankingStartDate}
                                endDate={rankingEndDate}
                                onChange={(update) => {
                                    setRankingDateRange(update as [Date | null, Date | null]);
                                    setContentPage(1);
                                    setCreatorPage(1);
                                }}
                                locale={ko}
                                dateFormat="yyyy.MM.dd"
                                className="text-xs text-gray-700 bg-transparent w-40 focus:outline-none cursor-pointer"
                                placeholderText="전체 기간"
                            />
                        </div>

                        <div className="w-px h-5 bg-gray-200" />

                        {/* 콘텐츠 유형 드롭다운 */}
                        <div className="relative">
                            <button
                                onClick={() => setShowRankingContentTypeDropdown(prev => !prev)}
                                className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg bg-white hover:border-gray-300 transition-colors text-xs text-gray-700"
                            >
                                <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                                </svg>
                                <span>콘텐츠 타입: </span>
                                <span className="font-medium">
                                    {selectedContentTypes.length === 0 ? '전체' : `${selectedContentTypes.length}개 선택`}
                                </span>
                                <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                            </button>
                            {showRankingContentTypeDropdown && (
                                <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 w-52 py-1">
                                    <button
                                        onClick={() => { setSelectedContentTypes([]); setContentPage(1); setCreatorPage(1); setShowRankingContentTypeDropdown(false); }}
                                        className={`w-full px-3 py-2 text-left text-xs hover:bg-gray-50 transition-colors ${selectedContentTypes.length === 0 ? 'font-medium text-gray-900' : 'text-gray-600'}`}
                                    >
                                        전체
                                    </button>
                                    {contentTypeOptions.slice(1).map((type) => {
                                        const isSelected = selectedContentTypes.includes(type);
                                        return (
                                            <button
                                                key={type}
                                                onClick={() => {
                                                    setSelectedContentTypes(prev =>
                                                        prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
                                                    );
                                                    setContentPage(1); setCreatorPage(1);
                                                }}
                                                className="w-full px-3 py-2 text-left text-xs hover:bg-gray-50 transition-colors flex items-center justify-between"
                                            >
                                                <span className={isSelected ? 'font-medium text-gray-900' : 'text-gray-600'}>{type}</span>
                                                {isSelected && (
                                                    <svg className="w-3.5 h-3.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        <div className="w-px h-5 bg-gray-200" />

                        {/* 팔로워 수 */}
                        <div className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg bg-white hover:border-gray-300 transition-colors">
                            <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span className="text-xs text-gray-500 whitespace-nowrap">팔로워</span>
                            <input
                                type="number"
                                placeholder="최솟값"
                                value={followerMin}
                                onChange={(e) => { setFollowerMin(e.target.value === '' ? '' : Number(e.target.value)); setContentPage(1); setCreatorPage(1); }}
                                className="w-20 text-xs text-gray-700 bg-transparent border-none focus:outline-none placeholder-gray-300"
                            />
                            <span className="text-xs text-gray-300">~</span>
                            <input
                                type="number"
                                placeholder="최댓값"
                                value={followerMax}
                                onChange={(e) => { setFollowerMax(e.target.value === '' ? '' : Number(e.target.value)); setContentPage(1); setCreatorPage(1); }}
                                className="w-20 text-xs text-gray-700 bg-transparent border-none focus:outline-none placeholder-gray-300"
                            />
                            {(followerMin !== '' || followerMax !== '') && (
                                <button onClick={() => { setFollowerMin(''); setFollowerMax(''); }} className="text-gray-300 hover:text-gray-500 transition-colors">
                                    <X className="w-3 h-3" />
                                </button>
                            )}
                        </div>

                        <div className="w-px h-5 bg-gray-200" />

                        {/* 계정/채널 */}
                        <MultiSelectDropdown
                            label="계정/채널"
                            options={allCreatorNames}
                            selected={selectedCreators}
                            onChange={(v) => { setSelectedCreators(v); setContentPage(1); setCreatorPage(1); }}
                        />
                    </div>
                </div>

                {/* 탭 헤더 */}
                <div className="border-b mb-6">
                    <div className="flex gap-6">
                        <button
                            onClick={() => setActiveRankingTab('content')}
                            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeRankingTab === 'content'
                                ? 'border-gray-900 text-gray-900'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            콘텐츠 랭킹
                        </button>
                        <button
                            onClick={() => setActiveRankingTab('creator')}
                            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeRankingTab === 'creator'
                                ? 'border-gray-900 text-gray-900'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            크리에이터 랭킹
                        </button>
                    </div>
                </div>

                {/* 콘텐츠 랭킹 탭 */}
                {activeRankingTab === 'content' && (
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-medium text-gray-700">
                                전체 콘텐츠 랭킹 Top {filteredAndSortedContents.length}
                                {selectedContentIds.size > 0 && (
                                    <span className="ml-2 text-xs text-blue-600 font-normal">{selectedContentIds.size}개 선택됨</span>
                                )}
                            </h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm min-w-[1000px]">
                                <thead className="bg-gray-50 text-gray-500 text-xs">
                                    <tr>
                                        {/* 전체 선택 체크박스 */}
                                        <th className="px-3 py-3 w-10">
                                            <input
                                                type="checkbox"
                                                className="rounded border-gray-300 cursor-pointer"
                                                checked={selectedContentIds.size === paginatedContents.length && paginatedContents.length > 0}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setSelectedContentIds(new Set(paginatedContents.map(c => c.id)));
                                                    } else {
                                                        setSelectedContentIds(new Set());
                                                    }
                                                }}
                                            />
                                        </th>
                                        <th className="px-3 py-3 text-center font-medium w-10">No.</th>
                                        <th className="px-3 py-3 text-left font-medium min-w-[260px] cursor-pointer" onClick={() => handleContentSort('uploadDate')}>콘텐츠 <SortIcon columnKey="uploadDate" currentSort={contentSort} /></th>
                                        <th className="px-3 py-3 text-left font-medium min-w-[160px] cursor-pointer" onClick={() => handleContentSort('creator')}>계정/채널 <SortIcon columnKey="creator" currentSort={contentSort} /></th>
                                        <th className="px-3 py-3 text-right font-medium w-24 cursor-pointer" onClick={() => handleContentSort('followers')}>팔로워 수 <SortIcon columnKey="followers" currentSort={contentSort} /></th>
                                        <th className="px-3 py-3 text-right font-medium w-20 cursor-pointer" onClick={() => handleContentSort('views')}>조회 수 <SortIcon columnKey="views" currentSort={contentSort} /></th>
                                        <th className="px-3 py-3 text-right font-medium w-20 cursor-pointer" onClick={() => handleContentSort('likes')}>좋아요 수 <SortIcon columnKey="likes" currentSort={contentSort} /></th>
                                        <th className="px-3 py-3 text-right font-medium w-16 cursor-pointer" onClick={() => handleContentSort('comments')}>댓글 수 <SortIcon columnKey="comments" currentSort={contentSort} /></th>
                                        <th className="px-3 py-3 text-right font-medium w-16 cursor-pointer" onClick={() => handleContentSort('shares')}>공유 수 <SortIcon columnKey="shares" currentSort={contentSort} /></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {paginatedContents.map((content, index) => {
                                        const isChecked = selectedContentIds.has(content.id);
                                        return (
                                            <tr
                                                key={content.id}
                                                className={`hover:bg-gray-50 transition-colors ${isChecked ? 'bg-blue-50/30' : ''}`}
                                            >
                                                {/* 체크박스 */}
                                                <td className="px-3 py-4">
                                                    <input
                                                        type="checkbox"
                                                        className="rounded border-gray-300 cursor-pointer"
                                                        checked={isChecked}
                                                        onChange={(e) => {
                                                            const next = new Set(selectedContentIds);
                                                            e.target.checked ? next.add(content.id) : next.delete(content.id);
                                                            setSelectedContentIds(next);
                                                        }}
                                                    />
                                                </td>
                                                {/* 번호 */}
                                                <td className="px-3 py-4 text-center text-gray-500 text-xs font-medium">
                                                    {(contentPage - 1) * ITEMS_PER_PAGE + index + 1}
                                                </td>
                                                {/* 콘텐츠: 플랫폼 아이콘 + 썸네일 + 제목 + 날짜 */}
                                                <td className="px-3 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="relative flex-shrink-0">
                                                            <div className="w-14 h-14 rounded-lg overflow-hidden bg-gray-100">
                                                                <img src={content.thumbnail} alt="썸네일" className="w-full h-full object-cover" />
                                                            </div>
                                                            {/* 플랫폼 아이콘 — 썸네일 위 좌상단 */}
                                                            <div className="absolute -top-1 -left-1 bg-white rounded-full shadow p-0.5">
                                                                {getPlatformIcon(content.type)}
                                                            </div>
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div
                                                                className="text-xs text-gray-800 font-medium truncate max-w-[200px] cursor-help leading-snug"
                                                                onMouseEnter={() => setHoveredContent(content.id)}
                                                                onMouseLeave={() => setHoveredContent(null)}
                                                            >
                                                                {content.description}
                                                            </div>
                                                            <div className="text-xs text-gray-400 mt-1">{content.uploadDate}</div>
                                                            {hoveredContent === content.id && (
                                                                <div className="absolute z-20 bg-gray-900 text-white text-xs p-3 rounded-lg shadow-lg max-w-xs whitespace-pre-wrap mt-1">
                                                                    {content.description}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                {/* 계정/채널: 아바타 + 이름 + 핸들 */}
                                                <td className="px-3 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-pink-300 to-orange-200 flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                                                            {content.creator.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="flex items-center gap-1">
                                                                <span className="text-xs font-medium text-gray-900 truncate">{content.creator}</span>
                                                                {getPlatformIcon(content.type)}
                                                            </div>
                                                            <p className="text-xs text-gray-400 truncate">@{content.creator}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                {/* 지표 */}
                                                <td className="px-3 py-4 text-right text-xs text-gray-700">{content.followers.toLocaleString()}</td>
                                                <td className="px-3 py-4 text-right text-xs font-medium text-gray-900">{content.views.toLocaleString()}</td>
                                                <td className="px-3 py-4 text-right text-xs text-gray-700">{content.likes.toLocaleString()}</td>
                                                <td className="px-3 py-4 text-right text-xs text-gray-600">{content.comments.toLocaleString()}</td>
                                                <td className="px-3 py-4 text-right text-xs text-gray-500">{(content.shares ?? 0).toLocaleString()}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        {totalContentPages > 1 && (
                            <div className="flex justify-center mt-6 gap-2">
                                <button onClick={() => setContentPage(p => Math.max(1, p - 1))} disabled={contentPage === 1} className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50">이전</button>
                                <span className="px-3 py-1 text-sm flex items-center">{contentPage} / {totalContentPages}</span>
                                <button onClick={() => setContentPage(p => Math.min(totalContentPages, p + 1))} disabled={contentPage === totalContentPages} className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50">다음</button>
                            </div>
                        )}
                    </div>
                )}

                {/* 크리에이터 랭킹 탭 */}
                {activeRankingTab === 'creator' && (
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-medium text-gray-700">전체 크리에이터 랭킹 Top {sortedCreators.length}</h3>
                            <div className="flex items-center gap-2">
                                {/* 평균/누적 토글 — 항상 표시 */}
                                <div className="flex bg-gray-100 p-0.5 rounded-lg">
                                    <button
                                        onClick={() => setCreatorViewMode('avg')}
                                        className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${creatorViewMode === 'avg' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                    >
                                        평균
                                    </button>
                                    <button
                                        onClick={() => setCreatorViewMode('sum')}
                                        className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${creatorViewMode === 'sum' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                    >
                                        누적
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm min-w-[1000px]">
                                <thead className="bg-gray-50 text-gray-500">
                                    <tr>
                                        <th className="px-3 py-3 text-center font-medium w-10"></th>
                                        <th className="px-3 py-3 text-center font-medium w-12">순위</th>
                                        <th className="px-3 py-3 text-left font-medium min-w-[200px] cursor-pointer" onClick={() => handleCreatorSort('name')}>계정/채널 <SortIcon columnKey="name" currentSort={creatorSort} /></th>
                                        <th className="px-3 py-3 text-right font-medium w-20 cursor-pointer" onClick={() => handleCreatorSort('followers')}>팔로워 <SortIcon columnKey="followers" currentSort={creatorSort} /></th>
                                        <th className="px-3 py-3 text-right font-medium w-16 cursor-pointer" onClick={() => handleCreatorSort('contentCount')}>콘텐츠 <SortIcon columnKey="contentCount" currentSort={creatorSort} /></th>
                                        <th className="px-3 py-3 text-left font-medium w-24">유형</th>
                                        <th className="px-3 py-3 text-right font-medium w-24 cursor-pointer" onClick={() => handleCreatorSort('avgViews')}>
                                            {creatorViewMode === 'avg' ? '평균 ' : '누적 '}조회 <SortIcon columnKey="avgViews" currentSort={creatorSort} />
                                        </th>
                                        <th className="px-3 py-3 text-right font-medium w-24 cursor-pointer" onClick={() => handleCreatorSort('avgLikes')}>
                                            {creatorViewMode === 'avg' ? '평균 ' : '누적 '}좋아요 <SortIcon columnKey="avgLikes" currentSort={creatorSort} />
                                        </th>
                                        <th className="px-3 py-3 text-right font-medium w-20 cursor-pointer" onClick={() => handleCreatorSort('avgComments')}>
                                            {creatorViewMode === 'avg' ? '평균 ' : '누적 '}댓글 <SortIcon columnKey="avgComments" currentSort={creatorSort} />
                                        </th>
                                        <th className="px-3 py-3 text-right font-medium w-20 cursor-pointer" onClick={() => handleCreatorSort('avgShares')}>
                                            {creatorViewMode === 'avg' ? '평균 ' : '누적 '}공유 <SortIcon columnKey="avgShares" currentSort={creatorSort} />
                                        </th>
                                        <th className="px-3 py-3 text-right font-medium w-28 cursor-pointer" onClick={() => handleCreatorSort('avgEngagement')}>
                                            {creatorViewMode === 'avg' ? '평균 ' : '누적 '}인게이지먼트 <SortIcon columnKey="avgEngagement" currentSort={creatorSort} />
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedCreators.map((creator, index) => {
                                        const cnt = creator.contentCount || 1;
                                        const val = (avg: number | undefined) =>
                                            creatorViewMode === 'avg' ? (avg ?? 0) : Math.round((avg ?? 0) * cnt);
                                        const isExpanded = expandedCreatorId === creator.id;
                                        const creatorContents = contents.filter(c => c.creator === creator.name);

                                        return (
                                            <>
                                                {/* 크리에이터 행 */}
                                                <tr
                                                    key={creator.id}
                                                    className={`border-b border-gray-100 transition-colors ${isExpanded ? 'bg-blue-50/40' : 'hover:bg-gray-50'}`}
                                                >
                                                    {/* 아코디언 토글 */}
                                                    <td className="px-2 py-3 text-center">
                                                        <button
                                                            onClick={() => setExpandedCreatorId(isExpanded ? null : creator.id)}
                                                            className={`w-6 h-6 flex items-center justify-center rounded-md transition-all ${isExpanded ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'}`}
                                                            title={isExpanded ? '접기' : '콘텐츠 보기'}
                                                        >
                                                            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                                                        </button>
                                                    </td>
                                                    <td className="px-3 py-3 text-center text-gray-500 font-medium">
                                                        {(creatorPage - 1) * ITEMS_PER_PAGE + index + 1}
                                                    </td>
                                                    <td className="px-3 py-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-pink-300 to-orange-200 flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                                                                {creator.name.charAt(0).toUpperCase()}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <div className="flex items-center gap-1.5">
                                                                    <span className="font-medium text-gray-900 text-xs">{creator.name}</span>
                                                                    {getPlatformIcon(creator.platform)}
                                                                </div>
                                                                <p className="text-xs text-gray-400 truncate">{creator.nickname} {creator.handle}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-3 py-3 text-right text-gray-900 text-xs">{creator.followers.toLocaleString()}</td>
                                                    <td className="px-3 py-3 text-right text-gray-900 text-xs">{creator.contentCount}</td>
                                                    <td className="px-3 py-3">
                                                        <div className="flex flex-wrap gap-1">
                                                            {creator.contentTypes?.map((type, i) => (
                                                                <span key={i} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">{type}</span>
                                                            ))}
                                                        </div>
                                                    </td>
                                                    <td className="px-3 py-3 text-right text-gray-900 text-xs font-medium">{val(creator.avgViews).toLocaleString()}</td>
                                                    <td className="px-3 py-3 text-right text-gray-900 text-xs">{val(creator.avgLikes).toLocaleString()}</td>
                                                    <td className="px-3 py-3 text-right text-gray-600 text-xs">{val(creator.avgComments).toLocaleString()}</td>
                                                    <td className="px-3 py-3 text-right text-gray-600 text-xs">{val(creator.avgShares).toLocaleString()}</td>
                                                    <td className="px-3 py-3 text-right text-gray-900 text-xs font-medium">{val(creator.avgEngagement).toLocaleString()}</td>
                                                </tr>

                                                {/* 아코디언 콘텐츠 행 */}
                                                {isExpanded && (
                                                    <tr key={`${creator.id}-contents`} className="border-b border-gray-100">
                                                        <td colSpan={10} className="p-0">
                                                            <div className="bg-gray-50 border-t border-blue-100 px-6 py-4">
                                                                <div className="flex items-center gap-2 mb-3">
                                                                    <div className="w-1 h-4 bg-blue-400 rounded-full"></div>
                                                                    <span className="text-xs font-semibold text-gray-700">
                                                                        {creator.name}의 발행 콘텐츠
                                                                    </span>
                                                                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                                                                        {creatorContents.length}개
                                                                    </span>
                                                                </div>
                                                                {creatorContents.length === 0 ? (
                                                                    <p className="text-xs text-gray-400 py-4 text-center">발행된 콘텐츠가 없습니다.</p>
                                                                ) : (
                                                                    <div className="divide-y divide-gray-100">
                                                                        {creatorContents.map((content) => (
                                                                            <div
                                                                                key={content.id}
                                                                                className="flex items-center gap-3 py-2.5 px-1 hover:bg-gray-100/60 rounded-lg cursor-pointer transition-colors group"
                                                                                onClick={() => window.open(content.url, '_blank')}
                                                                            >
                                                                                {/* 썸네일 */}
                                                                                <div className="flex-shrink-0 w-12 h-12 rounded-md overflow-hidden bg-gray-200">
                                                                                    <img src={content.thumbnail} alt="" className="w-full h-full object-cover" />
                                                                                </div>
                                                                                {/* 내용 */}
                                                                                <div className="flex-1 min-w-0">
                                                                                    <p className="text-xs text-gray-800 font-medium truncate leading-snug group-hover:text-blue-600 transition-colors">
                                                                                        {content.description}
                                                                                    </p>
                                                                                    <p className="text-xs text-gray-400 mt-0.5">{content.uploadDate}</p>
                                                                                </div>
                                                                                {/* 지표 */}
                                                                                <div className="flex-shrink-0 flex items-center gap-3 text-xs text-gray-500">
                                                                                    <span className="flex items-center gap-1">
                                                                                        <Eye className="w-3 h-3" />
                                                                                        {content.views >= 10000 ? `${(content.views / 10000).toFixed(1)}만` : content.views.toLocaleString()}
                                                                                    </span>
                                                                                    <span className="flex items-center gap-1">
                                                                                        <Heart className="w-3 h-3" />
                                                                                        {content.likes.toLocaleString()}
                                                                                    </span>
                                                                                    <span className="flex items-center gap-1 w-12 text-right justify-end">
                                                                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                                                                                        {content.comments.toLocaleString()}
                                                                                    </span>
                                                                                    <span className="flex items-center gap-1 w-12 text-right justify-end">
                                                                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                                                                                        {content.shares?.toLocaleString() ?? 0}
                                                                                    </span>
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        {totalCreatorPages > 1 && (
                            <div className="flex justify-center mt-6 gap-2">
                                <button onClick={() => setCreatorPage(p => Math.max(1, p - 1))} disabled={creatorPage === 1} className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50">이전</button>
                                <span className="px-3 py-1 text-sm flex items-center">{creatorPage} / {totalCreatorPages}</span>
                                <button onClick={() => setCreatorPage(p => Math.min(totalCreatorPages, p + 1))} disabled={creatorPage === totalCreatorPages} className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50">다음</button>
                            </div>
                        )}
                    </div>
                )}
            </section>





            {/* 급상승 콘텐츠 모달 */}
            {
                showRisingModal && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
                        onClick={() => setShowRisingModal(false)}
                    >
                        <div
                            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Modal Header */}
                            <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0">
                                <div className="flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5 text-green-500" />
                                    <h2 className="text-base font-bold text-gray-900">급상승 콘텐츠</h2>
                                    <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-semibold">
                                        {summary.risingContentCount}개
                                    </span>
                                </div>
                                <button
                                    onClick={() => setShowRisingModal(false)}
                                    className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                                >
                                    <X className="h-5 w-5 text-gray-500" />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="overflow-y-auto flex-1 p-6">
                                <p className="text-xs text-gray-500 mb-4">조회수를 기준으로 급상승한 콘텐츠 목록입니다.</p>
                                <div className="space-y-3">
                                    {risingContents.map((content, index) => (
                                        <div
                                            key={content.id}
                                            className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-green-200 hover:bg-green-50/40 transition-colors group cursor-pointer"
                                            onClick={() => window.open(content.url, '_blank')}
                                        >
                                            {/* Rank */}
                                            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                                            ${index === 0 ? 'bg-yellow-400 text-yellow-900' :
                                                    index === 1 ? 'bg-gray-300 text-gray-700' :
                                                        'bg-orange-300 text-orange-900'}`}>
                                                {index + 1}
                                            </div>

                                            {/* Thumbnail */}
                                            <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-gray-100">
                                                <img
                                                    src={content.thumbnail}
                                                    alt=""
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    {getPlatformIcon(content.type)}
                                                    <span className="text-xs text-gray-500 font-medium">@{content.creator}</span>
                                                    {getContentTypeBadge(content.type)}
                                                </div>
                                                <p className="text-sm text-gray-800 line-clamp-2 leading-snug mb-1.5">
                                                    {content.description}
                                                </p>
                                                <p className="text-xs text-gray-400">{content.uploadDate}</p>
                                            </div>

                                            {/* Metrics */}
                                            <div className="flex-shrink-0 text-right space-y-1.5 min-w-[48px]">
                                                <div className="flex items-center justify-end gap-1 text-gray-600">
                                                    <Eye className="w-3.5 h-3.5" />
                                                    <span className="text-xs font-semibold">
                                                        {content.views >= 10000
                                                            ? (content.views / 10000).toFixed(1) + '만'
                                                            : content.views.toLocaleString()}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-end gap-1 text-gray-400">
                                                    <Heart className="w-3.5 h-3.5" />
                                                    <span className="text-xs">{content.likes.toLocaleString()}</span>
                                                </div>
                                                <div className="flex items-center justify-end gap-1 text-gray-400">
                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                                                    <span className="text-xs">{content.comments.toLocaleString()}</span>
                                                </div>
                                                <div className="flex items-center justify-end gap-1 text-gray-400">
                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                                                    <span className="text-xs">{content.shares?.toLocaleString() ?? 0}</span>
                                                </div>
                                            </div>

                                            {/* External link icon */}
                                            <ExternalLink className="flex-shrink-0 w-4 h-4 text-gray-300 group-hover:text-green-500 transition-colors" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}

