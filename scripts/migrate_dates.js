
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'finance_db.json');

try {
    if (!fs.existsSync(DB_PATH)) {
        console.log('DB not found at:', DB_PATH);
        process.exit(1);
    }
    const data = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
    let updatedCount = 0;

    data.transactions = data.transactions.map((tx) => {
        if (!tx.raw_json) return tx;

        try {
            const raw = JSON.parse(tx.raw_json);

            // value_date is often the effective date, booking_date is when it hit the ledger
            const betterDate = raw.value_date || raw.booking_date;

            if (betterDate && betterDate !== tx.booking_date) {
                console.log(`[Update] Tx ${tx.transaction_id}: ${tx.booking_date} -> ${betterDate}`);
                tx.booking_date = betterDate;
                updatedCount++;
            }
        } catch (e) {
            console.error('Failed to parse raw_json for tx:', tx.transaction_id);
        }
        return tx;
    });

    if (updatedCount > 0) {
        fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
        console.log(`Successfully updated ${updatedCount} transactions to use value_date.`);
    } else {
        console.log('No transactions needed updating.');
    }

} catch (e) {
    console.error('Error:', e);
}
