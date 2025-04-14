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
 * Lambda function to add a shopping list to the DynamoDB LunchplannerV2-ShoppingLists table
 * 
 * @param {Object} event - Lambda event object
 * @param {string} event.name - Name of the shopping list
 * @param {string[]} event.mealIds - Array of meal IDs included in this shopping list
 * @returns {Object} - Response containing the shopping list details
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
        
        const { mealIds } = requestBody;
        
        if (!mealIds || !Array.isArray(mealIds)) {
            return {
                statusCode: 400,
                headers: corsHeaders,
                body: JSON.stringify({ message: 'mealIds must be an array' })
            };
        }
        
        // Generate a unique ID for the shopping list
        const shoppingListId = uuidv4();
        
        // Create the shopping list item
        const shoppingList = {
            shoppingListId,
            mealIds,
            createdAt: new Date().toISOString() // Add timestamp for sorting/filtering
        };
        
        // Prepare the DynamoDB put command
        const params = {
            TableName: 'LunchplannerV2-ShoppingLists',
            Item: marshall(shoppingList)
        };
        
        // Add the shopping list to DynamoDB
        await dynamoDbClient.send(new PutItemCommand(params));
        
        return {
            statusCode: 201,
            headers: corsHeaders,
            body: JSON.stringify({
                message: 'Shopping list added successfully',
                shoppingList
            })
        };
    } catch (error) {
        console.error('Error adding shopping list:', error);
        
        return {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({
                message: 'Error adding shopping list to database',
                error: error.message
            })
        };
    }
}; 