import { Box, Button, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const HomePage = () => {
  const { isAuthenticated, username } = useAuth();

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "60vh",
        textAlign: "center",
      }}
    >
      <Typography variant="h3" component="h1" gutterBottom>
        Welcome to Lunchplanner
      </Typography>

      <Typography
        variant="h5"
        component="h2"
        gutterBottom
        color="text.secondary"
      >
        Plan your meals and generate shopping lists with ease
      </Typography>

      {isAuthenticated ? (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            Hello, {username}!
          </Typography>
          <Button
            component={RouterLink}
            to="/meals"
            variant="contained"
            size="large"
            sx={{
              mt: 2,
              color: "white",
              "&:visited": {
                color: "white",
              },
              "&:hover": {
                color: "white",
              },
            }}
          >
            Go to Meals
          </Button>
        </Box>
      ) : (
        <Box sx={{ mt: 4, display: "flex", gap: 2 }}>
          <Button
            component={RouterLink}
            to="/login"
            variant="contained"
            color="primary"
            size="large"
            sx={{
              color: "white",
              "&:visited": {
                color: "white",
              },
              "&:hover": {
                color: "white",
              },
            }}
          >
            Login
          </Button>
          <Button
            component={RouterLink}
            to="/register"
            variant="outlined"
            color="primary"
            size="large"
            sx={{
              color: (theme) => theme.palette.primary.main,
              "&:visited": {
                color: (theme) => theme.palette.primary.main,
              },
              "&:hover": {
                color: (theme) => theme.palette.primary.main,
              },
            }}
          >
            Register
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default HomePage;
