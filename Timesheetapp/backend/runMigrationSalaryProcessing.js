const db = require('./db');

const runMigration = async () => {
  try {
    console.log('🔄 Running migration: Creating salary_processing table...');

    // Create salary_processing table
    await db.query(`
      CREATE TABLE IF NOT EXISTS salary_processing (
        id SERIAL PRIMARY KEY,
        user_id INT NOT NULL REFERENCES users(id),
        month VARCHAR(7) NOT NULL,
        basic_salary NUMERIC NOT NULL,
        working_days INT NOT NULL,
        total_leaves INT NOT NULL,
        unpaid_leaves INT NOT NULL,
        deduction NUMERIC NOT NULL,
        final_salary NUMERIC NOT NULL,
        timesheet_approved BOOLEAN NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
        processed_by INT REFERENCES users(id),
        processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        organization VARCHAR(100),
        UNIQUE(user_id, month)
      );
    `);
    console.log('✅ Created salary_processing table');

    // Create index for faster queries
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_salary_processing_user_month 
      ON salary_processing(user_id, month);
    `);
    console.log('✅ Created index on user_id, month');

    // Create index for status queries
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_salary_processing_status 
      ON salary_processing(status);
    `);
    console.log('✅ Created index on status');
    console.log('🔍 Verifying table structure...');
    // Verify table structure
    const result = await db.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'salary_processing'
      ORDER BY ordinal_position;
    `);
    
    console.log('\n✅ salary_processing table columns:');
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name} (${row.data_type}) ${row.is_nullable === 'NO' ? '[NOT NULL]' : '[NULLABLE]'}`);
    });

    console.log('\n✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration error:', error.message);
    process.exit(1);
  }
};


runMigration();
