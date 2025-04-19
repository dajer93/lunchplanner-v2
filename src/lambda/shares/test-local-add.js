/**
 * Local test for the addShare Lambda function
 * This simulates an API Gateway event
 */

// Import the handler function
const { handler } = require('./addShare');

// Sample event object to simulate an API Gateway request
const testEvent = {
  httpMethod: 'POST',
  body: JSON.stringify({
    listId: 'YOUR_LIST_ID', // Replace with a valid shopping list ID
    email: 'user@example.com' // Replace with a valid user email
  }),
  // Mock the authorizer context
  requestContext: {
    authorizer: {
      claims: {
        sub: 'USER_ID' // Replace with a valid user ID (owner of the shopping list)
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