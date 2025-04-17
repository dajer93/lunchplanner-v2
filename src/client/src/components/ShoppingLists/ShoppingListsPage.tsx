import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  Grid,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import {
  getIngredients,
  getMeals,
  getShoppingLists,
  updateShoppingList,
} from "../../services/apiService";
import { Ingredient, Meal, ShoppingList } from "../../types";
import ShoppingBasketIcon from "@mui/icons-material/ShoppingBasket";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import ListAltIcon from "@mui/icons-material/ListAlt";
import CloseIcon from "@mui/icons-material/Close";

const ShoppingListsPage = () => {
  const [shoppingLists, setShoppingLists] = useState<ShoppingList[]>([]);
  const [meals, setMeals] = useState<Map<string, Meal>>(new Map());
  const [ingredients, setIngredients] = useState<Map<string, Ingredient>>(
    new Map(),
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingListId, setUpdatingListId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch all data in parallel
      const [shoppingListsData, mealsData, ingredientsData] = await Promise.all(
        [getShoppingLists(), getMeals(), getIngredients()],
      );

      // Convert meals and ingredients to maps for easy lookup
      const mealsMap = new Map<string, Meal>();
      mealsData.forEach((meal) => mealsMap.set(meal.mealId, meal));

      const ingredientsMap = new Map<string, Ingredient>();
      ingredientsData.forEach((ingredient) =>
        ingredientsMap.set(ingredient.ingredientId, ingredient),
      );

      console.log("Fetched shopping lists:", shoppingListsData);
      console.log("Fetched meals:", mealsData);
      console.log("Fetched ingredients:", ingredientsData);

      setShoppingLists(shoppingListsData);
      setMeals(mealsMap);
      setIngredients(ingredientsMap);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to load shopping lists. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // Function to get meal names from meal IDs
  const getMealNames = (shoppingList: ShoppingList) => {
    if (!Array.isArray(shoppingList.mealIds)) {
      console.error("Invalid mealIds:", shoppingList.mealIds);
      return "No meals";
    }

    return shoppingList.mealIds
      .map((id) => meals.get(id)?.mealName || "Unknown Meal")
      .join(", ");
  };

  // Function to get ingredient names and IDs
  const getIngredientItems = (shoppingList: ShoppingList) => {
    if (!Array.isArray(shoppingList.ingredientIds)) {
      return [];
    }

    return shoppingList.ingredientIds.map((id) => ({
      id,
      name: ingredients.get(id)?.ingredientName || "Unknown Ingredient",
    }));
  };

  // Function to handle ingredient removal from a shopping list
  const handleRemoveIngredient = async (
    listId: string,
    ingredientId: string,
  ) => {
    try {
      setUpdatingListId(listId);

      // Call the API to update the shopping list by removing the ingredient
      const updatedList = await updateShoppingList(listId, [ingredientId]);

      // Update the local state to reflect the change
      setShoppingLists((prevLists) =>
        prevLists.map((list) => (list.listId === listId ? updatedList : list)),
      );
    } catch (err) {
      console.error("Error removing ingredient from shopping list:", err);
      setError("Failed to update shopping list. Please try again later.");
    } finally {
      setUpdatingListId(null);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
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
        <Card sx={{ p: 3, textAlign: "center" }}>
          <Typography variant="body1">
            You don't have any shopping lists yet. Create one from the Meals
            page!
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
          const listId = shoppingList.listId;
          const ingredientItems = getIngredientItems(shoppingList);
          const isUpdating = updatingListId === listId;

          return (
            <Grid key={listId} sx={{ width: { xs: "100%", md: "50%" } }}>
              <Card>
                <CardContent>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                    <ShoppingBasketIcon sx={{ mr: 1 }} color="primary" />
                    <Typography variant="h6" component="h2">
                      {shoppingList.name}
                    </Typography>
                  </Box>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    gutterBottom
                  >
                    Created:{" "}
                    {new Date(shoppingList.createdAt || "").toLocaleString()}
                  </Typography>

                  <Divider sx={{ my: 2 }} />

                  <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                    <RestaurantIcon sx={{ mr: 1 }} fontSize="small" />
                    <Typography variant="subtitle2">Meals:</Typography>
                  </Box>

                  <Typography variant="body2" paragraph>
                    {getMealNames(shoppingList)}
                  </Typography>

                  <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                    <ListAltIcon sx={{ mr: 1 }} fontSize="small" />
                    <Typography variant="subtitle2">Shopping List:</Typography>
                  </Box>

                  {ingredientItems.length > 0 ? (
                    <Box>
                      {ingredientItems.map((ingredient) => (
                        <Stack
                          key={ingredient.id}
                          direction="row"
                          alignItems="center"
                          justifyContent="space-between"
                          sx={{ mb: 0.5 }}
                        >
                          <Typography variant="body2">
                            {ingredient.name}
                          </Typography>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() =>
                              handleRemoveIngredient(listId, ingredient.id)
                            }
                            disabled={isUpdating}
                          >
                            <CloseIcon fontSize="small" />
                          </IconButton>
                        </Stack>
                      ))}
                    </Box>
                  ) : (
                    <Typography variant="body2" sx={{ fontStyle: "italic" }}>
                      No ingredients in this shopping list
                    </Typography>
                  )}

                  {isUpdating && (
                    <Box
                      sx={{ display: "flex", justifyContent: "center", mt: 2 }}
                    >
                      <CircularProgress size={24} />
                    </Box>
                  )}
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
