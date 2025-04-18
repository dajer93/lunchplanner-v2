const { DynamoDBClient, GetItemCommand, UpdateItemCommand } = require('@aws-sdk/client-dynamodb');
const { marshall, unmarshall } = require('@aws-sdk/util-dynamodb');

const dynamoDbClient = new DynamoDBClient({ region: 'eu-central-1' });

// CORS headers to allow requests from all origins
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token',
    'Access-Control-Allow-Methods': 'OPTIONS,PUT,POST,DELETE',
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
 * Lambda function to update a shopping list in the DynamoDB LunchplannerV2-ShoppingLists table
 * Can update the list of ingredients by removing specific ingredient IDs or adding new ingredient IDs
 * 
 * @param {Object} event - Lambda event object
 * @returns {Object} - Response containing the updated shopping list details
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
        
        // Check if a specific listId was provided in the path parameters
        const listId = event.pathParameters?.listId;
        
        if (!listId) {
            return {
                statusCode: 400,
                headers: corsHeaders,
                body: JSON.stringify({ message: 'Shopping list ID is required' })
            };
        }
        
        // Parse request body if it's a string
        const requestBody = typeof event.body === 'string' 
            ? JSON.parse(event.body) 
            : event.body || event;
        
        // Get the list of ingredient IDs to remove and add
        const { removeIngredientIds = [], addIngredientIds = [] } = requestBody;
        
        // Validate that at least one operation is requested
        if (
            (removeIngredientIds.length === 0 || !Array.isArray(removeIngredientIds)) &&
            (addIngredientIds.length === 0 || !Array.isArray(addIngredientIds))
        ) {
            return {
                statusCode: 400,
                headers: corsHeaders,
                body: JSON.stringify({ message: 'Either removeIngredientIds or addIngredientIds array is required' })
            };
        }
        
        // First, get the existing shopping list to verify it exists and belongs to the user
        const getParams = {
            TableName: 'LunchplannerV2-ShoppingLists',
            Key: marshall({ listId })
        };
        
        const { Item } = await dynamoDbClient.send(new GetItemCommand(getParams));
        
        if (!Item) {
            return {
                statusCode: 404,
                headers: corsHeaders,
                body: JSON.stringify({ message: 'Shopping list not found' })
            };
        }
        
        const shoppingList = unmarshall(Item);
        
        // Check if this shopping list belongs to the current user
        if (shoppingList.userId !== userId) {
            return {
                statusCode: 403,
                headers: corsHeaders,
                body: JSON.stringify({ message: 'You do not have permission to update this shopping list' })
            };
        }
        
        // Get current ingredient IDs
        const currentIngredientIds = shoppingList.ingredientIds || [];
        
        // Filter out the ingredient IDs to remove
        let updatedIngredientIds = currentIngredientIds;
        if (removeIngredientIds.length > 0) {
            updatedIngredientIds = updatedIngredientIds.filter(id => !removeIngredientIds.includes(id));
        }
        
        // Add new ingredients (avoiding duplicates)
        if (addIngredientIds.length > 0) {
            // Only add ingredients that don't already exist in the list
            const newIngredients = addIngredientIds.filter(id => !updatedIngredientIds.includes(id));
            updatedIngredientIds = [...updatedIngredientIds, ...newIngredients];
        }
        
        // Update the shopping list in DynamoDB
        const updateParams = {
            TableName: 'LunchplannerV2-ShoppingLists',
            Key: marshall({ listId }),
            UpdateExpression: 'SET ingredientIds = :ingredientIds, updatedAt = :updatedAt',
            ExpressionAttributeValues: marshall({
                ':ingredientIds': updatedIngredientIds,
                ':updatedAt': new Date().toISOString()
            }),
            ReturnValues: 'ALL_NEW'
        };
        
        const { Attributes } = await dynamoDbClient.send(new UpdateItemCommand(updateParams));
        
        const updatedShoppingList = unmarshall(Attributes);
        
        return {
            statusCode: 200,
            headers: corsHeaders,
            body: JSON.stringify({
                message: 'Shopping list updated successfully',
                shoppingList: updatedShoppingList
            })
        };
    } catch (error) {
        console.error('Error updating shopping list:', error);
        
        return {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({
                message: 'Error updating shopping list in database',
                error: error.message
            })
        };
    }
}; 