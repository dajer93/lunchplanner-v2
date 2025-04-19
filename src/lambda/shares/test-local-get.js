/**
 * Local test for the getShares Lambda function
 * This simulates an API Gateway event
 */

// Import the handler function
const { handler } = require('./getShares');

// Sample event object to simulate an API Gateway request
const testEvent = {
  httpMethod: 'GET',
  // Simulating a request with a listId query parameter
  queryStringParameters: {
    // Uncomment to test with a specific listId
    // listId: 'YOUR_LIST_ID'
  },
  // Mock the authorizer context
  requestContext: {
    authorizer: {
      claims: {
        sub: 'USER_ID' // Replace with a valid user ID
      }
    }
  }
};

// Invoke the Lambda handler
async function runTest() {
  try {
    console.log('Sending test event:', JSON.stringify(testEvent, null, 2));
    const response = await handler(testEvent);
    console.log('Response:', JSON.stringify(response, null, 2));
  } catch (error) {
    console.error('Error executing lambda:', error);
  }
}

// Run the test
runTest(); 