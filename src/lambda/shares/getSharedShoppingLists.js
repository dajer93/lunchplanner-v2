const { DynamoDBClient, ScanCommand, GetItemCommand } = require('@aws-sdk/client-dynamodb');
const { marshall, unmarshall } = require('@aws-sdk/util-dynamodb');

const dynamoDbClient = new DynamoDBClient({ region: 'eu-central-1' });

// CORS headers to allow requests from all origins
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token',
    'Access-Control-Allow-Methods': 'OPTIONS,GET',
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
 * Lambda function to retrieve shopping lists shared with the current user
 * including resolved meal and ingredient names
 * 
 * @param {Object} event - Lambda event object
 * @returns {Object} - Response containing the shopping lists
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
        
        // Get all shares for this user
        const userShares = await getSharesForUser(userId);
        
        if (userShares.length === 0) {
            return {
                statusCode: 200,
                headers: corsHeaders,
                body: JSON.stringify({
                    shoppingLists: [],
                    count: 0
                })
            };
        }
        
        // Get all unique list IDs from the shares
        const listIds = [...new Set(userShares.map(share => share.listId))];
        
        // Get full shopping list data for each shared list
        const shoppingLists = await Promise.all(
            listIds.map(async (listId) => {
                try {
                    const shoppingList = await getShoppingListData(listId);
                    
                    if (!shoppingList) {
                        console.warn(`Shopping list ${listId} not found`);
                        return null;
                    }
                    
                    // Enrich with meal and ingredient names
                    const enhancedList = await enhanceShoppingListWithNames(shoppingList);
                    
                    // Add a flag to indicate this is a shared list
                    enhancedList.isShared = true;
                    
                    return enhancedList;
                } catch (error) {
                    console.error(`Error processing shopping list ${listId}:`, error);
                    return null;
                }
            })
        );
        
        // Filter out null values (lists that weren't found or had errors)
        const validShoppingLists = shoppingLists.filter(Boolean);
        
        return {
            statusCode: 200,
            headers: corsHeaders,
            body: JSON.stringify({
                shoppingLists: validShoppingLists,
                count: validShoppingLists.length
            })
        };
    } catch (error) {
        console.error('Error retrieving shared shopping lists:', error);
        
        return {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({
                message: 'Error retrieving shared shopping lists from database',
                error: error.message
            })
        };
    }
};

/**
 * Get all shares for a specific user
 * 
 * @param {string} userId - The ID of the user
 * @returns {Array} - Array of shares
 */
async function getSharesForUser(userId) {
    const params = {
        TableName: 'LunchplannerV2-SharedShoppingLists',
        FilterExpression: 'userId = :userId',
        ExpressionAttributeValues: marshall({
            ':userId': userId
        })
    };
    
    const { Items } = await dynamoDbClient.send(new ScanCommand(params));
    
    return Items ? Items.map(item => unmarshall(item)) : [];
}

/**
 * Get a shopping list by its ID
 * 
 * @param {string} listId - The ID of the shopping list
 * @returns {Object|null} - The shopping list or null if not found
 */
async function getShoppingListData(listId) {
    const params = {
        TableName: 'LunchplannerV2-ShoppingLists',
        Key: marshall({ listId })
    };
    
    const { Item } = await dynamoDbClient.send(new GetItemCommand(params));
    
    if (!Item) {
        return null;
    }
    
    return unmarshall(Item);
}

/**
 * Get meal data by its ID
 * 
 * @param {string} mealId - The ID of the meal
 * @returns {Object|null} - The meal or null if not found
 */
async function getMealData(mealId) {
    const params = {
        TableName: 'LunchplannerV2-Meals',
        Key: marshall({ mealId })
    };
    
    const { Item } = await dynamoDbClient.send(new GetItemCommand(params));
    
    if (!Item) {
        return null;
    }
    
    return unmarshall(Item);
}

/**
 * Get ingredient data by its ID
 * 
 * @param {string} ingredientId - The ID of the ingredient
 * @returns {Object|null} - The ingredient or null if not found
 */
async function getIngredientData(ingredientId) {
    const params = {
        TableName: 'LunchplannerV2-MealIngredients',
        Key: marshall({ ingredientId })
    };
    
    const { Item } = await dynamoDbClient.send(new GetItemCommand(params));
    
    if (!Item) {
        return null;
    }
    
    return unmarshall(Item);
}

/**
 * Enhance a shopping list with meal and ingredient names
 * 
 * @param {Object} shoppingList - The shopping list to enhance
 * @returns {Object} - Enhanced shopping list with meal and ingredient names
 */
async function enhanceShoppingListWithNames(shoppingList) {
    // Create a copy of the shopping list to avoid modifying the original
    const enhancedList = { ...shoppingList };
    
    // Add mealNames array
    enhancedList.mealNames = [];
    
    // Process meals
    if (Array.isArray(shoppingList.mealIds)) {
        const mealPromises = shoppingList.mealIds.map(async (mealId) => {
            const meal = await getMealData(mealId);
            return meal ? meal.mealName : 'Unknown Meal';
        });
        
        enhancedList.mealNames = await Promise.all(mealPromises);
    }
    
    // Add ingredientNames array
    enhancedList.ingredientNames = [];
    
    // Process ingredients
    if (Array.isArray(shoppingList.ingredientIds)) {
        const ingredientPromises = shoppingList.ingredientIds.map(async (ingredientId) => {
            const ingredient = await getIngredientData(ingredientId);
            return {
                id: ingredientId,
                name: ingredient ? ingredient.ingredientName : 'Unknown Ingredient'
            };
        });
        
        enhancedList.ingredientNames = await Promise.all(ingredientPromises);
    }
    
    return enhancedList;
} 