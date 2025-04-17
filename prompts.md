## Prompt 1 for client: 

```
Hi! 
I'd like to create a client app with vite and react in typescript and MaterialUI.

On a high level the app needs to do the following things:
- Manage Meals and their ingredients
- List the meals in a list where the user can select a subset of them. 
- Generate a shopping list of the ingredients necessary for the selected Meals.

The UI needs to have the following pages:
- A homepage. This should contain login/registration buttons when logged out, otherwise it should only contain a Logout button.
- Meals page - This is where the user has a list of Meals and where they can create a new meal. This is also where the user can select meals and create shopping list from them.
- Shopping lists - This is where the user can see their already existing shopping lists

Technical details:
This is the API url to be called: @https://evplabpje9.execute-api.eu-central-1.amazonaws.com/dev 
The endpoints: `/meals`, `/ingredients`, `/shoppingLists`, all of them have a POST and a GET endpoint.
The authentication happens with AWS cognito using this url: @https://eu-central-1frd37fsmj.auth.eu-central-1.amazoncognito.com , this authority: @https://cognito-idp.eu-central-1.amazonaws.com/eu-central-1_FRd37FSmj , and this client_id: `463hip4itnsj2t7qlplichej6a`, using username and password. The Cognito auth returns JWT tokens, the id_token should be used in the API calls as an Authorization method with the Bearer prefix.

The app itself should have the following user flows:
1. Create Meals with mealName on the client. At this point no API call is necessary. The user can add Ingredients with ingredientName, each ingredient should call the POST /ingredients API to push each individual ingredient. 
2. Once the list of ingredients is complete, the user can save the Meal. At this point the POST `/meals` API is called and data is sent with the mealName and an array of ingredientIds as `ingredients`.
3. Once there are meals returned from the GET /meals API, the user can view a list of the meals in a table view, where each row has a checkmark that can be ticked. Beneath the table there is a button "Create shoppinglist" that calls the POST /shoppingLists API to create the shopping list.
4. The previous shopping lists are accessible with the GET /shoppingLists API.
5. In order to create a shopping list, the app should also call the GET /ingredients API, to retrieve the ingredients.

Please use the `src/client` folder to create the application.

Ask my questions if more details are needed.
```

```
I'd like to create a new lambda function to be able to update the shoppinglists. 
For this change, please refer to the already existing functions addShoppingList and getShoppingLists and their data structure.
Please also make sure to update the template.yaml to have the new API endpoint and the Lambda connected to the endpoint.
Please also make sure to update the client side of the app, the list items on the ShoppingListPage.tsx should each have a small button with a crossmark that allows the users to delete list items from the respective shoppinglist. In order to do so, you will also need to update the apiService with the new API call to the UPDATE endpoint.
```