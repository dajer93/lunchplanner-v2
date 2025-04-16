const { DynamoDBClient, ScanCommand, GetItemCommand, QueryCommand } = require('@aws-sdk/client-dynamodb');
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
 * Lambda function to retrieve meals from the DynamoDB LunchplannerV2-Meals table
 * Can retrieve a single meal by ID or all meals
 * 
 * @param {Object} event - Lambda event object
 * @param {Object} event.pathParameters - Path parameters (if any)
 * @param {string} event.pathParameters.mealId - Optional meal ID to retrieve a specific meal
 * @returns {Object} - Response containing the meal(s)
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
        
        // Check if a specific mealId was provided
        const mealId = event.pathParameters?.mealId;
        
        if (mealId) {
            // Get a specific meal by ID
            return await getMealById(mealId, userId);
        } else {
            // Get all meals for this user
            return await getAllMeals(userId);
        }
    } catch (error) {
        console.error('Error retrieving meals:', error);
        
        return {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({
                message: 'Error retrieving meals from database',
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
                message: 'You do not have permission to access this meal' 
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

/**
 * Retrieves all meals from the DynamoDB table for a specific user
 * 
 * @param {string} userId - The ID of the current user
 * @returns {Object} - Response containing all meals for the user
 */
async function getAllMeals(userId) {
    const params = {
        TableName: 'LunchplannerV2-Meals',
        FilterExpression: 'userId = :userId',
        ExpressionAttributeValues: marshall({
            ':userId': userId
        })
    };
    
    const { Items } = await dynamoDbClient.send(new ScanCommand(params));
    
    const meals = Items ? Items.map(item => unmarshall(item)) : [];
    
    // Sort by createdAt if available, newest first
    meals.sort((a, b) => {
        if (a.createdAt && b.createdAt) {
            return new Date(b.createdAt) - new Date(a.createdAt);
        }
        return 0;
    });
    
    return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
            meals,
            count: meals.length
        })
    };
} 