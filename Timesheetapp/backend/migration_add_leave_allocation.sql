-- Add missing columns to leaves table
ALTER TABLE leaves ADD COLUMN IF NOT EXISTS is_paid_leave BOOLEAN DEFAULT true;

-- Create leave_allocation table
CREATE TABLE IF NOT EXISTS leave_allocation (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  leave_type VARCHAR(50) NOT NULL,
  year INTEGER NOT NULL,
  total_days DECIMAL(5,2) NOT NULL,
  used_days DECIMAL(5,2) DEFAULT 0,
  remaining_days DECIMAL(5,2),
  organization VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, leave_type, year, organization)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_leave_allocation_user_id ON leave_allocation(user_id);
CREATE INDEX IF NOT EXISTS idx_leave_allocation_year ON leave_allocation(year);

-- Create salary table
CREATE TABLE IF NOT EXISTS salaries (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  base_salary DECIMAL(10,2),
  hourly_rate DECIMAL(8,2),
  month VARCHAR(7),
  year INTEGER,
  total_hours DECIMAL(8,2),
  total_salary DECIMAL(10,2),
  organization VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_salaries_user_id ON salaries(user_id);
CREATE INDEX IF NOT EXISTS idx_salaries_month ON salaries(month);

-- Create salary_processing table
CREATE TABLE IF NOT EXISTS salary_processing (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  month VARCHAR(7) NOT NULL,
  year INTEGER NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  base_salary DECIMAL(10,2),
  total_hours DECIMAL(8,2),
  hourly_rate DECIMAL(8,2),
  calculated_salary DECIMAL(10,2),
  bonus DECIMAL(10,2) DEFAULT 0,
  deductions DECIMAL(10,2) DEFAULT 0,
  final_salary DECIMAL(10,2),
  organization VARCHAR(100),
  processed_by INTEGER REFERENCES users(id),
  processed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, month, year, organization)
);

CREATE INDEX IF NOT EXISTS idx_salary_processing_user_id ON salary_processing(user_id);
CREATE INDEX IF NOT EXISTS idx_salary_processing_month ON salary_processing(month);
CREATE INDEX IF NOT EXISTS idx_salary_processing_status ON salary_processing(status);

-- Create organizations table
CREATE TABLE IF NOT EXISTS organizations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_organizations_name ON organizations(name);

-- Create loss_of_pay table
CREATE TABLE IF NOT EXISTS loss_of_pay (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  month VARCHAR(7),
  year INTEGER,
  amount DECIMAL(10,2),
  reason TEXT,
  organization VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_loss_of_pay_user_id ON loss_of_pay(user_id);
