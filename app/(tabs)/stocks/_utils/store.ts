import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface StockStore {
    watchlist: string[];
    addToWatchlist: (symbol: string) => void;
    removeFromWatchlist: (symbol: string) => void;
    isWatched: (symbol: string) => boolean;
}

export const useStockStore = create<StockStore>()(
    persist(
        (set, get) => ({
            watchlist: ['AAPL', 'TSLA', 'NVDA', 'BTC-USD'],
            addToWatchlist: (symbol) => set({ watchlist: [...get().watchlist, symbol] }),
            removeFromWatchlist: (symbol) =>
                set({ watchlist: get().watchlist.filter((s) => s !== symbol) }),
            isWatched: (symbol) => get().watchlist.includes(symbol),
        }),
        {
            name: 'stock-storage-v2', // unique name
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
