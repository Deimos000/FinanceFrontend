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
import * as SecureStore from './storage';

// ── Configure your backend URL here ─────────────────────
// On Android emulator localhost maps differently, use 10.0.2.2
const DEV_URL =
    Platform.OS === 'android'
        ? 'http://10.0.2.2:5000'
        : 'http://localhost:5000';

// In Expo Web, process.env.EXPO_PUBLIC_* variables are inlined at build time.
// Cloud Run -> use production URL from .env
// Development -> fallback to DEV_URL
export const BACKEND_URL = process.env.EXPO_PUBLIC_API_URL || DEV_URL;

// ── Generic fetch helper ─────────────────────────────────

export async function api<T = any>(
    path: string,
    options: RequestInit = {},
): Promise<T> {
    const url = `${BACKEND_URL}${path}`;

    // Get token from secure store
    let token = null;
    try {
        token = await SecureStore.getItemAsync('userToken');
    } catch (e) {
        console.warn("Failed to get token", e);
    }

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string> || {}),
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(url, {
        ...options,
        headers,
    });

    if (!res.ok) {
        const body = await res.text();
        throw new Error(`API ${res.status}: ${body}`);
    }

    return res.json();
}

// ── Settings ─────────────────────────────────────────────
export const fetchSettings = () =>
    api<{ gemini_api_key?: string }>('/auth/settings');

export const updateSettings = (gemini_api_key: string) =>
    api('/auth/settings', {
        method: 'PUT',
        body: JSON.stringify({ gemini_api_key }),
    });

// ── Accounts ─────────────────────────────────────────────

export const fetchAccounts = () =>
    api<{ accounts: any[] }>('/api/accounts');

export const upsertAccount = (account: any) =>
    api('/api/accounts', { method: 'POST', body: JSON.stringify(account) });

export const deleteAccount = (accountId: string) =>
    api(`/api/accounts/${accountId}`, { method: 'DELETE' });

// ── Transactions ─────────────────────────────────────────

export const fetchTransactions = (accountId?: string, days?: number, startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (accountId) params.set('account_id', accountId);
    if (startDate) params.set('start_date', startDate);
    if (endDate) params.set('end_date', endDate);
    if (days && !startDate) params.set('days', String(days));
    return api<{ transactions: any[] }>(`/api/transactions?${params}`);
};

export const fetchUncategorizedTransactions = () =>
    api<{ transactions: any[] }>('/api/transactions?uncategorized=true&days=90');

export const fetchDailySpending = (startDate: string, endDate: string) =>
    api<{ date: string; amount: number }[]>(
        `/api/transactions/daily-spending?start_date=${startDate}&end_date=${endDate}`,
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

export const createCategory = (category: { name: string; color: string; icon: string }) =>
    api('/api/categories', {
        method: 'POST',
        body: JSON.stringify(category),
    });

// ── Statistics ───────────────────────────────────────────

export const fetchCategorySpending = (startDate: string, endDate: string) =>
    api<{ name: string; value: number; color: string; icon: string }[]>(
        `/api/stats/category-spending?start_date=${startDate}&end_date=${endDate}`
    );

export const fetchCategoryTrends = (startDate: string, endDate: string) =>
    api<Record<string, { date: string; amount: number }[]>>
        (`/api/stats/category-trends?start_date=${startDate}&end_date=${endDate}`
        );

export const triggerCategorization = () =>
    api<{ message: string; processed: number; updated: number; details: any }>(
        '/api/stats/categorize',
        { method: 'POST' }
    );

export const fetchMonthlyCashflow = (months = 6) =>
    api<{ month: string; income: number; spending: number }[]>(
        `/api/stats/monthly-cashflow?months=${months}`
    );

// ── Budget ────────────────────────────────────────────────

export const fetchBudgetSettings = () =>
    api<{ monthly_income: number }>('/api/budget/settings');

export const updateBudgetSettings = (monthly_income: number) =>
    api('/api/budget/settings', {
        method: 'PUT',
        body: JSON.stringify({ monthly_income }),
    });

export const fetchCategoryBudgets = () =>
    api<{ name: string; color: string; icon: string; monthly_budget: number }[]>(
        '/api/budget/categories'
    );

export const updateCategoryBudget = (categoryName: string, monthly_budget: number) =>
    api(`/api/budget/categories/${encodeURIComponent(categoryName)}`, {
        method: 'PUT',
        body: JSON.stringify({ monthly_budget }),
    });

export const updateTransactionCategory = (transactionId: string, category: string) =>
    api(`/api/transactions/${transactionId}`, {
        method: 'PATCH',
        body: JSON.stringify({ category }),
    });

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

export const bankingSearchBanks = (query: string, country = 'DE') =>
    api<{ banks: { name: string; country: string; logo?: string; bic?: string }[] }>(
        `/api/banking/search-banks?query=${encodeURIComponent(query)}&country=${encodeURIComponent(country)}`
    );

export const bankingAuthUrl = (bankName: string, country = 'DE', redirectUrl?: string) =>
    api<{ url: string }>('/api/banking/auth-url', {
        method: 'POST',
        body: JSON.stringify({ bankName, country, redirectUrl }),
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

// ── Friends ──────────────────────────────────────────────

export const searchUsers = (q: string) =>
    api<{ users: { id: number; username: string }[] }>(
        `/api/friends/search?q=${encodeURIComponent(q)}`
    );

export const sendFriendRequest = (username: string) =>
    api<{ ok: boolean; message: string }>('/api/friends/request', {
        method: 'POST',
        body: JSON.stringify({ username }),
    });

export const getFriendRequests = () =>
    api<{
        incoming: { id: number; requester_id: number; requester_username: string; created_at: string }[];
        outgoing: { id: number; addressee_id: number; addressee_username: string; created_at: string }[];
    }>('/api/friends/requests');

export const respondToFriendRequest = (friendshipId: number, action: 'accept' | 'reject') =>
    api<{ ok: boolean; status: string }>('/api/friends/respond', {
        method: 'POST',
        body: JSON.stringify({ friendship_id: friendshipId, action }),
    });

export const getFriends = () =>
    api<{ friends: { friendship_id: number; friend_id: number; friend_username: string; since: string }[] }>(
        '/api/friends'
    );

export const removeFriend = (friendshipId: number) =>
    api(`/api/friends/${friendshipId}`, { method: 'DELETE' });
