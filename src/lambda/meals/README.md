# Meals Lambda Functions

This directory contains Lambda functions for managing meals in the LunchplannerV2-Meals DynamoDB table.

## Functions

### Add Meal (`addMeal.js`)
Adds a new meal to the DynamoDB table.

### Get Meals (`getMeals.js`)
Retrieves meals from the DynamoDB table. Can retrieve all meals or a specific meal by ID.

## Features

- CORS Support: Both Lambda functions include CORS headers to allow requests from all origins
- Error handling with appropriate status codes
- Input validation
- Support for API Gateway integration

## Structure

- `addMeal.js` - Lambda function to add a meal
- `getMeals.js` - Lambda function to retrieve meals
- `package.json` - Dependencies and project metadata
- `test-local.js` - Test script for the addMeal function
- `test-local-get.js` - Test script for the getMeals function

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

### Deploying Add Meal Function

3. Create the Lambda function (first-time only):
   ```
   aws lambda create-function \
     --function-name LunchplannerV2-AddMeal \
     --runtime nodejs18.x \
     --handler addMeal.handler \
     --role arn:aws:iam::<ACCOUNT_ID>:role/LunchplannerV2LambdaRole \
     --zip-file fileb://function.zip
   ```

4. Update the Lambda function (for updates):
   ```
   aws lambda update-function-code \
     --function-name LunchplannerV2-AddMeal \
     --zip-file fileb://function.zip
   ```

### Deploying Get Meals Function

3. Create the Lambda function (first-time only):
   ```
   aws lambda create-function \
     --function-name LunchplannerV2-GetMeals \
     --runtime nodejs18.x \
     --handler getMeals.handler \
     --role arn:aws:iam::<ACCOUNT_ID>:role/LunchplannerV2LambdaRole \
     --zip-file fileb://function.zip
   ```

4. Update the Lambda function (for updates):
   ```
   aws lambda update-function-code \
     --function-name LunchplannerV2-GetMeals \
     --zip-file fileb://function.zip
   ```

## Usage

### Add Meal

The addMeal Lambda function expects the following input structure:

```json
{
  "mealName": "Chicken Curry",
  "ingredients": ["ing123", "ing456", "ing789"]
}
```

#### Response

Successful response (201):
```json
{
  "statusCode": 201,
  "body": {
    "message": "Meal added successfully",
    "meal": {
      "mealId": "generated-uuid",
      "mealName": "Chicken Curry",
      "ingredients": ["ing123", "ing456", "ing789"]
    }
  }
}
```

Error responses:
- 400: Missing or invalid input
- 500: Server-side error

### Get Meals

#### Get All Meals

To get all meals, call the Lambda function without any path parameters.

Response (200):
```json
{
  "statusCode": 200,
  "body": {
    "meals": [
      {
        "mealId": "meal-id-1",
        "mealName": "Chicken Curry",
        "ingredients": ["ing123", "ing456"]
      },
      {
        "mealId": "meal-id-2",
        "mealName": "Pasta Carbonara",
        "ingredients": ["ing789", "ing101"]
      }
    ],
    "count": 2
  }
}
```

#### Get Meal by ID

To get a specific meal, call the Lambda function with the mealId path parameter:

```
/meals/{mealId}
```

Response (200):
```json
{
  "statusCode": 200,
  "body": {
    "meal": {
      "mealId": "meal-id-1",
      "mealName": "Chicken Curry",
      "ingredients": ["ing123", "ing456"]
    }
  }
}
```

Error responses:
- 404: Meal not found
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
- DynamoDB: PutItem, Scan, GetItem on LunchplannerV2-Meals table
- CloudWatch: CreateLogGroup, CreateLogStream, PutLogEvents 