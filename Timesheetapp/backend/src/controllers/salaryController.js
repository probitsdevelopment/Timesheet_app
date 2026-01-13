const db = require('../../db');

// Get all salaries (admin only)
exports.getAllSalaries = async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM salaries ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('❌ GET /salaries error:', error);
    res.status(500).json({ error: 'Failed to fetch salaries' });
  }
};

// Get salary by ID
exports.getSalaryById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      'SELECT * FROM salaries WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Salary record not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('❌ GET /salaries/:id error:', error);
    res.status(500).json({ error: 'Failed to fetch salary' });
  }
};

// Get salary by user ID
exports.getSalaryByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await db.query(
      'SELECT * FROM salaries WHERE user_id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Salary record not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('❌ GET /salaries/user/:userId error:', error);
    res.status(500).json({ error: 'Failed to fetch salary' });
  }
};

// Create new salary
exports.createSalary = async (req, res) => {
  try {
    console.log('📝 Creating salary...');
    console.log('Request body:', req.body);
    console.log('User:', req.user);

    const { user_id, basic_salary } = req.body;
    const organization = req.user?.organization;

    // Validation
    if (!user_id || !basic_salary) {
      return res.status(400).json({
        error: 'user_id and basic_salary are required',
      });
    }

    if (isNaN(basic_salary) || basic_salary <= 0) {
      return res.status(400).json({
        error: 'basic_salary must be a positive number',
      });
    }

    if (!organization) {
      return res.status(400).json({
        error: 'Organization not found in user token',
      });
    }

    // Check if user exists
    const userExists = await db.query(
      'SELECT id FROM users WHERE id = $1',
      [user_id]
    );

    if (userExists.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Insert salary
    const result = await db.query(
      `
      INSERT INTO salaries (user_id, basic_salary, organization)
      VALUES ($1, $2, $3)
      RETURNING *
      `,
      [user_id, basic_salary, organization]
    );

    console.log(`✅ Salary created for user ${user_id}`);
    res.status(201).json(result.rows[0]);

  } catch (error) {
    // Unique constraint (salary already exists)
    if (error.code === '23505') {
      return res.status(400).json({
        error: 'Salary record already exists for this user',
      });
    }

    console.error('❌ POST /salaries error:', error);
    res.status(500).json({ error: 'Failed to create salary' });
  }
};

// Update salary
exports.updateSalary = async (req, res) => {
  try {
    const { id } = req.params;
    const { basic_salary } = req.body;

    // Validation
    if (!basic_salary) {
      return res.status(400).json({
        error: 'basic_salary is required',
      });
    }

    if (isNaN(basic_salary) || basic_salary <= 0) {
      return res.status(400).json({
        error: 'basic_salary must be a positive number',
      });
    }

    const result = await db.query(
      `
      UPDATE salaries
      SET basic_salary = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
      `,
      [basic_salary, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Salary record not found' });
    }

    console.log(`✅ Salary ${id} updated`);
    res.json(result.rows[0]);

  } catch (error) {
    console.error('❌ PUT /salaries/:id error:', error);
    res.status(500).json({ error: 'Failed to update salary' });
  }
};

// Delete salary
exports.deleteSalary = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      'DELETE FROM salaries WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Salary record not found' });
    }

    console.log(`✅ Salary ${id} deleted`);
    res.json({ message: 'Salary record deleted successfully' });

  } catch (error) {
    console.error('❌ DELETE /salaries/:id error:', error);
    res.status(500).json({ error: 'Failed to delete salary' });
  }
};

// Get all salaries for organization
exports.getSalariesByOrganization = async (req, res) => {
  try {
    const organization = req.user?.organization;

    if (!organization) {
      return res.status(400).json({ error: 'Organization not found' });
    }

    const result = await db.query(
      `
      SELECT * FROM salaries
      WHERE organization = $1
      ORDER BY created_at DESC
      `,
      [organization]
    );

    res.json(result.rows);

  } catch (error) {
    console.error('❌ GET /salaries/organization error:', error);
    res.status(500).json({ error: 'Failed to fetch salaries' });
  }
};
