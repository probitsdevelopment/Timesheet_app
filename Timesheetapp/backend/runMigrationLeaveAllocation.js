const db = require('./db');

const createLeaveAllocationTable = async () => {
  try {
    console.log('🔄 Creating leave_allocation table...');

    // Create the leave_allocation table
    await db.query(`
      CREATE TABLE IF NOT EXISTS leave_allocation (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        leave_type VARCHAR(50) NOT NULL DEFAULT 'annual',
        allocated_days INTEGER NOT NULL DEFAULT 12,
        year INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, leave_type, year)
      );
    `);

    console.log('✅ leave_allocation table created successfully!');

    // Create index for faster queries
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_leave_allocation_user_id 
      ON leave_allocation(user_id);
    `);

    console.log('✅ Index created on user_id');

    // Insert default allocations for existing users (12 annual leaves for 2026)
    const users = await db.query('SELECT id FROM users');
    const currentYear = new Date().getFullYear();

    for (const user of users.rows) {
      try {
        await db.query(
          `INSERT INTO leave_allocation (user_id, leave_type, allocated_days, year)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (user_id, leave_type, year) DO NOTHING`,
          [user.id, 'annual', 12, currentYear]
        );
      } catch (err) {
        // User might already have allocation, skip silently
      }
    }

    console.log(`✅ Default allocations (12 annual leaves) inserted for ${users.rows.length} users`);
    console.log('✅ Migration completed successfully!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
};

createLeaveAllocationTable();
