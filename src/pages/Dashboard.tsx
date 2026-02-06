import { useEffect, useState } from 'react';
import { MetricCard } from '../components/MetricCard';
import { CreatorRankingTable } from '../components/CreatorRankingTable';
import { api, MOCK_SUMMARY, MOCK_DAILY_DATA } from '../lib/api';
import type { Creator } from '../lib/types';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { ChevronDown, Check } from 'lucide-react';

export function Dashboard() {
    const [creators, setCreators] = useState<Creator[]>([]);
    const [activeTab, setActiveTab] = useState('좋아요 수(릴스)');
    const [isLoading, setIsLoading] = useState(true);

    const tabs = ['종합 성과', '좋아요 수(릴스)', '좋아요 수(스타일클립)', '댓글 수', '조회 수', '발송 수(소셜비즈)', '클릭 수(소셜비즈)'];

    useEffect(() => {
        const loadData = async () => {
            try {
                const creatorsData = await api.getCreators();
                setCreators(creatorsData);
            } catch (error) {
                console.error('Failed to load data', error);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, []);

    const summary = MOCK_SUMMARY;
    const chartData = MOCK_DAILY_DATA;

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-gray-500">크리에이터 프로그램 대시보드</p>
                </div>
                <button className="text-sm text-gray-500 hover:text-gray-700">로그아웃</button>
            </div>

            {/* Period Selector */}
            <div className="flex items-center gap-4">
                <button className="flex items-center gap-2 px-4 py-2 border rounded-md bg-white text-sm font-medium">
                    12기 (12월)
                    <ChevronDown className="h-4 w-4" />
                </button>
            </div>

            {/* Content Performance Section */}
            <div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">콘텐츠 성과</h2>
                <p className="text-sm text-gray-500 mb-6">
                    현재 기수 크리에이터들이 현재까지 참여한 미션의 좋아요, 댓글, 조회 수와 소셜비즈 발송 수, 클릭 수 데이터를 포함합니다.
                </p>

                {/* Tabs */}
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                    {tabs.map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-full whitespace-nowrap transition-colors ${activeTab === tab
                                ? 'bg-gray-900 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            {activeTab === tab && <Check className="h-3 w-3" />}
                            {tab}
                        </button>
                    ))}
                    <select className="ml-auto px-3 py-2 text-sm border rounded-md bg-white">
                        <option>3차 미션</option>
                    </select>
                </div>

                {/* Bar Chart */}
                <div className="rounded-lg border border-gray-200 bg-white p-6 mb-6">
                    <div className="h-[280px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                                <XAxis
                                    dataKey="date"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#9ca3af', fontSize: 12 }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#9ca3af', fontSize: 12 }}
                                    domain={[0, 42]}
                                    ticks={[0, 7, 14, 21, 28, 35, 42]}
                                    orientation="right"
                                />
                                <Tooltip
                                    cursor={{ fill: 'transparent' }}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={36}>
                                    {chartData.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill="#ff5452" />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Metric Cards - First Row */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                    <MetricCard label="평균 좋아요 수(릴스/스타일)" value={`${summary.avgLikes}/${summary.avgLikesPerReel}`} unit="개" />
                    <MetricCard label="평균 댓글 수" value={summary.avgComments} unit="개" />
                    <MetricCard label="평균 조회 수" value={summary.avgViews.toLocaleString()} unit="개" />
                </div>

                {/* Metric Cards - Second Row */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                    <MetricCard label="평균 인게이지먼트" value={summary.avgEngagement} unit="개" />
                    <MetricCard label="평균 발송 수(소셜비즈)" value={summary.avgShares} unit="회" />
                    <MetricCard label="평균 클릭 수(소셜비즈)" value={summary.avgClicks} unit="회" />
                </div>

                {/* Metric Cards - Third Row */}
                <div className="grid grid-cols-3 gap-4">
                    <MetricCard label="총 광고 비용" value={summary.totalAdCost.toLocaleString()} unit="원" />
                    <MetricCard label="CPV" value={summary.cpv} unit="원" />
                    <MetricCard label="CPE" value={summary.cpe} unit="원" />
                </div>
            </div>

            {/* Creator Ranking */}
            {!isLoading && <CreatorRankingTable creators={creators} />}
        </div>
    );
}
