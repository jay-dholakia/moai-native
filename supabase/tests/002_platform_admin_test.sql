-- Platform Admin Role Tests
-- Test that pgTAP is working

-- Import pgTAP functions into current namespace
SET search_path TO extensions, public;

BEGIN;
-- \i ./utils/setup_util.sql
SELECT plan(1);

SELECT ok(true, 'pgTAP is working');

SELECT * FROM finish();

ROLLBACK;