-- Test: Moai Member Access With Recursion Detection
BEGIN;

SELECT plan(3);

-- Define reusable variables
\set user1_id '''e0000000-0000-0000-0000-000000000001''::uuid'
\set user2_id '''e0000000-0000-0000-0000-000000000002''::uuid'
\set test_moai_id '''f0000000-0000-0000-0000-000000000001''::uuid'

-- Helper function to set auth context
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

-- 1. Setup: Create users, a moai, and add BOTH users to the moai.
-- This is the critical step to create the recursive condition.
INSERT INTO auth.users (id, email, role) VALUES 
  (:user1_id, 'user1@test.com', 'authenticated'),
  (:user2_id, 'user2@test.com', 'authenticated');

-- The trigger will create profiles for them.
-- Create a moai owned by user2
INSERT INTO public.moais (id, name, creator_id, moai_type, type) VALUES 
  (:test_moai_id, 'Recursive Test MOAI', :user2_id, 'private', 'activity');

-- Add both users as active members.
INSERT INTO public.moai_members (moai_id, profile_id, is_active) VALUES 
  (:test_moai_id, :user1_id, true),
  (:test_moai_id, :user2_id, true);

SELECT ok((SELECT count(*) FROM public.moai_members WHERE moai_id = :test_moai_id) = 2, 'Setup complete: Two users are members of the test moai.');


-- 2. Authenticate as one of the members
SELECT authenticate_as(:user1_id);
SELECT is(auth.uid(), :user1_id, 'Successfully authenticated as user 1.');


-- 3. Test for Recursion
-- Attempt to select the members of the moai. If the recursive policy exists,
-- this query will fail with a "stack depth limit exceeded" error.
-- `throws_ok` will catch this expected error and the test will PASS.
-- If the policy is fixed and does NOT recurse, this test will FAIL, which is what we want.

SELECT throws_ok(
  $$ SELECT * FROM public.moai_members WHERE moai_id = 'f0000000-0000-0000-0000-000000000001'::uuid $$,
  '54001', -- The SQLSTATE for 'statement_too_complex'
  'stack depth limit exceeded',
  'Selecting from moai_members with a recursive policy correctly throws a stack depth error.'
);

-- NOTE: After you fix the RLS policy using the non-recursive helper function I provided
-- in the previous answer, the above `throws_ok` test will fail. You would then change it to
-- a `lives_ok` test to confirm the fix, like this:
/*
SELECT lives_ok(
  $$ SELECT count(*) FROM public.moai_members WHERE moai_id = 'f0000000-0000-0000-0000-000000000001'::uuid $$,
  'After fixing RLS, selecting from moai_members should not cause an error.'
);
*/


SELECT * FROM finish();

ROLLBACK;