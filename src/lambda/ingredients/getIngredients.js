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
 * Lambda function to retrieve ingredients from the DynamoDB LunchplannerV2-MealIngredients table
 * Can retrieve a single ingredient by ID or all ingredients
 * 
 * @param {Object} event - Lambda event object
 * @param {Object} event.pathParameters - Path parameters (if any)
 * @param {string} event.pathParameters.ingredientId - Optional ingredient ID to retrieve a specific ingredient
 * @returns {Object} - Response containing the ingredient(s)
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
        
        // Check if a specific ingredientId was provided
        const ingredientId = event.pathParameters?.ingredientId;
        
        if (ingredientId) {
            // Get a specific ingredient by ID
            return await getIngredientById(ingredientId, userId);
        } else {
            // Get all ingredients
            return await getAllIngredients(userId);
        }
    } catch (error) {
        console.error('Error retrieving ingredients:', error);
        
        return {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({
                message: 'Error retrieving ingredients from database',
                error: error.message
            })
        };
    }
};

/**
 * Retrieves a specific ingredient from DynamoDB by its ID
 * 
 * @param {string} ingredientId - The ID of the ingredient to retrieve
 * @param {string} userId - The ID of the current user
 * @returns {Object} - Response containing the ingredient
 */
async function getIngredientById(ingredientId, userId) {
    const params = {
        TableName: 'LunchplannerV2-MealIngredients',
        Key: marshall({ ingredientId })
    };
    
    const { Item } = await dynamoDbClient.send(new GetItemCommand(params));
    
    if (!Item) {
        return {
            statusCode: 404,
            headers: corsHeaders,
            body: JSON.stringify({ 
                message: 'Ingredient not found' 
            })
        };
    }
    
    const ingredient = unmarshall(Item);
    
    // Check if this ingredient belongs to the current user
    if (ingredient.userId && ingredient.userId !== userId) {
        return {
            statusCode: 403,
            headers: corsHeaders,
            body: JSON.stringify({ 
                message: 'You do not have permission to access this ingredient' 
            })
        };
    }
    
    return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
            ingredient
        })
    };
}

/**
 * Retrieves all ingredients from the DynamoDB table for a specific user
 * 
 * @param {string} userId - The ID of the current user
 * @returns {Object} - Response containing all ingredients for the user
 */
async function getAllIngredients(userId) {
    const params = {
        TableName: 'LunchplannerV2-MealIngredients',
        FilterExpression: 'userId = :userId',
        ExpressionAttributeValues: marshall({
            ':userId': userId
        })
    };
    
    const { Items } = await dynamoDbClient.send(new ScanCommand(params));
    
    const ingredients = Items ? Items.map(item => unmarshall(item)) : [];
    
    // Sort alphabetically by name for easier browsing
    ingredients.sort((a, b) => {
        if (a.ingredientName && b.ingredientName) {
            return a.ingredientName.localeCompare(b.ingredientName);
        }
        return 0;
    });
    
    return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
            ingredients,
            count: ingredients.length
        })
    };
} 