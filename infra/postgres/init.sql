-- Runs once on first boot of a fresh volume. Application tables are owned by
-- @koi/server's Drizzle migrations, never by this file.

-- PowerSync bucket storage lives in its own database (Postgres bucket
-- storage is GA — no MongoDB, D-022).
CREATE DATABASE powersync_storage;

-- Logical-replication publication for PowerSync. FOR ALL TABLES so tables
-- added by later migrations replicate without an ALTER PUBLICATION step
-- (a forgotten ALTER would be a silent no-sync failure); sync_rules.yaml
-- decides what actually reaches clients — server-only tables such as
-- dead_letters are simply never selected there.
CREATE PUBLICATION powersync FOR ALL TABLES;
