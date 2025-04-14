# Shopping Lists Lambda Functions

This directory contains Lambda functions for managing shopping lists in the LunchplannerV2-ShoppingLists DynamoDB table.

## Functions

### Add Shopping List (`addShoppingList.js`)
Adds a new shopping list to the DynamoDB table with a name and list of meal IDs.

### Get Shopping Lists (`getShoppingLists.js`)
Retrieves shopping lists from the DynamoDB table. Can retrieve all shopping lists or a specific shopping list by ID.

## Features

- CORS Support: Both Lambda functions include CORS headers to allow requests from all origins
- Error handling with appropriate status codes
- Input validation
- Support for API Gateway integration
- Timestamp tracking for sorting shopping lists by creation date

## Structure

- `addShoppingList.js` - Lambda function to add a shopping list
- `getShoppingLists.js` - Lambda function to retrieve shopping lists
- `package.json` - Dependencies and project metadata
- `test-local-add.js` - Test script for the addShoppingList function
- `test-local-get.js` - Test script for the getShoppingLists function

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

### Deploying Add Shopping List Function

3. Create the Lambda function (first-time only):
   ```
   aws lambda create-function \
     --function-name LunchplannerV2-AddShoppingList \
     --runtime nodejs18.x \
     --handler addShoppingList.handler \
     --role arn:aws:iam::<ACCOUNT_ID>:role/LunchplannerV2LambdaRole \
     --zip-file fileb://function.zip
   ```

4. Update the Lambda function (for updates):
   ```
   aws lambda update-function-code \
     --function-name LunchplannerV2-AddShoppingList \
     --zip-file fileb://function.zip
   ```

### Deploying Get Shopping Lists Function

3. Create the Lambda function (first-time only):
   ```
   aws lambda create-function \
     --function-name LunchplannerV2-GetShoppingLists \
     --runtime nodejs18.x \
     --handler getShoppingLists.handler \
     --role arn:aws:iam::<ACCOUNT_ID>:role/LunchplannerV2LambdaRole \
     --zip-file fileb://function.zip
   ```

4. Update the Lambda function (for updates):
   ```
   aws lambda update-function-code \
     --function-name LunchplannerV2-GetShoppingLists \
     --zip-file fileb://function.zip
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