import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  addIngredient,
  deleteShoppingList,
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
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";

const ShoppingListsPage = () => {
  const [shoppingLists, setShoppingLists] = useState<ShoppingList[]>([]);
  const [meals, setMeals] = useState<Map<string, Meal>>(new Map());
  const [ingredients, setIngredients] = useState<Map<string, Ingredient>>(
    new Map(),
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingListId, setUpdatingListId] = useState<string | null>(null);
  const [newIngredientInputs, setNewIngredientInputs] = useState<{
    [key: string]: string;
  }>({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [listToDelete, setListToDelete] = useState<ShoppingList | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [shoppingListsData, mealsData, ingredientsData] = await Promise.all(
        [getShoppingLists(), getMeals(), getIngredients()],
      );

      const mealsMap = new Map<string, Meal>();
      mealsData.forEach((meal) => mealsMap.set(meal.mealId, meal));

      const ingredientsMap = new Map<string, Ingredient>();
      ingredientsData.forEach((ingredient) =>
        ingredientsMap.set(ingredient.ingredientId, ingredient),
      );

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

  const getMealNames = (shoppingList: ShoppingList) => {
    if (!Array.isArray(shoppingList.mealIds)) {
      console.error("Invalid mealIds:", shoppingList.mealIds);
      return "No meals";
    }

    return shoppingList.mealIds
      .map((id) => meals.get(id)?.mealName || "Unknown Meal")
      .join(", ");
  };

  const getIngredientItems = (shoppingList: ShoppingList) => {
    if (!Array.isArray(shoppingList.ingredientIds)) {
      return [];
    }

    return shoppingList.ingredientIds.map((id) => ({
      id,
      name: ingredients.get(id)?.ingredientName || "Unknown Ingredient",
    }));
  };

  const handleRemoveIngredient = async (
    listId: string,
    ingredientId: string,
  ) => {
    try {
      setUpdatingListId(listId);

      const updatedList = await updateShoppingList(listId, [ingredientId]);

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

  const handleIngredientInputChange = (listId: string, value: string) => {
    setNewIngredientInputs((prev) => ({
      ...prev,
      [listId]: value,
    }));
  };

  const handleAddIngredient = async (listId: string) => {
    const ingredientName = newIngredientInputs[listId]?.trim();
    if (!listId || !ingredientName) return;

    try {
      setUpdatingListId(listId);

      const newIngredient = await addIngredient(ingredientName);
      const updatedList = await updateShoppingList(
        listId,
        [],
        [newIngredient.ingredientId],
      );

      setShoppingLists((prevLists) =>
        prevLists.map((list) => (list.listId === listId ? updatedList : list)),
      );

      setIngredients((prevMap) => {
        const newMap = new Map(prevMap);
        newMap.set(newIngredient.ingredientId, newIngredient);
        return newMap;
      });

      setNewIngredientInputs((prev) => ({
        ...prev,
        [listId]: "",
      }));
    } catch (err) {
      console.error("Error adding ingredient to shopping list:", err);
      setError("Failed to add ingredient. Please try again later.");
    } finally {
      setUpdatingListId(null);
    }
  };

  const openDeleteDialog = (shoppingList: ShoppingList) => {
    setListToDelete(shoppingList);
    setDeleteDialogOpen(true);
  };

  const handleDeleteList = async () => {
    if (!listToDelete) return;

    try {
      setUpdatingListId(listToDelete.listId);
      await deleteShoppingList(listToDelete.listId);

      setShoppingLists((prevLists) =>
        prevLists.filter((list) => list.listId !== listToDelete.listId),
      );

      setDeleteDialogOpen(false);
      setListToDelete(null);
    } catch (err) {
      console.error("Error deleting shopping list:", err);
      setError("Failed to delete shopping list. Please try again later.");
    } finally {
      setUpdatingListId(null);
    }
  };

  const isIngredientTicked = (
    shoppingList: ShoppingList,
    ingredientId: string,
  ): boolean => {
    return Boolean(shoppingList.tickedIngredients?.includes(ingredientId));
  };

  const handleIngredientToggle = async (
    listId: string,
    ingredientId: string,
    checked: boolean,
  ) => {
    try {
      setUpdatingListId(listId);

      const currentList = shoppingLists.find((list) => list.listId === listId);
      if (!currentList) return;

      const currentTickedIngredients = currentList.tickedIngredients || [];

      let newTickedIngredients: string[];
      if (checked) {
        newTickedIngredients = [
          ...currentTickedIngredients,
          ingredientId,
        ].filter((id, index, self) => self.indexOf(id) === index);
      } else {
        newTickedIngredients = currentTickedIngredients.filter(
          (id) => id !== ingredientId,
        );
      }

      const updatedList = await updateShoppingList(
        listId,
        [], // No ingredients to remove
        [], // No ingredients to add
        newTickedIngredients,
      );

      setShoppingLists((prevLists) =>
        prevLists.map((list) => (list.listId === listId ? updatedList : list)),
      );
    } catch (err) {
      console.error("Error updating ticked ingredients:", err);
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
          const newIngredientValue = newIngredientInputs[listId] || "";

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
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              flex: 1,
                            }}
                          >
                            <Checkbox
                              checked={isIngredientTicked(
                                shoppingList,
                                ingredient.id,
                              )}
                              onChange={(e) =>
                                handleIngredientToggle(
                                  listId,
                                  ingredient.id,
                                  e.target.checked,
                                )
                              }
                              disabled={isUpdating}
                              size="small"
                            />
                            <Typography
                              variant="body2"
                              sx={{
                                textDecoration: isIngredientTicked(
                                  shoppingList,
                                  ingredient.id,
                                )
                                  ? "line-through"
                                  : "none",
                                color: isIngredientTicked(
                                  shoppingList,
                                  ingredient.id,
                                )
                                  ? "text.secondary"
                                  : "text.primary",
                              }}
                            >
                              {ingredient.name}
                            </Typography>
                          </Box>
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

                  <Box sx={{ mt: 2, display: "flex", alignItems: "center" }}>
                    <TextField
                      placeholder="Add new ingredient"
                      fullWidth
                      value={newIngredientValue}
                      onChange={(e) =>
                        handleIngredientInputChange(listId, e.target.value)
                      }
                      disabled={isUpdating}
                      sx={{
                        mr: 1,
                        "& .MuiInputBase-root": {
                          height: 36.5,
                        },
                        "& .MuiOutlinedInput-input": {
                          padding: "8px 14px",
                        },
                      }}
                      size="small"
                    />
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<AddIcon />}
                      onClick={() => handleAddIngredient(listId)}
                      disabled={isUpdating || !newIngredientValue.trim()}
                      sx={{ height: 36.5 }}
                    >
                      Add
                    </Button>
                  </Box>

                  <Box
                    sx={{ mt: 2, display: "flex", justifyContent: "flex-end" }}
                  >
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<DeleteIcon />}
                      onClick={() => openDeleteDialog(shoppingList)}
                      disabled={isUpdating}
                    >
                      Delete List
                    </Button>
                  </Box>

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

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">Delete Shopping List</DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            Are you sure you want to delete this shopping list? This action
            cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            disabled={updatingListId === listToDelete?.listId}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteList}
            color="error"
            disabled={updatingListId === listToDelete?.listId}
            autoFocus
          >
            {updatingListId === listToDelete?.listId ? (
              <CircularProgress size={24} />
            ) : (
              "Delete"
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ShoppingListsPage;
