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
  shoppingListId?: string;  // For backward compatibility
  listId: string;           // Actual API field
  name?: string;            // Optional for backward compatibility
  meals?: string[];         // Optional for backward compatibility
  mealIds: string[];        // Actual API field
  ingredients?: string[];   // Optional for backward compatibility
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