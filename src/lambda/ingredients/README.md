# Ingredients Lambda Functions

This directory contains Lambda functions for managing ingredients in the LunchplannerV2-Ingredients DynamoDB table.

## Functions

### Add Ingredient (`addIngredient.js`)
Adds a new ingredient to the DynamoDB table.

### Get Ingredients (`getIngredients.js`)
Retrieves ingredients from the DynamoDB table. Can retrieve all ingredients or a specific ingredient by ID.

## Features

- CORS Support: Both Lambda functions include CORS headers to allow requests from all origins
- Error handling with appropriate status codes
- Input validation
- Support for API Gateway integration

## Structure

- `addIngredient.js` - Lambda function to add an ingredient
- `getIngredients.js` - Lambda function to retrieve ingredients
- `package.json` - Dependencies and project metadata
- `test-local-add.js` - Test script for the addIngredient function
- `test-local-get.js` - Test script for the getIngredients function

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
   zip -r function.zip . -x "*.git*" "node_modules/.bin/*"
   ```

### Deploying Add Ingredient Function

3. Create the Lambda function (first-time only):
   ```
   aws lambda create-function \
     --function-name LunchplannerV2-AddIngredient \
     --runtime nodejs18.x \
     --handler addIngredient.handler \
     --role arn:aws:iam::<ACCOUNT_ID>:role/LunchplannerV2LambdaRole \
     --zip-file fileb://function.zip
   ```

4. Update the Lambda function (for updates):
   ```
   aws lambda update-function-code \
     --function-name LunchplannerV2-AddIngredient \
     --zip-file fileb://function.zip
   ```

### Deploying Get Ingredients Function

3. Create the Lambda function (first-time only):
   ```
   aws lambda create-function \
     --function-name LunchplannerV2-GetIngredients \
     --runtime nodejs18.x \
     --handler getIngredients.handler \
     --role arn:aws:iam::<ACCOUNT_ID>:role/LunchplannerV2LambdaRole \
     --zip-file fileb://function.zip
   ```

4. Update the Lambda function (for updates):
   ```
   aws lambda update-function-code \
     --function-name LunchplannerV2-GetIngredients \
     --zip-file fileb://function.zip
   ```

## Usage

### Add Ingredient

The addIngredient Lambda function expects the following input structure:

```json
{
  "ingredientName": "Chicken"
}
```

#### Response

Successful response (201):
```json
{
  "statusCode": 201,
  "body": {
    "message": "Ingredient added successfully",
    "ingredient": {
      "ingredientId": "generated-uuid",
      "ingredientName": "Chicken"
    }
  }
}
```

Error responses:
- 400: Missing or invalid input
- 500: Server-side error

### Get Ingredients

#### Get All Ingredients

To get all ingredients, call the Lambda function without any path parameters.

Response (200):
```json
{
  "statusCode": 200,
  "body": {
    "ingredients": [
      {
        "ingredientId": "ingredient-id-1",
        "ingredientName": "Chicken"
      },
      {
        "ingredientId": "ingredient-id-2",
        "ingredientName": "Pasta"
      }
    ],
    "count": 2
  }
}
```

#### Get Ingredient by ID

To get a specific ingredient, call the Lambda function with the ingredientId path parameter:

```
/ingredients/{ingredientId}
```

Response (200):
```json
{
  "statusCode": 200,
  "body": {
    "ingredient": {
      "ingredientId": "ingredient-id-1",
      "ingredientName": "Chicken"
    }
  }
}
```

Error responses:
- 404: Ingredient not found
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
- DynamoDB: PutItem, Scan, GetItem on LunchplannerV2-Ingredients table
- CloudWatch: CreateLogGroup, CreateLogStream, PutLogEvents 