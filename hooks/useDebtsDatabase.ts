import { useState, useCallback, useEffect } from 'react';
import { Alert } from 'react-native';
import {
    fetchDebtsSummary,
    fetchDebtsList,
    createPerson,
    createDebt,
    createSubDebt,
    deleteDebt as apiDeleteDebt,
} from '@/utils/api';

export interface Person {
    id: number;
    name: string;
    created_at: string;
    netBalance: number;
}

export interface SubDebt {
    id: number;
    debt_id: number;
    amount: number;
    note: string;
    created_at: string;
}

export interface Debt {
    id: number;
    person_id: number;
    person_name: string;
    type: 'OWED_BY_ME' | 'OWED_TO_ME';
    amount: number;
    currency: string;
    description: string;
    created_at: string;
    paid_amount: number;
    remaining_amount: number;
    sub_debts: SubDebt[];
}

export function useDebtsDatabase() {
    const [isReady, setIsReady] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Mark ready immediately – no local DB init needed
    useEffect(() => {
        setIsReady(true);
    }, []);

    const getPeopleSummary = useCallback(async (): Promise<Person[]> => {
        try {
            return await fetchDebtsSummary();
        } catch (e: any) {
            setError(e.message);
            return [];
        }
    }, []);

    const getDebtsList = useCallback(
        async (filter?: 'OWED_BY_ME' | 'OWED_TO_ME'): Promise<Debt[]> => {
            try {
                return await fetchDebtsList(filter);
            } catch (e: any) {
                setError(e.message);
                return [];
            }
        },
        [],
    );

    const createPersonHook = useCallback(
        async (name: string): Promise<{ id: number; name: string }> => {
            return await createPerson(name);
        },
        [],
    );

    const createDebtHook = useCallback(
        async (
            person_id: number,
            type: 'OWED_BY_ME' | 'OWED_TO_ME',
            amount: number,
            description: string,
        ): Promise<{ id: number }> => {
            return await createDebt(person_id, type, amount, description);
        },
        [],
    );

    const createSubDebtHook = useCallback(
        async (
            debt_id: number,
            amount: number,
            note: string,
        ): Promise<{ id: number; deleted?: boolean }> => {
            return await createSubDebt(debt_id, amount, note);
        },
        [],
    );

    const getTotals = useCallback(async (): Promise<{
        iOwe: number;
        owedToMe: number;
    }> => {
        try {
            const people = await fetchDebtsSummary();
            let iOwe = 0;
            let owedToMe = 0;
            for (const p of people) {
                if (p.netBalance > 0) owedToMe += p.netBalance;
                else if (p.netBalance < 0) iOwe += Math.abs(p.netBalance);
            }
            return { iOwe, owedToMe };
        } catch {
            return { iOwe: 0, owedToMe: 0 };
        }
    }, []);

    const deleteDebtHook = useCallback(async (debtId: number): Promise<void> => {
        await apiDeleteDebt(debtId);
    }, []);

    return {
        isReady,
        error,
        getPeopleSummary,
        getDebtsList,
        getTotals,
        createPerson: createPersonHook,
        createDebt: createDebtHook,
        createSubDebt: createSubDebtHook,
        deleteDebt: deleteDebtHook,
    };
}
