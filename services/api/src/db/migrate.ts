import { readFileSync } from 'fs';
import { join } from 'path';
import { query } from './client';

/**
 * Run database migrations
 * Executes SQL migration files in order
 */
async function migrate() {
  try {
    console.log('Running database migrations...');

    // Read and execute initial schema migration
    const migrationPath = join(__dirname, 'migrations', '001_initial_schema.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    await query(migrationSQL);
    console.log('✅ Migration completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migrations if called directly
if (require.main === module) {
  migrate()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export default migrate;
