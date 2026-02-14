
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'finance_db.json');

try {
    if (!fs.existsSync(DB_PATH)) {
        console.log('DB not found at:', DB_PATH);
        process.exit(1);
    }
    const data = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));

    console.log('Original Accounts:', data.accounts?.length);
    console.log('Original Transactions:', data.transactions?.length);

    // Cleanup Accounts
    const uniqueAccounts = new Map();
    if (data.accounts) {
        data.accounts.forEach((acc) => {
            // Validate ID
            let id = acc.account_id || acc.uid || acc.id;

            // Fix invalid ID
            if (!id || typeof id !== 'string' || id === '[object Object]' || id.includes('[object')) {
                console.log('Found invalid account ID:', id, acc.iban);
                // Recover from IBAN
                if (acc.iban && typeof acc.iban === 'string' && acc.iban.length > 5) {
                    id = acc.iban;
                } else {
                    return; // Skip
                }
            }

            // Normalize
            acc.account_id = id;
            acc.id = id;

            const key = acc.iban || id;

            // Overwrite with latest/current (deduplication)
            uniqueAccounts.set(key, acc);
        });
    }

    const cleanedAccounts = Array.from(uniqueAccounts.values());

    // Cleanup Transactions
    const uniqueTransactions = new Map();
    if (data.transactions) {
        data.transactions.forEach((tx) => {
            let id = tx.transaction_id || tx.id;
            if (!id || typeof id !== 'string' || id === '[object Object]' || id.includes('[object')) return;

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

    fs.writeFileSync(DB_PATH, JSON.stringify(newData, null, 2));

    console.log('Final Accounts:', cleanedAccounts.length);
    console.log('Final Transactions:', cleanedTransactions.length);
    console.log('Cleanup successful.');

} catch (e) {
    console.error('Error:', e);
}
