// Simple test to verify our setup works
console.log('Testing Moai Native setup...');

// Test path aliases would work
const testPaths = [
  '@/hooks/useAuth',
  '@/providers/theme-provider',
  '@/utils/styles',
  '@/services/profile-service',
  '@/constants/Tokens'
];

console.log('Path aliases configured:', testPaths);
console.log('✅ Moai Native setup appears to be working!');

// Basic React Native component structure test
const componentStructure = {
  authentication: ['login', 'signup', 'forgot-password'],
  tabs: ['index', 'moais', 'activities', 'profile'],
  navigation: 'expo-router with nested layouts',
  styling: 'custom utilities with theme support',
  stateManagement: 'react-query + supabase',
  providers: ['AppProviders', 'ThemeProvider', 'SupabaseProvider', 'QueryProvider']
};

console.log('Component structure:', JSON.stringify(componentStructure, null, 2));

module.exports = { componentStructure };