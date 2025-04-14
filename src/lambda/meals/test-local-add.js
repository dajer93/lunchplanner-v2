/**
 * Simple test script to invoke the Lambda function locally
 * Run with: node test-local.js
 */

const { handler } = require('./addMeal');

// Mock event data to simulate API Gateway request
const mockEvent = {
  body: JSON.stringify({
    mealName: "Test Meal",
    ingredients: ["ing123", "ing456", "ing789"]
  })
};

async function runTest() {
  console.log('Testing addMeal Lambda function locally...');
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
 * 
 * Alternative approach: mock the DynamoDB client for local testing
 * without connecting to actual AWS services.
 */ 