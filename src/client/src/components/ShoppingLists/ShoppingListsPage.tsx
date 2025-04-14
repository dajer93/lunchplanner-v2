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
  const getMealNames = (mealIds: string[]) => {
    return mealIds
      .map(id => meals.get(id)?.mealName || 'Unknown Meal')
      .join(', ');
  };

  // Function to get ingredient names from ingredient IDs
  const getIngredientItems = (ingredientIds: string[]) => {
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
        {shoppingLists.map((shoppingList) => (
          <Grid key={shoppingList.shoppingListId} sx={{ gridColumn: { xs: 'span 12', md: 'span 6' } }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <ShoppingBasketIcon sx={{ mr: 1 }} color="primary" />
                  <Typography variant="h6" component="h2">
                    {shoppingList.name}
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
                  {getMealNames(shoppingList.meals)}
                </Typography>
                
                <Typography variant="subtitle2" gutterBottom>
                  Ingredients:
                </Typography>
                
                <Box component="ul" sx={{ pl: 2, mt: 0 }}>
                  {getIngredientItems(shoppingList.ingredients).map((ingredient, index) => (
                    <Typography key={index} component="li" variant="body2">
                      {ingredient}
                    </Typography>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default ShoppingListsPage; 