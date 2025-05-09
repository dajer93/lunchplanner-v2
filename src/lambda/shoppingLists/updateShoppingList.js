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
        
        const requestBody = typeof event.body === 'string' 
            ? JSON.parse(event.body) 
            : event.body || event;
        
        const { 
            removeIngredientIds = [], 
            addIngredientIds = [],
            tickedIngredientIds
        } = requestBody;
        
        // Validate that at least one operation is requested
        if (
            (removeIngredientIds.length === 0 || !Array.isArray(removeIngredientIds)) &&
            (addIngredientIds.length === 0 || !Array.isArray(addIngredientIds)) &&
            tickedIngredientIds === undefined
        ) {
            return {
                statusCode: 400,
                headers: corsHeaders,
                body: JSON.stringify({ message: 'At least one of removeIngredientIds, addIngredientIds, or tickedIngredientIds is required' })
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
                body: JSON.stringify({ message: 'You do not have permission to update this shopping list' })
            };
        }
        
        const currentIngredientIds = shoppingList.ingredientIds || [];
        
        let updatedIngredientIds = currentIngredientIds;
        if (removeIngredientIds.length > 0) {
            updatedIngredientIds = updatedIngredientIds.filter(id => !removeIngredientIds.includes(id));
        }
        
        if (addIngredientIds.length > 0) {
            const newIngredients = addIngredientIds.filter(id => !updatedIngredientIds.includes(id));
            updatedIngredientIds = [...updatedIngredientIds, ...newIngredients];
        }
        
        let updateExpression = 'SET updatedAt = :updatedAt';
        let expressionAttributeValues = {
            ':updatedAt': new Date().toISOString()
        };

        // If we're updating ingredients
        if (removeIngredientIds.length > 0 || addIngredientIds.length > 0) {
            updateExpression += ', ingredientIds = :ingredientIds';
            expressionAttributeValues[':ingredientIds'] = updatedIngredientIds;
        }

        // If we're updating ticked ingredients
        if (tickedIngredientIds !== undefined) {
            const tickedIngredients = Array.isArray(tickedIngredientIds) ? tickedIngredientIds : [];
            updateExpression += ', tickedIngredients = :tickedIngredients';
            expressionAttributeValues[':tickedIngredients'] = tickedIngredients;
        }
        
        const updateParams = {
            TableName: 'LunchplannerV2-ShoppingLists',
            Key: marshall({ listId }),
            UpdateExpression: updateExpression,
            ExpressionAttributeValues: marshall(expressionAttributeValues),
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