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
  listId: string;
  name: string;
  mealIds: string[];
  ingredientIds: string[];
  tickedIngredients?: string[];
  createdAt?: string;
  updatedAt?: string;
  isShared?: boolean;
  // For shared lists
  mealNames?: string[];
  ingredientNames?: { id: string; name: string }[];
}

export interface User {
  username: string;
  isAuthenticated: boolean;
  token?: string;
}

export interface Share {
  shareId: string;
  listId: string;
  userId: string;
  userEmail?: string;
  createdBy: string;
  createdAt: string;
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
