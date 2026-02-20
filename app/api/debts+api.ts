import { ExpoRequest } from 'expo-router/server';
import { getDb } from '../../utils/db';

export async function GET(req: ExpoRequest) {
    const db = await getDb();
    const url = new URL(req.url);
    const type = url.searchParams.get('type'); // 'summary', 'owe', 'owed'

    try {
        if (type === 'summary') {
            // Get all people
            const people = await db.getAllAsync('SELECT * FROM names ORDER BY name');

            // Get all debts with paid amounts in ONE query
            const debts = await db.getAllAsync<{ person_id: number, type: string, amount: number, paid: number }>(`
                SELECT 
                    d.person_id, 
                    d.type, 
                    d.amount, 
                    COALESCE(SUM(sd.amount), 0) as paid
                FROM debts d
                LEFT JOIN sub_debts sd ON d.id = sd.debt_id
                GROUP BY d.id
            `);

            // Aggregate in memory (O(N) operation)
            const peopleMap = new Map();
            people.forEach((p: any) => {
                peopleMap.set(p.id, { ...p, netBalance: 0 });
            });

            debts.forEach(d => {
                const person = peopleMap.get(d.person_id);
                if (person) {
                    const remaining = d.amount - d.paid;
                    if (d.type === 'OWED_TO_ME') {
                        person.netBalance += remaining;
                    } else { // OWED_BY_ME
                        person.netBalance -= remaining;
                    }
                }
            });

            return Response.json(Array.from(peopleMap.values()));
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

            // Fetch ALL sub-debts in one go
            const allSubDebts = await db.getAllAsync('SELECT * FROM sub_debts ORDER BY created_at DESC');

            // Map sub-debts to debts
            const debtsWithBalance = debts.map((debt: any) => {
                const mySubDebts = (allSubDebts as any[]).filter(sd => sd.debt_id === debt.id);
                const payed = mySubDebts.reduce((sum, sd) => sum + sd.amount, 0);

                return {
                    ...debt,
                    paid_amount: payed,
                    remaining_amount: debt.amount - payed,
                    sub_debts: mySubDebts
                };
            });

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
