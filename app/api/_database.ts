import fs from 'fs';
import path from 'path';

const getDbPath = () => path.join(process.cwd(), 'finance_db.json');

export interface DbSchema {
  transactions: any[];
  accounts: any[];
  contacts: any[];
}

function readDb(): DbSchema {
  if (!fs.existsSync(getDbPath())) {
    return { transactions: [], accounts: [], contacts: [] };
  }
  try {
    const data = fs.readFileSync(getDbPath(), 'utf-8');
    const json = JSON.parse(data || '{}');
    return {
      transactions: json.transactions || [],
      accounts: json.accounts || [],
      contacts: json.contacts || []
    };
  } catch (e) {
    console.error('Failed to read DB:', e);
    return { transactions: [], accounts: [], contacts: [] };
  }
}

function writeDb(data: DbSchema) {
  try {
    fs.writeFileSync(getDbPath(), JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('Failed to write DB:', e);
  }
}

export default {
  read: readDb,
  write: writeDb
};
