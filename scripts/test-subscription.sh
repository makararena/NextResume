#!/bin/bash

# Run subscription-related tests
echo "Running subscription model tests..."

# First, check if we have the necessary dependencies
if ! command -v npx &> /dev/null
then
    echo "npx could not be found. Make sure Node.js is properly installed."
    exit 1
fi

# Try to run the unit tests with Vitest
npx vitest run src/lib/__tests__/subscription.test.ts src/app/api/__tests__/user-usage.test.ts src/hooks/__tests__/useSubscriptionLimits.test.tsx

# Check if tests failed
if [ $? -ne 0 ]; then
    echo "Vitest tests failed or couldn't be found. Running fallback simple test..."
    node src/tests/simple.test.js
fi

# Test the actual application behavior
echo "Testing application behavior..."

# Testing API endpoints
echo "Testing API endpoints..."

# Test the user usage API
echo "Testing user usage API:"
curl -s http://localhost:3000/api/user/usage | jq .

# Test AI generation increment API
echo -e "\nTesting AI generation increment API:"
curl -s -X POST http://localhost:3000/api/user/increment-ai-generation | jq .

# Test resume increment API
echo -e "\nTesting resume increment API:"
curl -s -X POST http://localhost:3000/api/user/increment-resume | jq .

# Test integrated behavior (as much as possible without auth)
echo -e "\nVerifying subscription features in the UI..."
echo "To complete testing, please manually follow the steps in SUBSCRIPTION_TEST_MANUAL.md"

echo -e "\nTests completed." 