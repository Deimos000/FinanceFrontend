/**
 * Centralized API service for the Finance Backend.
 *
 * All frontend code should import from here instead of calling local
 * databases or Expo API routes.
 *
 * In development: BACKEND_URL = http://localhost:5000
 * In production : BACKEND_URL = your Cloud Run URL
 */

import { Platform } from 'react-native';

// ── Configure your backend URL here ─────────────────────
// On Android emulator localhost maps differently, use 10.0.2.2
const DEV_URL =
    Platform.OS === 'android'
        ? 'http://10.0.2.2:5000'
        : 'http://localhost:5000';

export const BACKEND_URL = 'https://financebackend-331581307981.europe-west1.run.app';
// For production, replace with your Cloud Run URL:
// export const BACKEND_URL = 'https://your-cloud-run-url.run.app';

// ── Generic fetch helper ─────────────────────────────────

async function api<T = any>(
    path: string,
    options: RequestInit = {},
): Promise<T> {
    const url = `${BACKEND_URL}${path}`;
    const res = await fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(options.headers || {}),
        },
    });

    if (!res.ok) {
        const body = await res.text();
        throw new Error(`API ${res.status}: ${body}`);
    }

    return res.json();
}

// ── Accounts ─────────────────────────────────────────────

export const fetchAccounts = () =>
    api<{ accounts: any[] }>('/api/accounts');

export const upsertAccount = (account: any) =>
    api('/api/accounts', { method: 'POST', body: JSON.stringify(account) });

export const deleteAccount = (accountId: string) =>
    api(`/api/accounts/${accountId}`, { method: 'DELETE' });

// ── Transactions ─────────────────────────────────────────

export const fetchTransactions = (accountId?: string, days?: number) => {
    const params = new URLSearchParams();
    if (accountId) params.set('account_id', accountId);
    if (days) params.set('days', String(days));
    return api<{ transactions: any[] }>(`/api/transactions?${params}`);
};

export const fetchDailySpending = (days = 30) =>
    api<{ date: string; amount: number }[]>(
        `/api/transactions/daily-spending?days=${days}`,
    );

export const fetchMonthlyIncome = (months = 6) =>
    api<{ month: string; amount: number }[]>(
        `/api/transactions/monthly-income?months=${months}`,
    );

// ── Categories ───────────────────────────────────────────

export const fetchCategories = () =>
    api<{ name: string; color: string; icon: string; total: number }[]>(
        '/api/categories',
    );

// ── Debts ────────────────────────────────────────────────

export const fetchDebtsSummary = () =>
    api<any[]>('/api/debts?type=summary');

export const fetchDebtsList = (filter?: 'OWED_BY_ME' | 'OWED_TO_ME') => {
    const params = filter ? `&filter=${filter}` : '';
    return api<any[]>(`/api/debts?type=list${params}`);
};

export const createPerson = (name: string) =>
    api('/api/debts', {
        method: 'POST',
        body: JSON.stringify({ action: 'create_person', name }),
    });

export const createDebt = (
    person_id: number,
    type: 'OWED_BY_ME' | 'OWED_TO_ME',
    amount: number,
    description: string,
) =>
    api('/api/debts', {
        method: 'POST',
        body: JSON.stringify({
            action: 'create_debt',
            person_id,
            type,
            amount,
            description,
        }),
    });

export const createSubDebt = (
    debt_id: number,
    amount: number,
    note: string,
) =>
    api<{ id: number; deleted: boolean }>('/api/debts', {
        method: 'POST',
        body: JSON.stringify({ action: 'create_sub_debt', debt_id, amount, note }),
    });

export const deleteDebt = (debtId: number) =>
    api(`/api/debts/${debtId}`, { method: 'DELETE' });

// ── Cash Account ─────────────────────────────────────────

export const fetchCashAccount = () =>
    api<any>('/api/cash/account');

export const createCashAccount = () =>
    api<any>('/api/cash/account', { method: 'POST' });

export const updateCashBalance = (balance: number) =>
    api('/api/cash/balance', {
        method: 'PUT',
        body: JSON.stringify({ balance }),
    });

export const addCashTransaction = (tx: {
    amount: number;
    name?: string;
    description?: string;
}) =>
    api('/api/cash/transaction', { method: 'POST', body: JSON.stringify(tx) });

// ── Banking (Enable Banking) ─────────────────────────────

export const bankingAuthUrl = (bankName: string) =>
    api<{ url: string }>('/api/banking/auth-url', {
        method: 'POST',
        body: JSON.stringify({ bankName }),
    });

export const bankingSession = (code: string) =>
    api<{ accounts: any[] }>('/api/banking/session', {
        method: 'POST',
        body: JSON.stringify({ code }),
    });

export const bankingRefresh = (accounts: any[]) =>
    api<{ accounts: any[] }>('/api/banking/refresh', {
        method: 'POST',
        body: JSON.stringify({ accounts }),
    });

// ── Yahoo Finance Proxy ──────────────────────────────────

export const yahooSearch = (q: string) =>
    api(`/api/yahoo-proxy?type=search&query=${encodeURIComponent(q)}`);

export const yahooQuote = (
    symbol: string,
    interval = '1d',
    range = '1y',
) =>
    api(
        `/api/yahoo-proxy?type=quote&symbol=${symbol}&interval=${interval}&range=${range}`,
    );
