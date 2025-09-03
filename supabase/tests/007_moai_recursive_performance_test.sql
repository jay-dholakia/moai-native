-- Test: MOAI Recursive Performance Test
-- Specifically tests for performance degradation due to recursive RLS policies
BEGIN;

SELECT plan(7);

-- Define reusable variables
\set creator_id '''c0000000-0000-0000-0000-000000000001''::uuid'
\set member_id '''c0000000-0000-0000-0000-000000000002''::uuid'
\set test_moai_prefix '''d0000000-0000-0000-0000-00000000000'''

-- Create a helper function to set auth context
CREATE OR REPLACE FUNCTION authenticate_as(user_id uuid) RETURNS void AS $$
BEGIN
  PERFORM set_config('request.jwt.claims', json_build_object('sub', user_id::text)::text, true);
END;
$$ LANGUAGE plpgsql;

-- Helper function to measure query time
CREATE OR REPLACE FUNCTION measure_query_time(query_text text) 
RETURNS interval AS $$
DECLARE
    start_time timestamp;
    end_time timestamp;
BEGIN
    start_time := clock_timestamp();
    EXECUTE query_text;
    end_time := clock_timestamp();
    RETURN end_time - start_time;
END;
$$ LANGUAGE plpgsql;

-- Setup test users
INSERT INTO auth.users (id, email, role) VALUES 
  (:creator_id, 'creator@test.com', 'authenticated'),
  (:member_id, 'member@test.com', 'authenticated');

-- Wait for profile triggers
SELECT pg_sleep(0.1);

-- Test 1: Baseline - create a few MOAIs
SELECT authenticate_as(:creator_id);

-- Create 5 MOAIs with mixed types
INSERT INTO public.moais (id, name, description, creator_id, moai_type, type) 
SELECT 
  (:test_moai_prefix || i::text)::uuid,
  'Test MOAI ' || i::text,
  'Testing recursive performance',
  :creator_id,
  CASE WHEN i % 2 = 0 THEN 'public'::moai_type ELSE 'private'::moai_type END,
  'activity'
FROM generate_series(1, 5) AS i;

-- Add creator as member to all MOAIs
INSERT INTO public.moai_members (moai_id, profile_id, role_in_moai)
SELECT 
  (:test_moai_prefix || i::text)::uuid,
  :creator_id,
  'admin'
FROM generate_series(1, 5) AS i;

-- Add member to some MOAIs
INSERT INTO public.moai_members (moai_id, profile_id, role_in_moai)
SELECT 
  (:test_moai_prefix || i::text)::uuid,
  :member_id,
  'member'
FROM generate_series(1, 3) AS i;

-- Test 2: Query as member - this triggers the recursive policies
SELECT authenticate_as(:member_id);

-- Test accessing moais table (which checks moai_members)
SELECT ok(
  (SELECT COUNT(*) FROM public.moais WHERE id IN (
    SELECT (:test_moai_prefix || i::text)::uuid 
    FROM generate_series(1, 5) AS i
  )) >= 3,
  'Member can see at least the MOAIs they belong to'
);

-- Test 3: Measure time for moais access
SELECT ok(
  measure_query_time('SELECT COUNT(*) FROM public.moais') < interval '1 second',
  'Moais query completes in reasonable time (< 1 second)'
);

-- Test 4: Measure time for moai_members access
SELECT ok(
  measure_query_time('SELECT COUNT(*) FROM public.moai_members') < interval '1 second',
  'Moai_members query completes in reasonable time (< 1 second)'
);

-- Test 5: Test nested subquery that could trigger multiple policy evaluations
SELECT ok(
  (SELECT COUNT(*) FROM public.moais m 
   WHERE EXISTS (
     SELECT 1 FROM public.moai_members mm 
     WHERE mm.moai_id = m.id
   )) >= 3,
  'Nested query with policy interaction completes successfully'
);

-- Test 6: Test query that joins both tables (worst case for recursion)
SELECT ok(
  (SELECT COUNT(*) FROM public.moais m
   JOIN public.moai_members mm ON m.id = mm.moai_id
   WHERE mm.profile_id = :member_id) = 3,
  'Join query between moais and moai_members works without recursion'
);

-- Test 7: Test the SECURITY DEFINER functions prevent recursion
SELECT ok(
  (SELECT COUNT(*) FROM public.moais 
   WHERE can_user_view_moai(id, :member_id)) >= 3,
  'can_user_view_moai function prevents policy recursion'
);

-- Test 8: Complex nested query that would expose recursion issues
SELECT ok(
  (SELECT COUNT(*) FROM public.moais m1
   WHERE EXISTS (
     SELECT 1 FROM public.moai_members mm1
     WHERE mm1.moai_id = m1.id
     AND EXISTS (
       SELECT 1 FROM public.moais m2
       WHERE m2.id = mm1.moai_id
       AND EXISTS (
         SELECT 1 FROM public.moai_members mm2
         WHERE mm2.moai_id = m2.id
         AND mm2.profile_id = :member_id
       )
     )
   )) >= 3,
  'Deeply nested query with circular table references completes without recursion'
);

-- Cleanup helper function
DROP FUNCTION measure_query_time(text);

SELECT * FROM finish();

ROLLBACK;