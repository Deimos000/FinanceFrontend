import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import {
    fetchAccounts as apiFetchAccounts,
    fetchCashAccount,
    bankingAuthUrl,
    bankingSession,
    bankingRefresh,
} from '@/utils/api';

export interface Transaction {
    id: string;
    date: string;
    amount: number;
    currency: string;
    description: string;
    recipient: string;
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

export function useBankData() {
    const [accounts, setAccounts] = useState<BankAccount[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchAccountsFromServer = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            // Fetch bank accounts from Flask backend
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
                })),
            }));

            // Fetch cash account separately & merge
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
                        })),
                    };

                    // Only add if not already present
                    if (!fetchedAccounts.find(a => a.id === 'CASH_ACCOUNT')) {
                        fetchedAccounts.push(cashMapped);
                    }
                }
            } catch {
                // Cash account may not exist yet, that's fine
            }

            setAccounts(fetchedAccounts);
        } catch (err) {
            console.error('[useBankData] Failed to fetch bank data:', err);
            setError('Failed to load accounts. Please try again.');
        } finally {
            setLoading(false);
        }
    }, []);

    const connectBank = async (bankName: string) => {
        try {
            setLoading(true);
            const data = await bankingAuthUrl(bankName);
            if (data.url) {
                await WebBrowser.openBrowserAsync(data.url);
            } else {
                setError('Failed to get auth URL');
            }
        } catch (err) {
            console.error('Connection failed:', err);
            setError('Connection failed');
        } finally {
            setLoading(false);
        }
    };

    const processCode = async (code: string) => {
        try {
            setLoading(true);
            const data = await bankingSession(code);
            if (data.accounts) {
                await fetchAccountsFromServer();
            }
        } catch (err) {
            console.error('Auth processing failed:', err);
            setError('Authentication failed');
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

    return {
        accounts,
        loading,
        error,
        refreshAccounts,
        connectBank,
        processCode,
    };
}
