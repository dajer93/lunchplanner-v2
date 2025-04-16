const { DynamoDBClient, ScanCommand, GetItemCommand } = require('@aws-sdk/client-dynamodb');
const { marshall, unmarshall } = require('@aws-sdk/util-dynamodb');

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
 * Lambda function to retrieve shopping lists from the DynamoDB LunchplannerV2-ShoppingLists table
 * Can retrieve a single shopping list by ID or all shopping lists
 * 
 * @param {Object} event - Lambda event object
 * @param {Object} event.pathParameters - Path parameters (if any)
 * @param {string} event.pathParameters.shoppingListId - Optional shopping list ID
 * @returns {Object} - Response containing the shopping list(s)
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
        
        // Check if a specific shoppingListId was provided
        const shoppingListId = event.pathParameters?.shoppingListId;
        
        if (shoppingListId) {
            // Get a specific shopping list by ID
            return await getShoppingListById(shoppingListId, userId);
        } else {
            // Get all shopping lists
            return await getAllShoppingLists(userId);
        }
    } catch (error) {
        console.error('Error retrieving shopping lists:', error);
        
        return {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({
                message: 'Error retrieving shopping lists from database',
                error: error.message
            })
        };
    }
};

/**
 * Retrieves a specific shopping list from DynamoDB by its ID
 * 
 * @param {string} shoppingListId - The ID of the shopping list to retrieve
 * @param {string} userId - The ID of the current user
 * @returns {Object} - Response containing the shopping list
 */
async function getShoppingListById(shoppingListId, userId) {
    const params = {
        TableName: 'LunchplannerV2-ShoppingLists',
        Key: marshall({ shoppingListId })
    };
    
    const { Item } = await dynamoDbClient.send(new GetItemCommand(params));
    
    if (!Item) {
        return {
            statusCode: 404,
            headers: corsHeaders,
            body: JSON.stringify({ 
                message: 'Shopping list not found' 
            })
        };
    }
    
    const shoppingList = unmarshall(Item);
    
    // Check if this shopping list belongs to the current user
    if (shoppingList.userId && shoppingList.userId !== userId) {
        return {
            statusCode: 403,
            headers: corsHeaders,
            body: JSON.stringify({ 
                message: 'You do not have permission to access this shopping list' 
            })
        };
    }
    
    return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
            shoppingList
        })
    };
}

/**
 * Retrieves all shopping lists from the DynamoDB table for a specific user
 * 
 * @param {string} userId - The ID of the current user
 * @returns {Object} - Response containing all shopping lists
 */
async function getAllShoppingLists(userId) {
    const params = {
        TableName: 'LunchplannerV2-ShoppingLists',
        FilterExpression: 'userId = :userId',
        ExpressionAttributeValues: marshall({
            ':userId': userId
        })
    };
    
    const { Items } = await dynamoDbClient.send(new ScanCommand(params));
    
    const shoppingLists = Items ? Items.map(item => unmarshall(item)) : [];
    
    // Sort shopping lists by createdAt in descending order (newest first)
    shoppingLists.sort((a, b) => {
        if (a.createdAt && b.createdAt) {
            return new Date(b.createdAt) - new Date(a.createdAt);
        }
        return 0;
    });
    
    return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
            shoppingLists,
            count: shoppingLists.length
        })
    };
} 