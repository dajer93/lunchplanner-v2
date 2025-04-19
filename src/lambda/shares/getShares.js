const { DynamoDBClient, ScanCommand } = require('@aws-sdk/client-dynamodb');
const { CognitoIdentityProviderClient, AdminGetUserCommand } = require('@aws-sdk/client-cognito-identity-provider');
const { marshall, unmarshall } = require('@aws-sdk/util-dynamodb');

const dynamoDbClient = new DynamoDBClient({ region: 'eu-central-1' });
const cognitoClient = new CognitoIdentityProviderClient({ region: 'eu-central-1' });

// CORS headers to allow requests from all origins
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token',
    'Access-Control-Allow-Methods': 'OPTIONS,GET,POST,DELETE',
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
 * Get user's email from Cognito by userId
 * 
 * @param {string} userId - User's unique ID
 * @returns {string|null} - User's email or null if not found
 */
async function getUserEmailFromId(userId) {
    try {
        const params = {
            UserPoolId: 'eu-central-1_FRd37FSmj', // Your User Pool ID
            Username: userId
        };

        const command = new AdminGetUserCommand(params);
        const response = await cognitoClient.send(command);
        
        const emailAttribute = response.UserAttributes.find(attr => attr.Name === 'email');
        return emailAttribute ? emailAttribute.Value : null;
    } catch (error) {
        console.error('Error getting user email:', error);
        return null;
    }
}

/**
 * Lambda function to get shares for a shopping list
 * 
 * @param {Object} event - Lambda event object
 * @returns {Object} - Response containing shares
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
        
        // Check if a specific listId was provided via query parameter
        const listId = event.queryStringParameters?.listId;
        
        // Get shares based on provided parameters
        let shares;
        if (listId) {
            // Get shares for a specific list
            shares = await getSharesByListId(listId);
        } else {
            // Get all shares created by this user
            shares = await getSharesByUserId(userId);
        }
        
        // Enrich with user email information
        const enrichedShares = await Promise.all(shares.map(async (share) => {
            // Get email for the shared user (not the creator)
            const email = await getUserEmailFromId(share.userId);
            return {
                ...share,
                userEmail: email || 'Unknown email'
            };
        }));
        
        return {
            statusCode: 200,
            headers: corsHeaders,
            body: JSON.stringify({
                shares: enrichedShares,
                count: enrichedShares.length
            })
        };
    } catch (error) {
        console.error('Error retrieving shares:', error);
        
        return {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({
                message: 'Error retrieving shares from database',
                error: error.message
            })
        };
    }
};

/**
 * Retrieves all shares for a specific list ID
 * 
 * @param {string} listId - The ID of the shopping list
 * @returns {Array} - Array of shares
 */
async function getSharesByListId(listId) {
    const params = {
        TableName: 'LunchplannerV2-SharedShoppingLists',
        FilterExpression: 'listId = :listId',
        ExpressionAttributeValues: marshall({
            ':listId': listId
        })
    };
    
    const { Items } = await dynamoDbClient.send(new ScanCommand(params));
    
    const shares = Items ? Items.map(item => unmarshall(item)) : [];
    return shares;
}

/**
 * Retrieves all shares created by a specific user
 * 
 * @param {string} userId - The ID of the user
 * @returns {Array} - Array of shares
 */
async function getSharesByUserId(userId) {
    const params = {
        TableName: 'LunchplannerV2-SharedShoppingLists',
        FilterExpression: 'createdBy = :userId',
        ExpressionAttributeValues: marshall({
            ':userId': userId
        })
    };
    
    const { Items } = await dynamoDbClient.send(new ScanCommand(params));
    
    const shares = Items ? Items.map(item => unmarshall(item)) : [];
    return shares;
} 