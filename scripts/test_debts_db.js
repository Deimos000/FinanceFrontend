
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(process.cwd(), 'finance.db');
console.log('Database Path:', dbPath);

if (!fs.existsSync(dbPath)) {
    console.log('Database not found. Creating...');
}

const db = new Database(dbPath);

// Initialize (copy of logic from _sqlite.ts to ensure it runs here if app didn't run yet)
db.exec(`
    CREATE TABLE IF NOT EXISTS names (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS debts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        person_id INTEGER NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('OWED_BY_ME', 'OWED_TO_ME')),
        amount REAL NOT NULL,
        currency TEXT DEFAULT 'EUR',
        description TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        is_settled BOOLEAN DEFAULT 0,
        FOREIGN KEY(person_id) REFERENCES names(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS sub_debts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        debt_id INTEGER NOT NULL,
        amount REAL NOT NULL,
        note TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(debt_id) REFERENCES debts(id) ON DELETE CASCADE
    );
`);

console.log('Schema verified.');

// Test Logic
try {
    // 1. Create Person
    const name = 'TestUser_' + Date.now();
    const info = db.prepare('INSERT INTO names (name) VALUES (?)').run(name);
    const personId = info.lastInsertRowid;
    console.log(`Created Person: ${name} (ID: ${personId})`);

    // 2. Create Debt (Owed TO Me)
    const debtInfo = db.prepare(`
        INSERT INTO debts (person_id, type, amount, description) 
        VALUES (?, ?, ?, ?)
    `).run(personId, 'OWED_TO_ME', 100.50, 'Test Debt');
    const debtId = debtInfo.lastInsertRowid;
    console.log(`Created Debt: 100.50 (ID: ${debtId})`);

    // 3. Add Sub Debt (Partial Payment)
    db.prepare(`
        INSERT INTO sub_debts (debt_id, amount, note)
        VALUES (?, ?, ?)
    `).run(debtId, 20.50, 'Partial Pay');
    console.log('Added Sub-debt: 20.50');

    // 4. Verify Calculation
    const subDebtsSum = db.prepare('SELECT SUM(amount) as total FROM sub_debts WHERE debt_id = ?').get(debtId);
    const payed = subDebtsSum.total || 0;
    const remaining = 100.50 - payed;

    console.log(`Paid: ${payed}, Remaining: ${remaining}`);

    if (remaining === 80) {
        console.log('SUCCESS: Calculation is correct.');
    } else {
        console.error(`FAILURE: Expected 80, got ${remaining}`);
    }

    // Cleanup
    // db.prepare('DELETE FROM names WHERE id = ?').run(personId);
    // console.log('Cleanup done.');

} catch (e) {
    console.error('Test Failed:', e);
}
