export interface Stock {
    symbol: string;
    name: string;
    price: number;
    change: number;
    changePercent: number;
    currency: string;
    // Yahoo Finance specific fields usually found in 'summaryDetail'
    marketCap?: string;
    volume?: string;
    peRatio?: number;
    history: { timestamp: number; value: number }[]; // For charts
}
