import { BACKEND_URL, api } from '@/utils/api';
import { Stock, Sandbox, SandboxPortfolio } from './types';

// --- Mappers ---

const mapChartDataToStock = (symbol: string, data: any): Stock | null => {
    const result = data.chart?.result?.[0];
    if (!result) return null;

    const meta = result.meta;
    const timestamps = result.timestamp || [];
    const indicators = result.indicators.quote[0];
    const closes = indicators.close || [];

    // Filter out null values (common in Yahoo data)
    const history = timestamps.map((t: number, i: number) => ({
        timestamp: t * 1000,
        value: closes[i]
    })).filter((item: any) => item.value != null);

    // Get current price (last valid close or regularMarketPrice)
    const currentPrice = meta.regularMarketPrice || (history.length > 0 ? history[history.length - 1].value : 0);
    const prevClose = meta.chartPreviousClose || meta.previousClose;

    return {
        symbol: meta.symbol,
        name: meta.longName || meta.shortName || meta.symbol,
        price: currentPrice,
        change: meta.snapshotDate ? (meta.currentPrice - meta.previousClose) : (currentPrice - prevClose),
        changePercent: meta.snapshotDate ? (meta.currentPrice - meta.previousClose) / meta.previousClose * 100 : (currentPrice - prevClose) / prevClose * 100,
        history: history,

        // Stock Details
        open: meta.regularMarketOpen,
        high: meta.regularMarketDayHigh,
        low: meta.regularMarketDayLow,
        fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh,
        fiftyTwoWeekLow: meta.fiftyTwoWeekLow,
        previousClose: prevClose,

        // Extended Details
        marketCap: meta.marketCap,
        volume: meta.volume,
        peRatio: meta.trailingPE,
        dividendYield: meta.dividendYield,
        sector: meta.sector,
        industry: meta.industry,
        employees: meta.fullTimeEmployees,
        website: meta.website,
        city: meta.city,
        country: meta.country,
        description: meta.longBusinessSummary,

        // Analyst Ratings
        recommendationKey: meta.recommendationKey,
        recommendationMean: meta.recommendationMean,
        numberOfAnalystOpinions: meta.numberOfAnalystOpinions,
        targetHighPrice: meta.targetHighPrice,
        targetLowPrice: meta.targetLowPrice,
        targetMeanPrice: meta.targetMeanPrice,
        targetMedianPrice: meta.targetMedianPrice,

        // Financial Ratios
        forwardPE: meta.forwardPE,
        priceToBook: meta.priceToBook,
        priceToSales: meta.priceToSalesTrailing12Months,
        enterpriseToEbitda: meta.enterpriseToEbitda,
        peRatioPEG: meta.trailingPegRatio,
        profitMargins: meta.profitMargins,
        grossMargins: meta.grossMargins,
        operatingMargins: meta.operatingMargins,
        ebitdaMargins: meta.ebitdaMargins,
        returnOnAssets: meta.returnOnAssets,
        returnOnEquity: meta.returnOnEquity,
        revenueGrowth: meta.revenueGrowth,
        earningsGrowth: meta.earningsGrowth,
        forwardEps: meta.forwardEps,
        payoutRatio: meta.payoutRatio,

        // Financial Health
        totalCash: meta.totalCash,
        totalDebt: meta.totalDebt,
        currentRatio: meta.currentRatio,
        quickRatio: meta.quickRatio,
        freeCashflow: meta.freeCashflow,
        operatingCashflow: meta.operatingCashflow,
        ebitdaValue: meta.ebitda,

        // Market Data / Ownership
        beta: meta.beta,
        heldPercentInsiders: meta.heldPercentInsiders,
        heldPercentInstitutions: meta.heldPercentInstitutions,
        shortRatio: meta.shortRatio,
        shortPercentOfFloat: meta.shortPercentOfFloat,
        sharesOutstanding: meta.sharesOutstanding,
        floatShares: meta.floatShares,

        // Officers & Risk
        officers: meta.companyOfficers,
        overallRisk: meta.overallRisk,
        auditRisk: meta.auditRisk,
        boardRisk: meta.boardRisk,
        compensationRisk: meta.compensationRisk,

        // Financial Comparison
        comparison: result.comparison,
        snapshotDate: meta.snapshotDate,
    };
};

// --- API Functions ---

/**
 * Search for stocks (Global support)
 */
export const searchStocks = async (query: string): Promise<Stock[]> => {
    if (!query) return [];

    try {
        console.log(`[API] Searching ${query} via /api/yahoo-proxy`);
        const data = await api(`/api/yahoo-proxy?type=search&query=${encodeURIComponent(query)}`);

        if (data.quotes && Array.isArray(data.quotes)) {
            return data.quotes
                .filter((q: any) => q.quoteType === 'EQUITY' || q.quoteType === 'ETF')
                .map((q: any) => ({
                    symbol: q.symbol,
                    name: q.shortname || q.longname || q.symbol,
                    price: 0, // Search returns partial data
                    change: 0,
                    changePercent: 0,
                    history: []
                }));
        }
        return [];
    } catch (e) {
        console.error("Search error:", e);
        return [];
    }
};



/**
 * Wishlist API
 */
export const getWishlist = async () => {
    try {
        const data = await api('/api/wishlist');
        return data.wishlist || [];
    } catch (e) {
        console.error("Get Wishlist Error:", e);
        return [];
    }
};

export const addToWishlist = async (symbol: string, initialPrice: number, note: string = "", snapshot: any = {}) => {
    try {
        await api('/api/wishlist', {
            method: 'POST',
            body: JSON.stringify({ symbol, initial_price: initialPrice, note, snapshot })
        });
        return true;
    } catch (e) {
        console.error("Add Wishlist Error:", e);
        return false;
    }
};

export const removeFromWishlist = async (symbol: string) => {
    try {
        await api(`/api/wishlist/${symbol}`, {
            method: 'DELETE'
        });
        return true;
    } catch (e) {
        console.error("Remove Wishlist Error:", e);
        return false;
    }
};

/**
 * Get detailed stock info + history
 */
export const getStockDetails = async (
    symbol: string,
    range: string = '1d',
    interval: string = '1d',
    start?: string,
    end?: string
): Promise<Stock | null> => {
    try {
        console.log(`[API] Fetching ${symbol} via proxy at /api/yahoo-proxy, start=${start}, end=${end}`);

        let url = `/api/yahoo-proxy?symbol=${encodeURIComponent(symbol)}&range=${range}&interval=${interval}`;
        if (start && end) {
            url += `&start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`;
        }

        const data = await api(url);

        if (data.error) throw new Error(data.details);

        return mapChartDataToStock(symbol, data);

    } catch (e) {
        console.error("Get Details Error:", e);
        return null;
    }
};

// Mock function for "Top Movers" or default list if needed
export const getMarketMovers = async (): Promise<Stock[]> => {
    try {
        const data = await api('/api/yahoo-proxy?type=market_movers');

        if (data.quotes && Array.isArray(data.quotes)) {
            return data.quotes.map((q: any) => ({
                symbol: q.symbol,
                name: q.name,
                price: q.price,
                change: q.change,
                changePercent: q.changePercent,
                history: [] // No history needed for the card
            }));
        }
        return [];
    } catch (e) {
        console.error("Get Market Movers Error:", e);
        return [];
    }
};

/**
 * Sandbox API
 */
export const createSandbox = async (name: string, balance: number = 10000): Promise<Sandbox | null> => {
    try {
        const data = await api('/api/sandbox', {
            method: 'POST',
            body: JSON.stringify({ name, balance })
        });
        return {
            id: data.id,
            name: data.name,
            balance: data.balance,
            initial_balance: balance,
            total_equity: balance,
            created_at: new Date().toISOString()
        };
    } catch (e) {
        console.error("Create Sandbox Error:", e);
        return null;
    }
};

export const getSandboxes = async (): Promise<Sandbox[]> => {
    try {
        console.log(`[API] Fetching sandboxes from /api/sandboxes`);
        const data = await api('/api/sandboxes');
        return data.sandboxes || [];
    } catch (e) {
        console.error("Get Sandboxes Error:", e);
        return [];
    }
};

export const deleteSandbox = async (id: number): Promise<boolean> => {
    try {
        await api(`/api/sandbox/${id}`, {
            method: 'DELETE'
        });
        return true;
    } catch (e) {
        console.error("Delete Sandbox Error:", e);
        return false;
    }
};

export const getSandboxPortfolio = async (id: number): Promise<SandboxPortfolio | null> => {
    try {
        return await api(`/api/sandbox/${id}/portfolio`);
    } catch (e) {
        console.error("Get Portfolio Error:", e);
        return null;
    }
};

// Basic Quote (Price + Change)
export const getStockQuote = async (symbol: string): Promise<Stock | null> => {
    try {
        const data = await api(`/api/yahoo-proxy?symbol=${encodeURIComponent(symbol)}&range=1d&interval=1d`);
        return mapChartDataToStock(symbol, data);
    } catch (e) {
        return null;
    }
};

export const tradeStock = async (sandboxId: number, symbol: string, type: 'BUY' | 'SELL', quantity?: number, amount?: number): Promise<boolean> => {
    try {
        const body: any = { symbol, type };
        if (quantity) body.quantity = quantity;
        if (amount) body.amount = amount;

        await api(`/api/sandbox/${sandboxId}/trade`, {
            method: 'POST',
            body: JSON.stringify(body)
        });
        return true;
    } catch (e) {
        console.error("Trade Error:", e);
        throw e;
    }
};

export const getSandboxTransactions = async (id: number): Promise<any[]> => {
    try {
        const data = await api(`/api/sandbox/${id}/transactions`);
        return data.transactions || [];
    } catch (e) {
        console.error("Get Transactions Error:", e);
        return [];
    }
};

/**
 * Sandbox Sharing API
 */
export const getSharedSandboxes = async (): Promise<Sandbox[]> => {
    try {
        const data = await api('/api/sandboxes/shared');
        return data.sandboxes || [];
    } catch (e) {
        console.error("Get Shared Sandboxes Error:", e);
        return [];
    }
};

export const getSandboxShares = async (sandboxId: number): Promise<any[]> => {
    try {
        const data = await api(`/api/sandbox/${sandboxId}/shares`);
        return data.shares || [];
    } catch (e) {
        console.error("Get Shares Error:", e);
        return [];
    }
};

export const shareSandbox = async (sandboxId: number, friendId: number, permission: 'watch' | 'edit'): Promise<boolean> => {
    try {
        await api(`/api/sandbox/${sandboxId}/share`, {
            method: 'POST',
            body: JSON.stringify({ friend_id: friendId, permission })
        });
        return true;
    } catch (e) {
        console.error("Share Sandbox Error:", e);
        return false;
    }
};

export const updateSandboxShare = async (sandboxId: number, shareId: number, permission: 'watch' | 'edit'): Promise<boolean> => {
    try {
        await api(`/api/sandbox/${sandboxId}/share/${shareId}`, {
            method: 'PUT',
            body: JSON.stringify({ permission })
        });
        return true;
    } catch (e) {
        console.error("Update Share Error:", e);
        return false;
    }
};

export const removeSandboxShare = async (sandboxId: number, shareId: number): Promise<boolean> => {
    try {
        await api(`/api/sandbox/${sandboxId}/share/${shareId}`, {
            method: 'DELETE'
        });
        return true;
    } catch (e) {
        console.error("Remove Share Error:", e);
        return false;
    }
};
