const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
});

async function createTableAndVerify() {
  try {
    console.log('🔄 Creating timesheets table...');

    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS timesheets (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        month VARCHAR(7) NOT NULL,
        year INTEGER,
        total_hours DECIMAL(10, 2) DEFAULT 0,
        status VARCHAR(20) DEFAULT 'draft',
        submitted_to INTEGER REFERENCES users(id),
        submitted_at TIMESTAMP,
        approved_by INTEGER REFERENCES users(id),
        approval_date TIMESTAMP,
        rejection_reason TEXT,
        organization VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, month, year, organization)
      );
    `;

    await pool.query(createTableQuery);
    console.log('✅ Timesheets table created successfully');

    // Verify table exists
    const verifyQuery = `
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'timesheets'
      ORDER BY ordinal_position;
    `;

    const result = await pool.query(verifyQuery);
    console.log('\n📋 Timesheets table structure:');
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type}`);
    });

    console.log('\n✅ Migration completed successfully!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createTableAndVerify();
