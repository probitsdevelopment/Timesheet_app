const db = require('./db');

async function createSalariesTable() {
  try {
    console.log('🔄 Creating salaries table...');

    // Create salaries table
    await db.query(`
      CREATE TABLE IF NOT EXISTS salaries (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        basic_salary DECIMAL(12, 2) NOT NULL,
        organization VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, organization)
      );
    `);
    console.log('✅ Salaries table created successfully');

    // Create index for faster queries
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_salaries_user_id ON salaries(user_id);
      CREATE INDEX IF NOT EXISTS idx_salaries_organization ON salaries(organization);
    `);
    console.log('✅ Indexes created successfully');

    // Verify table exists
    const result = await db.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'salaries'
      ORDER BY ordinal_position;
    `);

    console.log('\n📋 Salaries table structure:');
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type}`);
    });

    console.log('\n✅ Migration completed successfully!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

createSalariesTable();
