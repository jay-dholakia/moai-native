#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const testUsers = require('../test-data/users.json');

// Load environment variables
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

// Check SUPABASE_ENV to determine which URL to use
const isLocal = process.env.SUPABASE_ENV === 'local';
const supabaseUrl = isLocal 
  ? 'http://127.0.0.1:54321' 
  : process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   - EXPO_PUBLIC_SUPABASE_URL or local URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

console.log('🔧 Using Supabase URL:', supabaseUrl);
console.log('🔧 Local mode:', isLocal ? 'Yes' : 'No');

// Create Supabase admin client
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function cleanupTestUsers() {
  console.log('🧹 Cleaning up existing test users...');
  
  try {
    // Get all test users (emails ending with @moai.test)
    const { data: users, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('Error listing users:', listError);
      return;
    }

    // Filter test users
    const testUserIds = users.users
      .filter(user => user.email?.endsWith('@moai.test'))
      .map(user => user.id);

    if (testUserIds.length > 0) {
      // Delete profiles first (due to foreign key constraints)
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .in('id', testUserIds);

      if (profileError) {
        console.error('Error deleting test profiles:', profileError);
      }

      // Delete auth users
      for (const userId of testUserIds) {
        const { error } = await supabase.auth.admin.deleteUser(userId);
        if (error) {
          console.error(`Error deleting user ${userId}:`, error);
        }
      }

      console.log(`✅ Cleaned up ${testUserIds.length} test users`);
    } else {
      console.log('✅ No test users to clean up');
    }
  } catch (error) {
    console.error('Error during cleanup:', error);
  }
}

async function createTestUser(userData) {
  console.log(`👤 Creating test user: ${userData.email}`);
  
  try {
    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true, // Auto-confirm email for test users
      user_metadata: userData.metadata || {}
    });

    if (authError) {
      console.error(`❌ Error creating auth user ${userData.email}:`, authError);
      return null;
    }

    // Create profile
    const profileData = {
      id: authData.user.id,
      ...userData.profile,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { error: profileError } = await supabase
      .from('profiles')
      .insert(profileData);

    if (profileError) {
      // Check if it's a duplicate key error (profile already exists)
      if (profileError.code === '23505') {
        console.log(`⚠️  Profile already exists for ${userData.email}, updating instead...`);
        // Update the existing profile
        const { error: updateError } = await supabase
          .from('profiles')
          .update(profileData)
          .eq('id', authData.user.id);
        
        if (updateError) {
          console.error(`❌ Error updating profile for ${userData.email}:`, updateError);
          return null;
        }
      } else {
        console.error(`❌ Error creating profile for ${userData.email}:`, profileError);
        // Clean up auth user if profile creation fails
        await supabase.auth.admin.deleteUser(authData.user.id);
        return null;
      }
    }

    console.log(`✅ Created test user: ${userData.email} (Auth user created, profile may exist)`);
    return authData.user;
  } catch (error) {
    console.error(`❌ Unexpected error creating user ${userData.email}:`, error);
    return null;
  }
}

async function seedTestData(users) {
  console.log('🌱 Seeding test data for users...');
  
  if (users.length === 0) {
    console.log('No users to seed data for');
    return;
  }

  const [regularUser, coachUser, memberUser] = users;

  // Create test moais
  const testMoais = [
    {
      creator_id: regularUser.id,
      name: 'Morning Runners',
      description: 'Early morning running group for all levels',
      type: 'cardio',
      moai_type: 'public',
      max_members: 20,
      member_count: 12,
      location_address: 'Central Park, NYC',
      image_url: null
    },
    {
      creator_id: regularUser.id,
      name: 'Strength Training Club',
      description: 'Build strength together with guided workouts',
      type: 'strength',
      moai_type: 'public',
      max_members: 15,
      member_count: 8,
      location_address: 'Downtown Gym',
      image_url: null
    },
    {
      creator_id: coachUser.id,
      name: 'Yoga & Mindfulness',
      description: 'Daily yoga practice and meditation sessions',
      type: 'yoga',
      moai_type: 'public',
      max_members: 30,
      member_count: 25,
      location_address: 'Online',
      image_url: null,
      coach_id: coachUser.id
    },
    {
      creator_id: memberUser.id,
      name: 'Weekend Warriors',
      description: 'Adventure sports and outdoor activities',
      type: 'adventure',
      moai_type: 'private',
      max_members: 10,
      member_count: 6,
      location_address: 'Various Locations',
      image_url: null
    }
  ];

  const { data: createdMoais, error: moaiError } = await supabase
    .from('moais')
    .insert(testMoais)
    .select();

  if (moaiError) {
    console.error('Error creating test moais:', moaiError);
    return;
  }

  console.log('✅ Created test moais');

  // Create moai memberships
  const moaiMemberships = [];
  if (createdMoais && createdMoais.length > 0) {
    // Add users to each other's moais
    createdMoais.forEach((moai, index) => {
      users.forEach((user, userIndex) => {
        if (user.id !== moai.user_id) {
          moaiMemberships.push({
            moai_id: moai.id,
            profile_id: user.id,
            role_in_moai: userIndex === 1 ? 'coach' : 'member',
            is_active: true,
            joined_at: new Date().toISOString()
          });
        }
      });
    });

    const { error: membershipError } = await supabase
      .from('moai_members')
      .insert(moaiMemberships);

    if (membershipError) {
      console.error('Error creating moai memberships:', membershipError);
    } else {
      console.log('✅ Created moai memberships');
    }
  }

  // Create test activities
  const testActivities = [
    {
      user_id: regularUser.id,
      type: 'cardio',
      name: 'Morning Run',
      duration_minutes: 30,
      calories_burned: 300,
      notes: 'Great morning run in the park',
      date: new Date().toISOString()
    },
    {
      user_id: regularUser.id,
      type: 'strength',
      name: 'Upper Body Workout',
      duration_minutes: 45,
      calories_burned: 250,
      notes: 'Focused on chest and arms',
      date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    },
    {
      user_id: coachUser.id,
      type: 'yoga',
      name: 'Vinyasa Flow',
      duration_minutes: 60,
      calories_burned: 180,
      notes: 'Relaxing flow session',
      date: new Date().toISOString()
    },
    {
      user_id: memberUser.id,
      type: 'walking',
      name: 'Evening Walk',
      duration_minutes: 25,
      calories_burned: 120,
      notes: 'Peaceful walk around the neighborhood',
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];

  const { error: activityError } = await supabase
    .from('activity_logs')
    .insert(testActivities);

  if (activityError) {
    console.error('Error creating test activities:');
  } else {
    console.log('✅ Created test activities');
  }

  // Create friendships between test users
  const friendships = [
    {
      user_id: regularUser.id,
      friend_id: coachUser.id,
      status: 'accepted',
      created_at: new Date().toISOString()
    },
    {
      user_id: coachUser.id,
      friend_id: regularUser.id,
      status: 'accepted',
      created_at: new Date().toISOString()
    },
    {
      user_id: regularUser.id,
      friend_id: memberUser.id,
      status: 'accepted',
      created_at: new Date().toISOString()
    },
    {
      user_id: memberUser.id,
      friend_id: regularUser.id,
      status: 'accepted',
      created_at: new Date().toISOString()
    }
  ];

  const { error: friendshipError } = await supabase
    .from('friendships')
    .insert(friendships);

  if (friendshipError) {
    console.error('Error creating test friendships:', friendshipError);
  } else {
    console.log('✅ Created test friendships');
  }

  // Create coach-client relationship if coach user exists
  if (coachUser && regularUser) {
    const coachRelationship = {
      coach_id: coachUser.id,
      client_id: regularUser.id,
      status: 'active',
      created_at: new Date().toISOString()
    };

    const { error: coachError } = await supabase
      .from('coach_client_relationships')
      .insert([coachRelationship]);

    if (coachError) {
      console.error('Error creating coach relationship:', coachError);
    } else {
      console.log('✅ Created coach-client relationship');
    }
  }

  console.log('🎉 Test data seeding completed successfully!');
}

async function main() {
  console.log('🚀 Starting test user seeding...\n');

  // Clean up existing test users
  await cleanupTestUsers();

  // Create new test users
  const createdUsers = [];
  for (const userData of testUsers.users) {
    const user = await createTestUser(userData);
    if (user) {
      createdUsers.push(user);
    }
  }

  // Seed additional test data
  await seedTestData(createdUsers);

  console.log('\n✨ Test user seeding completed!');
  console.log(`📊 Created ${createdUsers.length} test users`);
  
  // Output test credentials for reference
  console.log('\n📝 Test Credentials:');
  testUsers.users.forEach(user => {
    console.log(`   Email: ${user.email}`);
    console.log(`   Password: ${user.password}`);
    console.log('   ---');
  });
}

// Run the script
main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});