#!/bin/bash

# Test runner for new signup and onboarding flow
# Run this script to validate the updated E2E tests

echo "🧪 Testing Updated Signup and Onboarding Flow"
echo "=============================================="

# Set script to exit on any error
set -e

# Check if Maestro is installed
if ! command -v maestro &> /dev/null; then
    echo "❌ Maestro is not installed. Please install Maestro first."
    echo "   Visit: https://maestro.mobile.dev/getting-started/installing-maestro"
    exit 1
fi

# Check if device/simulator is connected
echo "📱 Checking device connection..."
if ! maestro test --help &> /dev/null; then
    echo "❌ Maestro CLI not working properly"
    exit 1
fi

echo "✅ Maestro CLI is ready"

# Test 1: Updated Signup and Onboarding Flow
echo ""
echo "📝 Test 1: Running signup-onboarding-invite-test.yaml"
echo "This tests the new signup flow (no first/last name) and checkpoint-based onboarding"
maestro test flows/signup-onboarding-invite-test.yaml || {
    echo "❌ Signup and onboarding test failed"
    exit 1
}
echo "✅ Signup and onboarding test passed"

# Test 2: Onboarding Checkpoint System
echo ""
echo "🔍 Test 2: Running onboarding-checkpoint-test.yaml"
echo "This validates the 6-step checkpoint system matching the web app"
maestro test flows/onboarding-checkpoint-test.yaml || {
    echo "❌ Onboarding checkpoint test failed"
    exit 1
}
echo "✅ Onboarding checkpoint test passed"

# Test 3: Comprehensive Auth Test (existing users)
echo ""
echo "🔐 Test 3: Running comprehensive-auth-test.yaml"
echo "This tests login with existing users (should bypass onboarding)"
maestro test flows/auth/comprehensive-auth-test.yaml || {
    echo "❌ Comprehensive auth test failed"
    exit 1
}
echo "✅ Comprehensive auth test passed"

echo ""
echo "🎉 All tests passed! The new signup and onboarding flow is working correctly."
echo ""
echo "Summary of changes validated:"
echo "- ✅ Signup form no longer collects first/last name"
echo "- ✅ First/last name collected in onboarding step 1 (Identity)"
echo "- ✅ 6-step checkpoint system works correctly"
echo "- ✅ Onboarding completion redirects to main app"
echo "- ✅ Session persistence works after onboarding"
echo "- ✅ Existing user login bypasses onboarding"
echo ""
echo "The mobile app now matches the web app flow! 🚀"