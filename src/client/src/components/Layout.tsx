import { FC, ReactNode } from "react";
import {
  AppBar,
  Box,
  Button,
  Container,
  Toolbar,
  Typography,
} from "@mui/material";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import pkg from "../../package.json";

interface LayoutProps {
  children: ReactNode;
}

const Layout: FC<LayoutProps> = ({ children }) => {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <AppBar position="static" sx={{ width: "100%" }}>
        <Toolbar>
          <Typography
            variant="h6"
            component={RouterLink}
            to="/"
            sx={{ flexGrow: 1, textDecoration: "none" }}
          >
            Meal Planner
          </Typography>

          {isAuthenticated ? (
            <>
              <Button color="inherit" component={RouterLink} to="/meals">
                Meals
              </Button>
              <Button
                color="inherit"
                component={RouterLink}
                to="/shopping-lists"
              >
                Shopping Lists
              </Button>
              <Button color="inherit" onClick={handleLogout}>
                Logout
              </Button>
            </>
          ) : (
            <>
              <Button color="inherit" component={RouterLink} to="/login">
                Login
              </Button>
              <Button color="inherit" component={RouterLink} to="/register">
                Register
              </Button>
              <Button color="inherit" component={RouterLink} to="/verify">
                Verify Account
              </Button>
            </>
          )}
        </Toolbar>
      </AppBar>

      <Container
        component="main"
        sx={{
          mt: 4,
          mb: 4,
          flexGrow: 1,
          maxWidth: { sm: "100%", md: "960px", lg: "1200px" },
        }}
      >
        {children}
      </Container>

      <Box
        component="footer"
        sx={{ py: 3, width: "100%", textAlign: "center" }}
      >
        <Typography variant="body2" color="text.secondary">
          © {new Date().getFullYear()} Lunchplanner v{pkg.version}
        </Typography>
      </Box>
    </Box>
  );
};

export default Layout;
