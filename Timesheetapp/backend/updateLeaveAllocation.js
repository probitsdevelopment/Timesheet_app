const db = require('./db');

const updateLeaveAllocation = async () => {
  try {
    console.log('🔄 Updating leave allocation from 14 to 12 days...');

    // Update all existing records from 14 to 12 days
    const result = await db.query(
      `UPDATE leave_allocation 
       SET allocated_days = 12, updated_at = CURRENT_TIMESTAMP
       WHERE allocated_days = 14 AND leave_type = 'annual'`
    );

    console.log('✅ Update completed successfully!');
    console.log(`✅ Updated leave allocation from 14 to 12 days`);
    
    // Show updated records
    const updated = await db.query(
      `SELECT user_id, leave_type, allocated_days, year 
       FROM leave_allocation 
       WHERE leave_type = 'annual' 
       ORDER BY user_id`
    );

    console.log('\n📋 Updated allocations:');
    console.log(JSON.stringify(updated.rows, null, 2));
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Update failed:', error.message);
    process.exit(1);
  }
};

updateLeaveAllocation();
