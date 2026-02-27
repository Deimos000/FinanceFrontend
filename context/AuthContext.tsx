import React, { createContext, useContext, useEffect, useState } from 'react';
import * as SecureStore from '../utils/storage';
import * as LocalAuthentication from 'expo-local-authentication';
import { Platform, DeviceEventEmitter } from 'react-native';
import { useSandboxStore } from '../app/(tabs)/stocks/_utils/sandboxStore';
import { fetchAccounts, bankingRefresh } from '../utils/api';

interface AuthContextType {
    token: string | null;
    userId: number | null;
    username: string | null;
    setAuth: (token: string, userId: number, username: string) => Promise<void>;
    logout: () => Promise<void>;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
    token: null,
    userId: null,
    username: null,
    setAuth: async () => { },
    logout: async () => { },
    isLoading: true,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [token, setTokenState] = useState<string | null>(null);
    const [userId, setUserId] = useState<number | null>(null);
    const [username, setUsername] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const performBackgroundSync = async () => {
        try {
            // Pre-load sandboxes
            await useSandboxStore.getState().loadSandboxes();
            const store = useSandboxStore.getState();
            // Pre-fetch chart data for all sandboxes
            store.sandboxes.forEach(sb => {
                store.loadPortfolio(sb.id);
            });
            store.sharedSandboxes.forEach(sb => {
                store.loadPortfolio(sb.id);
            });

            // Perform banking sync in the background
            console.log('[AuthContext] Background syncing bank accounts...');
            const data = await fetchAccounts();
            if (data && data.accounts && data.accounts.length > 0) {
                await bankingRefresh(data.accounts);
                console.log('[AuthContext] Background sync complete');
            } else {
                console.log('[AuthContext] No bank accounts to sync.');
            }
        } catch (e) {
            console.error('[AuthContext] Background sync failed:', e);
        }
    };

    useEffect(() => {
        const authListener = DeviceEventEmitter.addListener('onUnauthorized', () => {
            console.log('[AuthContext] Unauthorized event received, logging out');
            logout();
        });

        // Auto Refresh
        let interval: ReturnType<typeof setInterval>;
        if (token) {
            // Refresh every 1 hour (3600000 ms)
            interval = setInterval(() => {
                console.log('[AuthContext] Hourly background sync triggered');
                performBackgroundSync();
            }, 3600000);
        }

        return () => {
            authListener.remove();
            if (interval) clearInterval(interval);
        };
    }, [token]);

    useEffect(() => {
        const loadAuth = async () => {
            try {
                const storedToken = await SecureStore.getItemAsync('userToken');
                const storedUserId = await SecureStore.getItemAsync('userId');
                const storedUsername = await SecureStore.getItemAsync('username');

                if (storedToken) {
                    if (Platform.OS !== 'web') {
                        const hasHardware = await LocalAuthentication.hasHardwareAsync();
                        const isEnrolled = await LocalAuthentication.isEnrolledAsync();

                        if (hasHardware && isEnrolled) {
                            const result = await LocalAuthentication.authenticateAsync({
                                promptMessage: 'Unlock Finance App',
                                fallbackLabel: 'Use Password',
                                cancelLabel: 'Cancel',
                            });

                            if (!result.success) {
                                // Authentication failed or cancelled; clear tokens and force login
                                await SecureStore.deleteItemAsync('userToken');
                                await SecureStore.deleteItemAsync('userId');
                                await SecureStore.deleteItemAsync('username');
                                setTokenState(null);
                                setUserId(null);
                                setUsername(null);
                                return;
                            }
                        }
                    }

                    // On web or successful biometric auth (or if biometric isn't available)
                    setTokenState(storedToken);
                    setUserId(storedUserId ? parseInt(storedUserId) : null);
                    setUsername(storedUsername);

                    // Perform background sync right after login finishes
                    performBackgroundSync();
                }
            } catch (e) {
                console.error("Failed to load auth state", e);
            } finally {
                setIsLoading(false);
            }
        };

        loadAuth();
    }, []);

    const setAuth = async (newToken: string, newUserId: number, newUsername: string) => {
        await SecureStore.setItemAsync('userToken', newToken);
        await SecureStore.setItemAsync('userId', newUserId.toString());
        await SecureStore.setItemAsync('username', newUsername);

        setTokenState(newToken);
        setUserId(newUserId);
        setUsername(newUsername);

        // Run background tasks on manual login as well
        performBackgroundSync();
    };

    const logout = async () => {
        await SecureStore.deleteItemAsync('userToken');
        await SecureStore.deleteItemAsync('userId');
        await SecureStore.deleteItemAsync('username');

        setTokenState(null);
        setUserId(null);
        setUsername(null);
    };

    return (
        <AuthContext.Provider value={{ token, userId, username, setAuth, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};
