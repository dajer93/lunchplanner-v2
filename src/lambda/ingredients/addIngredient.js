const { DynamoDBClient, PutItemCommand, QueryCommand, ScanCommand } = require('@aws-sdk/client-dynamodb');
const { marshall, unmarshall } = require('@aws-sdk/util-dynamodb');
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
 * Lambda function to add an ingredient to the DynamoDB LunchplannerV2-Ingredients table
 * If the ingredient already exists, it returns the existing ingredient instead of creating a new one.
 * 
 * @param {Object} event - Lambda event object
 * @param {string} event.ingredientName - Name of the ingredient
 * @returns {Object} - Response containing the ingredient details
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
        
        const { ingredientName } = requestBody;
        
        // Validate input
        if (!ingredientName) {
            return {
                statusCode: 400,
                headers: corsHeaders,
                body: JSON.stringify({ message: 'ingredientName is required' })
            };
        }
        
        // Check if the ingredient already exists
        const scanParams = {
            TableName: 'LunchplannerV2-MealIngredients',
            FilterExpression: 'ingredientName = :name',
            ExpressionAttributeValues: marshall({
                ':name': ingredientName
            })
        };
        
        const scanResponse = await dynamoDbClient.send(new ScanCommand(scanParams));
        
        // If ingredient exists, return it
        if (scanResponse.Items && scanResponse.Items.length > 0) {
            const existingIngredient = unmarshall(scanResponse.Items[0]);
            
            return {
                statusCode: 200,
                headers: corsHeaders,
                body: JSON.stringify({
                    message: 'Ingredient already exists',
                    ingredient: existingIngredient
                })
            };
        }
        
        // Generate a unique ID for the ingredient
        const ingredientId = uuidv4();
        
        // Create the ingredient item
        const ingredient = {
            ingredientId,
            ingredientName
        };
        
        // Prepare the DynamoDB put command
        const params = {
            TableName: 'LunchplannerV2-MealIngredients',
            Item: marshall(ingredient)
        };
        
        // Add the ingredient to DynamoDB
        await dynamoDbClient.send(new PutItemCommand(params));
        
        return {
            statusCode: 201,
            headers: corsHeaders,
            body: JSON.stringify({
                message: 'Ingredient added successfully',
                ingredient
            })
        };
    } catch (error) {
        console.error('Error adding ingredient:', error);
        
        return {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({
                message: 'Error adding ingredient to database',
                error: error.message
            })
        };
    }
}; 