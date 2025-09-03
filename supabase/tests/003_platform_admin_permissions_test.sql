-- Platform Admin Permissions Tests
BEGIN;

SELECT plan(3);

-- Define reusable variables
\set test_user_id '''00000000-0000-0000-0000-000000000001''::uuid'
\set test_user_email '''admin@test.com'''
\set test_role_name '''PlatformAdmin'''

-- Ensure the trigger exists before we test it
SELECT ok(
  EXISTS (
    SELECT 1 
    FROM pg_trigger t
    JOIN pg_class c ON t.tgrelid = c.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE n.nspname = 'auth' 
    AND c.relname = 'users' 
    AND t.tgname = 'on_auth_user_created'
  ),
  'Trigger on_auth_user_created should exist on auth.users table'
);

-- 1. Setup test data
-- Create a test user with a specific ID we can reference
INSERT INTO auth.users (id, email, role) 
VALUES (
  :test_user_id, 
  :test_user_email, 
  'authenticated'
);

-- Give the trigger a moment to execute
-- SELECT pg_sleep(0.1);

-- Test 2: Verify that a profile is created for the user via trigger
SELECT ok (
  EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = :test_user_id
  ),
  'Profile should be created for the user via trigger'
);

-- Create or get PlatformAdmin role (use ON CONFLICT to handle if it already exists)
INSERT INTO public.roles (name, description) 
VALUES (:test_role_name, 'Full control over the entire platform')
ON CONFLICT (name) DO NOTHING;

-- Assign the PlatformAdmin role to the user
INSERT INTO public.user_roles (user_id, role_id)
SELECT 
  :test_user_id,
  r.id
FROM public.roles r
WHERE r.name = :test_role_name;

-- Test 3: Verify the user has the PlatformAdmin role
SELECT ok(
  EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.roles r ON ur.role_id = r.id
    WHERE ur.user_id = :test_user_id 
    AND r.name = :test_role_name
  ),
  'User should have the PlatformAdmin role assigned'
);

SELECT * FROM finish();

ROLLBACK;
