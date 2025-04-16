import { FC, ReactNode, useState } from "react";
import {
  AppBar,
  Box,
  Button,
  Container,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { Link as RouterLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import pkg from "../../package.json";

interface LayoutProps {
  children: ReactNode;
}

const Layout: FC<LayoutProps> = ({ children }) => {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
  };

  const navItems = isAuthenticated
    ? [
        ...(isMobile ? [{ text: "Lunchplanner", path: "/" }] : []),
        { text: "Meals", path: "/meals" },
        { text: "Shopping Lists", path: "/shopping-lists" },
        { text: "Logout", action: handleLogout },
      ]
    : [
        ...(isMobile ? [{ text: "Lunchplanner", path: "/" }] : []),
        { text: "Login", path: "/login" },
        { text: "Register", path: "/register" },
        { text: "Verify Account", path: "/verify" },
      ];

  const drawer = (
    <Box onClick={closeDrawer} sx={{ width: 250 }}>
      <List>
        {navItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            {item.path ? (
              <ListItemButton
                component={RouterLink}
                to={item.path}
                selected={location.pathname === item.path}
              >
                <ListItemText primary={item.text} />
              </ListItemButton>
            ) : (
              <ListItemButton onClick={item.action}>
                <ListItemText primary={item.text} />
              </ListItemButton>
            )}
          </ListItem>
        ))}
      </List>
    </Box>
  );

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
            Lunchplanner
          </Typography>

          {!isMobile && (
            <>
              {navItems.map((item) =>
                item.path ? (
                  <Button
                    key={item.text}
                    color="inherit"
                    component={RouterLink}
                    to={item.path}
                  >
                    {item.text}
                  </Button>
                ) : (
                  <Button key={item.text} color="inherit" onClick={item.action}>
                    {item.text}
                  </Button>
                ),
              )}
            </>
          )}

          {isMobile && (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              onClick={toggleDrawer}
              sx={{ ml: 1 }}
            >
              <MenuIcon />
            </IconButton>
          )}
        </Toolbar>
      </AppBar>

      <Drawer anchor="right" open={drawerOpen} onClose={toggleDrawer}>
        {drawer}
      </Drawer>

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
