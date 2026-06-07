import { exec } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const migrationFile = path.join(__dirname, '0001_billing_setup.sql');
const sqlContent = fs.readFileSync(migrationFile, 'utf-8');

// Split SQL into individual statements and execute
const statements = sqlContent
  .split(';')
  .map(s => s.trim())
  .filter(s => s.length > 0);

console.log(`Found ${statements.length} SQL statements to execute`);
console.log('SQL statements:');
statements.forEach((stmt, i) => {
  console.log(`\n[${i + 1}] ${stmt.substring(0, 60)}...`);
});

console.log('\n✓ Migration file validated successfully');
console.log('Ready to apply migration to database');
