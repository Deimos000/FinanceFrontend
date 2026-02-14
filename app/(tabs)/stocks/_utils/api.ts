import { BACKEND_URL } from '@/utils/api';

export interface Stock {
    symbol: string;
    name: string;
    price: number;
    change: number;
    changePercent: number;
    currency: string;
    exchange: string;
    previousClose: number;
    open: number;
    high: number;
    low: number;
    fiftyTwoWeekHigh: number;
    fiftyTwoWeekLow: number;
    history: { timestamp: number; value: number }[];
}

const API_BASE_URL = `${BACKEND_URL}/api/yahoo-proxy`;

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
        change: currentPrice - prevClose,
        changePercent: (currentPrice - prevClose) / prevClose * 100,
        currency: meta.currency,
        exchange: meta.exchangeName,
        previousClose: prevClose,
        open: meta.regularMarketOpen,
        high: meta.regularMarketDayHigh,
        low: meta.regularMarketDayLow,
        fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh,
        fiftyTwoWeekLow: meta.fiftyTwoWeekLow,
        history: history
    };
};

// --- API Functions ---

/**
 * Search for stocks (Global support)
 */
export const searchStocks = async (query: string): Promise<Stock[]> => {
    if (!query) return [];

    try {
        console.log(`[API] Searching ${query} via ${API_BASE_URL}`);
        const res = await fetch(`${API_BASE_URL}?type=search&query=${encodeURIComponent(query)}`);
        if (!res.ok) throw new Error('Search failed');

        const data = await res.json();

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
 * Get detailed stock info + history
 */
export const getStockDetails = async (symbol: string, range: string = '1d', interval: string = '1d'): Promise<Stock | null> => {
    try {
        console.log(`[API] Fetching ${symbol} via proxy at ${API_BASE_URL}`);

        const res = await fetch(`${API_BASE_URL}?symbol=${encodeURIComponent(symbol)}&range=${range}&interval=${interval}`);

        if (!res.ok) {
            const text = await res.text();
            throw new Error(`Proxy error: ${res.status} ${text}`);
        }

        const data = await res.json();

        if (data.error) throw new Error(data.details);

        return mapChartDataToStock(symbol, data);

    } catch (e) {
        console.error("Get Details Error:", e);
        return null;
    }
};

// Mock function for "Top Movers" or default list if needed
export const getMarketMovers = async (): Promise<Stock[]> => {
    // Yahoo doesn't have a simple "market movers" public endpoint that is stable without scraping.
    // We can fetch a few default tech stocks as a placeholder.
    const defaults = ['AAPL', 'MSFT', 'GOOG', 'AMZN', 'TSLA'];
    const results = await Promise.all(defaults.map(s => getStockDetails(s)));
    return results.filter(s => s !== null) as Stock[];
};
