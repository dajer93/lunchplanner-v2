/**
 * Simple test script to invoke the addShoppingList Lambda function locally
 * Run with: node test-local-add.js
 */

const { handler } = require('./addShoppingList');

// Mock event data to simulate API Gateway request
const mockEvent = {
  body: JSON.stringify({
    name: "Weekly Grocery List",
    mealIds: ["meal123", "meal456", "meal789"]
  })
};

async function runTest() {
  console.log('Testing addShoppingList Lambda function locally...');
  console.log('Input event:', JSON.stringify(mockEvent, null, 2));
  
  try {
    const result = await handler(mockEvent);
    console.log('Result:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
}

runTest();

/**
 * Note: To run this test locally, you need:
 * 1. AWS credentials configured locally with appropriate permissions
 * 2. A live connection to AWS services
 * 3. The DynamoDB table must exist
 */ 