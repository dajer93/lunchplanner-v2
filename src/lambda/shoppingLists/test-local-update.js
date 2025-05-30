// Test script for the updateShoppingList Lambda function
const { handler } = require('./updateShoppingList');

// Sample event for testing removal of ingredients
const removeIngredientsEvent = {
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

// Sample event for testing addition of ingredients
const addIngredientsEvent = {
  httpMethod: 'PUT',
  pathParameters: {
    listId: 'YOUR_LIST_ID_HERE' // Replace with an actual listId from your database
  },
  body: JSON.stringify({
    addIngredientIds: ['INGREDIENT_ID_TO_ADD'] // Replace with an actual ingredient ID
  }),
  requestContext: {
    authorizer: {
      claims: {
        sub: 'YOUR_USER_ID_HERE' // Replace with your test user ID
      }
    }
  }
};

// Sample event for testing ticking ingredients
const tickIngredientsEvent = {
  httpMethod: 'PUT',
  pathParameters: {
    listId: 'YOUR_LIST_ID_HERE' // Replace with an actual listId from your database
  },
  body: JSON.stringify({
    tickedIngredientIds: ['INGREDIENT_ID_TO_TICK'] // Replace with an actual ingredient ID
  }),
  requestContext: {
    authorizer: {
      claims: {
        sub: 'YOUR_USER_ID_HERE' // Replace with your test user ID
      }
    }
  }
};

// Sample event for testing both adding, removing, and ticking ingredients
const multipleOperationsEvent = {
  httpMethod: 'PUT',
  pathParameters: {
    listId: 'YOUR_LIST_ID_HERE' // Replace with an actual listId from your database
  },
  body: JSON.stringify({
    removeIngredientIds: ['INGREDIENT_ID_TO_REMOVE'], // Replace with an actual ingredient ID
    addIngredientIds: ['INGREDIENT_ID_TO_ADD'], // Replace with an actual ingredient ID
    tickedIngredientIds: ['INGREDIENT_ID_TO_TICK'] // Replace with an actual ingredient ID
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
  
  // Test case 1: Removing ingredients
  try {
    console.log('\n--- Testing removing ingredients ---');
    const removeResponse = await handler(removeIngredientsEvent);
    console.log('Response:', JSON.stringify(removeResponse, null, 2));
    
    // Parse the response body
    const removeBody = JSON.parse(removeResponse.body);
    console.log('Updated shopping list after removal:', removeBody.shoppingList);
  } catch (error) {
    console.error('Error in remove test:', error);
  }
  
  // Test case 2: Adding ingredients
  try {
    console.log('\n--- Testing adding ingredients ---');
    const addResponse = await handler(addIngredientsEvent);
    console.log('Response:', JSON.stringify(addResponse, null, 2));
    
    // Parse the response body
    const addBody = JSON.parse(addResponse.body);
    console.log('Updated shopping list after addition:', addBody.shoppingList);
  } catch (error) {
    console.error('Error in add test:', error);
  }
  
  // Test case 3: Ticking ingredients
  try {
    console.log('\n--- Testing ticking ingredients ---');
    const tickResponse = await handler(tickIngredientsEvent);
    console.log('Response:', JSON.stringify(tickResponse, null, 2));
    
    // Parse the response body
    const tickBody = JSON.parse(tickResponse.body);
    console.log('Updated shopping list after ticking:', tickBody.shoppingList);
  } catch (error) {
    console.error('Error in tick test:', error);
  }
  
  // Test case 4: Multiple operations
  try {
    console.log('\n--- Testing multiple operations (adding, removing, and ticking) ---');
    const multiResponse = await handler(multipleOperationsEvent);
    console.log('Response:', JSON.stringify(multiResponse, null, 2));
    
    // Parse the response body
    const multiBody = JSON.parse(multiResponse.body);
    console.log('Updated shopping list after multiple operations:', multiBody.shoppingList);
  } catch (error) {
    console.error('Error in multiple operations test:', error);
  }
};

test(); 