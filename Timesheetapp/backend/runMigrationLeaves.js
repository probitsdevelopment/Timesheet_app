// Migration script to create leaves table
const db = require('./db');

const createLeavesTable = async () => {
  try {
    console.log('🔄 Starting migration: Creating leaves table...\n');

    // Create leaves table
    await db.query(`
      CREATE TABLE IF NOT EXISTS leaves (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        leave_type VARCHAR(50) NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        number_of_days INTEGER,
        reason TEXT,
        status VARCHAR(20) DEFAULT 'pending',
        submitted_to INTEGER REFERENCES users(id),
        rejection_reason TEXT,
        organization VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Leaves table created successfully');

    // Create timesheets table if not exists
    await db.query(`
      CREATE TABLE IF NOT EXISTS timesheets (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        month VARCHAR(7),
        year INTEGER,
        total_hours DECIMAL(6,2),
        status VARCHAR(20) DEFAULT 'draft',
        submitted_to INTEGER REFERENCES users(id),
        submitted_at TIMESTAMP,
        approved_by INTEGER REFERENCES users(id),
        rejection_reason TEXT,
        organization VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Timesheets table created successfully');

    // Create indexes for leaves
    await db.query(`CREATE INDEX IF NOT EXISTS idx_leaves_user_id ON leaves(user_id);`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_leaves_start_date ON leaves(start_date);`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_leaves_status ON leaves(status);`);
    console.log('✅ Leaves indexes created successfully');

    // Create indexes for timesheets
    await db.query(`CREATE INDEX IF NOT EXISTS idx_timesheets_user_id ON timesheets(user_id);`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_timesheets_month ON timesheets(month);`);
    console.log('✅ Timesheets indexes created successfully');

    console.log('\n✅ Migration completed successfully!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
};

createLeavesTable();
