import { useState } from 'react';
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
  Typography
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { addIngredient, addMeal } from '../../services/apiService';
import { Ingredient } from '../../types';

interface NewMealDialogProps {
  open: boolean;
  onClose: (mealAdded: boolean) => void;
}

const NewMealDialog = ({ open, onClose }: NewMealDialogProps) => {
  const [mealName, setMealName] = useState('');
  const [currentIngredient, setCurrentIngredient] = useState('');
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(false);
  const [addingIngredient, setAddingIngredient] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setMealName('');
    setCurrentIngredient('');
    setIngredients([]);
    setError(null);
  };

  const handleAddIngredient = async () => {
    if (!currentIngredient.trim()) {
      return;
    }
    
    setAddingIngredient(true);
    setError(null);
    
    try {
      const newIngredient = await addIngredient(currentIngredient.trim());
      setIngredients([...ingredients, newIngredient]);
      setCurrentIngredient('');
    } catch (err) {
      console.error('Error adding ingredient:', err);
      setError('Failed to add ingredient. Please try again.');
    } finally {
      setAddingIngredient(false);
    }
  };

  const handleRemoveIngredient = (ingredientId: string) => {
    setIngredients(ingredients.filter(ingredient => ingredient.ingredientId !== ingredientId));
  };

  const handleSaveMeal = async () => {
    if (!mealName.trim()) {
      setError('Please enter a meal name');
      return;
    }
    
    if (ingredients.length === 0) {
      setError('Please add at least one ingredient');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const ingredientIds = ingredients.map(ingredient => ingredient.ingredientId);
      await addMeal(mealName.trim(), ingredientIds);
      
      resetForm();
      onClose(true);
    } catch (err) {
      console.error('Error saving meal:', err);
      setError('Failed to save meal. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && currentIngredient.trim()) {
      e.preventDefault();
      handleAddIngredient();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add New Meal</DialogTitle>
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
          disabled={loading}
        />
        
        <Divider sx={{ my: 2 }} />
        
        <Typography variant="subtitle1" gutterBottom>
          Ingredients
        </Typography>
        
        <Box sx={{ display: 'flex', mb: 2 }}>
          <TextField
            label="Add Ingredient"
            fullWidth
            value={currentIngredient}
            onChange={(e) => setCurrentIngredient(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading || addingIngredient}
          />
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleAddIngredient}
            disabled={!currentIngredient.trim() || loading || addingIngredient}
            sx={{ ml: 1 }}
          >
            {addingIngredient ? <CircularProgress size={24} /> : 'Add'}
          </Button>
        </Box>
        
        {ingredients.length > 0 ? (
          <List>
            {ingredients.map((ingredient) => (
              <ListItem
                key={ingredient.ingredientId}
                secondaryAction={
                  <IconButton 
                    edge="end" 
                    aria-label="delete" 
                    onClick={() => handleRemoveIngredient(ingredient.ingredientId)}
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
          <Typography variant="body2" color="text.secondary" align="center" sx={{ my: 2 }}>
            No ingredients added yet
          </Typography>
        )}
        
        <Box sx={{ mt: 2 }}>
          <Typography variant="caption" color="text.secondary">
            Total Ingredients: {ingredients.length}
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSaveMeal}
          variant="contained"
          disabled={loading || ingredients.length === 0 || !mealName.trim()}
        >
          {loading ? <CircularProgress size={24} /> : 'Save Meal'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default NewMealDialog; 