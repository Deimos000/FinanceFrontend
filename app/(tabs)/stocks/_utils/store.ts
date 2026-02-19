
import { create } from 'zustand';
import { addToWishlist as apiAdd, removeFromWishlist as apiRemove, getWishlist as apiGet, getStockDetails } from './api';
import { WishlistItem } from './types';

interface StockStore {
    watchlist: WishlistItem[];
    loading: boolean;
    loadWishlist: () => Promise<void>;
    addToWatchlist: (symbol: string, price: number, snapshot?: any) => Promise<void>;
    removeFromWatchlist: (symbol: string) => Promise<void>;
    isWatched: (symbol: string) => boolean;
}

export const useStockStore = create<StockStore>((set, get) => ({
    watchlist: [],
    loading: false,

    loadWishlist: async () => {
        set({ loading: true });
        const items = await apiGet();
        // Set initial DB data (snapshots)
        set({ watchlist: items, loading: false });

        // Fetch fresh data for each item
        const updatedItems = await Promise.all(items.map(async (item: WishlistItem) => {
            try {
                // Fetch 1d data with 15m interval to ensure we have enough points for the sparkline
                const currentData = await getStockDetails(item.symbol, '1d', '15m');
                if (currentData) {
                    return { ...item, current: currentData };
                }
            } catch (e) {
                console.error(`Failed to refresh ${item.symbol}`, e);
            }
            return item;
        }));

        set({ watchlist: updatedItems });
    },

    addToWatchlist: async (symbol, price, snapshot) => {
        // Optimistic update
        const tempItem: WishlistItem = {
            symbol,
            initial_price: price,
            snapshot,
            added_at: new Date().toISOString()
        };
        set(state => ({ watchlist: [tempItem, ...state.watchlist] }));

        await apiAdd(symbol, price, "", snapshot);

        // Refresh to get real ID/data
        const items = await apiGet();
        set({ watchlist: items });
    },

    removeFromWatchlist: async (symbol) => {
        set(state => ({ watchlist: state.watchlist.filter(i => i.symbol !== symbol) }));
        await apiRemove(symbol);
    },

    isWatched: (symbol) => {
        return get().watchlist.some(i => i.symbol === symbol);
    }
}));
