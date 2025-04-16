const { DynamoDBClient, PutItemCommand } = require('@aws-sdk/client-dynamodb');
const { marshall } = require('@aws-sdk/util-dynamodb');
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
 * Lambda function to add a shopping list to the DynamoDB LunchplannerV2-ShoppingLists table
 * 
 * @param {Object} event - Lambda event object
 * @param {string} event.name - Name of the shopping list
 * @param {Array} event.mealIds - Array of shopping list items
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
        
        // Generate a unique ID for the shopping list
        const shoppingListId = uuidv4();
        
        // Create the shopping list item
        const shoppingList = {
            shoppingListId,
            userId, // Associate shopping list with the authenticated user
            name,
            mealIds,
            createdAt: new Date().toISOString()
        };
        
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