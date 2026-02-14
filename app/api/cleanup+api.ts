
import fs from 'fs';
import path from 'path';

const getDbPath = () => path.join(process.cwd(), 'finance_db.json');

export async function GET(request: Request) {
    try {
        if (!fs.existsSync(getDbPath())) {
            return Response.json({ message: 'DB not found' });
        }
        const data = JSON.parse(fs.readFileSync(getDbPath(), 'utf8'));

        const originalAccountCount = data.accounts?.length || 0;
        const originalTransactionCount = data.transactions?.length || 0;

        // Cleanup Accounts
        const uniqueAccounts = new Map();
        if (data.accounts) {
            data.accounts.forEach((acc: any) => {
                // Validate ID
                let id = acc.account_id || acc.uid || acc.id;

                // Check for invalid ID
                if (!id || typeof id !== 'string' || id === '[object Object]' || id.includes('[object')) {
                    console.log('Found invalid account ID:', id, acc.iban);
                    // Try to recover from IBAN if possible
                    if (acc.iban && typeof acc.iban === 'string' && acc.iban.length > 5) {
                        id = acc.iban; // Fallback to IBAN as ID
                    } else {
                        return; // Skip invalid account completely
                    }
                }

                // Normalize
                acc.account_id = id;
                acc.id = id;

                // Key for deduplication: Prefer IBAN, else ID
                const key = acc.iban || id;

                // If we already have this account, we prefer the one with a "newer" last_synced date?
                // Or just the first one?
                if (uniqueAccounts.has(key)) {
                    // Check which one is better
                    const existing = uniqueAccounts.get(key);
                    // If current has balance and existing doesn't, take current?
                    // For now, let's assume the latest in the list is the most recent (append only log)
                    // But actually, db implementation usually appends.
                    // Let's take the last one seen (overwrite)
                    uniqueAccounts.set(key, acc);
                } else {
                    uniqueAccounts.set(key, acc);
                }
            });
        }

        const cleanedAccounts = Array.from(uniqueAccounts.values());

        // Cleanup Transactions
        const uniqueTransactions = new Map();
        if (data.transactions) {
            data.transactions.forEach((tx: any) => {
                let id = tx.transaction_id || tx.id;
                if (!id || typeof id !== 'string' || id === '[object Object]' || id.includes('[object')) return;

                // Also ensure it belongs to a valid account? Optional but good.

                if (!uniqueTransactions.has(id)) {
                    uniqueTransactions.set(id, tx);
                }
            });
        }

        const cleanedTransactions = Array.from(uniqueTransactions.values());

        // Update DB
        const newData = {
            ...data,
            accounts: cleanedAccounts,
            transactions: cleanedTransactions
        };

        fs.writeFileSync(getDbPath(), JSON.stringify(newData, null, 2));

        return Response.json({
            success: true,
            originalAccountCount,
            finalAccountCount: cleanedAccounts.length,
            removedAccounts: originalAccountCount - cleanedAccounts.length,
            originalTransactionCount,
            finalTransactionCount: cleanedTransactions.length,
            removedTransactions: originalTransactionCount - cleanedTransactions.length
        });

    } catch (e: any) {
        console.error(e);
        return Response.json({ error: e.message, stack: e.stack }, { status: 500 });
    }
}
