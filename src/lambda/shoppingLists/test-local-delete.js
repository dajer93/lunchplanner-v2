// Test script for the deleteShoppingList Lambda function
const { handler } = require('./deleteShoppingList');

// Sample event for testing
const event = {
  httpMethod: 'DELETE',
  pathParameters: {
    listId: 'YOUR_LIST_ID_HERE' // Replace with an actual listId from your database
  },
  requestContext: {
    authorizer: {
      claims: {
        sub: 'YOUR_USER_ID_HERE' // Replace with your test user ID
      }
    }
  }
};

// Execute the handler
const test = async () => {
  console.log('Testing deleteShoppingList Lambda function...');
  
  try {
    const response = await handler(event);
    console.log('Response:', JSON.stringify(response, null, 2));
    
    // Parse the response body
    const body = JSON.parse(response.body);
    console.log('Result:', body);
  } catch (error) {
    console.error('Error:', error);
  }
};

test(); 