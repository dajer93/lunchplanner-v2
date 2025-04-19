/**
 * Local test for the deleteShare Lambda function
 * This simulates an API Gateway event
 */

// Import the handler function
const { handler } = require('./deleteShare');

// Sample event object to simulate an API Gateway request
const testEvent = {
  httpMethod: 'DELETE',
  pathParameters: {
    shareId: 'YOUR_SHARE_ID' // Replace with a valid share ID
  },
  // Mock the authorizer context
  requestContext: {
    authorizer: {
      claims: {
        sub: 'USER_ID' // Replace with a valid user ID (creator of the share)
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