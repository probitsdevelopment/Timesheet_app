const db = require('./db');

const runMigration = async () => {
  try {
    console.log('🔄 Running migration: Adding is_paid_leave column to leaves table...');

    // Add is_paid_leave column
    await db.query(`
      ALTER TABLE leaves
      ADD COLUMN IF NOT EXISTS is_paid_leave BOOLEAN DEFAULT true;
    `);
    console.log('✅ Added is_paid_leave column');

    // Verify changes
    const result = await db.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'leaves'
      ORDER BY ordinal_position;
    `);
    
    console.log('\n✅ Leaves table columns:');
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
