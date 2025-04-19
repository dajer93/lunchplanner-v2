/* eslint-disable */

import { Ingredient, Meal, ShoppingList } from "../types";
import { getAuthToken, signOut } from "./authService";

// const API_URL = 'https://evplabpje9.execute-api.eu-central-1.amazonaws.com/dev';
const API_URL = "https://dqyn7lk8qb.execute-api.eu-central-1.amazonaws.com/dev";
// const API_URL = 'http://localhost:3000';

// Singleton for token expiration handling to prevent multiple redirects
class TokenExpirationHandler {
  private static instance: TokenExpirationHandler;
  private isHandlingExpiration = false;

  private constructor() {}

  public static getInstance(): TokenExpirationHandler {
    if (!TokenExpirationHandler.instance) {
      TokenExpirationHandler.instance = new TokenExpirationHandler();
    }
    return TokenExpirationHandler.instance;
  }

  public handleExpiration(): void {
    if (this.isHandlingExpiration) return;

    this.isHandlingExpiration = true;
    console.log("Token expired, logging out...");

    // Perform logout
    signOut();

    // Redirect to login page
    window.location.href = "/login";
  }
}

const getHeaders = () => {
  const token = getAuthToken();
  return {
    "Content-Type": "application/json",
    Authorization: token ? `Bearer ${token}` : "",
  };
};

const handleResponse = async (response: Response) => {
  if (!response.ok) {
    try {
      const errorData = await response.json();
      console.error("API error response:", errorData);

      // Check for token expiration (401 Unauthorized with specific message)
      if (
        response.status === 401 &&
        errorData.message &&
        (errorData.message.includes("expired") ||
          errorData.message.includes("token"))
      ) {
        TokenExpirationHandler.getInstance().handleExpiration();
      }

      throw new Error(errorData.message || "API request failed");
    } catch (e) {
      // If parsing JSON fails, use text instead
      const errorText = await response.text();
      console.error(`HTTP error ${response.status}:`, errorText);

      // Also check for 401 status code here
      if (response.status === 401) {
        TokenExpirationHandler.getInstance().handleExpiration();
      }

      throw new Error(errorText || `HTTP error ${response.status}`);
    }
  }

  try {
    const data = await response.json();
    return data;
  } catch (e) {
    console.error("Failed to parse JSON response:", e);
    throw new Error("Failed to parse API response");
  }
};

// Helper function to parse API response
const parseResponseBody = <T>(data: any): T | null => {
  // If the body is a string, try to parse it
  if (data.body && typeof data.body === "string") {
    try {
      return JSON.parse(data.body);
    } catch (e) {
      console.error("Error parsing response body:", e);
      return null;
    }
  }

  // If data is already the expected format
  return data as T;
};

// Define response types to fix typing issues
interface IngredientsResponse {
  ingredients: Ingredient[];
}

interface IngredientResponse {
  ingredient: Ingredient;
}

interface MealsResponse {
  meals: Meal[];
}

interface MealResponse {
  meal: Meal;
}

interface ShoppingListsResponse {
  shoppingLists: ShoppingList[];
}

interface ShoppingListResponse {
  shoppingList: ShoppingList;
}

// Types for shares
interface ShareResponse {
  shares: Share[];
  count: number;
}

interface Share {
  shareId: string;
  listId: string;
  userId: string;
  userEmail?: string;
  createdBy: string;
  createdAt: string;
}

// Ingredients API
export const getIngredients = async (): Promise<Ingredient[]> => {
  try {
    const response = await fetch(`${API_URL}/ingredients`, {
      method: "GET",
      headers: getHeaders(),
    });

    const data = await handleResponse(response);
    console.log("API Response for getIngredients:", data);

    const parsedData = parseResponseBody<IngredientsResponse>(data);
    if (parsedData && parsedData.ingredients) {
      return parsedData.ingredients;
    }

    // Fallback to the original format
    return (data as any).ingredients || [];
  } catch (error) {
    console.error("Error fetching ingredients:", error);
    throw error;
  }
};

export const addIngredient = async (
  ingredientName: string,
): Promise<Ingredient> => {
  try {
    const response = await fetch(`${API_URL}/ingredients`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ ingredientName }),
    });

    const data = await handleResponse(response);
    console.log("API Response for addIngredient:", data);

    const parsedData = parseResponseBody<IngredientResponse>(data);
    if (parsedData && parsedData.ingredient) {
      return parsedData.ingredient;
    }

    // Fallback to previous checks
    if ((data as any).ingredient) {
      return (data as any).ingredient;
    } else if (data && typeof data === "object" && "ingredientId" in data) {
      return data as Ingredient;
    } else {
      throw new Error("Unexpected API response format");
    }
  } catch (error) {
    console.error("Error adding ingredient:", error);
    throw error;
  }
};

// Meals API
export const getMeals = async (): Promise<Meal[]> => {
  try {
    const response = await fetch(`${API_URL}/meals`, {
      method: "GET",
      headers: getHeaders(),
    });

    const data = await handleResponse(response);
    console.log("API Response for getMeals:", data);

    const parsedData = parseResponseBody<MealsResponse>(data);
    if (parsedData && parsedData.meals) {
      return parsedData.meals;
    }

    // Fallback to the original format
    return (data as any).meals || [];
  } catch (error) {
    console.error("Error fetching meals:", error);
    throw error;
  }
};

export const addMeal = async (
  mealName: string,
  ingredients: string[],
): Promise<Meal> => {
  try {
    const response = await fetch(`${API_URL}/meals`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ mealName, ingredients }),
    });

    const data = await handleResponse(response);
    console.log("API Response for addMeal:", data);

    const parsedData = parseResponseBody<MealResponse>(data);
    if (parsedData && parsedData.meal) {
      return parsedData.meal;
    }

    // Fallback
    if ((data as any).meal) {
      return (data as any).meal;
    } else {
      throw new Error("Unexpected API response format");
    }
  } catch (error) {
    console.error("Error adding meal:", error);
    throw error;
  }
};

export const updateMeal = async (
  mealId: string,
  mealName: string,
  ingredients: string[],
): Promise<Meal> => {
  try {
    const response = await fetch(`${API_URL}/meals/${mealId}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify({ mealName, ingredients }),
    });

    const data = await handleResponse(response);
    console.log("API Response for updateMeal:", data);

    const parsedData = parseResponseBody<MealResponse>(data);
    if (parsedData && parsedData.meal) {
      return parsedData.meal;
    }

    // Fallback
    if ((data as any).meal) {
      return (data as any).meal;
    } else {
      throw new Error("Unexpected API response format");
    }
  } catch (error) {
    console.error("Error updating meal:", error);
    throw error;
  }
};

// Shopping Lists API
export const getShoppingLists = async (): Promise<ShoppingList[]> => {
  try {
    const response = await fetch(`${API_URL}/shoppingLists`, {
      method: "GET",
      headers: getHeaders(),
    });

    const data = await handleResponse(response);
    console.log("API Response for getShoppingLists:", data);

    const parsedData = parseResponseBody<ShoppingListsResponse>(data);
    if (parsedData && parsedData.shoppingLists) {
      return parsedData.shoppingLists;
    }

    // Fallback
    return (data as any).shoppingLists || [];
  } catch (error) {
    console.error("Error fetching shopping lists:", error);
    throw error;
  }
};

export const addShoppingList = async (
  name: string,
  meals: string[],
): Promise<ShoppingList> => {
  try {
    const response = await fetch(`${API_URL}/shoppingLists`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ name, mealIds: meals }),
    });

    const data = await handleResponse(response);
    console.log("API Response for addShoppingList:", data);

    const parsedData = parseResponseBody<ShoppingListResponse>(data);
    if (parsedData && parsedData.shoppingList) {
      return parsedData.shoppingList;
    }

    // Fallback
    if ((data as any).shoppingList) {
      return (data as any).shoppingList;
    } else {
      throw new Error("Unexpected API response format");
    }
  } catch (error) {
    console.error("Error adding shopping list:", error);
    throw error;
  }
};

export const updateShoppingList = async (
  listId: string,
  removeIngredientIds: string[] = [],
  addIngredientIds: string[] = [],
  tickedIngredientIds?: string[],
): Promise<ShoppingList> => {
  try {
    const response = await fetch(`${API_URL}/shoppingLists/${listId}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify({
        removeIngredientIds,
        addIngredientIds,
        ...(tickedIngredientIds !== undefined && { tickedIngredientIds }),
      }),
    });

    const data = await handleResponse(response);
    console.log("API Response for updateShoppingList:", data);

    const parsedData = parseResponseBody<ShoppingListResponse>(data);
    if (parsedData && parsedData.shoppingList) {
      return parsedData.shoppingList;
    }

    // Fallback
    if ((data as any).shoppingList) {
      return (data as any).shoppingList;
    } else {
      throw new Error("Unexpected API response format");
    }
  } catch (error) {
    console.error("Error updating shopping list:", error);
    throw error;
  }
};

export const deleteShoppingList = async (
  listId: string,
): Promise<{ listId: string }> => {
  try {
    const response = await fetch(`${API_URL}/shoppingLists/${listId}`, {
      method: "DELETE",
      headers: getHeaders(),
    });

    const data = await handleResponse(response);
    console.log("API Response for deleteShoppingList:", data);

    return { listId };
  } catch (error) {
    console.error("Error deleting shopping list:", error);
    throw error;
  }
};

// Shares API
export const getShares = async (listId?: string): Promise<Share[]> => {
  try {
    const url = listId
      ? `${API_URL}/share?listId=${encodeURIComponent(listId)}`
      : `${API_URL}/share`;

    const response = await fetch(url, {
      method: "GET",
      headers: getHeaders(),
    });

    const data = await handleResponse(response);
    console.log("API Response for getShares:", data);

    const parsedData = parseResponseBody<ShareResponse>(data);
    if (parsedData && parsedData.shares) {
      return parsedData.shares;
    }

    // Fallback
    return (data as any).shares || [];
  } catch (error) {
    console.error("Error fetching shares:", error);
    throw error;
  }
};

export const addShare = async (
  listId: string,
  email: string,
): Promise<Share> => {
  try {
    const response = await fetch(`${API_URL}/share`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ listId, email }),
    });

    const data = await handleResponse(response);
    console.log("API Response for addShare:", data);

    // The API returns the share object directly in the response
    if (data && data.share) {
      return data.share;
    }

    throw new Error("Unexpected API response format");
  } catch (error) {
    console.error("Error adding share:", error);
    throw error;
  }
};

export const deleteShare = async (
  shareId: string,
): Promise<{ shareId: string }> => {
  try {
    const response = await fetch(`${API_URL}/share/${shareId}`, {
      method: "DELETE",
      headers: getHeaders(),
    });

    const data = await handleResponse(response);
    console.log("API Response for deleteShare:", data);

    return { shareId };
  } catch (error) {
    console.error("Error deleting share:", error);
    throw error;
  }
};

export const getSharedShoppingLists = async (): Promise<ShoppingList[]> => {
  try {
    const response = await fetch(`${API_URL}/share/shoppingLists`, {
      method: "GET",
      headers: getHeaders(),
    });

    const data = await handleResponse(response);
    console.log("API Response for getSharedShoppingLists:", data);

    // The API returns shopping lists with the same structure as the regular shopping lists
    // but with additional properties like isShared
    if (data && data.shoppingLists) {
      return data.shoppingLists;
    }

    return [];
  } catch (error) {
    console.error("Error fetching shared shopping lists:", error);
    throw error;
  }
};
