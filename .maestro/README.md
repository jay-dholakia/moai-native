# MOAI Native E2E Test Suite - Optimized Structure

This directory contains the optimized E2E test suite for MOAI Native, restructured to eliminate redundancy and improve execution efficiency.

## 📈 Optimization Results

- **Reduced test files**: 43 → 17 files (-60%)
- **Eliminated redundant tests**: Removed 14 duplicate/obsolete test files
- **Standardized authentication**: Single auth helper replaces 5 different patterns
- **Consolidated test data**: Centralized environment variables and credentials
- **Improved execution time**: Estimated 60% reduction in CI/CD time

## 🗂️ Directory Structure

```
.maestro/
├── suites/                           # Core aggregated test suites
│   ├── smoke-test.yaml              # Essential functionality (replaces 4 basic tests)
│   ├── auth-comprehensive.yaml      # Complete auth testing (replaces 3 auth tests)
│   └── features-integration.yaml    # Cross-feature testing (replaces 2 e2e tests)
├── flows/                           # Feature-specific tests
│   ├── activities/                  # Activity logging and tracking
│   ├── moais/                       # Community management
│   ├── profile/                     # User profile and settings
│   ├── chat/                        # Messaging functionality
│   ├── navigation/                  # Tab and screen navigation
│   └── auth/                        # Remaining auth edge cases
├── helpers/                         # Reusable test components
│   ├── auth-helper.yaml            # Standardized auth patterns
│   ├── test-data.yaml              # Centralized test data
│   ├── setup-test-environment.yaml # Environment preparation
│   └── test-data-cleanup.yaml      # Test cleanup utilities
└── config.yaml                     # Master configuration
```

## 🚀 Quick Start

### Prerequisites
1. Install Maestro CLI:
   ```bash
   # Via Homebrew (recommended)
   brew tap mobile-dev-inc/tap
   brew install maestro
   
   # Or via curl
   curl -Ls "https://get.maestro.mobile.dev" | bash
   ```

2. Ensure you have iOS Simulator or Android Emulator running

### Run Essential Tests (Every PR)
```bash
maestro test .maestro/suites/smoke-test.yaml
```

### Run Comprehensive Tests (Releases)
```bash
maestro test .maestro/suites/
```

### Run Feature-Specific Tests
```bash
# Activities feature
maestro test .maestro/flows/activities/

# Authentication flow
maestro test .maestro/suites/auth-comprehensive.yaml

# Cross-feature integration
maestro test .maestro/suites/features-integration.yaml
```

## 📋 Test Suite Categories

### Core Suites (Required)

#### 1. **Smoke Test** (`suites/smoke-test.yaml`)
- **Purpose**: Critical path verification
- **Duration**: ~3 minutes
- **Coverage**: App launch, basic navigation, authentication
- **When to run**: Every PR, deployment verification
- **Replaces**: `basic-app-launch.yaml`, `simple-launch.yaml`, `basic-navigation.yaml`, core `smoke-test.yaml`

#### 2. **Authentication Comprehensive** (`suites/auth-comprehensive.yaml`)  
- **Purpose**: Complete authentication testing
- **Duration**: ~5 minutes
- **Coverage**: All user types, login/logout, session persistence, error handling
- **When to run**: Auth changes, user management updates
- **Replaces**: `auth/login.yaml`, `auth/comprehensive-auth-test.yaml`, `e2e-login-test.yaml`, `auth-smoke-test.yaml`

#### 3. **Features Integration** (`suites/features-integration.yaml`)
- **Purpose**: Cross-feature functionality and data flow
- **Duration**: ~8 minutes  
- **Coverage**: Activities ↔ Moais ↔ Profile integration, multi-user scenarios
- **When to run**: Major feature releases, integration testing
- **Replaces**: `e2e-full-flow-test.yaml`, `e2e-comprehensive-test.yaml`, `onboarding-checkpoint-test.yaml`, `signup-onboarding-invite-test.yaml`

### Feature Suites (Selective)

#### Activities (`flows/activities/`)
- Activity logging and tracking
- Pull-to-refresh functionality
- Weekly statistics

#### Moais (`flows/moais/`)  
- Community browsing and search
- Join/leave functionality
- Basic community interactions

#### Profile (`flows/profile/`)
- User profile management
- Settings and preferences
- Profile statistics

#### Chat (`flows/chat/`)
- Message sending and receiving
- Reactions and read receipts
- Typing indicators

#### Navigation (`flows/navigation/`)
- Tab navigation
- Protected routes
- Deep linking

## 🔧 Helper Components

### Authentication Helper (`helpers/auth-helper.yaml`)
Standardized authentication patterns:
- `idempotent-logout`: Clean logout regardless of current state
- `standard-login`: Parameterized login flow
- `quick-login`: Default test user login
- `user-role-verification`: Verify logged-in user details

### Test Data Helper (`helpers/test-data.yaml`)
Centralized test configuration:
- Standardized test user accounts
- Environment variables
- Expected test data validation
- Performance metrics logging

## 📊 Test User Accounts

| Role | Email | Purpose |
|------|-------|---------|
| Regular User | `e2e-test-user@moai.test` | Standard user functionality |
| Coach | `e2e-coach@moai.test` | Coach-specific features |
| Member | `e2e-member@moai.test` | Community member testing |

## 🏃‍♂️ CI/CD Integration

### Recommended Pipeline

```yaml
# Essential tests (fast feedback)
pr_tests:
  - maestro test .maestro/suites/smoke-test.yaml

# Comprehensive tests (thorough validation)  
release_tests:
  - maestro test .maestro/suites/smoke-test.yaml
  - maestro test .maestro/suites/auth-comprehensive.yaml
  - maestro test .maestro/suites/features-integration.yaml

# Feature-specific tests (targeted validation)
feature_tests:
  activities: maestro test .maestro/flows/activities/
  moais: maestro test .maestro/flows/moais/
  profile: maestro test .maestro/flows/profile/
```

### NPM Scripts Integration
```json
{
  "scripts": {
    "test:e2e": "maestro test .maestro/suites/",
    "test:e2e:smoke": "maestro test .maestro/suites/smoke-test.yaml",
    "test:e2e:auth": "maestro test .maestro/suites/auth-comprehensive.yaml",
    "test:e2e:features": "maestro test .maestro/suites/features-integration.yaml",
    "test:e2e:activities": "maestro test .maestro/flows/activities/",
    "test:e2e:moais": "maestro test .maestro/flows/moais/",
    "test:e2e:profile": "maestro test .maestro/flows/profile/"
  }
}
```

## 🔍 Removed Files

The following redundant files have been removed:

### Replaced by Smoke Test:
- `basic-app-launch.yaml`
- `simple-launch.yaml` 
- `basic-navigation.yaml`
- `flows/basic-test.yaml`

### Replaced by Auth Comprehensive:
- `flows/auth/login.yaml`
- `flows/e2e-login-test.yaml`
- `flows/auth-smoke-test.yaml`

### Replaced by Features Integration:
- `flows/e2e-full-flow-test.yaml`
- `flows/e2e-comprehensive-test.yaml`

### Development/Debug Files:
- `flows/debug-simple.yaml`
- `flows/debug-logout.yaml`
- `flows/syntax-validation-test.yaml`

### Replaced by New Helpers:
- `helpers/auth-helpers.yaml` → `helpers/auth-helper.yaml`
- `helpers/quick-login.yaml` → integrated into `helpers/auth-helper.yaml`

## 🎯 Best Practices

### Test Execution Order
1. **Smoke Test** - Verify basic functionality
2. **Auth Comprehensive** - Ensure authentication works  
3. **Features Integration** - Test feature interactions
4. **Specific Features** - Test focused scenarios

### When to Add New Tests
- **Add to suites/**: Cross-cutting concerns, critical user journeys
- **Add to flows/**: Feature-specific scenarios, edge cases
- **Add to helpers/**: Reusable patterns, common utilities

### Test Naming Convention
- **Suites**: `{purpose}-{scope}.yaml` (e.g., `auth-comprehensive.yaml`)
- **Flows**: `{feature}-{scenario}.yaml` (e.g., `moais-search-filter.yaml`)
- **Helpers**: `{purpose}-helper.yaml` (e.g., `auth-helper.yaml`)

### Writing New Tests

#### Basic Test Structure
```yaml
appId: com.moai.native
env:
  TEST_EMAIL: "e2e-test-user@moai.test"
  TEST_PASSWORD: "TestPassword123!"
---
- launchApp
- assertVisible: "Expected Text"
- tapOn: "Button"
- inputText: "Input Value"
```

#### Using Auth Helper
```yaml
# Quick login with default user
- runFlow: helpers/auth-helper.yaml#quick-login

# Login with custom credentials
- runFlow: 
    parameters:
      email: "custom@example.com"
      password: "CustomPassword123!"
    flow: helpers/auth-helper.yaml#login-with-credentials

# Clean logout
- runFlow: helpers/auth-helper.yaml#enhanced-logout
```

## 🐛 Debugging

### Common Issues
1. **Authentication failures**: Check test user credentials in `config.yaml`
2. **Element not found**: Verify UI text patterns in test data helper
3. **Timeout errors**: Adjust timing in individual test files

### Debug Commands
```bash
# Run with verbose logging
maestro test --verbose .maestro/suites/smoke-test.yaml

# Run single test with screenshots
maestro test --screenshot .maestro/flows/activities/activities-basic.yaml

# Test auth helper in isolation
maestro test .maestro/helpers/auth-helper.yaml
```

### View Test Screenshots
Maestro automatically captures screenshots during test runs. Check the output directory for visual debugging.

## 📚 Migration Guide

For developers familiar with the old test structure:

| Old File | New Location | Notes |
|----------|--------------|-------|
| `basic-app-launch.yaml` | `suites/smoke-test.yaml` | Consolidated with other basic tests |
| `e2e-full-flow-test.yaml` | `suites/features-integration.yaml` | Enhanced with more comprehensive coverage |
| `auth/login.yaml` | `suites/auth-comprehensive.yaml` | Part of complete auth testing |
| `quick-login.yaml` | `helpers/auth-helper.yaml` | Available as reusable flow |
| All debug files | Removed | Use individual test files for debugging |

### Updated Commands
```bash
# Old way
npm run test:e2e:smoke      # Multiple scattered tests
npm run test:e2e:auth       # Basic auth only
npm run test:e2e:navigation # Tab navigation only

# New way  
npm run test:e2e:smoke      # Comprehensive smoke test
npm run test:e2e:auth       # Complete auth testing
npm run test:e2e:features   # Cross-feature integration
```

## 📈 Performance Metrics

| Metric | Before | After | Improvement |
|--------|--------|--------|-------------|
| Total test files | 43 | 17 | -60% |
| Auth test patterns | 5 different | 1 standardized | -80% duplication |
| Estimated CI time | ~25 minutes | ~10 minutes | -60% |
| Maintenance overhead | High | Low | Significantly reduced |

## 🔧 Test Data Requirements

For tests to pass, ensure:

1. **Test user accounts exist in Supabase** with credentials:
   - Regular User: `e2e-test-user@moai.test` / `TestPassword123!`
   - Coach User: `e2e-coach@moai.test` / `CoachPassword123!`
   - Member User: `e2e-member@moai.test` / `MemberPassword123!`

2. **Sample data is available**:
   - Moais: "Morning Runners", "Strength Training Club", "Yoga & Mindfulness"
   - Activities: "Morning Run", "Upper Body Workout", "Evening Walk"

3. **Database configuration**:
   - Profile creation triggers are set up
   - Test data isolation is maintained
   - Proper permissions for test accounts

## 🚀 App Configuration

- **iOS Bundle ID**: com.moai.native
- **Android Package**: com.moai.native
- **Test Environment**: Isolated test database
- **Auth Provider**: Supabase

---

*For questions or issues with the test suite, refer to the project's main README or create an issue in the repository.*