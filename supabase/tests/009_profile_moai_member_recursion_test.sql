-- Test: Profile and MOAI Member Recursion
-- Specifically tests the circular dependency between profiles and moai_members RLS policies
-- Profile policy: "Members can view profiles in same moai" references moai_members
-- Moai_members policies may reference profiles - this could cause recursion
BEGIN;

SELECT plan(10);

-- Define reusable variables
\set user1_id '''f0000000-0000-0000-0000-000000000001''::uuid'
\set user2_id '''f0000000-0000-0000-0000-000000000002''::uuid'
\set user3_id '''f0000000-0000-0000-0000-000000000003''::uuid'
\set shared_moai_id '''70000000-0000-0000-0000-000000000001''::uuid'

-- Create a helper function to set auth context
CREATE OR REPLACE FUNCTION authenticate_as(user_id uuid) RETURNS void AS $$
BEGIN
  PERFORM set_config('request.jwt.claims', json_build_object('sub', user_id::text)::text, true);
END;
$$ LANGUAGE plpgsql;

-- Setup test users
INSERT INTO auth.users (id, email, role) VALUES 
  (:user1_id, 'user1@recursiontest.com', 'authenticated'),
  (:user2_id, 'user2@recursiontest.com', 'authenticated'),
  (:user3_id, 'user3@recursiontest.com', 'authenticated');

-- Wait for profile triggers
SELECT pg_sleep(0.1);

-- Test 1: Verify all profiles were created
SELECT ok(
  (SELECT COUNT(*) FROM public.profiles WHERE id IN (:user1_id, :user2_id, :user3_id)) = 3,
  'All user profiles should be created'
);

-- Test 2: User1 can see their own profile (baseline)
SELECT authenticate_as(:user1_id);

SELECT ok(
  EXISTS (SELECT 1 FROM public.profiles WHERE id = :user1_id),
  'User1 can see their own profile'
);

-- Test 3: User1 CAN see User2's profile (current policy allows all authenticated users)
SELECT ok(
  EXISTS (SELECT 1 FROM public.profiles WHERE id = :user2_id),
  'User1 CAN see User2 profile (authenticated users can view all profiles policy)'
);

-- Test 4: Create a MOAI and add User1 as owner/admin
INSERT INTO public.moais (id, name, description, creator_id, moai_type, type) VALUES 
  (:shared_moai_id, 'Shared Recursion Test MOAI', 'Testing profile-member recursion', :user1_id, 'private', 'activity');

-- Add User1 as admin member
INSERT INTO public.moai_members (moai_id, profile_id, role_in_moai) VALUES 
  (:shared_moai_id, :user1_id, 'admin');

-- Test 5: User1 can still see their own profile after joining MOAI
SELECT ok(
  EXISTS (SELECT 1 FROM public.profiles WHERE id = :user1_id),
  'User1 can still see own profile after joining MOAI'
);

-- Test 6: Add User2 to the same MOAI
INSERT INTO public.moai_members (moai_id, profile_id, role_in_moai) VALUES 
  (:shared_moai_id, :user2_id, 'member');

-- Test 7: Now User1 should be able to see User2's profile (same MOAI policy)
-- This is where the potential recursion could occur:
-- profiles policy checks moai_members -> moai_members policy might check profiles
SELECT ok(
  EXISTS (SELECT 1 FROM public.profiles WHERE id = :user2_id),
  'User1 can see User2 profile after joining same MOAI (tests circular policy)'
);

-- Test 8: User2 can see User1's profile (reverse direction)
SELECT authenticate_as(:user2_id);

SELECT ok(
  EXISTS (SELECT 1 FROM public.profiles WHERE id = :user1_id),
  'User2 can see User1 profile in same MOAI (tests reverse circular policy)'
);

-- Test 9: User2 CAN see User3's profile (current policy allows all authenticated users)
SELECT ok(
  EXISTS (SELECT 1 FROM public.profiles WHERE id = :user3_id),
  'User2 CAN see User3 profile (authenticated users can view all profiles policy)'
);

-- Test 10: Test the specific circular query that could cause recursion
-- This query explicitly triggers the profiles->moai_members->profiles chain
SELECT ok(
  (SELECT COUNT(*) FROM public.profiles p
   WHERE p.id = :user1_id
   AND EXISTS (
     SELECT 1 FROM public.moai_members mm1
     WHERE mm1.profile_id = p.id
     AND EXISTS (
       SELECT 1 FROM public.moai_members mm2
       WHERE mm2.moai_id = mm1.moai_id
       AND EXISTS (
         SELECT 1 FROM public.profiles p2
         WHERE p2.id = mm2.profile_id
         AND p2.id = :user2_id
       )
     )
   )) = 1,
  'Complex circular query completes without infinite recursion'
);

-- Test 11: User3 authenticates and tries to access profiles
SELECT authenticate_as(:user3_id);

SELECT ok(
  EXISTS (SELECT 1 FROM public.profiles WHERE id = :user3_id),
  'User3 can see own profile (isolated user baseline)'
);

-- Test 12: User3 CAN see profiles of MOAI members (current policy allows all authenticated users)
SELECT ok(
  (SELECT COUNT(*) FROM public.profiles WHERE id IN (:user1_id, :user2_id)) = 2,
  'User3 CAN see MOAI member profiles (authenticated users can view all profiles policy)'
);

-- Additional verification: Test that the queries actually complete in reasonable time
-- by doing a more complex join that would definitely hang if there was recursion
DO $$
DECLARE
    start_time timestamp := clock_timestamp();
    end_time timestamp;
    query_duration interval;
BEGIN
    -- This query joins profiles with moai_members multiple times
    -- If there was recursion, this would hang or timeout
    PERFORM COUNT(*)
    FROM public.profiles p1
    JOIN public.moai_members mm1 ON p1.id = mm1.profile_id
    JOIN public.moai_members mm2 ON mm1.moai_id = mm2.moai_id
    JOIN public.profiles p2 ON mm2.profile_id = p2.id
    WHERE p1.id != p2.id;
    
    end_time := clock_timestamp();
    query_duration := end_time - start_time;
    
    IF query_duration > interval '5 seconds' THEN
        RAISE EXCEPTION 'Query took too long: %, possible recursion', query_duration;
    END IF;
END $$;

SELECT * FROM finish();

ROLLBACK;