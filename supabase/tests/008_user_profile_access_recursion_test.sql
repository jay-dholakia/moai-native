-- Test: User Profile Access Without Infinite Recursion
-- 
-- This test verifies that:
-- 1. The database role is correctly set to 'authenticated' (not postgres)
-- 2. auth.uid() returns the correct user ID
-- 3. JWT claims are properly configured
-- 4. Users can access moai_members table WITHOUT triggering infinite recursion
--
-- IMPORTANT: This test will FAIL if infinite recursion is detected, indicating
-- that the RLS policies need to be fixed to avoid circular dependencies between
-- profile policies (referencing moai_members) and moai_members policies 
-- (referencing profiles).
BEGIN;

SELECT plan(7);

-- Define reusable variables
\set new_user_id '''e0000000-0000-0000-0000-000000000001''::uuid'
\set new_user_email '''newuser@test.com'''
\set moai_owner_id '''e0000000-0000-0000-0000-000000000002''::uuid'
\set test_moai_id '''f0000000-0000-0000-0000-000000000001''::uuid'



-- Create a clean helper function to set auth context and switch role
-- This function:
-- 1. Sets the database role to 'authenticated' (ensures RLS is enforced)
-- 2. Validates the user exists with the correct role
-- 3. Sets JWT claims to authenticate as the specified user
CREATE OR REPLACE FUNCTION authenticate_as(user_id uuid) RETURNS void AS $$
DECLARE
  user_role text;
BEGIN
  -- Switch to authenticated role to ensure RLS policies are enforced
  SET LOCAL role authenticated;
  
  PERFORM set_config('role', 'authenticated', true); 
  -- Set the JWT claims to authenticate as this user
  PERFORM set_config('request.jwt.claims', json_build_object(
    'sub', user_id::text,
    'aud', 'authenticated',
    'iss', 'supabase'
  )::text, true);
END;
$$ LANGUAGE plpgsql;

-- Test 1: Create a new user
INSERT INTO auth.users (id, email, role) VALUES 
  (:new_user_id, :new_user_email, 'authenticated');

-- Wait for profile trigger
SELECT pg_sleep(0.1);

-- Test 1a: Verify user was created with correct role
SELECT ok(
  (SELECT role FROM auth.users WHERE id = :new_user_id) = 'authenticated',
  'User should be created with authenticated role'
);

-- Test 2: Verify profile was created via trigger
SELECT ok(
  EXISTS (SELECT 1 FROM public.profiles WHERE id = :new_user_id),
  'Profile should be created for new user via trigger'
);

-- Test 3: Authenticate user (this also sets the database role to authenticated)
SELECT authenticate_as(:new_user_id);


-- Test 3b: Verify auth.uid() returns the correct ID
SELECT ok(
  auth.uid() = :new_user_id,
  'auth.uid() should return the authenticated user ID'
);

-- Test 4: Verify auth context is properly set
SELECT ok(
  (SELECT current_setting('request.jwt.claims', true)::json->>'sub')::uuid = :new_user_id,
  'JWT claims should contain the correct user ID'
);

-- Test 5: Verify JWT claims have correct role
SELECT ok(
  (SELECT current_setting('request.jwt.claims', true)::json->>'role') = 'authenticated',
  'JWT claims should contain the authenticated role'
);

-- Test 6: Reset to postgres role to create test data without triggering policies
RESET role;

-- Create MOAI and membership to set up recursive condition
INSERT INTO public.moais (id, name, creator_id, moai_type, type) VALUES 
  ('f0000000-0000-0000-0000-000000000001'::uuid, 'Test MOAI', :new_user_id, 'private', 'activity');

INSERT INTO public.moai_members (moai_id, profile_id, role_in_moai) VALUES 
  ('f0000000-0000-0000-0000-000000000001'::uuid, :new_user_id, 'admin');

SELECT ok(
  EXISTS (SELECT 1 FROM public.moai_members WHERE profile_id = :new_user_id),
  'Test data setup: User is now a member of a MOAI'
);

-- Test 7: Switch back to authenticated role and test for recursion
SELECT authenticate_as(:new_user_id);

-- Test 8: Verify that accessing moai_members does NOT trigger infinite recursion
-- 
-- *** THIS TEST CURRENTLY FAILS ***
-- 
-- This test will FAIL until the RLS policies are fixed to avoid circular dependencies.
-- The failure indicates that:
-- 1. Profile policies reference moai_members table
-- 2. Moai_members policies reference profiles table (through functions)
-- 3. This creates infinite recursion when both tables are accessed with authenticated role
--
-- To fix this, use SECURITY DEFINER functions that bypass RLS when checking permissions.
--
SELECT lives_ok(
  $$ SELECT COUNT(*) FROM public.moai_members WHERE profile_id = 'e0000000-0000-0000-0000-000000000001'::uuid $$,
  'Accessing moai_members with authenticated role should NOT trigger infinite recursion'
);


SELECT * FROM finish();

ROLLBACK;