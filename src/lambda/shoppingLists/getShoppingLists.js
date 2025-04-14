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
 * Lambda function to retrieve shopping lists from the DynamoDB LunchplannerV2-ShoppingLists table
 * Can retrieve a single shopping list by ID or all shopping lists
 * 
 * @param {Object} event - Lambda event object
 * @param {Object} event.pathParameters - Path parameters (if any)
 * @param {string} event.pathParameters.shoppingListId - Optional shopping list ID to retrieve a specific list
 * @returns {Object} - Response containing the shopping list(s)
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
        // Check if a specific shoppingListId was provided
        const shoppingListId = event.pathParameters?.shoppingListId;
        
        if (shoppingListId) {
            // Get a specific shopping list by ID
            return await getShoppingListById(shoppingListId);
        } else {
            // Get all shopping lists
            return await getAllShoppingLists();
        }
    } catch (error) {
        console.error('Error retrieving shopping lists:', error);
        
        return {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({
                message: 'Error retrieving shopping lists from database',
                error: error.message
            })
        };
    }
};

/**
 * Retrieves a specific shopping list from DynamoDB by its ID
 * 
 * @param {string} shoppingListId - The ID of the shopping list to retrieve
 * @returns {Object} - Response containing the shopping list
 */
async function getShoppingListById(shoppingListId) {
    const params = {
        TableName: 'LunchplannerV2-ShoppingLists',
        Key: marshall({ shoppingListId })
    };
    
    const { Item } = await dynamoDbClient.send(new GetItemCommand(params));
    
    if (!Item) {
        return {
            statusCode: 404,
            headers: corsHeaders,
            body: JSON.stringify({ 
                message: 'Shopping list not found' 
            })
        };
    }
    
    return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
            shoppingList: unmarshall(Item)
        })
    };
}

/**
 * Retrieves all shopping lists from the DynamoDB table
 * 
 * @returns {Object} - Response containing all shopping lists
 */
async function getAllShoppingLists() {
    const params = {
        TableName: 'LunchplannerV2-ShoppingLists'
    };
    
    const { Items } = await dynamoDbClient.send(new ScanCommand(params));
    
    const shoppingLists = Items ? Items.map(item => unmarshall(item)) : [];
    
    // Sort shopping lists by createdAt in descending order (newest first)
    shoppingLists.sort((a, b) => {
        return new Date(b.createdAt) - new Date(a.createdAt);
    });
    
    return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
            shoppingLists,
            count: shoppingLists.length
        })
    };
} 