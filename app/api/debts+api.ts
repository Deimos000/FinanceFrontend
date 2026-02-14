import { ExpoRequest } from 'expo-router/server';
import { getDb } from '../../utils/db';

export async function GET(req: ExpoRequest) {
    const db = await getDb();
    const url = new URL(req.url);
    const type = url.searchParams.get('type'); // 'summary', 'owe', 'owed'

    try {
        if (type === 'summary') {
            // Get all people with their aggregated net balance
            const people = await db.getAllAsync('SELECT * FROM names ORDER BY name');

            const summaries = await Promise.all(people.map(async (person: any) => {
                const debts = await db.getAllAsync('SELECT * FROM debts WHERE person_id = ?', [person.id]);

                let netBalance = 0;

                for (const debt of debts as any[]) {
                    const subDebtsSum = await db.getFirstAsync<{ total: number }>(
                        'SELECT SUM(amount) as total FROM sub_debts WHERE debt_id = ?',
                        [debt.id]
                    );
                    const payedAmount = subDebtsSum?.total || 0;
                    const remaining = debt.amount - payedAmount;

                    if (debt.type === 'OWED_TO_ME') {
                        netBalance += remaining;
                    } else { // OWED_BY_ME
                        netBalance -= remaining;
                    }
                }

                return {
                    ...person,
                    netBalance
                };
            }));

            return Response.json(summaries);
        }

        if (type === 'list') {
            // Return simplified list of debts with remaining balances
            const filterType = url.searchParams.get('filter') as 'OWED_BY_ME' | 'OWED_TO_ME';

            let query = `
                SELECT d.*, n.name as person_name 
                FROM debts d 
                JOIN names n ON d.person_id = n.id 
            `;

            const args: any[] = [];
            if (filterType) {
                query += ` WHERE d.type = ?`;
                args.push(filterType);
            }

            query += ` ORDER BY d.created_at DESC`;

            const debts = await db.getAllAsync(query, args);

            const debtsWithBalance = await Promise.all((debts as any[]).map(async (debt) => {
                const subDebtsSum = await db.getFirstAsync<{ total: number }>(
                    'SELECT SUM(amount) as total FROM sub_debts WHERE debt_id = ?',
                    [debt.id]
                );
                const payed = subDebtsSum?.total || 0;
                const subDebts = await db.getAllAsync(
                    'SELECT * FROM sub_debts WHERE debt_id = ? ORDER BY created_at DESC',
                    [debt.id]
                );
                return {
                    ...debt,
                    paid_amount: payed,
                    remaining_amount: debt.amount - payed,
                    sub_debts: subDebts
                };
            }));

            return Response.json(debtsWithBalance);
        }

        return Response.json({ error: 'Invalid type param' }, { status: 400 });

    } catch (error) {
        console.error('Database Error:', error);
        return Response.json({ error: (error as Error).message }, { status: 500 });
    }
}

export async function POST(req: ExpoRequest) {
    const db = await getDb();
    try {
        const body = await req.json();
        const { action } = body; // 'create_person', 'create_debt', 'create_sub_debt'

        if (action === 'create_person') {
            const { name } = body;
            const result = await db.runAsync('INSERT INTO names (name) VALUES (?)', [name]);
            return Response.json({ id: result.lastInsertRowId, name });
        }

        if (action === 'create_debt') {
            const { person_id, type, amount, description } = body;
            const result = await db.runAsync(
                `INSERT INTO debts (person_id, type, amount, description) VALUES (?, ?, ?, ?)`,
                [person_id, type, amount, description]
            );
            return Response.json({ id: result.lastInsertRowId });
        }

        if (action === 'create_sub_debt') {
            const { debt_id, amount, note } = body;
            const result = await db.runAsync(
                `INSERT INTO sub_debts (debt_id, amount, note) VALUES (?, ?, ?)`,
                [debt_id, amount, note]
            );
            return Response.json({ id: result.lastInsertRowId });
        }

        return Response.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error) {
        console.error('Database Write Error:', error);
        return Response.json({ error: (error as Error).message }, { status: 500 });
    }
}
