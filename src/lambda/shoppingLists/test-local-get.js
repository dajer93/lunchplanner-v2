/**
 * Simple test script to invoke the getShoppingLists Lambda function locally
 * Run with: node test-local-get.js
 */

const { handler } = require('./getShoppingLists');

// Test getting all shopping lists
async function testGetAllShoppingLists() {
  console.log('Testing getShoppingLists Lambda function (get all shopping lists)...');
  
  const mockEvent = {};
  
  try {
    const result = await handler(mockEvent);
    console.log('Result:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
}

// Test getting a specific shopping list by ID
async function testGetShoppingListById() {
  console.log('\nTesting getShoppingLists Lambda function (get shopping list by ID)...');
  
  // Replace with a valid shopping list ID from your DynamoDB table
  const shoppingListId = 'REPLACE_WITH_VALID_SHOPPING_LIST_ID';
  
  const mockEvent = {
    pathParameters: {
      shoppingListId: shoppingListId
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
  await testGetAllShoppingLists();
  await testGetShoppingListById();
}

runTests();

/**
 * Note: To run this test locally, you need:
 * 1. AWS credentials configured locally with appropriate permissions
 * 2. A live connection to AWS services
 * 3. The DynamoDB table must exist and contain data
 * 4. Replace 'REPLACE_WITH_VALID_SHOPPING_LIST_ID' with an actual shoppingListId from your table
 */ 