import { useState, useCallback, useEffect } from 'react';
import { Alert } from 'react-native';
import { BACKEND_URL } from '@/utils/api';

export type DebtType = 'OWE' | 'OWED';

export interface Debt {
    id: string;
    contact_id: string;
    type: DebtType;
    amount: number;
    currency: string;
    description: string;
    is_paid: number; // 0 or 1
    created_at: string;
    parent_id?: string;
}

export interface Contact {
    id: string;
    name: string;
    is_frequent: number;
    netBalance: number;
    debts: Debt[];
}

export function useDebts() {
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchDebts = useCallback(async () => {
        try {
            setLoading(true);
            const response = await fetch(`${BACKEND_URL}/api/debts?type=summary`);
            const data = await response.json();

            if (data.error) throw new Error(data.error);

            setContacts(data.contacts || data || []);
        } catch (err: any) {
            console.error('Error fetching debts:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDebts();
    }, [fetchDebts]);

    const addDebt = async (name: string, amount: number, type: DebtType, description: string, isFrequent: boolean, linkedDebtId?: string, parentId?: string) => {
        try {
            const res = await fetch(`${BACKEND_URL}/api/debts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, amount, type, description, isFrequent, linked_debt_id: linkedDebtId, parent_id: parentId }),
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);

            await fetchDebts(); // Refresh
            return true;
        } catch (err: any) {
            Alert.alert('Error', err.message);
            return false;
        }
    };

    const togglePaid = async (id: string, isPaid: boolean) => {
        try {
            const res = await fetch(`${BACKEND_URL}/api/debts`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, is_paid: isPaid }),
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);

            await fetchDebts();
        } catch (err: any) {
            Alert.alert('Error', err.message);
        }
    }

    return {
        contacts,
        loading,
        error,
        refreshDebts: fetchDebts,
        addDebt,
        togglePaid
    };
}
