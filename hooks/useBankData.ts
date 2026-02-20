import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import {
    fetchAccounts as apiFetchAccounts,
    fetchCashAccount,
    bankingAuthUrl,
    bankingSession,
    bankingRefresh,
    bankingSearchBanks,
    deleteAccount as apiDeleteAccount,
} from '@/utils/api';

export interface Transaction {
    id: string;
    date: string;
    amount: number;
    currency: string;
    description: string;
    recipient: string;
    booking_text?: string;
}

export interface BankAccount {
    id: string;
    name: string;
    iban: string;
    balance: number;
    currency: string;
    bankName: 'Commerzbank' | 'N26' | 'Other';
    transactions: Transaction[];
}

export interface BankResult {
    name: string;
    country: string;
    logo?: string;
    bic?: string;
}

export function useBankData() {
    const [accounts, setAccounts] = useState<BankAccount[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Bank search state
    const [bankResults, setBankResults] = useState<BankResult[]>([]);
    const [bankSearchLoading, setBankSearchLoading] = useState(false);
    const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const fetchAccountsFromServer = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const data = await apiFetchAccounts();
            let fetchedAccounts: BankAccount[] = (data.accounts || []).map((acc: any) => ({
                id: acc.account_id || acc.id,
                name: acc.name,
                iban: acc.iban || '',
                balance: acc.balance,
                currency: acc.currency || 'EUR',
                bankName: acc.bankName || acc.bank_name || 'Other',
                transactions: (acc.transactions || []).map((t: any) => ({
                    id: t.transaction_id || t.id,
                    date: t.date || t.booking_date,
                    amount: t.amount,
                    currency: t.currency || 'EUR',
                    description: t.description || t.remittance_information || '',
                    recipient: t.recipient || t.creditor_name || t.debtor_name || 'Unknown',
                    booking_text: t.booking_text,
                })),
            }));

            try {
                const cashAcc = await fetchCashAccount();
                if (cashAcc) {
                    const cashMapped: BankAccount = {
                        id: cashAcc.account_id,
                        name: cashAcc.name || 'Cash Account',
                        iban: cashAcc.iban || 'N/A',
                        balance: cashAcc.balance,
                        currency: cashAcc.currency || 'EUR',
                        bankName: 'Other',
                        transactions: (cashAcc.transactions || []).map((t: any) => ({
                            id: t.id,
                            date: t.booking_date,
                            amount: t.amount,
                            currency: t.currency || 'EUR',
                            description: t.description || '',
                            recipient: t.name || 'Cash',
                            booking_text: t.booking_text,
                        })),
                    };

                    if (!fetchedAccounts.find(a => a.id === 'CASH_ACCOUNT')) {
                        fetchedAccounts.push(cashMapped);
                    }
                }
            } catch {
                // Cash account may not exist yet
            }

            const totalTransactions = fetchedAccounts.reduce((sum, acc) => sum + acc.transactions.length, 0);
            console.log(`[useBankData] Fetched ${fetchedAccounts.length} accounts with ${totalTransactions} total transactions.`);

            setAccounts(fetchedAccounts);
        } catch (err) {
            console.error('[useBankData] Failed to fetch bank data:', err);
            setError('Failed to load accounts. Please try again.');
        } finally {
            setLoading(false);
        }
    }, []);

    /** Debounced bank search — clears results if query is empty */
    const searchBanks = useCallback((query: string, country = 'DE') => {
        if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);

        if (!query.trim()) {
            setBankResults([]);
            return;
        }

        setBankSearchLoading(true);
        searchDebounceRef.current = setTimeout(async () => {
            try {
                const data = await bankingSearchBanks(query.trim(), country);
                setBankResults(data.banks || []);
            } catch (err) {
                console.error('[useBankData] Bank search failed:', err);
                setBankResults([]);
            } finally {
                setBankSearchLoading(false);
            }
        }, 350);
    }, []);

    /** Connect a bank by ASPSP name. On web, same-tab redirect; on native, opens browser. */
    const connectBank = async (bankName: string, country = 'DE') => {
        try {
            setLoading(true);

            // Determine redirect URL
            let redirectUrl: string | undefined;
            if (Platform.OS === 'web') {
                // Use the current page URL (without query params) as the redirect target
                // ensure we remove any existing ?code= or other params to avoid confusion
                redirectUrl = window.location.origin + window.location.pathname;
            } else {
                // For mobile, we'd typically use a custom scheme or deep link.
                // If not set, the backend default (localhost) or .env value will be used.
                // You might use Linking.createURL('/accounts') here if using Expo Linking.
                // For now, let's leave it undefined to let backend decide, or set a mobile-specific one if known.
            }

            console.log('[connectBank] Initiating auth with redirectUrl:', redirectUrl);

            const data = await bankingAuthUrl(bankName, country, redirectUrl);
            if (data.url) {
                if (Platform.OS === 'web') {
                    // Same-tab redirect – the ?code= handler in useEffect will process the return
                    window.location.href = data.url;
                } else {
                    await WebBrowser.openBrowserAsync(data.url);
                }
            } else {
                setError('Failed to get auth URL');
            }
        } catch (err: any) {
            console.error('Connection failed:', err);
            // If the backend sent back the debug info, show it
            const debugInfo = err?.message && err.message.includes('API 400') ? 'Check console for Redirect URI mismatch' : '';
            setError(`Connection failed: ${err.message || 'Unknown error'}. ${debugInfo}`);
        } finally {
            setLoading(false);
        }
    };

    const processCode = async (code: string) => {
        try {
            setLoading(true);
            setError(null);
            console.log('[useBankData] processCode called with code prefix:', code.substring(0, 20));
            const data = await bankingSession(code);
            console.log('[useBankData] bankingSession response:', JSON.stringify(data).substring(0, 500));
            if (data.accounts && data.accounts.length > 0) {
                console.log(`[useBankData] Got ${data.accounts.length} accounts, refreshing from server...`);
                await fetchAccountsFromServer();
            } else {
                console.warn('[useBankData] bankingSession returned no accounts');
                setError('No accounts were returned from the bank. Please try again.');
            }
            if ((data as any).errors && (data as any).errors.length > 0) {
                console.error('[useBankData] Partial errors:', (data as any).errors);
                setError(`Some accounts had errors: ${(data as any).errors.map((e: any) => e.error).join(', ')}`);
            }
        } catch (err: any) {
            console.error('Auth processing failed:', err);
            const msg = err?.message || String(err);
            if (msg.includes('ALREADY_AUTHORIZED')) {
                setError('This authorization code was already used. Please reconnect your bank to get a new code.');
            } else {
                setError(`Authentication failed: ${msg.substring(0, 120)}`);
            }
        } finally {
            setLoading(false);
        }
    };

    // Check for code in URL (Web handling)
    useEffect(() => {
        if (Platform.OS === 'web') {
            console.log('[useBankData] Checking URL for code:', window.location.search);
            const params = new URLSearchParams(window.location.search);
            const code = params.get('code');
            if (code) {
                console.log('[useBankData] Found code, processing:', code);
                window.history.replaceState({}, '', window.location.pathname);
                processCode(code);
            } else {
                console.log('[useBankData] No code found in URL');
            }
        }
    }, []);

    useEffect(() => {
        fetchAccountsFromServer();
    }, [fetchAccountsFromServer]);

    const refreshAccounts = async () => {
        try {
            setLoading(true);
            await bankingRefresh(accounts);
            await fetchAccountsFromServer();
        } catch (e) {
            console.error('[useBankData] Refresh error:', e);
        } finally {
            setLoading(false);
        }
    };

    const removeAccount = async (accountId: string) => {
        try {
            setLoading(true);
            await apiDeleteAccount(accountId);
            await fetchAccountsFromServer();
        } catch (e) {
            console.error('[useBankData] Delete error:', e);
            setError('Failed to delete account.');
        } finally {
            setLoading(false);
        }
    };

    return {
        accounts,
        loading,
        error,
        refreshAccounts,
        connectBank,
        processCode,
        searchBanks,
        bankResults,
        bankSearchLoading,
        removeAccount,
    };
}
