const { DynamoDBClient, PutItemCommand } = require('@aws-sdk/client-dynamodb');
const { marshall } = require('@aws-sdk/util-dynamodb');
const { v4: uuidv4 } = require('uuid');

const dynamoDbClient = new DynamoDBClient({ region: 'eu-central-1' });

// CORS headers to allow requests from all origins
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token',
    'Access-Control-Allow-Methods': 'OPTIONS,POST,GET',
    'Access-Control-Allow-Credentials': true
};

/**
 * Lambda function to add a meal to the DynamoDB LunchplannerV2-Meals table
 * 
 * @param {Object} event - Lambda event object
 * @param {string} event.mealName - Name of the meal
 * @param {string[]} event.ingredients - Array of ingredient IDs
 * @returns {Object} - Response containing the meal details
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
        
        // Generate a unique ID for the meal
        const mealId = uuidv4();
        
        // Create the meal item
        const meal = {
            mealId,
            mealName,
            ingredients
        };
        
        // Prepare the DynamoDB put command
        const params = {
            TableName: 'LunchplannerV2-Meals',
            Item: marshall(meal)
        };
        
        // Add the meal to DynamoDB
        await dynamoDbClient.send(new PutItemCommand(params));
        
        return {
            statusCode: 201,
            headers: corsHeaders,
            body: JSON.stringify({
                message: 'Meal added successfully',
                meal
            })
        };
    } catch (error) {
        console.error('Error adding meal:', error);
        
        return {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({
                message: 'Error adding meal to database',
                error: error.message
            })
        };
    }
}; 