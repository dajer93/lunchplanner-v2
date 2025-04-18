const { DynamoDBClient, GetItemCommand, DeleteItemCommand } = require('@aws-sdk/client-dynamodb');
const { marshall, unmarshall } = require('@aws-sdk/util-dynamodb');

const dynamoDbClient = new DynamoDBClient({ region: 'eu-central-1' });

// CORS headers to allow requests from all origins
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token',
    'Access-Control-Allow-Methods': 'OPTIONS,DELETE',
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
 * Lambda function to delete a shopping list from the DynamoDB LunchplannerV2-ShoppingLists table
 * 
 * @param {Object} event - Lambda event object
 * @returns {Object} - Response containing the result of the deletion
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
        const userId = extractUserId(event);
        
        if (!userId) {
            return {
                statusCode: 401,
                headers: corsHeaders,
                body: JSON.stringify({ message: 'User not authenticated' })
            };
        }
        
        const listId = event.pathParameters?.listId;
        
        if (!listId) {
            return {
                statusCode: 400,
                headers: corsHeaders,
                body: JSON.stringify({ message: 'Shopping list ID is required' })
            };
        }
        
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
        
        if (shoppingList.userId !== userId) {
            return {
                statusCode: 403,
                headers: corsHeaders,
                body: JSON.stringify({ message: 'You do not have permission to delete this shopping list' })
            };
        }
        
        const deleteParams = {
            TableName: 'LunchplannerV2-ShoppingLists',
            Key: marshall({ listId }),
            ReturnValues: 'ALL_OLD'
        };
        
        await dynamoDbClient.send(new DeleteItemCommand(deleteParams));
        
        return {
            statusCode: 200,
            headers: corsHeaders,
            body: JSON.stringify({
                message: 'Shopping list deleted successfully',
                listId: listId
            })
        };
    } catch (error) {
        console.error('Error deleting shopping list:', error);
        
        return {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({
                message: 'Error deleting shopping list from database',
                error: error.message
            })
        };
    }
}; 