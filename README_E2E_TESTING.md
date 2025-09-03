# E2E Testing with Automated Seeding for Moai Native

This document explains the comprehensive E2E testing setup with automated test data seeding using Maestro flows only.

## Overview

This testing system uses **Maestro flows exclusively** for test data seeding, eliminating the need for external database scripts or manual setup. All test data is created through the app's UI, ensuring tests run against realistic user flows.

## Key Features

- ✅ **Fully Automated**: Test data seeding handled entirely by Maestro flows
- ✅ **No External Dependencies**: No database scripts or manual seeding required
- ✅ **Realistic Test Data**: Created through actual app UI flows
- ✅ **Self-Contained**: Each test includes its own data setup
- ✅ **Comprehensive Coverage**: Tests entire user journeys with real data

## Prerequisites

1. **iOS Simulator**: Have an iOS simulator installed and ready
2. **Maestro**: Install Maestro if not already installed:
   ```bash
   curl -fsSL "https://get.maestro.dev" | bash
   ```
3. **App Built**: Ensure the app is built and installed:
   ```bash
   npx expo run:ios
   ```

## Automated Test Data

The system automatically creates:

### Test Users
- **Regular User**: `e2e-test-user@moai.test` / `TestPassword123!`
- **Coach User**: `e2e-coach@moai.test` / `CoachPassword123!`
- **Member User**: `e2e-member@moai.test` / `MemberPassword123!`

### Test Data
- **Moais**: Morning Runners, Strength Training Club, Yoga & Mindfulness
- **Activities**: Morning Run, Upper Body Workout, Evening Walk
- **User Relationships**: Cross-user friendships and memberships

## Running E2E Tests

### Quick Start (Recommended)
All tests include automated seeding - just run them directly:
```bash
# Comprehensive full-journey test (recommended)
npm run test:e2e:comprehensive

# Quick login test with automated setup
npm run test:e2e:login

# Run all feature tests
npm run test:e2e:all-features
```

### Available Test Commands

#### Main Test Suites
- `npm run test:e2e:comprehensive` - **Recommended**: Full user journey with automated seeding
- `npm run test:e2e:login` - Login flow test with automated seeding
- `npm run test:e2e:full` - End-to-end full application flow test

#### Helper Commands (For Development)
- `npm run test:e2e:setup-env` - Set up complete test environment (users + data)
- `npm run test:e2e:seed-users` - Create test users through app signup
- `npm run test:e2e:seed-moais` - Create test moais through app UI
- `npm run test:e2e:seed-activities` - Create test activities through app UI
- `npm run test:e2e:cleanup` - Clean up test data (optional)

#### Feature-Specific Tests
- `npm run test:e2e:auth:comprehensive` - Authentication flow tests
- `npm run test:e2e:activities:comprehensive` - Activities feature tests
- `npm run test:e2e:moais:comprehensive` - Moais feature tests
- `npm run test:e2e:profile` - Profile feature tests

#### Basic Test Commands
- `npm run test:e2e` - Run all E2E test files
- `npm run test:e2e:smoke` - Run smoke tests
- `npm run test:e2e:auth` - Run authentication tests
- `npm run test:e2e:navigation` - Run navigation tests

#### Platform-Specific Tests
- `npm run test:e2e:ios` - Run tests on iOS platform
- `npm run test:e2e:android` - Run tests on Android platform

## Test Architecture

### Directory Structure
```
.maestro/
├── flows/                               # Main test flows
│   ├── auth/                           # Authentication tests
│   ├── activities/                     # Activity feature tests  
│   ├── moais/                          # Moai feature tests
│   ├── profile/                        # Profile feature tests
│   ├── navigation/                     # Navigation tests
│   ├── e2e-login-test.yaml            # Login test with automated seeding
│   ├── e2e-comprehensive-test.yaml    # Full user journey test
│   └── smoke-test.yaml                # Basic smoke tests
├── helpers/                           # Reusable test utilities
│   ├── setup-test-environment.yaml   # Master setup orchestrator
│   ├── test-data-seeding.yaml        # User creation through signup
│   ├── create-test-moais.yaml        # Moai creation through UI
│   ├── create-test-activities.yaml   # Activity creation through UI
│   ├── test-data-cleanup.yaml        # Optional cleanup utility
│   ├── quick-login.yaml              # Reusable login helper
│   ├── verify-test-data.yaml         # Data verification helper
│   └── auth-helpers.yaml             # Legacy auth utilities
└── config.yaml                       # Maestro configuration
```

### Test Data Creation Flow

1. **User Creation** (`test-data-seeding.yaml`):
   - Creates users through app's signup flow
   - Handles onboarding completion
   - Creates realistic user journeys

2. **Moai Creation** (`create-test-moais.yaml`):
   - Creates moais through app's create moai UI
   - Sets up different moai types and categories
   - Establishes moai memberships

3. **Activity Creation** (`create-test-activities.yaml`):
   - Logs activities through app's activity logging UI
   - Creates diverse activity types and data
   - Establishes activity history

4. **Environment Setup** (`setup-test-environment.yaml`):
   - Orchestrates all data creation flows
   - Ensures complete test environment
   - Provides single entry point for setup

## Advantages of Maestro-Only Seeding

### ✅ Benefits
- **Realistic Testing**: Data created through actual user flows
- **No Database Dependencies**: Works without direct database access
- **Self-Contained**: Tests include their own data setup
- **UI Coverage**: Tests both data creation and consumption flows
- **Maintainable**: Easy to update when UI changes
- **Portable**: Works across different environments

### ⚠️ Considerations
- **Slower Setup**: Takes more time than direct database insertion
- **UI Dependent**: Breaks if signup/creation flows change
- **Sequential**: Must create data in proper order

## Troubleshooting

### Tests fail with "app not found"
1. Ensure the app is built: `npx expo run:ios`
2. Check the app is installed on the simulator
3. Verify the bundle ID matches: `com.moai.native`

### Signup/Creation flows fail
1. Check if UI elements have changed (button text, field names)
2. Update helper flows if necessary
3. Verify app is in expected state before data creation

### Test data not created
1. Check Maestro logs for specific UI interaction failures
2. Verify network connectivity for app authentication
3. Ensure signup flows complete successfully

### Performance issues
1. Use `test:e2e:setup-env` once, then run multiple individual tests
2. Consider cleanup between test runs if needed
3. Monitor simulator resources

## CI/CD Integration

For CI/CD pipelines:
```bash
# Example CI script
npx expo run:ios                    # Build and install app
npm run test:e2e:comprehensive     # Run comprehensive tests
```

## Best Practices

1. **Start with comprehensive test**: `npm run test:e2e:comprehensive`
2. **Use helper commands for debugging**: Test individual seeding steps
3. **Keep tests isolated**: Each test should work independently  
4. **Monitor test data**: Use verification helpers to check data state
5. **Update UI selectors**: Keep helper flows updated with UI changes

## Migration from Database Seeding

If migrating from database-based seeding:

1. **Phase 1**: Keep both systems running
2. **Phase 2**: Update tests to use Maestro seeding
3. **Phase 3**: Remove database seeding scripts
4. **Phase 4**: Update CI/CD to use new approach

The current system is designed to replace manual database seeding entirely.