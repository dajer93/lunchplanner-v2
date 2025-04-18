import { FormEvent, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemText,
  TextField,
  Typography,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import {
  addIngredient,
  getIngredients,
  updateMeal,
} from "../../services/apiService";
import { Ingredient, Meal } from "../../types";

interface EditMealDialogProps {
  open: boolean;
  meal: Meal | null;
  onClose: (mealUpdated: boolean) => void;
}

const EditMealDialog = ({ open, meal, onClose }: EditMealDialogProps) => {
  const [mealName, setMealName] = useState("");
  const [currentIngredient, setCurrentIngredient] = useState("");
  const [selectedIngredientIds, setSelectedIngredientIds] = useState<string[]>(
    [],
  );
  const [allIngredients, setAllIngredients] = useState<Ingredient[]>([]);
  const [selectedIngredients, setSelectedIngredients] = useState<Ingredient[]>(
    [],
  );
  const [loading, setLoading] = useState(false);
  const [loadingIngredients, setLoadingIngredients] = useState(false);
  const [addingIngredient, setAddingIngredient] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (meal) {
      setMealName(meal.mealName);
      setSelectedIngredientIds(meal.ingredients);
      fetchAllIngredients();
    }
  }, [meal]);

  useEffect(() => {
    if (allIngredients.length > 0 && selectedIngredientIds.length > 0) {
      const selected = allIngredients.filter((ingredient) =>
        selectedIngredientIds.includes(ingredient.ingredientId),
      );
      setSelectedIngredients(selected);
    } else {
      setSelectedIngredients([]);
    }
  }, [allIngredients, selectedIngredientIds]);

  const fetchAllIngredients = async () => {
    setLoadingIngredients(true);
    try {
      const ingredients = await getIngredients();
      setAllIngredients(ingredients);
    } catch (err) {
      console.error("Error fetching ingredients:", err);
      setError("Failed to load ingredients. Please try again.");
    } finally {
      setLoadingIngredients(false);
    }
  };

  const resetForm = () => {
    setMealName("");
    setCurrentIngredient("");
    setSelectedIngredientIds([]);
    setSelectedIngredients([]);
    setError(null);
  };

  const handleAddIngredient = async (e?: FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    if (!currentIngredient.trim()) {
      return;
    }

    setAddingIngredient(true);
    setError(null);

    try {
      const newIngredient = await addIngredient(currentIngredient.trim());

      setAllIngredients([...allIngredients, newIngredient]);
      setSelectedIngredientIds([
        ...selectedIngredientIds,
        newIngredient.ingredientId,
      ]);
      setCurrentIngredient("");
    } catch (err) {
      console.error("Error adding ingredient:", err);
      setError("Failed to add ingredient. Please try again.");
    } finally {
      setAddingIngredient(false);
    }
  };

  const handleRemoveIngredient = (ingredientId: string) => {
    setSelectedIngredientIds(
      selectedIngredientIds.filter((id) => id !== ingredientId),
    );
  };

  const handleSaveMeal = async (e?: FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    if (!meal) {
      setError("No meal to update");
      return;
    }

    if (!mealName.trim()) {
      setError("Please enter a meal name");
      return;
    }

    if (selectedIngredientIds.length === 0) {
      setError("Please add at least one ingredient");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await updateMeal(meal.mealId, mealName.trim(), selectedIngredientIds);
      resetForm();
      onClose(true);
    } catch (err) {
      console.error("Error updating meal:", err);
      setError("Failed to update meal. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose(false);
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit Meal</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <TextField
          autoFocus
          margin="dense"
          label="Meal Name"
          fullWidth
          value={mealName}
          onChange={(e) => setMealName(e.target.value)}
          disabled={loading || loadingIngredients}
        />

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle1" gutterBottom>
          Ingredients
        </Typography>

        {loadingIngredients ? (
          <Box sx={{ display: "flex", justifyContent: "center", my: 2 }}>
            <CircularProgress size={24} />
          </Box>
        ) : (
          <>
            {selectedIngredients.length > 0 ? (
              <List>
                {selectedIngredients.map((ingredient) => (
                  <ListItem
                    key={ingredient.ingredientId}
                    secondaryAction={
                      <IconButton
                        edge="end"
                        aria-label="delete"
                        onClick={() =>
                          handleRemoveIngredient(ingredient.ingredientId)
                        }
                        disabled={loading}
                      >
                        <DeleteIcon />
                      </IconButton>
                    }
                  >
                    <ListItemText primary={ingredient.ingredientName} />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography
                variant="body2"
                color="text.secondary"
                align="center"
                sx={{ my: 2 }}
              >
                No ingredients added yet
              </Typography>
            )}

            <form onSubmit={handleAddIngredient}>
              <Box sx={{ display: "flex", mb: 2 }}>
                <TextField
                  label="Add Ingredient"
                  fullWidth
                  size="small"
                  value={currentIngredient}
                  onChange={(e) => setCurrentIngredient(e.target.value)}
                  disabled={loading || addingIngredient}
                />
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  size="small"
                  startIcon={<AddIcon />}
                  disabled={
                    !currentIngredient.trim() || loading || addingIngredient
                  }
                  sx={{ ml: 1 }}
                >
                  {addingIngredient ? <CircularProgress size={24} /> : "Add"}
                </Button>
              </Box>
            </form>

            <Box sx={{ mt: 2 }}>
              <Typography variant="caption" color="text.secondary">
                Total Ingredients: {selectedIngredients.length}
              </Typography>
            </Box>
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading || loadingIngredients}>
          Cancel
        </Button>
        <Button
          type="submit"
          variant="contained"
          onClick={handleSaveMeal}
          disabled={
            loading ||
            loadingIngredients ||
            selectedIngredientIds.length === 0 ||
            !mealName.trim()
          }
        >
          {loading ? <CircularProgress size={24} /> : "Save Changes"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditMealDialog;
