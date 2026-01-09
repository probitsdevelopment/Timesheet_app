const db = require('./db');

const runMigration = async () => {
  try {
    console.log('🔄 Running migration: Adding manager_id column to users...');

    // Add manager_id column
    await db.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS manager_id INTEGER REFERENCES users(id);
    `);
    console.log('✅ Added manager_id column');

    // Verify changes
    const result = await db.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users'
      ORDER BY ordinal_position;
    `);
    
    console.log('\n✅ Users table columns:');
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name} (${row.data_type})`);
    });

    console.log('\n✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration error:', error.message);
    process.exit(1);
  }
};

runMigration();

