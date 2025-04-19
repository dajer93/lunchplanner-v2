const { DynamoDBClient, ScanCommand, DeleteItemCommand } = require('@aws-sdk/client-dynamodb');
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
 * Lambda function to delete a share
 * 
 * @param {Object} event - Lambda event object
 * @returns {Object} - Response indicating success or failure
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
        
        // Get the shareId from path parameters
        const shareId = event.pathParameters?.shareId;
        
        if (!shareId) {
            return {
                statusCode: 400,
                headers: corsHeaders,
                body: JSON.stringify({ message: 'Missing required parameter: shareId' })
            };
        }
        
        // First, retrieve the share to check ownership
        const share = await getShareById(shareId);
        
        if (!share) {
            return {
                statusCode: 404,
                headers: corsHeaders,
                body: JSON.stringify({ message: 'Share not found' })
            };
        }
        
        // Verify the user has permission to delete this share
        // Only the creator of the share (owner of the shopping list) can delete it
        if (share.createdBy !== userId) {
            return {
                statusCode: 403,
                headers: corsHeaders,
                body: JSON.stringify({ message: 'You can only delete shares you created' })
            };
        }
        
        // Delete the share
        await deleteShareById(shareId);
        
        return {
            statusCode: 200,
            headers: corsHeaders,
            body: JSON.stringify({
                message: 'Share deleted successfully',
                shareId
            })
        };
    } catch (error) {
        console.error('Error deleting share:', error);
        
        return {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({
                message: 'Error deleting share',
                error: error.message
            })
        };
    }
};

/**
 * Get a share by its ID
 * 
 * @param {string} shareId - The ID of the share
 * @returns {Object|null} - The share object or null if not found
 */
async function getShareById(shareId) {
    const params = {
        TableName: 'LunchplannerV2-SharedShoppingLists',
        FilterExpression: 'shareId = :shareId',
        ExpressionAttributeValues: marshall({
            ':shareId': shareId
        })
    };
    
    const { Items } = await dynamoDbClient.send(new ScanCommand(params));
    
    if (!Items || Items.length === 0) {
        return null;
    }
    
    return unmarshall(Items[0]);
}

/**
 * Delete a share by its ID
 * 
 * @param {string} shareId - The ID of the share to delete
 */
async function deleteShareById(shareId) {
    const params = {
        TableName: 'LunchplannerV2-SharedShoppingLists',
        Key: marshall({
            shareId
        })
    };
    
    await dynamoDbClient.send(new DeleteItemCommand(params));
} 