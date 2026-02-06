import type { Creator } from '../lib/types';

interface CreatorRankingTableProps {
    creators: Creator[];
}

export function CreatorRankingTable({ creators }: CreatorRankingTableProps) {
    const tabs = ['종합 성과', '좋아요 수(릴스)', '좋아요 수(스타일클립)', '댓글 수', '조회 수', '발송 수(소셜비즈)', '클릭 수(소셜비즈)'];

    return (
        <div className="rounded-lg border border-gray-200 bg-white">
            <div className="p-6 border-b">
                <h3 className="text-lg font-bold text-gray-900">크리에이터 랭킹</h3>
                <p className="text-sm text-gray-500 mt-1">현재 기수 크리에이터들이 현재까지 참여한 미션을 기반으로 랭킹입니다.</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 px-6 py-3 border-b overflow-x-auto">
                {tabs.map((tab, i) => (
                    <button
                        key={tab}
                        className={`px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors ${i === 0
                                ? 'bg-gray-900 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        {tab}
                    </button>
                ))}
                <select className="ml-auto px-3 py-1.5 text-xs border rounded-md bg-white">
                    <option>전체 미션</option>
                </select>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-gray-500">
                        <tr>
                            <th className="px-6 py-3 text-left font-medium">NO</th>
                            <th className="px-6 py-3 text-left font-medium">크리에이터 계정</th>
                            <th className="px-6 py-3 text-left font-medium">카테고리</th>
                            <th className="px-6 py-3 text-left font-medium">오디언스</th>
                            <th className="px-6 py-3 text-right font-medium">팔로워 수</th>
                            <th className="px-6 py-3 text-right font-medium">30일 성장률 (팔로워 증감)</th>
                            <th className="px-6 py-3 text-right font-medium">종합 성과</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {creators.map((creator, index) => (
                            <tr key={creator.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4">
                                    <span className="text-gray-500">{index + 1}</span>
                                    <span className="ml-2 text-gray-400">(-)</span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-pink-300 to-orange-200 flex items-center justify-center text-white text-xs font-medium">
                                            {creator.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">{creator.name}</p>
                                            <p className="text-xs text-gray-500">예쁜건 다 좋아합니다. 🌷🌿...</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex gap-1">
                                        {creator.categories?.map((cat, i) => (
                                            <span
                                                key={i}
                                                className={`px-2 py-0.5 rounded text-xs font-medium ${cat === '패션' ? 'bg-red-100 text-red-600' :
                                                        cat === '뷰티' ? 'bg-pink-100 text-pink-600' :
                                                            cat === '일상' ? 'bg-yellow-100 text-yellow-600' :
                                                                'bg-gray-100 text-gray-600'
                                                    }`}
                                            >
                                                {cat}
                                            </span>
                                        ))}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-gray-600">{creator.audience}</td>
                                <td className="px-6 py-4 text-right text-gray-900">
                                    {(creator.followers / 10000).toFixed(1)}만 명
                                </td>
                                <td className="px-6 py-4 text-right text-gray-900">
                                    {creator.growthRate?.toLocaleString()} 명
                                </td>
                                <td className="px-6 py-4 text-right font-medium text-gray-900">
                                    {creator.totalScore?.toLocaleString()}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
