import React, { createContext, useContext, useEffect, useState } from 'react';
import * as SecureStore from '../utils/storage';

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

    useEffect(() => {
        const loadAuth = async () => {
            try {
                const storedToken = await SecureStore.getItemAsync('userToken');
                const storedUserId = await SecureStore.getItemAsync('userId');
                const storedUsername = await SecureStore.getItemAsync('username');

                if (storedToken) {
                    setTokenState(storedToken);
                    setUserId(storedUserId ? parseInt(storedUserId) : null);
                    setUsername(storedUsername);
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
