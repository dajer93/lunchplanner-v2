const { DynamoDBClient, PutItemCommand, GetItemCommand, BatchGetItemCommand } = require('@aws-sdk/client-dynamodb');
const { marshall, unmarshall } = require('@aws-sdk/util-dynamodb');
const { v4: uuidv4 } = require('uuid');

const dynamoDbClient = new DynamoDBClient({ region: 'eu-central-1' });

// CORS headers to allow requests from all origins
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token',
    'Access-Control-Allow-Methods': 'OPTIONS,POST,GET',
    'Access-Control-Allow-Credentials': true
};

/**
 * Extract user ID from the Cognito authorizer context
 * 
 * @param {Object} event - Lambda event object
 * @returns {string|null} - User ID or null if not found
 */
function extractUserId(event) {
    try {
        // The user ID is available in the requestContext from API Gateway when using Cognito authorizer
        if (event.requestContext && event.requestContext.authorizer && event.requestContext.authorizer.claims) {
            // 'sub' is the user ID in Cognito claims
            return event.requestContext.authorizer.claims.sub;
        }
        
        // If running locally or in a test environment without a proper authorizer
        console.warn('No user ID found in request context');
        return null;
    } catch (error) {
        console.error('Error extracting user ID:', error);
        return null;
    }
}

/**
 * Fetch meals from DynamoDB using meal IDs
 * 
 * @param {string[]} mealIds - Array of meal IDs to fetch
 * @returns {Object[]} - Array of meal objects
 */
async function fetchMeals(mealIds) {
    if (!mealIds || mealIds.length === 0) {
        return [];
    }

    // Create a map of key objects for BatchGetItem
    const keys = mealIds.map(mealId => ({ mealId }));
    
    const params = {
        RequestItems: {
            'LunchplannerV2-Meals': {
                Keys: keys.map(key => marshall(key))
            }
        }
    };

    try {
        const response = await dynamoDbClient.send(new BatchGetItemCommand(params));
        
        if (response.Responses && response.Responses['LunchplannerV2-Meals']) {
            const meals = response.Responses['LunchplannerV2-Meals'].map(item => unmarshall(item));
            return meals;
        }
        
        return [];
    } catch (error) {
        console.error('Error fetching meals:', error);
        return [];
    }
}

/**
 * Extract all unique ingredient IDs from a set of meals
 * 
 * @param {Object[]} meals - Array of meal objects
 * @returns {string[]} - Array of unique ingredient IDs
 */
function extractIngredientIds(meals) {    
    const ingredientIdsSet = new Set();
    
    meals.forEach(meal => {        
        if (meal.ingredients && Array.isArray(meal.ingredients)) {
            meal.ingredients.forEach(ingredientId => {
                // If ingredientId is an object with an S property, use that value
                if (typeof ingredientId === 'object' && ingredientId.S) {
                    ingredientIdsSet.add(ingredientId.S);
                } else {
                    ingredientIdsSet.add(ingredientId);
                }
            });
        } else {
            console.log(`Meal ${meal.mealId} has no valid ingredients array`);
        }
    });
    
    const result = Array.from(ingredientIdsSet);
    console.log('Extracted ingredient IDs:', JSON.stringify(result));
    return result;
}

/**
 * Lambda function to add a shopping list to the DynamoDB LunchplannerV2-ShoppingLists table
 * 
 * @param {Object} event - Lambda event object
 * @param {string} event.name - Name of the shopping list
 * @param {Array} event.mealIds - Array of meal IDs to include in the shopping list
 * @returns {Object} - Response containing the shopping list details
 */
exports.handler = async (event) => {
    // Handle preflight OPTIONS request
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: corsHeaders,
            body: ''
        };
    }
    
    try {
        // Extract user ID from Cognito context
        const userId = extractUserId(event);
        
        if (!userId) {
            return {
                statusCode: 401,
                headers: corsHeaders,
                body: JSON.stringify({ message: 'User not authenticated' })
            };
        }
        
        // Parse request body if it's a string
        const requestBody = typeof event.body === 'string' 
            ? JSON.parse(event.body) 
            : event.body || event;
        
        const { name, mealIds } = requestBody;
        
        // Validate input
        if (!name) {
            return {
                statusCode: 400,
                headers: corsHeaders,
                body: JSON.stringify({ message: 'listName is required' })
            };
        }
        
        // Fetch the meals to extract ingredient IDs
        const meals = await fetchMeals(mealIds);
        
        // Extract unique ingredient IDs from the meals
        const ingredientIds = extractIngredientIds(meals);

        // Generate a unique ID for the shopping list
        const listId = uuidv4();
        
        // Create the shopping list item
        const shoppingList = {
            listId,
            userId, // Associate shopping list with the authenticated user
            name,
            mealIds, // Keep the original meal IDs for reference
            ingredientIds, // Store the extracted ingredient IDs
            createdAt: new Date().toISOString()
        };
        
        console.log('Creating shopping list:', JSON.stringify(shoppingList));
        
        // Prepare the DynamoDB put command
        const params = {
            TableName: 'LunchplannerV2-ShoppingLists',
            Item: marshall(shoppingList)
        };
        
        // Add the shopping list to DynamoDB
        await dynamoDbClient.send(new PutItemCommand(params));
        
        return {
            statusCode: 201,
            headers: corsHeaders,
            body: JSON.stringify({
                message: 'Shopping list added successfully',
                shoppingList
            })
        };
    } catch (error) {
        console.error('Error adding shopping list:', error);
        
        return {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({
                message: 'Error adding shopping list to database',
                error: error.message
            })
        };
    }
}; 