const db = require('./db');

const runMigration = async () => {
  try {
    console.log('🔄 Running migration: Adding user columns...');

    // Add name column
    await db.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS name VARCHAR(100);
    `);
    console.log('✅ Added name column');

    // Add organization column
    await db.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS organization VARCHAR(100) DEFAULT 'Default Organization';
    `);
    console.log('✅ Added organization column');

    // Add number_of_hours column
    await db.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS number_of_hours INTEGER DEFAULT 0;
    `);
    console.log('✅ Added number_of_hours column');

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
