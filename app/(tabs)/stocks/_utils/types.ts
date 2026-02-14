export interface Stock {
    symbol: string;
    name: string;
    price: number;
    change: number;
    changePercent: number;
    history: { value: number; timestamp: number }[];

    // Details
    description?: string;
    sector?: string;
    industry?: string;
    website?: string;
    employees?: number;
    city?: string;
    country?: string;
    logo?: string;

    // Stats
    open?: number;
    high?: number;
    low?: number;
    volume?: number;
    marketCap?: number;
    peRatio?: number;
    dividendYield?: number;
    previousClose?: number;
    fiftyTwoWeekHigh?: number;
    fiftyTwoWeekLow?: number;
}
