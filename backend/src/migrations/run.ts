import pool from '../config/database.js';
import { PoolClient } from 'pg';

interface Migration {
  name: string;
  sql: string;
}

const migrations: Migration[] = [
  {
    name: '001_initial_schema',
    sql: `
      -- Organizations table (multi-tenancy support)
      CREATE TABLE IF NOT EXISTS organizations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        plan_type VARCHAR(50) DEFAULT 'self_hosted',
        settings JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Users table
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'caretaker')),
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        last_sync_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Residents table
      CREATE TABLE IF NOT EXISTS residents (
        id SERIAL PRIMARY KEY,
        organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        date_of_birth DATE,
        room_number VARCHAR(50),
        admission_date DATE,
        emergency_contact TEXT,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Inventory items table
      CREATE TABLE IF NOT EXISTS inventory_items (
        id SERIAL PRIMARY KEY,
        organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(50) CHECK (category IN ('medicine', 'supply')),
        quantity DECIMAL(10, 2) NOT NULL DEFAULT 0,
        unit VARCHAR(50),
        min_stock_level DECIMAL(10, 2) DEFAULT 0,
        expiry_date DATE,
        location VARCHAR(255),
        notes TEXT,
        version INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Inventory transactions table
      CREATE TABLE IF NOT EXISTS inventory_transactions (
        id SERIAL PRIMARY KEY,
        item_id INTEGER REFERENCES inventory_items(id) ON DELETE CASCADE,
        type VARCHAR(10) CHECK (type IN ('in', 'out')),
        quantity DECIMAL(10, 2) NOT NULL,
        performed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        notes TEXT,
        synced BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Schedules table
      CREATE TABLE IF NOT EXISTS schedules (
        id SERIAL PRIMARY KEY,
        organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
        caretaker_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        start_time TIMESTAMP NOT NULL,
        end_time TIMESTAMP NOT NULL,
        shift_type VARCHAR(50),
        status VARCHAR(50) DEFAULT 'scheduled',
        notes TEXT,
        version INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Medications table
      CREATE TABLE IF NOT EXISTS medications (
        id SERIAL PRIMARY KEY,
        organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
        resident_id INTEGER REFERENCES residents(id) ON DELETE CASCADE,
        medication_name VARCHAR(255) NOT NULL,
        dosage VARCHAR(100),
        frequency VARCHAR(100),
        start_date DATE NOT NULL,
        end_date DATE,
        instructions TEXT,
        version INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Medication logs table
      CREATE TABLE IF NOT EXISTS medication_logs (
        id SERIAL PRIMARY KEY,
        medication_id INTEGER REFERENCES medications(id) ON DELETE CASCADE,
        administered_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        administered_at TIMESTAMP NOT NULL,
        status VARCHAR(50) CHECK (status IN ('given', 'missed', 'refused')),
        notes TEXT,
        synced BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Tasks table
      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
        resident_id INTEGER REFERENCES residents(id) ON DELETE SET NULL,
        due_date TIMESTAMP,
        priority VARCHAR(50) DEFAULT 'medium',
        status VARCHAR(50) DEFAULT 'pending',
        version INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Activities table
      CREATE TABLE IF NOT EXISTS activities (
        id SERIAL PRIMARY KEY,
        organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        resident_ids INTEGER[],
        scheduled_at TIMESTAMP NOT NULL,
        duration INTEGER,
        led_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        status VARCHAR(50) DEFAULT 'scheduled',
        version INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Caretaker rates table (flexible payroll)
      CREATE TABLE IF NOT EXISTS caretaker_rates (
        id SERIAL PRIMARY KEY,
        caretaker_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        rate_type VARCHAR(50) CHECK (rate_type IN ('hourly', 'daily', 'night', 'full_day', 'weekly', 'weekend', 'weekday', 'monthly')),
        rate_amount DECIMAL(10, 2) NOT NULL,
        applies_to_days INTEGER[],
        effective_from DATE NOT NULL,
        effective_until DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Special day rates table (holidays/bonuses)
      CREATE TABLE IF NOT EXISTS special_day_rates (
        id SERIAL PRIMARY KEY,
        organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        date DATE NOT NULL,
        bonus_type VARCHAR(50) CHECK (bonus_type IN ('fixed', 'percentage')),
        bonus_amount DECIMAL(10, 2) NOT NULL,
        applies_to_all_caretakers BOOLEAN DEFAULT true,
        specific_caretaker_ids INTEGER[],
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Work hours table
      CREATE TABLE IF NOT EXISTS work_hours (
        id SERIAL PRIMARY KEY,
        caretaker_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        clock_in TIMESTAMP NOT NULL,
        clock_out TIMESTAMP,
        break_duration INTEGER DEFAULT 0,
        notes TEXT,
        synced BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Payroll table
      CREATE TABLE IF NOT EXISTS payroll (
        id SERIAL PRIMARY KEY,
        caretaker_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        period_start DATE NOT NULL,
        period_end DATE NOT NULL,
        total_hours DECIMAL(10, 2) NOT NULL,
        base_amount DECIMAL(10, 2) NOT NULL,
        bonus_amount DECIMAL(10, 2) DEFAULT 0,
        total_amount DECIMAL(10, 2) NOT NULL,
        calculation_details JSONB,
        status VARCHAR(50) DEFAULT 'pending',
        paid_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Sync queue table (offline operations)
      CREATE TABLE IF NOT EXISTS sync_queue (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        entity_type VARCHAR(50) NOT NULL,
        entity_id INTEGER,
        operation VARCHAR(50) CHECK (operation IN ('create', 'update', 'delete')),
        data JSONB NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        attempts INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        synced_at TIMESTAMP
      );

      -- Create indexes for performance
      CREATE INDEX IF NOT EXISTS idx_users_organization ON users(organization_id);
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_residents_organization ON residents(organization_id);
      CREATE INDEX IF NOT EXISTS idx_inventory_organization ON inventory_items(organization_id);
      CREATE INDEX IF NOT EXISTS idx_schedules_organization ON schedules(organization_id);
      CREATE INDEX IF NOT EXISTS idx_schedules_caretaker ON schedules(caretaker_id);
      CREATE INDEX IF NOT EXISTS idx_medications_resident ON medications(resident_id);
      CREATE INDEX IF NOT EXISTS idx_medication_logs_medication ON medication_logs(medication_id);
      CREATE INDEX IF NOT EXISTS idx_tasks_organization ON tasks(organization_id);
      CREATE INDEX IF NOT EXISTS idx_tasks_assigned ON tasks(assigned_to);
      CREATE INDEX IF NOT EXISTS idx_work_hours_caretaker ON work_hours(caretaker_id);
      CREATE INDEX IF NOT EXISTS idx_sync_queue_user ON sync_queue(user_id);
      CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON sync_queue(status);

      -- Create updated_at trigger function
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';

      -- Apply triggers to tables with updated_at
      CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      CREATE TRIGGER update_residents_updated_at BEFORE UPDATE ON residents
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      CREATE TRIGGER update_inventory_items_updated_at BEFORE UPDATE ON inventory_items
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      CREATE TRIGGER update_schedules_updated_at BEFORE UPDATE ON schedules
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      CREATE TRIGGER update_medications_updated_at BEFORE UPDATE ON medications
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      CREATE TRIGGER update_activities_updated_at BEFORE UPDATE ON activities
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      CREATE TRIGGER update_work_hours_updated_at BEFORE UPDATE ON work_hours
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      CREATE TRIGGER update_payroll_updated_at BEFORE UPDATE ON payroll
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `
  }
];

async function runMigrations(): Promise<void> {
  const client: PoolClient = await pool.connect();

  try {
    console.log('🔄 Running database migrations...\n');

    // Create migrations tracking table
    await client.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    for (const migration of migrations) {
      // Check if migration already executed
      const result = await client.query(
        'SELECT * FROM migrations WHERE name = $1',
        [migration.name]
      );

      if (result.rows.length === 0) {
        console.log(`⏳ Running migration: ${migration.name}`);
        await client.query(migration.sql);
        await client.query(
          'INSERT INTO migrations (name) VALUES ($1)',
          [migration.name]
        );
        console.log(`✅ Completed: ${migration.name}\n`);
      } else {
        console.log(`⏭️  Skipped (already executed): ${migration.name}\n`);
      }
    }

    console.log('✅ All migrations completed successfully!');
  } catch (error) {
    console.error('❌ Migration error:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run if called directly
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  runMigrations()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export { runMigrations };
