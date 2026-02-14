
import { getAccounts } from './db+api';

export async function GET(request: Request) {
    try {
        console.log('[accounts+api] ========== GET /api/accounts START ==========');
        const accounts = getAccounts();
        console.log('[accounts+api] Returning accounts:', accounts.map((a: any) => ({
            id: a.id,
            name: a.name,
            balance: a.balance,
            bankName: a.bankName
        })));
        console.log('[accounts+api] ========== GET /api/accounts END ==========');
        return Response.json({ accounts });
    } catch (error: any) {
        console.error('[accounts+api] Failed to get accounts:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
}
