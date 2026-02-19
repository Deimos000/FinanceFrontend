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
// export const BACKEND_URL = 'http://localhost:5000';

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
