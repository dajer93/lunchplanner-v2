/**
 * Simple test script to invoke the getIngredients Lambda function locally
 * Run with: node test-local-get.js
 */

const { handler } = require('./getIngredients');

// Test getting all ingredients
async function testGetAllIngredients() {
  console.log('Testing getIngredients Lambda function (get all ingredients)...');
  
  const mockEvent = {};
  
  try {
    const result = await handler(mockEvent);
    console.log('Result:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
}

// Test getting a specific ingredient by ID
async function testGetIngredientById() {
  console.log('\nTesting getIngredients Lambda function (get ingredient by ID)...');
  
  // Replace with a valid ingredient ID from your DynamoDB table
  const ingredientId = 'REPLACE_WITH_VALID_INGREDIENT_ID';
  
  const mockEvent = {
    pathParameters: {
      ingredientId: ingredientId
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
  await testGetAllIngredients();
  await testGetIngredientById();
}

runTests();

/**
 * Note: To run this test locally, you need:
 * 1. AWS credentials configured locally with appropriate permissions
 * 2. A live connection to AWS services
 * 3. The DynamoDB table must exist and contain data
 * 4. Replace 'REPLACE_WITH_VALID_INGREDIENT_ID' with an actual ingredientId from your table
 */ 