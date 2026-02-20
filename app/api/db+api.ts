
import db from './_database';

// Helper to read DB using shared module
function readDb() {
    return db.read();
}

// Helper to write DB using shared module
function writeDb(data: any) {
    db.write(data);
}

export const saveAccount = (acc: any) => {
    console.log('[db+api saveAccount] ========== START ==========');
    console.log('[db+api saveAccount] Input acc:', JSON.stringify(acc, null, 2).substring(0, 1500));

    const db = readDb();
    console.log('[db+api saveAccount] Current accounts in DB:', db.accounts.map((a: any) => ({ id: a.account_id, balance: a.balance, name: a.name })));

    // Extract balance
    let balance = 0;
    let balanceWasProvided = false;
    console.log('[db+api saveAccount] acc.balances:', JSON.stringify(acc.balances));

    if (acc.balances && acc.balances.current !== undefined) {
        balance = acc.balances.current;
        balanceWasProvided = true;
        console.log('[db+api saveAccount] Balance from acc.balances.current:', balance);
    } else if (acc.balances && Array.isArray(acc.balances) && acc.balances[0]) {
        const b = acc.balances[0];
        console.log('[db+api saveAccount] Balance array[0]:', JSON.stringify(b));
        balance = parseFloat(b.amount?.amount || b.balanceAmount?.amount || b.balance_amount?.amount || 0);
        balanceWasProvided = balance !== 0; // Only count as provided if non-zero
        console.log('[db+api saveAccount] Parsed balance from array:', balance, 'provided:', balanceWasProvided);
    } else {
        console.log('[db+api saveAccount] WARNING: No valid balance found in input');
    }

    // Determine strict ID
    // We prefer uid (consistent from API) > account_id > iban
    let accountId = acc.uid || acc.account_id || acc.iban;
    console.log('[db+api saveAccount] Resolved accountId:', accountId, '| uid:', acc.uid, '| account_id:', acc.account_id, '| iban:', acc.iban);

    // Validate ID - CRITICAL FIX to prevent [object Object]
    if (!accountId || typeof accountId !== 'string' || accountId === '[object Object]' || accountId.includes('[object')) {
        console.error('[db+api saveAccount] Cannot save account with invalid ID:', accountId);
        // Try fallback if iban is string
        if (acc.iban && typeof acc.iban === 'string') {
            accountId = acc.iban;
            console.log('[db+api saveAccount] Falling back to IBAN as ID:', accountId);
        } else {
            console.error('[db+api saveAccount] ABORTING - no valid ID');
            return;
        }
    }

    if (!accountId) {
        console.error('[db+api saveAccount] Cannot save account without a valid ID after fallback:', acc);
        return;
    }

    // Normalize Account Data
    const accountData = {
        account_id: accountId,
        name: acc.name || 'Bank Account',
        iban: acc.iban || '',
        balance: balance,
        currency: acc.currency || 'EUR',
        bank_name: acc.bank_name || (acc.iban && acc.iban.includes('541001100') ? 'N26' : (acc.iban && acc.iban.includes('72160400') ? 'Commerzbank' : 'Bank')),
        last_synced: new Date().toISOString()
    };

    console.log('[db+api saveAccount] Normalized accountData to save:', JSON.stringify(accountData));

    // Upsert
    const index = db.accounts.findIndex((a: any) => a.account_id === accountData.account_id);
    console.log('[db+api saveAccount] Found at index:', index);

    if (index >= 0) {
        const existingBalance = db.accounts[index].balance;
        console.log('[db+api saveAccount] BEFORE update - existing account:', JSON.stringify(db.accounts[index]));

        // FAILSAFE: If new balance is 0 but existing balance is non-zero, keep existing
        // This prevents 429 rate limit errors from wiping out valid balance data
        let finalBalance = balance;
        if (balance === 0 && existingBalance && existingBalance !== 0) {
            console.log('[db+api saveAccount] FAILSAFE: Keeping existing balance', existingBalance, 'instead of 0');
            finalBalance = existingBalance;
        } else if (!balanceWasProvided && existingBalance && existingBalance !== 0) {
            console.log('[db+api saveAccount] FAILSAFE: No balance provided, keeping existing balance', existingBalance);
            finalBalance = existingBalance;
        }

        db.accounts[index] = { ...db.accounts[index], ...accountData };
        db.accounts[index].balance = finalBalance;
        console.log('[db+api saveAccount] AFTER update - account:', JSON.stringify(db.accounts[index]));
    } else {
        console.log('[db+api saveAccount] Adding new account');
        db.accounts.push(accountData);
    }

    writeDb(db);
    console.log('[db+api saveAccount] ========== END ==========');
};

export const getAccounts = () => {
    console.log('[db+api getAccounts] ========== START ==========');
    const db = readDb();

    console.log('[db+api getAccounts] Raw accounts from DB:', db.accounts.map((a: any) => ({
        account_id: a.account_id,
        name: a.name,
        balance: a.balance,
        bank_name: a.bank_name
    })));

    // Attach transactions to accounts
    const result = db.accounts.map((acc: any) => {
        const mapped = {
            ...acc,
            // Explicitly ensure critical fields
            id: acc.account_id,
            balance: acc.balance,
            bankName: acc.bank_name,
            transactions: db.transactions
                .filter((t: any) => t.account_id === acc.account_id)
                .sort((a: any, b: any) => new Date(b.booking_date).getTime() - new Date(a.booking_date).getTime())
                .map((t: any) => {
                    // Extract clean name from remittance if creditor/debtor is missing
                    let cleanName = t.creditor_name || t.debtor_name;

                    if (!cleanName && t.remittance_information) {
                        // Pattern: "Name Sent from Bank"
                        const sentFromMatch = t.remittance_information.match(/^(.*?) Sent from/i);
                        if (sentFromMatch && sentFromMatch[1]) {
                            cleanName = sentFromMatch[1].trim();
                        }
                    }

                    return {
                        ...t,
                        id: t.transaction_id,
                        date: t.booking_date,
                        recipient: cleanName || 'Unknown',
                        description: t.remittance_information || t.creditor_name || t.debtor_name
                    };
                })
        };
        console.log(`[db+api getAccounts] Mapped account: id=${mapped.id}, name=${mapped.name}, balance=${mapped.balance}, txCount=${mapped.transactions.length}`);
        return mapped;
    });

    console.log('[db+api getAccounts] ========== END ==========');
    return result;
};

export const saveTransaction = (t: any, accountId: string) => {
    const db = readDb();
    const transactionData = processTransaction(t, accountId);

    // Upsert
    const index = db.transactions.findIndex((tr: any) => tr.transaction_id === transactionData.transaction_id);
    if (index >= 0) {
        db.transactions[index] = transactionData;
    } else {
        db.transactions.push(transactionData);
    }

    writeDb(db);
};

// Internal helper to process a single transaction object
const processTransaction = (t: any, accountId: string) => {
    // Parse amount safely
    let amount = 0;
    if (t.transaction_amount?.amount) amount = parseFloat(t.transaction_amount.amount);
    else if (typeof t.amount === 'number') amount = t.amount;

    // Adjust sign based on DBIT/CRDT
    if (t.credit_debit_indicator === 'DBIT') amount = -Math.abs(amount);
    else if (t.credit_debit_indicator === 'CRDT') amount = Math.abs(amount);

    // Stable ID Generation
    let stableId = t.transaction_id || t.transactionId || t.entry_reference;
    if (!stableId) {
        const uniqueString = `${accountId}-${t.booking_date}-${amount}`;
        // Simple hash replacement
        stableId = Buffer.from(uniqueString).toString('base64');
    }

    const transactionData = {
        transaction_id: stableId,
        account_id: accountId,
        // Prioritize value_date (effective date) over booking_date
        booking_date: t.value_date || t.booking_date,
        amount: amount,
        currency: t.transaction_amount?.currency || 'EUR',
        creditor_name: t.creditor?.name || t.creditorName || null,
        debtor_name: t.debtor?.name || t.debtorName || null,
        remittance_information: Array.isArray(t.remittance_information) ? t.remittance_information.join(' ') : (t.remittance_information || ''),
        raw_json: JSON.stringify(t),
        created_at: new Date().toISOString()
    };

    // Attempt to extract better name if missing
    if (!transactionData.creditor_name && !transactionData.debtor_name && transactionData.remittance_information) {
        const sentFromMatch = transactionData.remittance_information.match(/^(.*?) Sent from/i);
        if (sentFromMatch && sentFromMatch[1]) {
            transactionData.creditor_name = sentFromMatch[1].trim();
        }
    }

    return transactionData;
};

export const saveTransactionsBatch = (transactions: any[], accountId: string) => {
    console.log(`[db+api] Saving batch of ${transactions.length} transactions for account ${accountId}`);
    const db = readDb();
    let newCount = 0;
    let updateCount = 0;

    transactions.forEach(t => {
        const transactionData = processTransaction(t, accountId);
        const index = db.transactions.findIndex((tr: any) => tr.transaction_id === transactionData.transaction_id);

        if (index >= 0) {
            db.transactions[index] = transactionData;
            updateCount++;
        } else {
            db.transactions.push(transactionData);
            newCount++;
        }
    });

    writeDb(db);
    console.log(`[db+api] Batch save complete. New: ${newCount}, Updated: ${updateCount}`);
};

export default { saveAccount, getAccounts, saveTransaction, saveTransactionsBatch };
