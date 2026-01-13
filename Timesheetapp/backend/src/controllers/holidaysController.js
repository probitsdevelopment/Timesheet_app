const db = require('../../db');

// Get all holidays
exports.getAllHolidays = async (req, res) => {
  try {
    const organization = req.user?.organization || 'probits';
    console.log(`📥 Fetching all holidays for organization: ${organization}`);
    const holidays = await db.getAll(
      'SELECT * FROM holidays WHERE organization = $1 ORDER BY date ASC',
      [organization]
    );
    console.log('✅ Holidays retrieved:', holidays.length);
    res.json(holidays);
  } catch (error) {
    console.error('❌ Error fetching holidays:', error);
    res.status(500).json({ error: 'Failed to fetch holidays' });
  }
};

// Get single holiday by ID
exports.getHolidayById = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('📥 Fetching holiday:', id);
    const holiday = await db.getOne('SELECT * FROM holidays WHERE id = $1', [id]);
    if (!holiday) {
      return res.status(404).json({ error: 'Holiday not found' });
    }
    res.json(holiday);
  } catch (error) {
    console.error('❌ Error fetching holiday:', error);
    res.status(500).json({ error: 'Failed to fetch holiday' });
  }
};

// Create holiday (Admin only)
exports.createHoliday = async (req, res) => {
  try {
    const { date, title, type = 'holiday' } = req.body;
    console.log('🔍 DEBUG: req.user:', req.user);
    const userId = req.user?.userId;
    const organization = req.user?.organization || 'probits';

    // Validate input
    if (!date || !title) {
      return res.status(400).json({ error: 'Date and title are required' });
    }

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated or userId missing' });
    }

    if (!['holiday', 'rh'].includes(type)) {
      return res.status(400).json({ error: 'Invalid holiday type' });
    }

    console.log('📝 Creating holiday:', { date, title, type, createdBy: userId, organization });

    const result = await db.query(
      'INSERT INTO holidays (date, title, type, created_by, organization) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [date, title, type, userId, organization]
    );

    const holiday = result.rows[0];
    console.log('✅ Holiday created:', holiday);
    res.status(201).json(holiday);
  } catch (error) {
    console.error('❌ Error creating holiday:', error);
    if (error.message.includes('duplicate')) {
      return res.status(409).json({ error: 'Holiday on this date already exists' });
    }
    res.status(500).json({ error: 'Failed to create holiday' });
  }
};

// Update holiday (Admin only)
exports.updateHoliday = async (req, res) => {
  try {
    const { id } = req.params;
    const { date, title, type } = req.body;

    console.log('📝 Updating holiday:', id);

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (date) {
      updates.push(`date = $${paramCount++}`);
      values.push(date);
    }
    if (title) {
      updates.push(`title = $${paramCount++}`);
      values.push(title);
    }
    if (type) {
      updates.push(`type = $${paramCount++}`);
      values.push(type);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `UPDATE holidays SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`;
    const result = await db.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Holiday not found' });
    }

    console.log('✅ Holiday updated:', result.rows[0]);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('❌ Error updating holiday:', error);
    res.status(500).json({ error: 'Failed to update holiday' });
  }
};

// Delete holiday (Admin only)
exports.deleteHoliday = async (req, res) => {
  try {
    const { id } = req.params;

    console.log('🗑️ Deleting holiday:', id);

    const result = await db.query('DELETE FROM holidays WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Holiday not found' });
    }

    console.log('✅ Holiday deleted:', result.rows[0]);
    res.json({ message: 'Holiday deleted successfully', holiday: result.rows[0] });
  } catch (error) {
    console.error('❌ Error deleting holiday:', error);
    res.status(500).json({ error: 'Failed to delete holiday' });
  }
};
