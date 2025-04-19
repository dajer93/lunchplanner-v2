# Shares Lambda Functions

This directory contains Lambda functions for managing shopping list shares in the LunchplannerV2 application. These functions allow users to share their shopping lists with other users of the application.

## DynamoDB Table

These functions use the `LunchplannerV2-SharedShoppingLists` DynamoDB table, which has the following structure:

- **shareId** (String, PK): Unique identifier for each share
- **listId** (String): ID of the shopping list being shared
- **userId** (String): ID of the user with whom the list is shared
- **createdBy** (String): ID of the user who created the share
- **createdAt** (String): Timestamp of when the share was created

## Lambda Functions

### 1. getShares.js

Retrieves shares for a specific shopping list or all shares created by the current user.

Endpoints:
- `GET /share` - Get all shares created by the current user
- `GET /share?listId={listId}` - Get all shares for a specific shopping list

Response contains user email information for each share.

### 2. addShare.js

Creates a new share of a shopping list with another user.

Endpoint:
- `POST /share` - Create a new share

Request body:
```json
{
  "listId": "shopping-list-id",
  "email": "user@example.com"
}
```

### 3. deleteShare.js

Deletes a share, removing access for a user to a shopping list.

Endpoint:
- `DELETE /share/{shareId}` - Delete a specific share

### 4. getSharedShoppingLists.js

Retrieves all shopping lists shared with the current user, enriched with meal and ingredient names.

Endpoint:
- `GET /share/shoppingLists` - Get all shopping lists shared with the current user

## Permissions

These Lambda functions require:

1. DynamoDB access:
   - Read/Write access to `LunchplannerV2-SharedShoppingLists`
   - Read access to `LunchplannerV2-ShoppingLists`
   - Read access to `LunchplannerV2-Meals`
   - Read access to `LunchplannerV2-MealIngredients`

2. Cognito access:
   - `cognito-idp:AdminGetUser` - For looking up user emails by ID
   - `cognito-idp:ListUsers` - For looking up user IDs by email

## Testing

To test these Lambda functions locally, use the test files provided:

- `test-local-get.js` - Tests the getShares function
- `test-local-add.js` - Tests the addShare function
- `test-local-delete.js` - Tests the deleteShare function
- `test-local-get-shared.js` - Tests the getSharedShoppingLists function

Run tests with:
```bash
node test-local-get.js
``` 