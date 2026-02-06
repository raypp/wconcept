import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronDown, TrendingUp, Instagram, Youtube, Eye, Heart } from 'lucide-react';
import { api, MOCK_SUMMARY, MOCK_DAILY_DATA, MOCK_CREATORS, MOCK_CONTENTS } from '../lib/api';
import type { TrackingConfig } from '../lib/types';
import { MetricCard } from '../components/MetricCard';
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
    const [contentSortBy, setContentSortBy] = useState('조회 많은 순');
    const [selectedContentTypes, setSelectedContentTypes] = useState<string[]>([]);
    const [creatorSortBy, setCreatorSortBy] = useState('평균 조회수 높은 순');
    const [hoveredContent, setHoveredContent] = useState<string | null>(null);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [rankingPeriod, setRankingPeriod] = useState('전체 기간');
    const [chartMetric, setChartMetric] = useState('조회 수');
    const [isCumulativeView, setIsCumulativeView] = useState(false);
    const [activeRankingTab, setActiveRankingTab] = useState<'content' | 'creator'>('content');
    const [chartContentTypes, setChartContentTypes] = useState<string[]>([]);
    const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);
    const [startDate, endDate] = dateRange;

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
                chartMetric === '인게이지먼트' ? 'engagement' :
                    'views';
        return [...contents]
            .sort((a, b) => (b[metricKey as keyof typeof b] as number) - (a[metricKey as keyof typeof a] as number))
            .slice(0, 10);
    }, [contents, chartMetric]);

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

    const contentSortOptions = [
        '조회 많은 순',
        '좋아요 많은 순',
        '댓글 많은 순',
        '저장 많은 순',
        '공유 많은 순',
        '업로드 최신순',
        '업로드 오래된 순',
    ];

    const periodOptions = ['전체 기간', '최근 7일', '최근 14일', '최근 30일'];

    const creatorSortOptions = [
        '평균 조회수 높은 순',
        '최고 조회 수 높은 순',
        '업로드 콘텐츠 많은 순',
    ];

    // Filter and Sort Contents
    const filteredAndSortedContents = useMemo(() => {
        let result = [...contents];

        // Filter by Date
        if (rankingPeriod === '최신순') {
            // Logic for period... defaulting to all for now or mock
        }

        // Filter by Content Type
        if (selectedContentTypes.length > 0) {
            result = result.filter(content => {
                // Handle complex types mapping if needed
                const type = content.type;
                // Simple inclusion check
                return selectedContentTypes.some(startType => type.includes(startType.split('(')[0]));
            });
        }

        // Sort
        result.sort((a, b) => {
            switch (contentSortBy) {
                case '조회 많은 순': return b.views - a.views;
                case '좋아요 많은 순': return b.likes - a.likes;
                case '댓글 많은 순': return b.comments - a.comments;
                case '저장 많은 순': return (b.saves || 0) - (a.saves || 0);
                case '공유 많은 순': return (b.shares || 0) - (a.shares || 0);
                case '업로드 최신순': return new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime(); // Note: Mock date format might need parsing if not ISO
                case '업로드 오래된 순': return new Date(a.uploadDate).getTime() - new Date(b.uploadDate).getTime();
                default: return 0;
            }
        });

        return result;
    }, [contents, contentSortBy, selectedContentTypes, rankingPeriod]);

    // Paginated Contents
    const paginatedContents = useMemo(() => {
        const start = (contentPage - 1) * ITEMS_PER_PAGE;
        return filteredAndSortedContents.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredAndSortedContents, contentPage]);

    const totalContentPages = Math.ceil(filteredAndSortedContents.length / ITEMS_PER_PAGE);

    // Sort Creators
    const sortedCreators = useMemo(() => {
        let result = [...creators];
        result.sort((a, b) => {
            switch (creatorSortBy) {
                case '평균 조회수 높은 순': return (b.avgViews || 0) - (a.avgViews || 0);
                case '최고 조회 수 높은 순': return (b.maxViews || 0) - (a.maxViews || 0);
                case '업로드 콘텐츠 많은 순': return (b.contentCount || 0) - (a.contentCount || 0);
                default: return 0;
            }
        });
        return result;
    }, [creators, creatorSortBy]);

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
                engagement: acc.engagement + engagement
            };
        }, { likes: 0, comments: 0, views: 0, engagement: 0 });
    }, [contents]);

    // Calculate cumulative data
    const cumulativeData = useMemo(() => {
        let cumViews = 0, cumLikes = 0, cumComments = 0, cumEngagement = 0, cumUploads = 0;
        return chartData.map(entry => {
            cumViews += entry.views;
            cumLikes += entry.likes;
            cumComments += entry.comments;
            cumEngagement += entry.engagement;
            cumUploads += entry.uploads;
            return {
                date: entry.date,
                views: cumViews,
                likes: cumLikes,
                comments: cumComments,
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
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-500 mb-1">급상승 콘텐츠 수</p>
                        <div className="flex items-center justify-center gap-1">
                            <TrendingUp className="h-4 w-4 text-green-500" />
                            <p className="text-2xl font-bold text-gray-900">{summary.risingContentCount}<span className="text-sm font-normal">개</span></p>
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
                    <div className="grid grid-cols-4 gap-4">
                        <MetricCard label="평균 좋아요 수" value={summary.avgLikes.toLocaleString()} unit="개" />
                        <MetricCard label="평균 댓글 수" value={summary.avgComments.toLocaleString()} unit="개" />
                        <MetricCard label="평균 조회 수" value={summary.avgViews.toLocaleString()} unit="개" />
                        <MetricCard label="평균 인게이지먼트" value={summary.avgEngagement.toLocaleString()} unit="개" />
                    </div>
                </div>

                {/* 누적 성과 */}
                <div className="mt-8">
                    <h3 className="text-sm font-medium text-gray-700 mb-4">누적 성과</h3>
                    <div className="grid grid-cols-4 gap-4">
                        <MetricCard label="총 좋아요 수" value={totalStats.likes.toLocaleString()} unit="개" />
                        <MetricCard label="총 댓글 수" value={totalStats.comments.toLocaleString()} unit="개" />
                        <MetricCard label="총 조회 수" value={totalStats.views.toLocaleString()} unit="회" />
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
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                            {/* Date Range Picker */}
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500">기간 선택</span>
                                <DatePicker
                                    selectsRange={true}
                                    startDate={startDate}
                                    endDate={endDate}
                                    onChange={(update) => setDateRange(update as [Date | null, Date | null])}
                                    locale={ko}
                                    dateFormat="yyyy.MM.dd"
                                    className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg w-48 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholderText="기간 선택"
                                />
                            </div>
                            {/* Graph Mode Toggle */}
                            <div className="flex bg-gray-100 p-0.5 rounded-lg">
                                <button
                                    onClick={() => setIsCumulativeView(false)}
                                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${!isCumulativeView
                                        ? 'bg-white text-gray-900 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-900'
                                        }`}
                                >
                                    일별 발생량
                                </button>
                                <button
                                    onClick={() => setIsCumulativeView(true)}
                                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${isCumulativeView
                                        ? 'bg-white text-gray-900 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-900'
                                        }`}
                                >
                                    누적
                                </button>
                            </div>
                        </div>
                        {/* Metric Toggle - Far Right */}
                        <div className="flex bg-gray-100 p-1 rounded-lg">
                            {['조회 수', '좋아요', '댓글', '인게이지먼트'].map((metric) => (
                                <button
                                    key={metric}
                                    onClick={() => setChartMetric(metric)}
                                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${chartMetric === metric
                                        ? 'bg-white text-gray-900 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-900'
                                        }`}
                                >
                                    {metric}
                                </button>
                            ))}
                        </div>
                    </div>
                    {/* Content Type Filter */}
                    <div className="flex items-center gap-2 mb-4">
                        <span className="text-xs text-gray-500">콘텐츠 유형:</span>
                        <div className="flex flex-wrap gap-2">
                            {['인스타그램 피드', '인스타그램 릴스', '유튜브 영상(롱폼)', '유튜브 쇼츠'].map((type) => {
                                const isSelected = chartContentTypes.includes(type);
                                return (
                                    <button
                                        key={type}
                                        onClick={() => {
                                            if (isSelected) {
                                                setChartContentTypes(chartContentTypes.filter(t => t !== type));
                                            } else {
                                                setChartContentTypes([...chartContentTypes, type]);
                                            }
                                        }}
                                        className={`px-2.5 py-1 text-xs font-medium rounded-full border transition-colors ${isSelected
                                            ? 'bg-blue-50 border-blue-300 text-blue-700'
                                            : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                                            }`}
                                    >
                                        {type}
                                    </button>
                                );
                            })}
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
                                    <p className="text-[10px] text-gray-700 line-clamp-2 mb-1.5 leading-tight">
                                        {content.description}
                                    </p>
                                    <p className="text-[9px] text-gray-400 mb-2">{content.uploadDate}</p>

                                    <div className="flex items-center gap-2 text-gray-400">
                                        <div className="flex items-center gap-0.5">
                                            <Eye className="w-3 h-3" />
                                            <span className="text-[9px]">{content.views >= 10000 ? (content.views / 10000).toFixed(1) + '만' : content.views.toLocaleString()}</span>
                                        </div>
                                        <div className="flex items-center gap-0.5">
                                            <Heart className="w-3 h-3" />
                                            <span className="text-[9px]">{content.likes.toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 랭킹 Section with Tabs */}
            <section className="bg-white rounded-lg border p-6">
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

                {/* 콘텐츠 랭킹 Content */}
                {activeRankingTab === 'content' && (
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-medium text-gray-700">전체 콘텐츠 랭킹 Top {filteredAndSortedContents.length}</h3>
                            <div className="flex gap-2">
                                <select
                                    value={rankingPeriod}
                                    onChange={(e) => setRankingPeriod(e.target.value)}
                                    className="px-3 py-1.5 text-xs border rounded-md bg-white"
                                >
                                    {periodOptions.map((opt) => (
                                        <option key={opt} value={opt}>{opt}</option>
                                    ))}
                                </select>
                                <select
                                    value={contentSortBy}
                                    onChange={(e) => setContentSortBy(e.target.value)}
                                    className="px-3 py-1.5 text-xs border rounded-md bg-white"
                                >
                                    {contentSortOptions.map((opt) => (
                                        <option key={opt} value={opt}>{opt}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        {/* Content Type Multi-Select Toggles */}
                        <div className="flex flex-wrap gap-2 mb-4">
                            {contentTypeOptions.slice(1).map((type) => (
                                <button
                                    key={type}
                                    onClick={() => {
                                        setSelectedContentTypes(prev =>
                                            prev.includes(type)
                                                ? prev.filter(t => t !== type)
                                                : [...prev, type]
                                        );
                                    }}
                                    className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${selectedContentTypes.includes(type)
                                        ? 'bg-gray-900 text-white border-gray-900'
                                        : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
                                        }`}
                                >
                                    {type.includes('인스타그램') ? type.replace('인스타그램 ', '') : type.replace('유튜브 ', '')}
                                </button>
                            ))}
                            {selectedContentTypes.length > 0 && (
                                <button
                                    onClick={() => setSelectedContentTypes([])}
                                    className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700"
                                >
                                    초기화
                                </button>
                            )}
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 text-gray-500">
                                    <tr>
                                        <th className="px-3 py-3 text-center font-medium w-12">순위</th>
                                        <th className="px-3 py-3 text-left font-medium w-20">콘텐츠</th>
                                        <th className="px-3 py-3 text-left font-medium w-28">콘텐츠 유형</th>
                                        <th className="px-3 py-3 text-left font-medium min-w-[200px]">콘텐츠 내용</th>
                                        <th className="px-3 py-3 text-left font-medium w-24">업로드일</th>
                                        <th className="px-3 py-3 text-left font-medium w-32">계정/채널</th>
                                        <th className="px-3 py-3 text-right font-medium w-24">팔로워 수</th>
                                        <th className="px-3 py-3 text-right font-medium w-20">조회 수</th>
                                        <th className="px-3 py-3 text-right font-medium w-20">좋아요</th>
                                        <th className="px-3 py-3 text-right font-medium w-16">댓글</th>
                                        <th className="px-3 py-3 text-right font-medium w-16">공유</th>
                                        <th className="px-3 py-3 text-right font-medium w-16">저장</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {paginatedContents.map((content, index) => (
                                        <tr key={content.id} className="hover:bg-gray-50">
                                            <td className="px-3 py-3 text-center text-gray-500 font-medium">
                                                {(contentPage - 1) * ITEMS_PER_PAGE + index + 1}
                                            </td>
                                            <td className="px-3 py-3">
                                                <div className="w-14 h-14 rounded-lg overflow-hidden bg-gray-100">
                                                    <img
                                                        src={content.thumbnail}
                                                        alt="썸네일"
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                            </td>
                                            <td className="px-3 py-3">
                                                {getContentTypeBadge(content.type)}
                                            </td>
                                            <td className="px-3 py-3 relative">
                                                <div
                                                    className="max-w-[200px] truncate text-gray-700 cursor-help"
                                                    onMouseEnter={() => setHoveredContent(content.id)}
                                                    onMouseLeave={() => setHoveredContent(null)}
                                                >
                                                    {content.description}
                                                </div>
                                                {hoveredContent === content.id && (
                                                    <div className="absolute left-0 top-full mt-1 z-20 bg-gray-900 text-white text-xs p-3 rounded-lg shadow-lg max-w-xs whitespace-pre-wrap">
                                                        {content.description}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-3 py-3 text-gray-600 text-xs">
                                                {content.uploadDate}
                                            </td>
                                            <td className="px-3 py-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-7 w-7 rounded-full bg-gradient-to-br from-pink-300 to-orange-200 flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
                                                        {content.creator.charAt(0).toUpperCase()}
                                                    </div>
                                                    <span className="text-gray-900 text-xs font-medium truncate">{content.creator}</span>
                                                </div>
                                            </td>
                                            <td className="px-3 py-3 text-right text-gray-900 text-xs">
                                                {content.followers.toLocaleString()}
                                            </td>
                                            <td className="px-3 py-3 text-right text-gray-900 text-xs font-medium">
                                                {content.views.toLocaleString()}
                                            </td>
                                            <td className="px-3 py-3 text-right text-gray-900 text-xs">
                                                {content.likes.toLocaleString()}
                                            </td>
                                            <td className="px-3 py-3 text-right text-gray-600 text-xs">
                                                {content.comments.toLocaleString()}
                                            </td>
                                            <td className="px-3 py-3 text-right text-gray-600 text-xs">
                                                {content.shares.toLocaleString()}
                                            </td>
                                            <td className="px-3 py-3 text-right text-gray-600 text-xs">
                                                {content.saves.toLocaleString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {/* Pagination Controls */}
                        {totalContentPages > 1 && (
                            <div className="flex justify-center mt-6 gap-2">
                                <button
                                    onClick={() => setContentPage(p => Math.max(1, p - 1))}
                                    disabled={contentPage === 1}
                                    className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50"
                                >
                                    이전
                                </button>
                                <span className="px-3 py-1 text-sm flex items-center">
                                    {contentPage} / {totalContentPages}
                                </span>
                                <button
                                    onClick={() => setContentPage(p => Math.min(totalContentPages, p + 1))}
                                    disabled={contentPage === totalContentPages}
                                    className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50"
                                >
                                    다음
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* 크리에이터 랭킹 Content */}
                {activeRankingTab === 'creator' && (
                    <div>

                        {/* 크리에이터 기간별 랭킹 */}
                        {/* 크리에이터 기간별 랭킹 */}
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-medium text-gray-700">전체 크리에이터 랭킹 Top {sortedCreators.length}</h3>
                                <select
                                    value={creatorSortBy}
                                    onChange={(e) => setCreatorSortBy(e.target.value)}
                                    className="px-3 py-1.5 text-xs border rounded-md bg-white"
                                >
                                    {creatorSortOptions.map((opt) => (
                                        <option key={opt} value={opt}>{opt}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50 text-gray-500">
                                        <tr>
                                            <th className="px-4 py-3 text-center font-medium w-16">순위</th>
                                            <th className="px-4 py-3 text-left font-medium w-64">계정/채널</th>
                                            <th className="px-4 py-3 text-right font-medium">팔로워 수</th>
                                            <th className="px-4 py-3 text-right font-medium">콘텐츠 수</th>
                                            <th className="px-4 py-3 text-left font-medium">콘텐츠 유형</th>
                                            <th className="px-4 py-3 text-right font-medium">평균 조회 수</th>
                                            <th className="px-4 py-3 text-right font-medium">최고 조회 수</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {paginatedCreators.map((creator, index) => (
                                            <tr key={creator.id} className="hover:bg-gray-50">
                                                <td className="px-4 py-3 text-center text-gray-500 font-medium">
                                                    {(creatorPage - 1) * ITEMS_PER_PAGE + index + 1}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-pink-300 to-orange-200 flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                                                            {creator.name.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="font-medium text-gray-900">{creator.name}</span>
                                                                {getPlatformIcon(creator.platform)}
                                                            </div>
                                                            <p className="text-xs text-gray-500 truncate">{creator.nickname || `@${creator.name}`}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-right text-gray-900">
                                                    {creator.followers.toLocaleString()}
                                                </td>
                                                <td className="px-4 py-3 text-right text-gray-900">
                                                    {creator.contentCount}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex flex-wrap gap-1">
                                                        {creator.contentTypes?.map((type, i) => (
                                                            <span key={i} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                                                                {type}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-right text-gray-900">
                                                    {(creator.avgViews ?? 0).toLocaleString()}
                                                </td>
                                                <td className="px-4 py-3 text-right text-gray-900 font-medium">
                                                    {(creator.maxViews ?? 0).toLocaleString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {/* Pagination Controls */}
                            {totalCreatorPages > 1 && (
                                <div className="flex justify-center mt-6 gap-2">
                                    <button
                                        onClick={() => setCreatorPage(p => Math.max(1, p - 1))}
                                        disabled={creatorPage === 1}
                                        className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50"
                                    >
                                        이전
                                    </button>
                                    <span className="px-3 py-1 text-sm flex items-center">
                                        {creatorPage} / {totalCreatorPages}
                                    </span>
                                    <button
                                        onClick={() => setCreatorPage(p => Math.min(totalCreatorPages, p + 1))}
                                        disabled={creatorPage === totalCreatorPages}
                                        className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50"
                                    >
                                        다음
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </section >
        </div >
    );
}

