import { create } from 'zustand';
import { getSandboxes, getSharedSandboxes, getSandboxPortfolio, Sandbox, SandboxPortfolio } from './api';

interface SandboxStore {
    sandboxes: Sandbox[];
    sharedSandboxes: Sandbox[];
    portfolioCache: Record<number, SandboxPortfolio>;
    loading: boolean;
    loadSandboxes: () => Promise<void>;
    loadPortfolio: (id: number) => Promise<SandboxPortfolio | null>;
    clearCache: () => void;
}

export const useSandboxStore = create<SandboxStore>((set, get) => ({
    sandboxes: [],
    sharedSandboxes: [],
    portfolioCache: {},
    loading: false,

    loadSandboxes: async () => {
        set({ loading: true });
        try {
            const [data, shared] = await Promise.all([
                getSandboxes(),
                getSharedSandboxes()
            ]);
            set({ sandboxes: data, sharedSandboxes: shared });
        } catch (e) {
            console.error("Failed to load sandboxes", e);
        } finally {
            set({ loading: false });
        }
    },

    loadPortfolio: async (id: number) => {
        // Return cached instantly if available, then refresh silently
        const cached = get().portfolioCache[id];

        try {
            const fresh = await getSandboxPortfolio(id);
            if (fresh) {
                set(state => ({
                    portfolioCache: {
                        ...state.portfolioCache,
                        [id]: fresh
                    }
                }));
                return fresh;
            }
        } catch (e) {
            console.error(`Failed to fetch portfolio ${id}`, e);
        }
        return cached || null;
    },

    clearCache: () => {
        set({ sandboxes: [], sharedSandboxes: [], portfolioCache: {} });
    }
}));
