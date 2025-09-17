-- Initialize SupplyChainLens Database
-- This script sets up the initial database structure and sample data

-- Create database if it doesn't exist (this will be handled by Docker)
-- CREATE DATABASE IF NOT EXISTS supplychain_lens;

-- Connect to the database
\c supplychain_lens;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Create custom types (these will be created by Prisma, but we can add some custom ones)
-- The main schema will be created by Prisma migrations

-- Insert sample data after tables are created
-- This will be handled by the seed script

-- Create indexes for better performance (these will be created by Prisma)
-- Additional custom indexes can be added here if needed

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE supplychain_lens TO postgres;

-- Create a read-only user for reporting (optional)
-- CREATE USER supplychain_readonly WITH PASSWORD 'readonly_password';
-- GRANT CONNECT ON DATABASE supplychain_lens TO supplychain_readonly;
-- GRANT USAGE ON SCHEMA public TO supplychain_readonly;
-- GRANT SELECT ON ALL TABLES IN SCHEMA public TO supplychain_readonly;
-- ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO supplychain_readonly;
