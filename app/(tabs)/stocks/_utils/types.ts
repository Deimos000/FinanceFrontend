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

    // Analyst Ratings
    recommendationKey?: string;
    recommendationMean?: number;
    numberOfAnalystOpinions?: number;
    targetHighPrice?: number;
    targetLowPrice?: number;
    targetMeanPrice?: number;
    targetMedianPrice?: number;

    // Financial Ratios
    forwardPE?: number;
    priceToBook?: number;
    priceToSales?: number;
    enterpriseToEbitda?: number;
    peRatioPEG?: number;
    profitMargins?: number;
    grossMargins?: number;
    operatingMargins?: number;
    ebitdaMargins?: number;
    returnOnAssets?: number;
    returnOnEquity?: number;
    revenueGrowth?: number;
    earningsGrowth?: number;
    payoutRatio?: number;

    // Earnings
    basicEPS?: number;
    dilutedEPS?: number;
    forwardEps?: number;

    // Financial Health
    totalCash?: number;
    totalDebt?: number;
    currentRatio?: number;
    quickRatio?: number;
    freeCashflow?: number;
    operatingCashflow?: number;
    ebitdaValue?: number;

    // Market Data / Ownership
    beta?: number;
    heldPercentInsiders?: number;
    heldPercentInstitutions?: number;
    shortRatio?: number;
    shortPercentOfFloat?: number;
    sharesOutstanding?: number;
    floatShares?: number;

    // Company Officers
    officers?: {
        name: string;
        title: string;
        age?: number;
        totalPay?: number;
    }[];

    // Governance
    overallRisk?: number;
    auditRisk?: number;
    boardRisk?: number;
    compensationRisk?: number;

    // Comparison Data (Last 2 Years)
    comparison?: {
        years: string[];
        metrics: {
            [key: string]: (number | null)[];
        };
    };
    snapshotDate?: string;
}

export interface WishlistItem {
    id?: number;
    symbol: string;
    added_at?: string;
    initial_price: number;
    note?: string;
    snapshot?: Stock;
    current?: Stock;
}

export interface Sandbox {
    id: number;
    name: string;
    balance: number;
    initial_balance: number;
    total_equity: number;
    created_at: string;
    // Sharing fields
    owner_username?: string;
    owner_id?: number;
    permission?: 'owner' | 'watch' | 'edit';
    is_shared?: boolean;
    share_id?: number;
    share_count?: number;
}

export interface SandboxPortfolioItem {
    symbol: string;
    quantity: number;
    average_buy_price: number;
    current_price: number;
    current_value: number;
    gain_loss: number;
    gain_loss_percent: number;
}

export interface SandboxPortfolio {
    portfolio: SandboxPortfolioItem[];
    cash_balance: number;
    initial_balance: number;
    total_equity: number;
    equity_history?: { timestamp: number; value: number }[];
    permission?: string;
}

export interface SandboxTransaction {
    id: number;
    symbol: string;
    type: 'BUY' | 'SELL';
    quantity: number;
    price: number;
    created_at: string;
}

export interface SandboxShare {
    id: number;
    shared_with_id: number;
    shared_with_username: string;
    permission: 'watch' | 'edit';
    created_at: string;
}
