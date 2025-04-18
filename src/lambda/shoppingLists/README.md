# Shopping Lists Lambda Functions

This directory contains Lambda functions for managing shopping lists in the LunchplannerV2-ShoppingLists DynamoDB table.

## Functions

### Add Shopping List (`addShoppingList.js`)
Adds a new shopping list to the DynamoDB table with a name and list of meal IDs.

### Get Shopping Lists (`getShoppingLists.js`)
Retrieves shopping lists from the DynamoDB table. Can retrieve all shopping lists or a specific shopping list by ID.

### Update Shopping List (`updateShoppingList.js`)
Updates an existing shopping list by removing and adding ingredients.

## Features

- CORS Support: Both Lambda functions include CORS headers to allow requests from all origins
- Error handling with appropriate status codes
- Input validation
- Support for API Gateway integration
- Timestamp tracking for sorting shopping lists by creation date

## Structure

- `addShoppingList.js` - Lambda function to add a shopping list
- `getShoppingLists.js` - Lambda function to retrieve shopping lists
- `updateShoppingList.js` - Lambda function to update a shopping list
- `package.json` - Dependencies and project metadata
- `test-local-add.js` - Test script for the addShoppingList function
- `test-local-get.js` - Test script for the getShoppingLists function
- `test-local-update.js` - Test script for the updateShoppingList function

## Requirements

- AWS CLI configured with appropriate credentials
- Node.js 18 or higher

## Deployment Instructions

1. Install dependencies:
   ```
   npm install
   ```

2. Create a deployment package:
   ```
   npm run zip
   ```
   Or manually:
   ```
   zip -r function.zip . -x "*.git*" "node_modules/.bin/*"
   ```

### Deploying with CloudFormation

3. Package your CloudFormation template:
   ```
   aws cloudformation package \
     --template-file template.yaml \
     --s3-bucket your-deployment-bucket \
     --output-template-file packaged-template.yaml
   ```

4. Deploy your CloudFormation stack:
   ```
   aws cloudformation deploy \
     --template-file packaged-template.yaml \
     --stack-name lunchplanner-v2-shopping-lists \
     --capabilities CAPABILITY_IAM
   ```

## Usage

### Add Shopping List

The addShoppingList Lambda function expects the following input structure:

```json
{
  "name": "Weekly Grocery List",
  "mealIds": ["meal123", "meal456", "meal789"]
}
```

#### Response

Successful response (201):
```json
{
  "statusCode": 201,
  "body": {
    "message": "Shopping list added successfully",
    "shoppingList": {
      "shoppingListId": "generated-uuid",
      "name": "Weekly Grocery List",
      "mealIds": ["meal123", "meal456", "meal789"],
      "createdAt": "2023-06-16T10:30:00.000Z"
    }
  }
}
```

Error responses:
- 400: Missing or invalid input
- 500: Server-side error

### Get Shopping Lists

#### Get All Shopping Lists

To get all shopping lists, call the Lambda function without any path parameters.

Response (200):
```json
{
  "statusCode": 200,
  "body": {
    "shoppingLists": [
      {
        "shoppingListId": "list-id-1",
        "name": "Weekly Grocery List",
        "mealIds": ["meal123", "meal456", "meal789"],
        "createdAt": "2023-06-16T10:30:00.000Z"
      },
      {
        "shoppingListId": "list-id-2",
        "name": "Party Shopping List",
        "mealIds": ["meal101", "meal102"],
        "createdAt": "2023-06-15T16:45:00.000Z"
      }
    ],
    "count": 2
  }
}
```

Shopping lists are automatically sorted by creation date, with the newest lists first.

#### Get Shopping List by ID

To get a specific shopping list, call the Lambda function with the shoppingListId path parameter:

```
/shoppingLists/{shoppingListId}
```

Response (200):
```json
{
  "statusCode": 200,
  "body": {
    "shoppingList": {
      "shoppingListId": "list-id-1",
      "name": "Weekly Grocery List",
      "mealIds": ["meal123", "meal456", "meal789"],
      "createdAt": "2023-06-16T10:30:00.000Z"
    }
  }
}
```

Error responses:
- 404: Shopping list not found
- 500: Server-side error

### Update Shopping List

#### Introduction
The `updateShoppingList.js` Lambda function now supports both removing and adding ingredients to existing shopping lists.

#### Functionality

##### Removing Ingredients
- The function accepts an array of ingredient IDs to remove from the shopping list.
- These ingredients will be filtered out from the shopping list's existing ingredients.

##### Adding Ingredients (New Feature)
- The function now accepts an array of ingredient IDs to add to the shopping list.
- The new ingredients will be appended to the shopping list's existing ingredients.
- Duplicate ingredients are automatically filtered out.

#### API Endpoints

```
PUT /shoppingLists/{listId}
```

#### Request Body

```json
{
  "removeIngredientIds": ["ingredient-id-1", "ingredient-id-2"],
  "addIngredientIds": ["ingredient-id-3", "ingredient-id-4"]
}
```

Both `removeIngredientIds` and `addIngredientIds` are optional, but at least one must be provided.

#### Response

```json
{
  "message": "Shopping list updated successfully",
  "shoppingList": {
    "listId": "list-id",
    "name": "Shopping List Name",
    "userId": "user-id",
    "mealIds": ["meal-id-1", "meal-id-2"],
    "ingredientIds": ["ingredient-id-5", "ingredient-id-3", "ingredient-id-4"],
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-02T00:00:00.000Z"
  }
}
```

#### Testing

The function can be tested locally using the `test-local-update.js` script. This script tests:
1. Removing ingredients from a shopping list
2. Adding ingredients to a shopping list
3. Both operations in a single request

#### Client Integration

The client application has been updated to:
- Allow users to add new ingredients directly from the shopping list page
- Enable removing existing ingredients
- Update the UI to reflect changes in real-time

## CORS Support

Both Lambda functions include CORS headers that allow cross-origin requests from any domain. The following headers are included in all responses:

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Headers: Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token
Access-Control-Allow-Methods: OPTIONS,POST,GET
Access-Control-Allow-Credentials: true
```

The functions also handle preflight OPTIONS requests automatically.

## IAM Role Permissions

The Lambda execution role needs the following permissions:
- DynamoDB: PutItem, Scan, GetItem on LunchplannerV2-ShoppingLists table
- CloudWatch: CreateLogGroup, CreateLogStream, PutLogEvents 