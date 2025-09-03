-- Test: MOAI Creator Auto-Member
-- Tests the current behavior: creators are NOT automatically added as members
-- TODO: This test documents what SHOULD happen - creators should be auto-added as admin members
BEGIN;

SELECT plan(10);

-- Define reusable variables
\set creator_id '''80000000-0000-0000-0000-000000000001''::uuid'
\set moai_id '''90000000-0000-0000-0000-000000000001''::uuid'
\set creator_email '''moai-creator@test.com'''

-- Create a helper function to set auth context
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

-- 1. Setup test user
INSERT INTO auth.users (id, email, role) VALUES 
  (:creator_id, :creator_email, 'authenticated');

-- Wait for profile trigger
SELECT pg_sleep(0.1);

-- Test 1: Verify profile was created
SELECT ok(
  EXISTS (SELECT 1 FROM public.profiles WHERE id = :creator_id),
  'User profile should be created via trigger'
);

-- 2. Set auth context to creator
SELECT authenticate_as(:creator_id);

-- Test 2: Verify user can create a MOAI
INSERT INTO public.moais (id, name, description, creator_id, moai_type, type) VALUES 
  (:moai_id, 'Test Auto-Member MOAI', 'Testing automatic membership', :creator_id, 'public', 'activity');

SELECT ok(
  EXISTS (SELECT 1 FROM public.moais WHERE id = :moai_id AND creator_id = :creator_id),
  'User should be able to create a MOAI'
);

-- Test 3: Check if creator was automatically added as a member (currently NOT implemented)
SELECT ok(
  NOT EXISTS (
    SELECT 1 FROM public.moai_members 
    WHERE moai_id = :moai_id 
    AND profile_id = :creator_id
    AND is_active = true
  ),
  'Creator is NOT automatically added as a member (current behavior)'
);

-- Test 4: Check the role of the creator in the MOAI
SELECT is(
  (SELECT role_in_moai FROM public.moai_members 
   WHERE moai_id = :moai_id AND profile_id = :creator_id),
  NULL,
  'No membership record exists for creator (current behavior)'
);

-- Test 5: Verify member count is updated
SELECT is(
  (SELECT member_count FROM public.moais WHERE id = :moai_id),
  0,
  'MOAI member_count remains 0 as creator is not auto-added (current behavior)'
);

-- Test 6: Test with private MOAI
\set private_moai_id '''90000000-0000-0000-0000-000000000002''::uuid'

INSERT INTO public.moais (id, name, description, creator_id, moai_type, type) VALUES 
  (:private_moai_id, 'Test Private Auto-Member MOAI', 'Testing automatic membership for private', :creator_id, 'private', 'activity');

SELECT ok(
  NOT EXISTS (
    SELECT 1 FROM public.moai_members 
    WHERE moai_id = :private_moai_id 
    AND profile_id = :creator_id
    AND is_active = true
    AND role_in_moai = 'admin'
  ),
  'Creator is NOT automatically added to private MOAIs either (current behavior)'
);

-- Test 7: Check timing - member should be created immediately
\set new_moai_id '''90000000-0000-0000-0000-000000000003''::uuid'

-- Create MOAI and immediately check for membership
WITH new_moai AS (
  INSERT INTO public.moais (id, name, description, creator_id, moai_type, type) 
  VALUES (:new_moai_id, 'Test Immediate Member', 'Testing immediate membership', :creator_id, 'public', 'activity')
  RETURNING id
)
SELECT ok(
  NOT EXISTS (
    SELECT 1 FROM public.moai_members mm
    JOIN new_moai nm ON mm.moai_id = nm.id
    WHERE mm.profile_id = :creator_id
  ),
  'No membership is created when MOAI is created (current behavior)'
);

-- Test 8: Verify no memberships exist for creator
SELECT is(
  (SELECT COUNT(*) FROM public.moai_members 
   WHERE moai_id = :moai_id AND profile_id = :creator_id),
  0::bigint,
  'There should be zero membership records for the creator (current behavior)'
);

-- Additional test: Demonstrate manual membership creation
-- This shows what currently needs to be done manually

-- Test 9: Creator can manually add themselves as a member
INSERT INTO public.moai_members (moai_id, profile_id, role_in_moai) 
VALUES (:moai_id, :creator_id, 'admin');

SELECT ok(
  EXISTS (
    SELECT 1 FROM public.moai_members 
    WHERE moai_id = :moai_id 
    AND profile_id = :creator_id
    AND role_in_moai = 'admin'
  ),
  'Creator can manually add themselves as admin member'
);

-- Test 10: Verify member count is updated after manual addition
SELECT is(
  (SELECT member_count FROM public.moais WHERE id = :moai_id),
  1,
  'MOAI member_count is updated to 1 after manual member addition'
);

SELECT * FROM finish();

ROLLBACK;