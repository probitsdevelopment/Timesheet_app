const db = require('./db');

async function runMigration() {
  try {
    console.log('🚀 Starting holidays migration...');

    // Create holidays table
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS holidays (
        id SERIAL PRIMARY KEY,
        date DATE NOT NULL UNIQUE,
        title VARCHAR(255) NOT NULL,
        type VARCHAR(50) DEFAULT 'holiday' CHECK (type IN ('holiday', 'rh')),
        created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await db.query(createTableQuery);
    console.log('✅ Holidays table created successfully');

    // Create index for faster queries
    const createIndexQuery = `
      CREATE INDEX IF NOT EXISTS idx_holidays_date ON holidays(date);
      CREATE INDEX IF NOT EXISTS idx_holidays_type ON holidays(type);
    `;

    await db.query(createIndexQuery);
    console.log('✅ Indexes created successfully');

    console.log('✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

runMigration();
