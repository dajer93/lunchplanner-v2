const { DynamoDBClient, UpdateItemCommand, GetItemCommand } = require('@aws-sdk/client-dynamodb');
const { marshall, unmarshall } = require('@aws-sdk/util-dynamodb');

const dynamoDbClient = new DynamoDBClient({ region: 'eu-central-1' });

// CORS headers to allow requests from all origins
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token',
    'Access-Control-Allow-Methods': 'OPTIONS,PUT,GET',
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
 * Lambda function to update a meal in the DynamoDB LunchplannerV2-Meals table
 * 
 * @param {Object} event - Lambda event object
 * @param {Object} event.pathParameters - Path parameters
 * @param {string} event.pathParameters.mealId - The meal ID to update
 * @param {Object} event.body - The request body containing update data
 * @param {string} event.body.mealName - The updated meal name
 * @param {string[]} event.body.ingredients - Array of updated ingredient IDs
 * @returns {Object} - Response containing the updated meal
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
        
        // Check if mealId was provided
        const mealId = event.pathParameters?.mealId;
        
        if (!mealId) {
            return {
                statusCode: 400,
                headers: corsHeaders,
                body: JSON.stringify({ message: 'mealId is required' })
            };
        }
        
        // First check if the meal exists and belongs to the user
        const existingMeal = await getMealById(mealId, userId);
        
        if (existingMeal.statusCode !== 200) {
            return existingMeal; // Return the error response
        }
        
        // Parse request body if it's a string
        const requestBody = typeof event.body === 'string' 
            ? JSON.parse(event.body) 
            : event.body || event;
        
        const { mealName, ingredients } = requestBody;
        
        // Validate input
        if (!mealName) {
            return {
                statusCode: 400,
                headers: corsHeaders,
                body: JSON.stringify({ message: 'mealName is required' })
            };
        }
        
        if (!ingredients || !Array.isArray(ingredients)) {
            return {
                statusCode: 400,
                headers: corsHeaders,
                body: JSON.stringify({ message: 'ingredients must be an array' })
            };
        }
        
        // Update the meal
        const params = {
            TableName: 'LunchplannerV2-Meals',
            Key: marshall({ mealId }),
            UpdateExpression: 'SET mealName = :mealName, ingredients = :ingredients, updatedAt = :updatedAt',
            ExpressionAttributeValues: marshall({
                ':mealName': mealName,
                ':ingredients': ingredients,
                ':updatedAt': new Date().toISOString()
            }),
            ReturnValues: 'ALL_NEW'
        };
        
        const { Attributes } = await dynamoDbClient.send(new UpdateItemCommand(params));
        const updatedMeal = unmarshall(Attributes);
        
        return {
            statusCode: 200,
            headers: corsHeaders,
            body: JSON.stringify({
                message: 'Meal updated successfully',
                meal: updatedMeal
            })
        };
    } catch (error) {
        console.error('Error updating meal:', error);
        
        return {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({
                message: 'Error updating meal in database',
                error: error.message
            })
        };
    }
};

/**
 * Retrieves a specific meal from DynamoDB by its ID
 * 
 * @param {string} mealId - The ID of the meal to retrieve
 * @param {string} userId - The ID of the current user
 * @returns {Object} - Response containing the meal
 */
async function getMealById(mealId, userId) {
    const params = {
        TableName: 'LunchplannerV2-Meals',
        Key: marshall({ mealId })
    };
    
    const { Item } = await dynamoDbClient.send(new GetItemCommand(params));
    
    if (!Item) {
        return {
            statusCode: 404,
            headers: corsHeaders,
            body: JSON.stringify({ 
                message: 'Meal not found' 
            })
        };
    }
    
    const meal = unmarshall(Item);
    
    // Check if this meal belongs to the current user
    if (meal.userId && meal.userId !== userId) {
        return {
            statusCode: 403,
            headers: corsHeaders,
            body: JSON.stringify({ 
                message: 'You do not have permission to update this meal' 
            })
        };
    }
    
    return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
            meal
        })
    };
} 