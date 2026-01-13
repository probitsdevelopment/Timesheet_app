const db = require('./db');

async function addOrganizationToHolidays() {
  try {
    console.log('🔄 Adding organization field to holidays table...');

    // Add organization column if it doesn't exist
    await db.query(`
      ALTER TABLE holidays
      ADD COLUMN IF NOT EXISTS organization VARCHAR(255) DEFAULT 'probits'
    `);

    console.log('✅ Organization column added to holidays table');

    // Create index on organization for faster queries
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_holidays_organization ON holidays(organization)
    `);

    console.log('✅ Index created on organization field');

    // Set organization for existing holidays
    await db.query(`
      UPDATE holidays 
      SET organization = 'probits' 
      WHERE organization IS NULL OR organization = ''
    `);

    console.log('✅ Updated existing holidays with organization');

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

addOrganizationToHolidays();
