-- =================================================================
-- Whalli Database Initialization Script
-- =================================================================
-- This script runs when the PostgreSQL container starts for the first time

-- Create database if it doesn't exist
SELECT 'CREATE DATABASE whalli'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'whalli')\gexec

-- Connect to the whalli database
\c whalli;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create a read-only user for monitoring/backup purposes
DO $$
BEGIN
   IF NOT EXISTS (SELECT FROM pg_catalog.pg_user WHERE usename = 'whalli_readonly') THEN
      CREATE USER whalli_readonly WITH PASSWORD 'readonly_password';
   END IF;
END
$$;

-- Grant read-only permissions
GRANT CONNECT ON DATABASE whalli TO whalli_readonly;
GRANT USAGE ON SCHEMA public TO whalli_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO whalli_readonly;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO whalli_readonly;

-- Create indexes that might be useful for performance
-- Note: Prisma will create the main schema, but these indexes can help with queries

-- Index for user lookups by email (already created by Prisma due to @index)
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email ON users(email);

-- Index for subscription status queries (already created by Prisma due to @index)
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

-- Index for project ownership queries (already created by Prisma due to @index)
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_projects_owner ON projects(owner_id);

-- Index for project member queries (already created by Prisma due to @index)
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_project_members_project ON project_members(project_id);

-- Index for task queries by project (already created by Prisma due to @index)
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_project ON tasks(project_id);

-- Index for message queries by project (already created by Prisma due to @index)
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_project ON messages(project_id);

-- Index for audit log queries by user (already created by Prisma due to @index)
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);

-- Index for audit log queries by action (already created by Prisma due to @index)
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);

-- Additional performance indexes that are not covered by Prisma schema
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_due_date ON tasks(due_date) WHERE due_date IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

-- Composite indexes for common query patterns
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_project_members_user_project ON project_members(user_id, project_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_user_project ON messages(user_id, project_id) WHERE project_id IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_project_status ON tasks(project_id, status);

-- Uncomment the above indexes after Prisma migrations have run