export interface Ingredient {
  ingredientId: string;
  ingredientName: string;
  createdAt?: string;
}

export interface Meal {
  mealId: string;
  mealName: string;
  ingredients: string[]; // Array of ingredientIds
  createdAt?: string;
}

export interface ShoppingList {
  shoppingListId: string;
  name: string;
  meals: string[]; // Array of mealIds
  ingredients: string[]; // Array of ingredientIds
  createdAt?: string;
}

export interface User {
  username: string;
  isAuthenticated: boolean;
  token?: string;
}

// API response types
export interface ApiResponse<T> {
  statusCode: number;
  body: T;
}

export interface IngredientsResponse {
  ingredients: Ingredient[];
  count: number;
}

export interface MealsResponse {
  meals: Meal[];
  count: number;
}

export interface ShoppingListsResponse {
  shoppingLists: ShoppingList[];
  count: number;
} 