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
  List,
  ListItem,
  ListItemSecondaryAction,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  addIngredient,
  deleteShare,
  deleteShoppingList,
  getIngredients,
  getMeals,
  getShares,
  getSharedShoppingLists,
  getShoppingLists,
  addShare,
  updateShoppingList,
} from "../../services/apiService";
import { Ingredient, Meal, ShoppingList, Share } from "../../types";
import ShoppingBasketIcon from "@mui/icons-material/ShoppingBasket";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import ListAltIcon from "@mui/icons-material/ListAlt";
import CloseIcon from "@mui/icons-material/Close";
import AddIcon from "@mui/icons-material/Add";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import DeleteIcon from "@mui/icons-material/Delete";
import ShareIcon from "@mui/icons-material/Share";
import PersonIcon from "@mui/icons-material/Person";

const ShoppingListsPage = () => {
  const [shoppingLists, setShoppingLists] = useState<ShoppingList[]>([]);
  const [sharedLists, setSharedLists] = useState<ShoppingList[]>([]);
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
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [activeListId, setActiveListId] = useState<string | null>(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareEmail, setShareEmail] = useState("");
  const [shares, setShares] = useState<Share[]>([]);
  const [sharesLoading, setSharesLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [shoppingListsData, mealsData, ingredientsData, sharedListsData] =
        await Promise.all([
          getShoppingLists(),
          getMeals(),
          getIngredients(),
          getSharedShoppingLists(),
        ]);

      const mealsMap = new Map<string, Meal>();
      mealsData.forEach((meal) => mealsMap.set(meal.mealId, meal));

      const ingredientsMap = new Map<string, Ingredient>();
      ingredientsData.forEach((ingredient) =>
        ingredientsMap.set(ingredient.ingredientId, ingredient),
      );

      setShoppingLists(shoppingListsData);
      setSharedLists(sharedListsData);
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

  const handleMenuOpen = (
    event: React.MouseEvent<HTMLElement>,
    listId: string,
  ) => {
    setMenuAnchorEl(event.currentTarget);
    setActiveListId(listId);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setActiveListId(null);
  };

  const handleDeleteList = async () => {
    if (!activeListId) return;

    try {
      setUpdatingListId(activeListId);
      await deleteShoppingList(activeListId);

      setShoppingLists((prevLists) =>
        prevLists.filter((list) => list.listId !== activeListId),
      );

      handleMenuClose();
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
    isShared: boolean = false,
  ) => {
    try {
      setUpdatingListId(listId);

      // For shared lists, only update local state without API call
      if (isShared) {
        setSharedLists((prevLists) =>
          prevLists.map((list) => {
            if (list.listId === listId) {
              const currentTickedIngredients = list.tickedIngredients || [];
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

              return {
                ...list,
                tickedIngredients: newTickedIngredients,
              };
            }
            return list;
          }),
        );
        setUpdatingListId(null);
        return;
      }

      // Original behavior for non-shared lists
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

  const handleShareClick = async (listId: string) => {
    setActiveListId(listId);
    setShareDialogOpen(true);
    setShareEmail("");
    setSharesLoading(true);

    try {
      const sharesData = await getShares(listId);
      setShares(sharesData);
    } catch (err) {
      console.error("Error fetching shares:", err);
      setError("Failed to load shares. Please try again later.");
    } finally {
      setSharesLoading(false);
    }
  };

  const handleShareDialogClose = () => {
    setShareDialogOpen(false);
    setActiveListId(null);
    setShares([]);
  };

  const handleAddShareSubmit = async () => {
    if (!activeListId || !shareEmail.trim()) return;

    try {
      setSharesLoading(true);
      await addShare(activeListId, shareEmail.trim());

      // Refresh shares list
      const sharesData = await getShares(activeListId);
      setShares(sharesData);

      // Clear the email input
      setShareEmail("");
    } catch (err) {
      console.error("Error sharing shopping list:", err);
      setError("Failed to share shopping list. Please try again later.");
    } finally {
      setSharesLoading(false);
    }
  };

  const handleDeleteShare = async (shareId: string) => {
    if (!activeListId) return;

    try {
      setSharesLoading(true);
      await deleteShare(shareId);

      // Update shares list
      setShares((prevShares) =>
        prevShares.filter((share) => share.shareId !== shareId),
      );
    } catch (err) {
      console.error("Error removing share:", err);
      setError("Failed to remove share. Please try again later.");
    } finally {
      setSharesLoading(false);
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

  if (shoppingLists.length === 0 && sharedLists.length === 0) {
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

  const renderShoppingList = (
    shoppingList: ShoppingList,
    isShared: boolean = false,
  ) => {
    const listId = shoppingList.listId;
    const isUpdating = updatingListId === listId;
    const newIngredientValue = newIngredientInputs[listId] || "";

    // Use different ingredient data based on whether it's a shared list
    let ingredientItems;
    if (isShared && shoppingList.ingredientNames) {
      ingredientItems = shoppingList.ingredientNames;
    } else {
      ingredientItems = getIngredientItems(shoppingList);
    }

    return (
      <Grid key={listId} sx={{ width: { xs: "100%", md: "50%" } }}>
        <Card>
          <CardContent>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                mb: 2,
                justifyContent: "space-between",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <ShoppingBasketIcon sx={{ mr: 1 }} color="primary" />
                <Typography variant="h6" component="h2">
                  {shoppingList.name}
                  {isShared && (
                    <Typography
                      component="span"
                      sx={{
                        ml: 1,
                        fontSize: "0.8rem",
                        color: "text.secondary",
                        backgroundColor: "action.selected",
                        borderRadius: 1,
                        px: 1,
                        py: 0.5,
                      }}
                    >
                      Shared with you
                    </Typography>
                  )}
                </Typography>
              </Box>
              {!isShared && (
                <Box>
                  <IconButton
                    aria-label="share list"
                    onClick={() => handleShareClick(listId)}
                    disabled={isUpdating}
                    sx={{ mr: 1 }}
                  >
                    <ShareIcon />
                  </IconButton>
                  <IconButton
                    aria-label="more options"
                    onClick={(e) => handleMenuOpen(e, listId)}
                    disabled={isUpdating}
                  >
                    <MoreVertIcon />
                  </IconButton>
                </Box>
              )}
            </Box>

            <Typography variant="body2" color="text.secondary" gutterBottom>
              Created: {new Date(shoppingList.createdAt || "").toLocaleString()}
            </Typography>

            <Divider sx={{ my: 2 }} />

            <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
              <RestaurantIcon sx={{ mr: 1 }} fontSize="small" />
              <Typography variant="subtitle2">Meals:</Typography>
            </Box>

            <Typography variant="body2" paragraph>
              {isShared && shoppingList.mealNames
                ? shoppingList.mealNames.join(", ")
                : getMealNames(shoppingList)}
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
                            isShared,
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
                          color: isIngredientTicked(shoppingList, ingredient.id)
                            ? "text.secondary"
                            : "text.primary",
                        }}
                      >
                        {ingredient.name}
                      </Typography>
                    </Box>
                    {!isShared && (
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
                    )}
                  </Stack>
                ))}
              </Box>
            ) : (
              <Typography variant="body2" sx={{ fontStyle: "italic" }}>
                No ingredients in this shopping list
              </Typography>
            )}

            {!isShared && (
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
            )}

            {isUpdating && (
              <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
                <CircularProgress size={24} />
              </Box>
            )}
          </CardContent>
        </Card>
      </Grid>
    );
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Your Shopping Lists
      </Typography>

      <Grid container spacing={3}>
        {shoppingLists.map((shoppingList) => renderShoppingList(shoppingList))}
      </Grid>

      {sharedLists.length > 0 && (
        <>
          <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 4 }}>
            Shared With You
          </Typography>
          <Grid container spacing={3}>
            {sharedLists.map((shoppingList) =>
              renderShoppingList(shoppingList, true),
            )}
          </Grid>
        </>
      )}

      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem
          onClick={handleDeleteList}
          disabled={updatingListId === activeListId}
          sx={{ color: "error.main" }}
        >
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Delete List
        </MenuItem>
      </Menu>

      <Dialog
        open={shareDialogOpen}
        onClose={handleShareDialogClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Share Shopping List</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Enter the email address of the user you want to share this shopping
            list with.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Email Address"
            type="email"
            fullWidth
            variant="outlined"
            value={shareEmail}
            onChange={(e) => setShareEmail(e.target.value)}
            disabled={sharesLoading}
          />
          <Button
            variant="contained"
            color="primary"
            onClick={handleAddShareSubmit}
            disabled={sharesLoading || !shareEmail.trim()}
            sx={{ mt: 2 }}
          >
            Share
          </Button>

          {sharesLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", my: 2 }}>
              <CircularProgress size={24} />
            </Box>
          ) : shares.length > 0 ? (
            <>
              <Typography variant="subtitle1" sx={{ mt: 3, mb: 1 }}>
                Currently Shared With:
              </Typography>
              <List>
                {shares.map((share) => (
                  <ListItem key={share.shareId}>
                    <PersonIcon sx={{ mr: 1, color: "text.secondary" }} />
                    <ListItemText primary={share.userEmail} />
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        aria-label="delete"
                        onClick={() => handleDeleteShare(share.shareId)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            </>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleShareDialogClose}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ShoppingListsPage;
