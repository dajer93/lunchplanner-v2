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
 * Lambda function to retrieve ingredients from the DynamoDB LunchplannerV2-Ingredients table
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
        // Check if a specific ingredientId was provided
        const ingredientId = event.pathParameters?.ingredientId;
        
        if (ingredientId) {
            // Get a specific ingredient by ID
            return await getIngredientById(ingredientId);
        } else {
            // Get all ingredients
            return await getAllIngredients();
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
 * @returns {Object} - Response containing the ingredient
 */
async function getIngredientById(ingredientId) {
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
    
    return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
            ingredient: unmarshall(Item)
        })
    };
}

/**
 * Retrieves all ingredients from the DynamoDB table
 * 
 * @returns {Object} - Response containing all ingredients
 */
async function getAllIngredients() {
    const params = {
        TableName: 'LunchplannerV2-MealIngredients'
    };
    
    const { Items } = await dynamoDbClient.send(new ScanCommand(params));
    
    const ingredients = Items ? Items.map(item => unmarshall(item)) : [];
    
    return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
            ingredients,
            count: ingredients.length
        })
    };
} 