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
        // Check if a specific mealId was provided
        const mealId = event.pathParameters?.mealId;
        
        if (mealId) {
            // Get a specific meal by ID
            return await getMealById(mealId);
        } else {
            // Get all meals
            return await getAllMeals();
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
 * @returns {Object} - Response containing the meal
 */
async function getMealById(mealId) {
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
    
    return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
            meal: unmarshall(Item)
        })
    };
}

/**
 * Retrieves all meals from the DynamoDB table
 * 
 * @returns {Object} - Response containing all meals
 */
async function getAllMeals() {
    const params = {
        TableName: 'LunchplannerV2-Meals'
    };
    
    const { Items } = await dynamoDbClient.send(new ScanCommand(params));
    
    const meals = Items ? Items.map(item => unmarshall(item)) : [];
    
    return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
            meals,
            count: meals.length
        })
    };
} 