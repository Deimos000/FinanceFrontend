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
                    booking_text: t.booking_text,
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
                            booking_text: t.booking_text,
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

            // Log the result
            const totalTransactions = fetchedAccounts.reduce((sum, acc) => sum + acc.transactions.length, 0);
            console.log(`[useBankData] Fetched ${fetchedAccounts.length} accounts with ${totalTransactions} total transactions.`);
            fetchedAccounts.forEach(acc => {
                console.log(`[useBankData] Account ${acc.name} (${acc.bankName}): ${acc.transactions.length} transactions`);
            });

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

    return {
        accounts,
        loading,
        error,
        refreshAccounts,
        connectBank,
        processCode,
    };
}
