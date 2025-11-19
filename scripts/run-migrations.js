/**
 * Migration Runner Script for Neon Database
 * 
 * This script runs SQL migrations against your Neon database.
 * 
 * Usage:
 *   node scripts/run-migrations.js
 * 
 * Environment Variables Required:
 *   DATABASE_URL - Your Neon database connection string
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runMigrations() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Read migration files
    const migrationsDir = path.join(__dirname, '..', 'database', 'migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort(); // Run migrations in alphabetical order

    console.log(`📋 Found ${migrationFiles.length} migration(s)`);

    for (const file of migrationFiles) {
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');
      
      console.log(`\n🔄 Running migration: ${file}`);
      await client.query(sql);
      console.log(`✅ Migration ${file} completed successfully`);
    }

    // Verify password column exists (check both lowercase and any case)
    console.log('\n🔍 Verifying password column...');
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND LOWER(column_name) = 'password'
    `);

    if (result.rows.length === 0) {
      console.log('⚠️  Password column not found! Creating it...');
      await client.query(`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS password VARCHAR(255) NULL;
      `);
      console.log('✅ Password column created');
    } else {
      const col = result.rows[0];
      console.log('✅ Password column exists:', col);
      
      // Check if column name is different case and needs fixing
      if (col.column_name !== 'password') {
        console.log(`⚠️  Column name is "${col.column_name}" but should be "password"`);
        console.log('💡 You may need to rename the column manually:');
        console.log(`   ALTER TABLE users RENAME COLUMN "${col.column_name}" TO password;`);
      }
    }

    // Check for any missing columns from User entity
    console.log('\n🔍 Checking for missing columns...');
    const allColumns = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users'
      ORDER BY column_name
    `);
    
    const existingColumns = allColumns.rows.map(r => r.column_name.toLowerCase());
    const requiredColumns = [
      'id', 'displaycode', 'fullname', 'email', 'password', 
      'phone', 'role', 'isactive', 'dob', 'address', 'profileimage',
      'createdat', 'updatedat'
    ];

    const missingColumns = requiredColumns.filter(
      col => !existingColumns.includes(col)
    );

    if (missingColumns.length > 0) {
      console.log('⚠️  Missing columns:', missingColumns);
      console.log('💡 These columns should be created by TypeORM synchronize or migrations');
    } else {
      console.log('✅ All required columns exist');
    }

    console.log('\n✅ All migrations completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigrations();

