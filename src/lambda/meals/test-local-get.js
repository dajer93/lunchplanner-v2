/**
 * Simple test script to invoke the getMeals Lambda function locally
 * Run with: node test-local-get.js
 */

const { handler } = require('./getMeals');

// Test getting all meals
async function testGetAllMeals() {
  console.log('Testing getMeals Lambda function (get all meals)...');
  
  const mockEvent = {};
  
  try {
    const result = await handler(mockEvent);
    console.log('Result:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
}

// Test getting a specific meal by ID
async function testGetMealById() {
  console.log('\nTesting getMeals Lambda function (get meal by ID)...');
  
  // Replace with a valid meal ID from your DynamoDB table
  const mealId = 'REPLACE_WITH_VALID_MEAL_ID';
  
  const mockEvent = {
    pathParameters: {
      mealId: mealId
    }
  };
  
  try {
    const result = await handler(mockEvent);
    console.log('Result:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run both tests
async function runTests() {
  await testGetAllMeals();
  await testGetMealById();
}

runTests();

/**
 * Note: To run this test locally, you need:
 * 1. AWS credentials configured locally with appropriate permissions
 * 2. A live connection to AWS services
 * 3. The DynamoDB table must exist and contain data
 * 4. Replace 'REPLACE_WITH_VALID_MEAL_ID' with an actual mealId from your table
 */ 