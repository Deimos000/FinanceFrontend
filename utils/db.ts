import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';

let dbInstance: SQLite.SQLiteDatabase | null = null;

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
    if (dbInstance) return dbInstance;

    // On web, use in-memory database (file persistence requires COOP/COEP headers)
    // On native, use persistent file database
    const dbName = Platform.OS === 'web' ? ':memory:' : 'finance.db';
    dbInstance = await SQLite.openDatabaseAsync(dbName);

    // Initialize tables if they don't exist - execute one at a time for web compatibility
    await dbInstance.execAsync(`
        CREATE TABLE IF NOT EXISTS names (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    `);

    await dbInstance.execAsync(`
        CREATE TABLE IF NOT EXISTS debts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            person_id INTEGER NOT NULL,
            type TEXT NOT NULL CHECK(type IN ('OWED_BY_ME', 'OWED_TO_ME')),
            amount REAL NOT NULL,
            currency TEXT DEFAULT 'EUR',
            description TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            is_settled INTEGER DEFAULT 0,
            FOREIGN KEY(person_id) REFERENCES names(id) ON DELETE CASCADE
        )
    `);

    await dbInstance.execAsync(`
        CREATE TABLE IF NOT EXISTS sub_debts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            debt_id INTEGER NOT NULL,
            amount REAL NOT NULL,
            note TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(debt_id) REFERENCES debts(id) ON DELETE CASCADE
        )
    `);

    await dbInstance.execAsync(`
        CREATE TABLE IF NOT EXISTS transactions (
            id TEXT PRIMARY KEY,
            account_id TEXT NOT NULL,
            date TEXT NOT NULL,
            amount REAL NOT NULL,
            currency TEXT NOT NULL,
            description TEXT,
            recipient TEXT,
            category TEXT,
            type TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    `);

    await dbInstance.execAsync(`
        CREATE TABLE IF NOT EXISTS categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            color TEXT,
            icon TEXT
        )
    `);

    // Seed default categories if empty
    try {
        const result = await dbInstance.getAllAsync<{ count: number }>('SELECT COUNT(*) as count FROM categories');
        const categoryCount = result[0]?.count || 0;

        if (categoryCount === 0) {
            await dbInstance.execAsync(`
                INSERT INTO categories (name, color, icon) VALUES 
                ('Groceries', '#FF9800', 'cart'),
                ('Shopping', '#E91E63', 'bag-handle'),
                ('Transport', '#2196F3', 'car'),
                ('Income', '#4CAF50', 'cash'),
                ('Utilities', '#9C27B0', 'flash'),
                ('Entertainment', '#673AB7', 'film'),
                ('Health', '#F44336', 'heart'),
                ('Dining', '#795548', 'restaurant')
            `);
        }
    } catch (e) {
        console.error('Error seeding categories:', e);
    }

    return dbInstance;
}

export async function upsertTransactions(transactions: any[], accountId: string): Promise<void> {
    const db = await getDb();

    try {
        for (const tx of transactions) {
            // Ensure ID is string and not empty
            const id = tx.id ? String(tx.id) : `gen-${Date.now()}-${Math.random()}`;
            const date = tx.date || new Date().toISOString();
            const amount = typeof tx.amount === 'number' && !isNaN(tx.amount) ? tx.amount : 0;
            const currency = tx.currency || 'EUR';
            const description = tx.description || '';
            const recipient = tx.recipient || '';
            const type = tx.type || '';
            const category = tx.category || '';

            // NOTE: expo-sqlite v14+ runAsync expects variadic arguments: runAsync(sql, ...params)
            // DO NOT pass an array as the second argument.
            await db.runAsync(
                `INSERT OR REPLACE INTO transactions (id, account_id, date, amount, currency, description, recipient, category, type, created_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                id,
                accountId,
                date,
                amount,
                currency,
                description,
                recipient,
                category,
                type,
                new Date().toISOString()
            );
        }
        console.log(`Upserted ${transactions.length} transactions for account ${accountId}`);
    } catch (e) {
        console.error('Failed to upsert transactions:', e);
    }
}

export async function getDailySpending(days: number = 30): Promise<{ date: string; amount: number }[]> {
    const db = await getDb();
    try {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        const cutoffStr = cutoffDate.toISOString().split('T')[0];

        // Pass scalar argument directly
        const result = await db.getAllAsync<{ date: string; amount: number }>(
            `SELECT date(date) as date, SUM(ABS(amount)) as amount
             FROM transactions
             WHERE amount < 0 AND date >= ?
             GROUP BY date(date)
             ORDER BY date(date) ASC`,
            cutoffStr
        );
        return result;
    } catch (e) {
        console.error('Error getting daily spending:', e);
        return [];
    }
}

export async function getMonthlyIncome(months: number = 6): Promise<{ month: string; amount: number }[]> {
    const db = await getDb();
    try {
        const cutoffDate = new Date();
        cutoffDate.setMonth(cutoffDate.getMonth() - months);
        const cutoffStr = cutoffDate.toISOString().split('T')[0];

        const result = await db.getAllAsync<{ month: string; amount: number }>(
            `SELECT strftime('%Y-%m', date) as month, SUM(amount) as amount
             FROM transactions
             WHERE amount > 0 AND date >= ?
             GROUP BY strftime('%Y-%m', date)
             ORDER BY strftime('%Y-%m', date) ASC`,
            cutoffStr
        );
        return result;
    } catch (e) {
        console.error('Error getting monthly income:', e);
        return [];
    }
}

export async function getCategories(): Promise<{ name: string; color: string; icon: string; total: number }[]> {
    const db = await getDb();
    try {
        // No params needed, so pass none
        const categories = await db.getAllAsync<{ name: string; color: string; icon: string }>(
            'SELECT name, color, icon FROM categories'
        );
        return categories.map(c => ({ ...c, total: 0 }));
    } catch (e) {
        console.error('Error getting categories:', e);
        return [];
    }
}
