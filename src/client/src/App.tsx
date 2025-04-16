import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import { AuthProvider } from "./contexts/AuthContext";
import Layout from "./components/Layout";
import HomePage from "./components/HomePage";
import Login from "./components/Auth/Login";
import Register from "./components/Auth/Register";
import VerifyAccount from "./components/Auth/VerifyAccount";
import MealsPage from "./components/Meals/MealsPage";
import ShoppingListsPage from "./components/ShoppingLists/ShoppingListsPage";
import ProtectedRoute from "./components/Auth/ProtectedRoute";

// Create a theme with custom colors
const theme = createTheme({
  palette: {
    primary: {
      main: "#3772FF",
    },
    secondary: {
      main: "#E9D985",
    },
    background: {
      default: "#E3EBFF",
    },
    text: {
      primary: "#494947",
    },
  },
  components: {
    MuiLink: {
      styleOverrides: {
        root: {
          color: "inherit",
          "&:visited": {
            color: "inherit",
          },
        },
      },
    },
    MuiCssBaseline: {
      styleOverrides: {
        a: {
          color: "inherit",
          "&:visited": {
            color: "inherit",
          },
        },
      },
    },
    MuiButton: {
      variants: [
        {
          props: { component: "a" },
          style: {
            "&:visited": {
              color: "inherit",
            },
          },
        },
      ],
    },
    MuiTypography: {
      variants: [
        {
          props: { component: "a" },
          style: {
            textDecoration: "none",
            color: "inherit",
            "&:visited": {
              color: "inherit",
            },
          },
        },
      ],
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Layout>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/verify" element={<VerifyAccount />} />
              <Route
                path="/meals"
                element={
                  <ProtectedRoute>
                    <MealsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/shopping-lists"
                element={
                  <ProtectedRoute>
                    <ShoppingListsPage />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Layout>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
