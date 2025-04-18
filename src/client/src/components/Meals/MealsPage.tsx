import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Divider,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import { addShoppingList, getMeals } from "../../services/apiService";
import { Meal } from "../../types";
import NewMealDialog from "./NewMealDialog";
import EditMealDialog from "./EditMealDialog";
import { useNavigate } from "react-router-dom";

const MealsPage = () => {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMeals, setSelectedMeals] = useState<Set<string>>(new Set());
  const [openNewMealDialog, setOpenNewMealDialog] = useState(false);
  const [openEditMealDialog, setOpenEditMealDialog] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [creatingShoppingList, setCreatingShoppingList] = useState(false);
  const [shoppingListSuccess, setShoppingListSuccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchMeals();
  }, []);

  const fetchMeals = async () => {
    setLoading(true);
    setError(null);

    try {
      const fetchedMeals = await getMeals();
      setMeals(fetchedMeals);
    } catch (err) {
      console.error("Error fetching meals:", err);
      setError("Failed to load meals. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleMeal = (mealId: string) => {
    const newSelectedMeals = new Set(selectedMeals);

    if (newSelectedMeals.has(mealId)) {
      newSelectedMeals.delete(mealId);
    } else {
      newSelectedMeals.add(mealId);
    }

    setSelectedMeals(newSelectedMeals);
  };

  const handleOpenNewMealDialog = () => {
    setOpenNewMealDialog(true);
  };

  const handleCloseNewMealDialog = (mealAdded: boolean) => {
    setOpenNewMealDialog(false);
    if (mealAdded) {
      fetchMeals();
    }
  };

  const handleEditMeal = (meal: Meal) => {
    setSelectedMeal(meal);
    setOpenEditMealDialog(true);
  };

  const handleCloseEditMealDialog = (mealUpdated: boolean) => {
    setOpenEditMealDialog(false);
    setSelectedMeal(null);
    if (mealUpdated) {
      fetchMeals();
    }
  };

  const handleCreateShoppingList = async () => {
    if (selectedMeals.size === 0) {
      setError("Please select at least one meal");
      return;
    }

    setCreatingShoppingList(true);
    setError(null);

    try {
      const mealIds = Array.from(selectedMeals);
      const name = `Shopping List - ${new Date().toLocaleDateString()}`;
      await addShoppingList(name, mealIds);

      setShoppingListSuccess(true);
      setSelectedMeals(new Set());

      // Show success message for 2 seconds before navigating
      setTimeout(() => {
        navigate("/shopping-lists");
      }, 2000);
    } catch (err) {
      console.error("Error creating shopping list:", err);
      setError("Failed to create shopping list. Please try again.");
    } finally {
      setCreatingShoppingList(false);
    }
  };

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h4" component="h1">
          Your Meals
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenNewMealDialog}
        >
          Add New Meal
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {shoppingListSuccess && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Shopping list created successfully! Redirecting to shopping lists...
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
          <CircularProgress />
        </Box>
      ) : meals.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: "center" }}>
          <Typography variant="body1">
            You don't have any meals yet. Create your first meal to get started!
          </Typography>
        </Paper>
      ) : (
        <>
          <TableContainer component={Paper}>
            <Table aria-label="meals table">
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox"></TableCell>
                  <TableCell>Meal Name</TableCell>
                  <TableCell>Number of Ingredients</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {meals.map((meal) => (
                  <TableRow key={meal.mealId} hover>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedMeals.has(meal.mealId)}
                        onChange={() => handleToggleMeal(meal.mealId)}
                      />
                    </TableCell>
                    <TableCell>{meal.mealName}</TableCell>
                    <TableCell>{meal.ingredients.length}</TableCell>
                    <TableCell align="right">
                      <IconButton
                        aria-label="edit"
                        onClick={() => handleEditMeal(meal)}
                        size="small"
                      >
                        <EditIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Divider sx={{ my: 3 }} />

          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Typography variant="h6">
              Selected Meals: {selectedMeals.size}
            </Typography>
            <Button
              variant="contained"
              color="secondary"
              startIcon={<ShoppingCartIcon />}
              onClick={handleCreateShoppingList}
              disabled={selectedMeals.size === 0 || creatingShoppingList}
            >
              {creatingShoppingList ? "Creating..." : "Create Shopping List"}
            </Button>
          </Box>
        </>
      )}

      <NewMealDialog
        open={openNewMealDialog}
        onClose={handleCloseNewMealDialog}
      />

      <EditMealDialog
        open={openEditMealDialog}
        meal={selectedMeal}
        onClose={handleCloseEditMealDialog}
      />
    </Box>
  );
};

export default MealsPage;
