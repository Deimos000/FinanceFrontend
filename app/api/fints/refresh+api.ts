
import { SignJWT, importPKCS8 } from 'jose';
import { saveTransaction, saveAccount } from '../db+api';

const PRIVATE_KEY = `-----BEGIN PRIVATE KEY-----
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
SqIKLENg196UJCofV3Utat2bo7EqdQ==
-----END PRIVATE KEY-----`;

const APP_ID = process.env.ENABLE_BANKING_APP_ID || 'da29a728-39e7-494d-9913-987087276661';

async function createToken(keyPem: string) {
    const privateKey = await importPKCS8(keyPem, 'RS256');
    return await new SignJWT({})
        .setProtectedHeader({ alg: 'RS256', kid: APP_ID })
        .setIssuedAt()
        .setExpirationTime('1h')
        .setIssuer(APP_ID)
        .setAudience('api.enablebanking.com')
        .sign(privateKey);
}

export async function POST(request: Request) {
    try {
        console.log('[refresh+api] ========== POST /api/fints/refresh START ==========');
        const body = await request.json();
        const { accounts } = body; // Expects an array of account objects or just UIDs

        console.log('[refresh+api] Received accounts count:', accounts?.length);
        console.log('[refresh+api] Received accounts:', JSON.stringify(accounts, null, 2).substring(0, 2000));

        if (!accounts || !Array.isArray(accounts)) {
            console.error('[refresh+api] ERROR: Missing accounts list');
            return Response.json({ error: 'Missing accounts list' }, { status: 400 });
        }

        const token = await createToken(PRIVATE_KEY);

        // Update each account
        const updatedAccounts = await Promise.all(accounts.map(async (acc: any) => {
            if (!acc.account_id && !acc.uid) return acc;

            const uid = acc.raw?.uid || acc.account_id; // Try to find the UID

            // Validate UID
            if (!uid || typeof uid !== 'string' || uid === '[object Object]' || uid.includes('[object')) {
                console.error(`[Backend Debug] Skipping account with invalid UID/ID: ${JSON.stringify(uid)}`);
                return acc;
            }

            console.log(`[Backend Debug] Processing account. ID: ${acc.account_id}, Derived UID: ${uid}`);

            if (!uid) {
                console.error(`[Backend Debug] Skipping account ${acc.account_id} - No UID found`);
                return acc;
            }

            try {
                console.log(`[Backend Debug] Refreshing account ${uid}... Token starts with: ${token.substring(0, 10)}...`);

                const balanceUrl = `https://api.enablebanking.com/accounts/${uid}/balances`;
                const transactionsUrl = `https://api.enablebanking.com/accounts/${uid}/transactions?date_from=${new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}`;

                console.log(`[Backend Debug] Fetching: ${balanceUrl}`);
                console.log(`[Backend Debug] Fetching: ${transactionsUrl}`);

                const [balanceRes, transactionsRes] = await Promise.all([
                    fetch(balanceUrl, {
                        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
                    }),
                    fetch(transactionsUrl, {
                        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
                    })
                ]);

                const balanceText = await balanceRes.text();
                const transactionsText = await transactionsRes.text();

                console.log(`[Backend Debug] Balance Resp (${balanceRes.status}):`, balanceText);
                console.log(`[Backend Debug] Transactions Resp (${transactionsRes.status}):`, transactionsText.substring(0, 100)); // Keep tx short

                let balanceData;
                let transactionsData;

                try {
                    balanceData = JSON.parse(balanceText);
                    transactionsData = JSON.parse(transactionsText);
                } catch (e) {
                    console.error('[Backend Debug] JSON Parse Error:', e);
                }

                if (balanceRes.ok && balanceData) {
                    console.log(`[refresh+api] [${uid}] Full balanceData:`, JSON.stringify(balanceData));
                    const bal = balanceData.balances?.[0]; // Safe access
                    console.log(`[refresh+api] [${uid}] bal[0]:`, JSON.stringify(bal));
                    const amountObj = bal?.amount || bal?.balanceAmount || bal?.balance_amount;
                    console.log(`[refresh+api] [${uid}] amountObj:`, JSON.stringify(amountObj));
                    if (amountObj) {
                        const parsedBalance = parseFloat(amountObj.amount || 0);
                        console.log(`[refresh+api] [${uid}] Parsed balance: ${parsedBalance} (raw: ${amountObj.amount})`);
                        acc.balances = {
                            ...acc.balances,
                            current: parsedBalance
                        };
                        console.log(`[refresh+api] [${uid}] Updated acc.balances:`, JSON.stringify(acc.balances));
                    } else {
                        console.warn(`[refresh+api] [${uid}] WARNING: No amountObj found in balance data!`);
                    }
                } else {
                    console.error(`[refresh+api] [${uid}] Balance fetch failed or no data. Status: ${balanceRes.status}`);
                }

                if (transactionsRes.ok && transactionsData) {
                    console.log(`[Backend Debug] Raw Transactions Array Length: ${transactionsData.transactions?.length}`);
                    if (transactionsData.transactions) {
                        // Return RAW transactions so the frontend can parse them consistent with the session endpoint

                        // CRITICAL: Force valid array
                        acc.transactions = transactionsData.transactions;

                        // Save to DB
                        if (acc.transactions) {
                            acc.transactions.forEach((t: any) => saveTransaction(t, acc.account_id || acc.uid));
                        }
                    }
                } else {
                    console.error(`[Backend Debug] Failed to fetch transactions: ${transactionsRes.status} ${transactionsRes.statusText}`);
                    if (transactionsRes.status === 401) {
                        acc.sessionExpired = true;
                    }
                }

                console.log(`[refresh+api] [${uid}] FINAL acc before saveAccount:`, JSON.stringify({
                    uid: acc.uid,
                    account_id: acc.account_id,
                    name: acc.name,
                    iban: acc.iban,
                    balances: acc.balances
                }));
                saveAccount(acc);

                return acc;

            } catch (e) {
                console.error(`[refresh+api] [${uid}] Failed to refresh`, e);
                return acc; // Return old data if fetch fails
            }
        }));

        console.log('[refresh+api] All updated accounts:', updatedAccounts.map((a: any) => ({ id: a.account_id || a.uid, balance: a.balances?.current })));
        console.log('[refresh+api] ========== POST /api/fints/refresh END ==========');
        return Response.json({ accounts: updatedAccounts });

    } catch (error: any) {
        console.error('Refresh Error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
}
