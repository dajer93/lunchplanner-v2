import { Ingredient, Meal, ShoppingList } from '../types';
import { getAuthToken } from './authService';

const API_URL = 'https://evplabpje9.execute-api.eu-central-1.amazonaws.com/dev';

const getHeaders = () => {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
  };
};

const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || 'API request failed');
  }
  return response.json();
};

// Ingredients API
export const getIngredients = async (): Promise<Ingredient[]> => {
  const response = await fetch(`${API_URL}/ingredients`, {
    method: 'GET',
    headers: getHeaders(),
  });
  
  const data = await handleResponse(response);
  return data.ingredients || [];
};

export const addIngredient = async (ingredientName: string): Promise<Ingredient> => {
  const response = await fetch(`${API_URL}/ingredients`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ ingredientName }),
  });
  
  const data = await handleResponse(response);
  return data.ingredient;
};

// Meals API
export const getMeals = async (): Promise<Meal[]> => {
  const response = await fetch(`${API_URL}/meals`, {
    method: 'GET',
    headers: getHeaders(),
  });
  
  const data = await handleResponse(response);
  return data.meals || [];
};

export const addMeal = async (mealName: string, ingredients: string[]): Promise<Meal> => {
  const response = await fetch(`${API_URL}/meals`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ mealName, ingredients }),
  });
  
  const data = await handleResponse(response);
  return data.meal;
};

// Shopping Lists API
export const getShoppingLists = async (): Promise<ShoppingList[]> => {
  const response = await fetch(`${API_URL}/shoppingLists`, {
    method: 'GET',
    headers: getHeaders(),
  });
  
  const data = await handleResponse(response);
  return data.shoppingLists || [];
};

export const addShoppingList = async (name: string, meals: string[]): Promise<ShoppingList> => {
  const response = await fetch(`${API_URL}/shoppingLists`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ name, meals }),
  });
  
  const data = await handleResponse(response);
  return data.shoppingList;
}; 