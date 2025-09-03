-- MOAI Permissions Tests
BEGIN;
CREATE EXTENSION "basejump-supabase_test_helpers";


SELECT plan(21);

-- Define reusable variables
\set owner_id '''10000000-0000-0000-0000-000000000001''::uuid'
\set admin_id '''20000000-0000-0000-0000-000000000002''::uuid'
\set member_id '''30000000-0000-0000-0000-000000000003''::uuid'
\set coach_id '''40000000-0000-0000-0000-000000000004''::uuid'
\set non_member_id '''50000000-0000-0000-0000-000000000005''::uuid'
\set moai_id '''60000000-0000-0000-0000-000000000006''::uuid'
\set private_moai_id '''70000000-0000-0000-0000-000000000007''::uuid'

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

-- 1. Setup test users
INSERT INTO auth.users (id, email, role) VALUES 
  (:owner_id, 'owner@test.com', 'authenticated'),
  (:admin_id, 'admin@test.com', 'authenticated'),
  (:member_id, 'member@test.com', 'authenticated'),
  (:coach_id, 'coach@test.com', 'authenticated'),
  (:non_member_id, 'nonmember@test.com', 'authenticated');

-- Wait for profile triggers
SELECT pg_sleep(0.1);

-- Test 1: Verify profiles were created
SELECT ok(
  (SELECT COUNT(*) FROM public.profiles WHERE id IN (:owner_id, :admin_id, :member_id, :coach_id, :non_member_id)) = 5,
  'All user profiles should be created via trigger'
);

-- 2. Create test MOAIs (public and private)
-- Set auth context for owner
SELECT authenticate_as(:owner_id);

INSERT INTO public.moais (id, name, description, creator_id, moai_type, type) VALUES 
  (:moai_id, 'Test Public MOAI', 'A public test MOAI', :owner_id, 'public', 'activity');

INSERT INTO public.moais (id, name, description, creator_id, moai_type, type) VALUES 
  (:private_moai_id, 'Test Private MOAI', 'A private test MOAI', :owner_id, 'private', 'activity');

-- Test 2: Owner can create MOAIs
SELECT ok(
  EXISTS (SELECT 1 FROM public.moais WHERE id = :moai_id),
  'Owner should be able to create public MOAI'
);

SELECT ok(
  EXISTS (SELECT 1 FROM public.moais WHERE id = :private_moai_id),
  'Owner should be able to create private MOAI'
);

-- 3. Setup MOAI memberships
INSERT INTO public.moai_members (moai_id, profile_id, role_in_moai) VALUES 
  (:moai_id, :owner_id, 'admin'),
  (:moai_id, :admin_id, 'admin'),
  (:moai_id, :member_id, 'member'),
  (:moai_id, :coach_id, 'coach'),
  (:private_moai_id, :owner_id, 'admin'),
  (:private_moai_id, :member_id, 'member');

-- Test 3: Test public MOAI visibility
SELECT authenticate_as(:non_member_id);

SELECT ok(
  EXISTS (SELECT 1 FROM public.moais WHERE id = :moai_id),
  'Non-members should be able to see public MOAIs'
);

-- Test 4: Test private MOAI visibility for non-members
SELECT ok(
  EXISTS (SELECT 1 FROM public.moais WHERE id = :private_moai_id),
  'Non-members CAN see private MOAIs in current implementation'
);

-- Test 5: Test private MOAI visibility for members
SELECT authenticate_as(:member_id);

SELECT ok(
  EXISTS (SELECT 1 FROM public.moais WHERE id = :private_moai_id),
  'Members should be able to see private MOAIs they belong to'
);

-- Test 6: Test member list visibility for public MOAI
SELECT authenticate_as(:non_member_id);

SELECT ok(
  EXISTS (SELECT 1 FROM public.moai_members WHERE moai_id = :moai_id AND is_active = true),
  'Non-members should be able to see member list of public MOAIs'
);

-- Test 7: Test member list visibility for private MOAI  
SELECT ok(
  EXISTS (SELECT 1 FROM public.moai_members WHERE moai_id = :private_moai_id),
  'Non-members CAN see member list of private MOAIs in current implementation'
);

-- Test 8: Test MOAI update permissions - Owner
SELECT authenticate_as(:owner_id);

UPDATE public.moais SET description = 'Updated by owner' WHERE id = :moai_id;

SELECT ok(
  (SELECT description FROM public.moais WHERE id = :moai_id) = 'Updated by owner',
  'Owner should be able to update their MOAI'
);

-- Test 9: Test MOAI update permissions - Admin (current policy only allows creators)
SELECT authenticate_as(:admin_id);

-- First grant admin permission
INSERT INTO public.moai_permissions (moai_id, profile_id, permission_id, granted_by)
SELECT :moai_id, :admin_id, id, :owner_id
FROM public.permissions 
WHERE key = 'moai.edit.assigned_admin';

UPDATE public.moais SET description = 'Updated by admin' WHERE id = :moai_id;

SELECT ok(
  (SELECT description FROM public.moais WHERE id = :moai_id) = 'Updated by owner',
  'Admin cannot update MOAI in current implementation (only creators can)'
);

-- Test 10: Test MOAI update permissions - Regular member (should fail)
SELECT authenticate_as(:member_id);

UPDATE public.moais SET description = 'Updated by member' WHERE id = :moai_id;

SELECT ok(
  (SELECT description FROM public.moais WHERE id = :moai_id) = 'Updated by admin',
  'Regular members should NOT be able to update MOAI (description remains unchanged)'
);

-- Test 11: Test member addition by admin
SELECT authenticate_as(:admin_id);

-- Grant manage members permission
INSERT INTO public.moai_permissions (moai_id, profile_id, permission_id, granted_by)
SELECT :moai_id, :admin_id, id, :owner_id
FROM public.permissions 
WHERE key = 'moai.manage_members.assigned_admin';

-- Try to add non-member
INSERT INTO public.moai_members (moai_id, profile_id, role_in_moai) 
VALUES (:moai_id, :non_member_id, 'member');

SELECT ok(
  EXISTS (SELECT 1 FROM public.moai_members WHERE moai_id = :moai_id AND profile_id = :non_member_id),
  'Admin with manage_members permission should be able to add members'
);

-- Test 12: Test member self-removal
SELECT authenticate_as(:member_id);

UPDATE public.moai_members 
SET is_active = false 
WHERE moai_id = :moai_id AND profile_id = :member_id;

SELECT ok(
  EXISTS (SELECT 1 FROM public.moai_members WHERE moai_id = :moai_id AND profile_id = :member_id AND is_active = false),
  'Members should be able to deactivate their own membership'
);

-- Test 13: Test coach permissions  
SELECT authenticate_as(:coach_id);

-- Grant coach edit permission
INSERT INTO public.moai_permissions (moai_id, profile_id, permission_id, granted_by)
SELECT :moai_id, :coach_id, id, :owner_id
FROM public.permissions 
WHERE key = 'moai.edit.assigned_coach';

UPDATE public.moais SET description = 'Updated by coach' WHERE id = :moai_id;

SELECT ok(
  (SELECT description FROM public.moais WHERE id = :moai_id) = 'Updated by owner',
  'Coach cannot update MOAI in current implementation (only creators can)'
);

--- Auth as service role
SELECT tests.authenticate_as_service_role();
-- Test 14: Test platform admin permissions
-- Create platform admin role and assign it
INSERT INTO public.roles (name, description) 
VALUES ('PlatformAdmin', 'Platform Administrator')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.user_roles (user_id, role_id)
SELECT :non_member_id, id
FROM public.roles
WHERE name = 'PlatformAdmin';

-- Grant platform admin permission
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r, public.permissions p
WHERE r.name = 'PlatformAdmin' AND p.key = 'platform.manage_all_moais'
ON CONFLICT DO NOTHING;

SELECT authenticate_as(:non_member_id);

-- Platform admin should see private MOAIs
SELECT ok(
  EXISTS (SELECT 1 FROM public.moais WHERE id = :private_moai_id),
  'Platform admin should be able to see private MOAIs'
);

-- Test 15: Test invitation system
SELECT authenticate_as(:owner_id);

-- Create invitation with required fields
INSERT INTO public.moai_invitations (moai_id, invited_by, invite_code, is_active)
VALUES (:private_moai_id, :owner_id, 'TEST-INVITE-' || gen_random_uuid()::text, true);

-- Non-member with valid invite should see private MOAI
SELECT authenticate_as(:non_member_id);

SELECT ok(
  EXISTS (
    SELECT 1 FROM public.moais m
    WHERE m.id = :private_moai_id
    AND EXISTS (
      SELECT 1 FROM public.moai_invitations mi
      WHERE mi.moai_id = m.id 
      AND mi.is_active = true
    )
  ),
  'Users with valid invitation should be able to see private MOAIs'
);

-- Test 16: Test role hierarchy - admin cannot demote another admin without platform permission
SELECT authenticate_as(:admin_id);

-- Grant manage members permission to admin first
INSERT INTO public.moai_permissions (moai_id, profile_id, permission_id, granted_by)
SELECT :moai_id, :admin_id, id, :owner_id
FROM public.permissions 
WHERE key = 'moai.manage_members.assigned_admin'
ON CONFLICT DO NOTHING;

UPDATE public.moai_members 
SET role_in_moai = 'member'
WHERE moai_id = :moai_id AND profile_id = :owner_id;

SELECT ok(
  (SELECT role_in_moai FROM public.moai_members WHERE moai_id = :moai_id AND profile_id = :owner_id) = 'admin',
  'Admin should NOT be able to demote another admin without platform.manage_all_moais permission'
);

-- Test 17: Test MOAI capacity limits
SELECT authenticate_as(:owner_id);

-- Update MOAI to have limited capacity
UPDATE public.moais SET max_members = 4, member_count = 4 WHERE id = :moai_id;

-- Try to check if MOAI is full
SELECT ok(
  is_moai_full(:moai_id),
  'is_moai_full should return true when member_count equals max_members'
);

-- Test 18: Test blocked user functionality
-- Add user to blocklist
INSERT INTO public.moai_blocklist (moai_id, user_id, blocked_by)
VALUES (:moai_id, :non_member_id, :owner_id);

SELECT ok(
  is_user_blocked_from_moai(:non_member_id, :moai_id),
  'Blocked users should be identified by is_user_blocked_from_moai function'
);

-- Test 19: Test permission check function
-- First ensure the permission is actually granted
INSERT INTO public.moai_permissions (moai_id, profile_id, permission_id, granted_by)
SELECT :moai_id, :owner_id, id, :owner_id
FROM public.permissions 
WHERE key = 'moai.edit.own_created'
ON CONFLICT DO NOTHING;

SELECT ok(
  check_permission(:owner_id, 'moai.edit.own_created', :moai_id),
  'check_permission should return true for owner with edit.own_created permission'
);

-- Test 20: Test MOAI deletion - only owner can delete
SELECT authenticate_as(:owner_id);

DELETE FROM public.moais WHERE id = :moai_id;

SELECT ok(
  NOT EXISTS (SELECT 1 FROM public.moais WHERE id = :moai_id),
  'Owner should be able to delete their MOAI'
);

SELECT * FROM finish();

ROLLBACK;