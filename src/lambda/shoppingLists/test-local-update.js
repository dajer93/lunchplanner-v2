// Test script for the updateShoppingList Lambda function
const { handler } = require('./updateShoppingList');

// Sample event for testing
const event = {
  httpMethod: 'PUT',
  pathParameters: {
    listId: 'YOUR_LIST_ID_HERE' // Replace with an actual listId from your database
  },
  body: JSON.stringify({
    removeIngredientIds: ['INGREDIENT_ID_TO_REMOVE'] // Replace with an actual ingredient ID
  }),
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
  console.log('Testing updateShoppingList Lambda function...');
  
  try {
    const response = await handler(event);
    console.log('Response:', JSON.stringify(response, null, 2));
    
    // Parse the response body
    const body = JSON.parse(response.body);
    console.log('Updated shopping list:', body.shoppingList);
  } catch (error) {
    console.error('Error:', error);
  }
};

test(); 