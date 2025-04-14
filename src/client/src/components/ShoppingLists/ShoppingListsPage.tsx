import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  Grid,
  Typography
} from '@mui/material';
import { getIngredients, getMeals, getShoppingLists } from '../../services/apiService';
import { Ingredient, Meal, ShoppingList } from '../../types';
import ShoppingBasketIcon from '@mui/icons-material/ShoppingBasket';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import ListAltIcon from '@mui/icons-material/ListAlt';

const ShoppingListsPage = () => {
  const [shoppingLists, setShoppingLists] = useState<ShoppingList[]>([]);
  const [meals, setMeals] = useState<Map<string, Meal>>(new Map());
  const [ingredients, setIngredients] = useState<Map<string, Ingredient>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch all data in parallel
      const [shoppingListsData, mealsData, ingredientsData] = await Promise.all([
        getShoppingLists(),
        getMeals(),
        getIngredients()
      ]);
      
      // Convert meals and ingredients to maps for easy lookup
      const mealsMap = new Map<string, Meal>();
      mealsData.forEach(meal => mealsMap.set(meal.mealId, meal));
      
      const ingredientsMap = new Map<string, Ingredient>();
      ingredientsData.forEach(ingredient => ingredientsMap.set(ingredient.ingredientId, ingredient));
      
      console.log('Fetched shopping lists:', shoppingListsData);
      console.log('Fetched meals:', mealsData);
      console.log('Fetched ingredients:', ingredientsData);
      
      setShoppingLists(shoppingListsData);
      setMeals(mealsMap);
      setIngredients(ingredientsMap);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load shopping lists. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Function to get meal names from meal IDs
  const getMealNames = (shoppingList: ShoppingList) => {
    // Use either mealIds or meals property, whichever is available
    const mealIds = shoppingList.mealIds || shoppingList.meals || [];
    
    if (!Array.isArray(mealIds)) {
      console.error('Invalid mealIds:', mealIds);
      return 'No meals';
    }
    
    return mealIds
      .map(id => meals.get(id)?.mealName || 'Unknown Meal')
      .join(', ');
  };

  // Function to get all ingredient IDs from meals in a shopping list
  const getAllIngredientIds = (shoppingList: ShoppingList): string[] => {
    // Use either mealIds or meals property, whichever is available
    const mealIds = shoppingList.mealIds || shoppingList.meals || [];
    
    if (!Array.isArray(mealIds)) {
      return [];
    }
    
    // Collect all ingredient IDs from all meals
    const allIngredientIds: string[] = [];
    
    mealIds.forEach(mealId => {
      const meal = meals.get(mealId);
      if (meal && Array.isArray(meal.ingredients)) {
        allIngredientIds.push(...meal.ingredients);
      }
    });
    
    return allIngredientIds;
  };

  // Function to get ingredient names from ingredient IDs
  const getIngredientItems = (ingredientIds: string[] = []) => {
    if (!Array.isArray(ingredientIds)) {
      console.error('Invalid ingredientIds:', ingredientIds);
      return [];
    }
    
    return ingredientIds
      .map(id => ingredients.get(id)?.ingredientName || 'Unknown Ingredient');
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        {error}
      </Alert>
    );
  }

  if (shoppingLists.length === 0) {
    return (
      <Box>
        <Typography variant="h4" component="h1" gutterBottom>
          Your Shopping Lists
        </Typography>
        <Card sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1">
            You don't have any shopping lists yet. Create one from the Meals page!
          </Typography>
        </Card>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Your Shopping Lists
      </Typography>
      
      <Grid container spacing={3}>
        {shoppingLists.map((shoppingList) => {
          // Get all ingredient IDs from the meals in this shopping list
          const allIngredientIds = getAllIngredientIds(shoppingList);
          
          return (
            <Grid key={shoppingList.listId || shoppingList.shoppingListId} sx={{ gridColumn: { xs: 'span 12', md: 'span 6' } }}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <ShoppingBasketIcon sx={{ mr: 1 }} color="primary" />
                    <Typography variant="h6" component="h2">
                      {shoppingList.name || `Shopping List ${new Date(shoppingList.createdAt || '').toLocaleDateString()}`}
                    </Typography>
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Created: {new Date(shoppingList.createdAt || '').toLocaleString()}
                  </Typography>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <RestaurantIcon sx={{ mr: 1 }} fontSize="small" />
                    <Typography variant="subtitle2">
                      Meals:
                    </Typography>
                  </Box>
                  
                  <Typography variant="body2" paragraph>
                    {getMealNames(shoppingList)}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <ListAltIcon sx={{ mr: 1 }} fontSize="small" />
                    <Typography variant="subtitle2">
                      Shopping List:
                    </Typography>
                  </Box>
                  
                  <Box component="ul" sx={{ pl: 2, mt: 0 }}>
                    {getIngredientItems(allIngredientIds).map((ingredient, index) => (
                      <Typography key={index} component="li" variant="body2">
                        {ingredient}
                      </Typography>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
};

export default ShoppingListsPage; 