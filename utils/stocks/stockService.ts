import { Stock } from './types';

// Helper to generate smooth random curves (Random Walk)
const generateHistory = (startPrice: number) => {
    let price = startPrice;
    const data = [];
    const now = Date.now();
    for (let i = 50; i > 0; i--) {
        const change = (Math.random() - 0.5) * (startPrice * 0.02);
        price += change;
        data.push({ timestamp: now - i * 3600 * 1000, value: price });
    }
    return data;
};

const STOCKS_DB: Record<string, Stock> = {
    AAPL: { symbol: 'AAPL', name: 'Apple Inc.', price: 175.43, change: 2.34, changePercent: 1.35, currency: 'USD', marketCap: '2.7T', volume: '54M', peRatio: 28.5, history: generateHistory(175) },
    TSLA: { symbol: 'TSLA', name: 'Tesla, Inc.', price: 243.12, change: -5.67, changePercent: -2.28, currency: 'USD', marketCap: '780B', volume: '102M', peRatio: 65.2, history: generateHistory(243) },
    NVDA: { symbol: 'NVDA', name: 'NVIDIA Corp.', price: 890.00, change: 12.50, changePercent: 1.42, currency: 'USD', marketCap: '2.2T', volume: '45M', peRatio: 72.1, history: generateHistory(890) },
    MSFT: { symbol: 'MSFT', name: 'Microsoft', price: 402.10, change: 1.10, changePercent: 0.27, currency: 'USD', marketCap: '3.0T', volume: '22M', peRatio: 35.4, history: generateHistory(402) },
    AMZN: { symbol: 'AMZN', name: 'Amazon.com', price: 178.20, change: -0.90, changePercent: -0.50, currency: 'USD', marketCap: '1.8T', volume: '33M', peRatio: 55.2, history: generateHistory(178) },
};

export const getStockDetails = async (symbol: string): Promise<Stock | null> => {
    // Simulate network latency for "real feel"
    await new Promise((r) => setTimeout(r, 600));
    return STOCKS_DB[symbol] || null;
};

export const searchStocks = async (query: string): Promise<Stock[]> => {
    await new Promise((r) => setTimeout(r, 300));
    if (!query) return Object.values(STOCKS_DB);
    return Object.values(STOCKS_DB).filter(
        (s) => s.symbol.includes(query.toUpperCase()) || s.name.toLowerCase().includes(query.toLowerCase())
    );
};
