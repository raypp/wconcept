import type { TrackingConfig, ContentItem, Creator } from './types';

// Mock Data - Korean
export const MOCK_CREATORS: Creator[] = [
    { id: '1', name: 'bhoeee', handle: '@bhoeee', nickname: '보희', platform: '인스타그램', followers: 12000, categories: ['패션', '뷰티'], audience: '25-34세 여성 (50%)', growthRate: 1.2, totalScore: 2273, contentCount: 12, contentTypes: ['피드', '릴스'], avgViews: 18500, maxViews: 45000 },
    { id: '2', name: 'ch__n1', handle: '@ch__n1', nickname: '채린', platform: '인스타그램', followers: 46300, categories: ['일상', '패션'], audience: '25-34세 여성 (50%)', growthRate: 2440, totalScore: 1079, contentCount: 8, contentTypes: ['릴스'], avgViews: 32100, maxViews: 78000 },
    { id: '3', name: 'peng_pongping', handle: '@peng_pongping', nickname: '펭퐁핑', platform: '인스타그램', followers: 25260, categories: ['뷰티', '패션'], audience: '25-34세 여성 (45%)', growthRate: 2526, totalScore: 985, contentCount: 15, contentTypes: ['피드', '릴스'], avgViews: 21300, maxViews: 52000 },
    { id: '4', name: 'bonjulya', handle: '@bonjulya', nickname: '본줄리아', platform: '인스타그램', followers: 60560, categories: ['패션', '뷰티'], audience: '25-34세 여성 (50%)', growthRate: 6056, totalScore: 912, contentCount: 6, contentTypes: ['피드'], avgViews: 42000, maxViews: 89000 },
    { id: '5', name: 'daily_mina', handle: '@daily_mina', nickname: '미나', platform: '유튜브', followers: 85000, categories: ['뷰티'], audience: '18-24세 여성 (60%)', growthRate: 3.5, totalScore: 1850, contentCount: 10, contentTypes: ['롱폼', '쇼츠'], avgViews: 55000, maxViews: 120000 },
    { id: '6', name: 'style_jieun', handle: '@style_jieun', nickname: '지은', platform: '인스타그램', followers: 34200, categories: ['패션'], audience: '25-34세 여성 (55%)', growthRate: 1.8, totalScore: 1420, contentCount: 9, contentTypes: ['피드', '릴스'], avgViews: 28900, maxViews: 67000 },
];

export const MOCK_CONTENTS = Array.from({ length: 350 }, (_, i) => ({
    id: `c${i + 1}`,
    url: '#',
    thumbnail: i % 3 === 0 ? '/assets/winter_knit_ootd.png' : i % 3 === 1 ? '/assets/mini_bag_collection.png' : '/assets/beauty_makeup_tutorial.png',
    type: ['인스타그램 릴스', '인스타그램 피드', '유튜브 쇼츠', '유튜브 영상(롱폼)'][i % 4],
    description: `테스트 콘텐츠 설명 Content Description ${i + 1} - This is a long description to test truncation functionality in the table view.`,
    uploadDate: `26.01.${String((i % 30) + 1).padStart(2, '0')}`,
    creator: ['bhoeee', 'ch__n1', 'daily_mina', 'peng_pongping', 'bonjulya', 'style_jieun'][i % 6],
    followers: 10000 + (i * 123) % 50000,
    views: 1000 + (i * 456) % 100000,
    likes: 100 + (i * 78) % 5000,
    comments: 10 + (i * 9) % 500,
    shares: 5 + (i * 4) % 200,
    saves: 20 + (i * 7) % 300
}));

export const MOCK_TRACKINGS: TrackingConfig[] = [
    {
        id: 't1',
        title: '1월 W크리에이터',
        keywords: ['#공구', '#광고', '#뷰티', '#피부'],
        creators: MOCK_CREATORS.slice(0, 4),
        startDate: '2025-12-15',
        endDate: '2025-12-31',
        createdAt: '2025-12-14',
        status: 'active',
        contentCount: 342,
        contentTypes: ['인스타그램 피드/릴스', '유튜브 숏폼/롱폼'],
    },
    {
        id: 't2',
        title: '12월 신규 캠페인',
        keywords: ['#OOTD', '#데일리룩'],
        creators: MOCK_CREATORS.slice(0, 2),
        startDate: '2024-12-01',
        endDate: '2024-12-15',
        createdAt: '2024-11-28',
        status: 'completed',
        contentCount: 128,
        contentTypes: ['인스타그램 피드/릴스'],
    },
];

export const MOCK_CONTENT: ContentItem[] = [
    {
        id: 'c1',
        trackingId: 't1',
        creatorId: '1',
        url: 'https://instagram.com/p/12345',
        thumbnailUrl: 'https://placehold.co/400x400/png?text=Insta+Post+1',
        publishedAt: '2025-12-20T10:00:00Z',
        metrics: { views: 15000, likes: 1200, comments: 45, shares: 120, engagementRate: 8.5 },
        sentiment: 'positive',
    },
    {
        id: 'c2',
        trackingId: 't1',
        creatorId: '2',
        url: 'https://instagram.com/p/67890',
        thumbnailUrl: 'https://placehold.co/400x400/png?text=Insta+Post+2',
        publishedAt: '2025-12-21T14:30:00Z',
        metrics: { views: 8200, likes: 540, comments: 20, shares: 30, engagementRate: 6.2 },
        sentiment: 'neutral',
    },
];

// Daily chart data for bar chart
export const MOCK_DAILY_DATA = [
    { date: '12-30', views: 15400, likes: 120, comments: 45, engagement: 220, uploads: 2 },
    { date: '12-31', views: 18200, likes: 190, comments: 65, engagement: 310, uploads: 1 },
    { date: '1-01', views: 22100, likes: 250, comments: 80, engagement: 450, uploads: 3 },
    { date: '1-02', views: 24500, likes: 280, comments: 88, engagement: 490, uploads: 2 },
    { date: '1-03', views: 28300, likes: 310, comments: 95, engagement: 520, uploads: 4 },
    { date: '1-04', views: 21000, likes: 220, comments: 75, engagement: 410, uploads: 1 },
    { date: '1-05', views: 18500, likes: 180, comments: 60, engagement: 340, uploads: 2 },
    { date: '1-06', views: 25000, likes: 300, comments: 90, engagement: 500, uploads: 3 },
    { date: '1-07', views: 32000, likes: 420, comments: 120, engagement: 680, uploads: 5 },
    { date: '1-08', views: 28000, likes: 350, comments: 100, engagement: 580, uploads: 2 },
    { date: '1-09', views: 25600, likes: 290, comments: 85, engagement: 490, uploads: 3 },
    { date: '1-10', views: 29500, likes: 380, comments: 115, engagement: 620, uploads: 4 },
    { date: '1-11', views: 35000, likes: 450, comments: 150, engagement: 750, uploads: 6 },
    { date: '1-12', views: 31000, likes: 390, comments: 130, engagement: 650, uploads: 3 },
    { date: '1-13', views: 29800, likes: 340, comments: 110, engagement: 560, uploads: 2 },
    { date: '1-14', views: 36500, likes: 480, comments: 160, engagement: 820, uploads: 5 },
    { date: '1-15', views: 42100, likes: 520, comments: 180, engagement: 890, uploads: 7 },
    { date: '1-16', views: 39000, likes: 490, comments: 165, engagement: 840, uploads: 4 },
    { date: '1-17', views: 38500, likes: 480, comments: 160, engagement: 810, uploads: 3 },
    { date: '1-18', views: 41000, likes: 510, comments: 190, engagement: 900, uploads: 5 },
    { date: '1-19', views: 45000, likes: 580, comments: 210, engagement: 950, uploads: 6 },
];

// Summary metrics
export const MOCK_SUMMARY = {
    creatorCount: 7,
    collectionPeriod: '2025.12.15 ~ 2025.12.31 (총 17일)',
    contentCount: 58,
    risingContentCount: 2,
    totalViews: 328962,
    avgLikes: 120,
    avgLikesPerReel: 16,
    avgComments: 103,
    avgViews: 14881,
    avgEngagement: 224,
    avgShares: 80,
    avgClicks: 12,
    totalAdCost: 9000000,
    cpv: 13.7,
    cpe: 910.7,
};

// Mock API Client
export const api = {
    getTrackings: async (): Promise<TrackingConfig[]> => {
        return new Promise((resolve) => setTimeout(() => resolve(MOCK_TRACKINGS), 300));
    },

    getTrackingById: async (id: string): Promise<TrackingConfig | undefined> => {
        return new Promise((resolve) => setTimeout(() => resolve(MOCK_TRACKINGS.find(t => t.id === id)), 200));
    },

    createTracking: async (data: Omit<TrackingConfig, 'id' | 'createdAt' | 'status'>): Promise<TrackingConfig> => {
        return new Promise((resolve) =>
            setTimeout(() => {
                const newTracking: TrackingConfig = {
                    ...data,
                    id: Math.random().toString(36).substr(2, 9),
                    createdAt: new Date().toISOString(),
                    status: 'active',
                };
                MOCK_TRACKINGS.unshift(newTracking);
                resolve(newTracking);
            }, 500)
        );
    },

    getContentMetrics: async (trackingId: string): Promise<ContentItem[]> => {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(MOCK_CONTENT.filter(c => c.trackingId === trackingId));
            }, 300);
        })
    },

    getDailyData: async (): Promise<typeof MOCK_DAILY_DATA> => {
        return new Promise((resolve) => setTimeout(() => resolve(MOCK_DAILY_DATA), 200));
    },

    getSummary: async (): Promise<typeof MOCK_SUMMARY> => {
        return new Promise((resolve) => setTimeout(() => resolve(MOCK_SUMMARY), 200));
    },

    getCreators: async (): Promise<Creator[]> => {
        return new Promise((resolve) => setTimeout(() => resolve(MOCK_CREATORS), 200));
    },
};
