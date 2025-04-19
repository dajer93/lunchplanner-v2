const { DynamoDBClient, ScanCommand, PutItemCommand } = require('@aws-sdk/client-dynamodb');
const { CognitoIdentityProviderClient, ListUsersCommand } = require('@aws-sdk/client-cognito-identity-provider');
const { marshall, unmarshall } = require('@aws-sdk/util-dynamodb');
const { v4: uuidv4 } = require('uuid');

const dynamoDbClient = new DynamoDBClient({ region: 'eu-central-1' });
const cognitoClient = new CognitoIdentityProviderClient({ region: 'eu-central-1' });

// CORS headers to allow requests from all origins
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token',
    'Access-Control-Allow-Methods': 'OPTIONS,POST',
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
 * Find a user by email in Cognito
 * 
 * @param {string} email - Email address to search for
 * @returns {string|null} - User ID (sub) for the given email, or null if not found
 */
async function getUserIdByEmail(email) {
    try {
        const params = {
            UserPoolId: 'eu-central-1_FRd37FSmj',
            Filter: `email = "${email}"`,
            Limit: 1
        };
        
        const command = new ListUsersCommand(params);
        const response = await cognitoClient.send(command);
        
        if (response.Users && response.Users.length > 0) {
            // Get the 'sub' attribute which is the user ID
            const subAttribute = response.Users[0].Attributes.find(attr => attr.Name === 'sub');
            return subAttribute ? subAttribute.Value : null;
        }
        
        return null;
    } catch (error) {
        console.error('Error finding user by email:', error);
        return null;
    }
}

/**
 * Lambda function to create a share for a shopping list
 * 
 * @param {Object} event - Lambda event object
 * @returns {Object} - Response containing the created share
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
        
        // Parse request body
        const requestBody = JSON.parse(event.body || '{}');
        const { listId, email } = requestBody;
        
        // Validate required fields
        if (!listId || !email) {
            return {
                statusCode: 400,
                headers: corsHeaders,
                body: JSON.stringify({ message: 'Missing required fields: listId and email are required' })
            };
        }
        
        // Check if the shopping list exists and belongs to the current user
        const listOwnership = await verifyShoppingListOwnership(listId, userId);
        
        if (!listOwnership.exists) {
            return {
                statusCode: 404,
                headers: corsHeaders,
                body: JSON.stringify({ message: 'Shopping list not found' })
            };
        }
        
        if (!listOwnership.isOwner) {
            return {
                statusCode: 403,
                headers: corsHeaders,
                body: JSON.stringify({ message: 'You can only share shopping lists you own' })
            };
        }
        
        // Find the target user ID by their email
        const targetUserId = await getUserIdByEmail(email);
        
        if (!targetUserId) {
            return {
                statusCode: 404,
                headers: corsHeaders,
                body: JSON.stringify({ message: 'User with the provided email not found' })
            };
        }
        
        // Check if this list is already shared with this user
        const existingShare = await checkExistingShare(listId, targetUserId);
        
        if (existingShare) {
            return {
                statusCode: 409,
                headers: corsHeaders,
                body: JSON.stringify({ message: 'This list is already shared with this user' })
            };
        }
        
        // Create the share
        const share = {
            shareId: uuidv4(),
            listId,
            userId: targetUserId,
            createdBy: userId,
            createdAt: new Date().toISOString()
        };
        
        // Add to DynamoDB
        const params = {
            TableName: 'LunchplannerV2-SharedShoppingLists',
            Item: marshall(share)
        };
        
        await dynamoDbClient.send(new PutItemCommand(params));
        
        return {
            statusCode: 201,
            headers: corsHeaders,
            body: JSON.stringify({
                share,
                message: 'Shopping list shared successfully'
            })
        };
    } catch (error) {
        console.error('Error sharing shopping list:', error);
        
        return {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({
                message: 'Error sharing shopping list',
                error: error.message
            })
        };
    }
};

/**
 * Verify that a shopping list exists and belongs to the given user
 * 
 * @param {string} listId - ID of the shopping list
 * @param {string} userId - ID of the user
 * @returns {Object} - Object with exists and isOwner flags
 */
async function verifyShoppingListOwnership(listId, userId) {
    const params = {
        TableName: 'LunchplannerV2-ShoppingLists',
        FilterExpression: 'listId = :listId',
        ExpressionAttributeValues: marshall({
            ':listId': listId
        })
    };
    
    const { Items } = await dynamoDbClient.send(new ScanCommand(params));
    
    if (!Items || Items.length === 0) {
        return { exists: false, isOwner: false };
    }
    
    const shoppingList = unmarshall(Items[0]);
    return { exists: true, isOwner: shoppingList.userId === userId };
}

/**
 * Check if a shopping list is already shared with a user
 * 
 * @param {string} listId - ID of the shopping list
 * @param {string} userId - ID of the target user
 * @returns {boolean} - True if a share already exists
 */
async function checkExistingShare(listId, userId) {
    const params = {
        TableName: 'LunchplannerV2-SharedShoppingLists',
        FilterExpression: 'listId = :listId AND userId = :userId',
        ExpressionAttributeValues: marshall({
            ':listId': listId,
            ':userId': userId
        })
    };
    
    const { Items } = await dynamoDbClient.send(new ScanCommand(params));
    
    return Items && Items.length > 0;
} 