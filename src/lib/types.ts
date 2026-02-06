export type TrackingStatus = 'active' | 'completed' | 'pending';

export interface Creator {
    id: string;
    name: string;
    handle: string;
    nickname?: string;
    platform: string;
    followers: number;
    categories?: string[];
    audience?: string;
    growthRate?: number;
    totalScore?: number;
    contentCount?: number;
    contentTypes?: string[];
    avgViews?: number;
    maxViews?: number;
}

export interface TrackingConfig {
    id: string;
    title: string;
    keywords: string[];
    creators: Creator[];
    startDate: string;
    endDate: string;
    createdAt: string;
    status: TrackingStatus;
    contentCount?: number;
    contentTypes?: string[];
}

export interface ContentMetric {
    views: number;
    likes: number;
    comments: number;
    shares: number;
    engagementRate: number;
}

export interface ContentItem {
    id: string;
    trackingId: string;
    creatorId: string;
    url: string;
    thumbnailUrl: string;
    publishedAt: string;
    metrics: ContentMetric;
    sentiment: 'positive' | 'neutral' | 'negative';
}
