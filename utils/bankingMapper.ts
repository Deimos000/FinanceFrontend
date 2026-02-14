
export type Account = {
    account_id: string;
    balances: {
        current: number;
        iso_currency_code: string;
    };
    transactions: {
        transactionId: string;
        bookingDate: string;
        amount: number;
        currency: string;
        remittanceInformation?: string;
        creditorName?: string;
        debtorName?: string;
        displayName?: string;
        raw?: any;
    }[];
    name: string;
    mask: string;
    type: string;
    subtype: string;
    iban: string;
    sessionExpired?: boolean;
};

export const mapEnableBankingAccounts = (rawAccounts: any[]): Account[] => {
    return rawAccounts.map((acc: any) => {
        // Check if this is an already mapped account from local state being passed back (partial refresh support)
        // But usually we expect raw data here. 
        // If it has 'balances' as an object with 'current', it might be our internal format.
        // But the refresh API returns 'transactions' as raw arrays now.
        // Let's assume we are re-mapping everything from the "raw-ish" structure we get.

        // 1. Balance Parsing
        let balanceAmount = 0;
        let currency = 'EUR';

        // Handle raw Enable Banking structure
        if (acc.balances && Array.isArray(acc.balances)) {
            const booked = acc.balances.find((b: any) => b.balanceType === 'closingBooked') || acc.balances[0];
            const amountObj = booked?.amount || booked?.balanceAmount || booked?.balance_amount;
            if (amountObj && amountObj.amount) {
                balanceAmount = parseFloat(amountObj.amount);
                currency = amountObj.currency || 'EUR';
            }
        }
        // Handle if it's already semi-parsed or from refresh (which might update acc.balances.current directly?)
        else if (acc.balances && typeof acc.balances.current === 'number') {
            balanceAmount = acc.balances.current;
            currency = acc.balances.iso_currency_code || 'EUR';
        }

        // 2. Transaction Parsing
        let transactions: any[] = [];
        if (acc.transactions && Array.isArray(acc.transactions)) {
            // console.log(`[Frontend Debug] Processing ${acc.transactions.length} transactions for account ${acc.uid || 'unknown'}`);
            transactions = acc.transactions.map((t: any, index: number) => {
                // Log the FIRST transaction completely to see structure
                /*
                if (index === 0) {
                    console.log('[Frontend Debug] FIRST RAW TRANSACTION:', JSON.stringify(t, null, 2));
                }
                */

                // RECOVERY MAGIC:
                // If 't' is our internal format (has 'amount' directly), checks if it has 'raw' stashed.
                // If so, swap 't' for 't.raw' to re-parse from source of truth.
                if (t.transactionId && !t.transaction_amount && t.raw) {
                    // if (index === 0) console.log('[Frontend Recovery] Restoring raw data from mapped transaction');
                    t = t.raw;
                }

                // Now proceed with parsing 't' as if it is a raw Enable Banking transaction

                // Determine amount and sign
                // Common structure: t.transaction_amount.amount (string)
                let amount = 0;
                let currency = 'EUR';

                if (t.transaction_amount && t.transaction_amount.amount) {
                    amount = parseFloat(t.transaction_amount.amount);
                    currency = t.transaction_amount.currency || 'EUR';
                } else if (typeof t.amount === 'number') {
                    // Fallback: It really is an internal object without raw data??
                    amount = t.amount;
                }

                // Check for DBIT indicator
                // If we have 'credit_debit_indicator', use it.
                if (t.credit_debit_indicator === 'DBIT' || t.credit_debit_indicator === 'D') {
                    // Ensure amount is negative
                    amount = -Math.abs(amount);
                } else if (t.credit_debit_indicator === 'CRDT' || t.credit_debit_indicator === 'C') {
                    // Ensure amount is positive
                    amount = Math.abs(amount);
                }

                // Name Resolution
                const creditorName = t.creditor_name || t.creditor?.name;
                const debtorName = t.debtor_name || t.debtor?.name;

                // Remittance
                const remittance = t.remittance_information_unstructured || t.remittance_information_structured || t.remittanceInformation || 'No description';

                // Display Name logic
                // If amount < 0 (Sending money), we care about Creditor (Receiver)
                // If amount > 0 (Receiving money), we care about Debtor (Sender)

                let displayName = '';
                if (amount < 0) {
                    displayName = creditorName || 'Unknown Receiver';
                } else {
                    displayName = debtorName || 'Unknown Sender';
                }

                // Fallback if the specific one is missing but the other exists (sometimes roles are swapped in data)
                if ((displayName === 'Unknown Receiver' || displayName === 'Unknown Sender') && (creditorName || debtorName)) {
                    displayName = creditorName || debtorName;
                }

                if (displayName === 'Unknown Receiver' || displayName === 'Unknown Sender') {
                    displayName = amount > 0 ? 'Received' : 'Sent';
                }

                return {
                    transactionId: t.transaction_id || t.transactionId || Math.random().toString(),
                    bookingDate: t.value_date || t.booking_date || t.bookingDate,
                    amount: amount,
                    currency: currency,
                    remittanceInformation: remittance,
                    creditorName: creditorName,
                    debtorName: debtorName,
                    displayName: displayName,
                    raw: t // Keep stashing raw!
                };
            });
        } else {
            // console.log('[Frontend Debug] No transactions found in account object', acc);
        }

        return {
            account_id: acc.uid || acc.account_id || acc.iban,
            name: acc.name || 'Commerzbank Account',
            mask: acc.iban ? acc.iban.slice(-4) : (acc.mask || '????'),
            type: 'depository',
            subtype: 'checking',
            iban: acc.iban || (acc.account_id && acc.account_id.length > 10 ? acc.account_id : ''),
            balances: {
                current: balanceAmount,
                iso_currency_code: currency
            },
            transactions: transactions,
            sessionExpired: acc.sessionExpired // <--- Propagate the flag
        };
    });
};
