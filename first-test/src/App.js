import React, {
  useState,
  createContext,
  useContext,
  useEffect,
  useMemo,
} from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Login from "./components/Login";
import UserDashboard from "./pages/UserDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import SalesDirector from "./pages/SalesDirectorDashboard";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { Snackbar, Alert } from "@mui/material";
import SalesDirectorReimbursementList from "./components/SalesDirectorReimbursementList";
import { axiosInstance } from "../src/lib/axios";

// Global Context for State Management
export const AppContext = createContext();

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within AppProvider");
  }
  return context;
};

function App() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSalesDirector, setIsSalesDirector] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [reimbursements, setReimbursements] = useState([]);
  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "info",
  });
  const [darkMode, setDarkMode] = useState(false);

  // Create theme based on darkMode state
  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: darkMode ? "dark" : "light",
          primary: {
            main: darkMode ? "#90caf9" : "#1976d2",
          },
          secondary: {
            main: darkMode ? "#4db6ac" : "#26a69a",
          },
          success: {
            main: darkMode ? "#81c784" : "#4caf50",
          },
          error: {
            main: darkMode ? "#e57373" : "#d32f2f",
          },
          warning: {
            main: darkMode ? "#ffd54f" : "#fbc02d",
          },
          info: {
            main: darkMode ? "#4fc3f7" : "#0288d1",
          },
          background: {
            default: darkMode ? "#0a1929" : "#f5f7fa",
            paper: darkMode ? "#1a2332" : "#ffffff",
          },
          text: {
            primary: darkMode ? "#ffffff" : "#333333",
            secondary: darkMode ? "#b0b0b0" : "#666666",
          },
        },
        typography: {
          fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
          h4: { fontWeight: 700 },
          h5: { fontWeight: 600 },
          h6: { fontWeight: 600 },
        },
        components: {
          MuiButton: {
            styleOverrides: {
              root: {
                borderRadius: 8,
                textTransform: "none",
                padding: "10px 24px",
                fontWeight: 500,
                boxShadow: "none",
                "&:hover": {
                  boxShadow: darkMode
                    ? "0 4px 8px rgba(255,255,255,0.1)"
                    : "0 4px 8px rgba(0,0,0,0.15)",
                },
              },
            },
          },
          MuiCard: {
            styleOverrides: {
              root: {
                borderRadius: 16,
                boxShadow: darkMode
                  ? "0 2px 12px rgba(0,0,0,0.3)"
                  : "0 2px 12px rgba(0,0,0,0.08)",
                transition: "all 0.3s ease",
                "&:hover": {
                  boxShadow: darkMode
                    ? "0 8px 24px rgba(0,0,0,0.5)"
                    : "0 8px 24px rgba(0,0,0,0.12)",
                },
              },
            },
          },
          MuiPaper: {
            styleOverrides: {
              root: {
                borderRadius: 12,
                backgroundImage: "none", // Remove default MUI dark mode gradient
              },
            },
          },
          MuiTextField: {
            styleOverrides: {
              root: {
                "& .MuiOutlinedInput-root": {
                  borderRadius: 8,
                },
              },
            },
          },
        },
      }),
    [darkMode]
  );

  // Persist auth state in memory (not localStorage as per requirements)
  // useEffect(() => {
  //   // In production, check Firebase auth state here
  //   // For now, just initialize empty state
  // }, []);

  const toggleTheme = () => {
    setDarkMode(!darkMode);
    showNotification(
      `Switched to ${!darkMode ? "dark" : "light"} mode`,
      "info"
    );
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setIsAdmin(false);
    setIsSalesDirector(false);
    setUser(null);
    showNotification("Logged out successfully", "success");
  };

  const showNotification = (message, severity = "info") => {
    setNotification({ open: true, message, severity });
  };

  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

  const addReimbursement = async (reimbursement) => {
    // try {
    //   const res = await fetch("http://localhost:5000/api/reimbursements", {
    //     method: "POST",
    //     headers: { "Content-Type": "application/json" },
    //     body: JSON.stringify({
    //       ...reimbursement,
    //       userId: user?.uid || user?.username,
    //       userName: user?.displayName || user?.username,
    //     }),
    //   });

    //   if (!res.ok) throw new Error("Failed to submit reimbursement");

    //   const saved = await res.json();

    //   setReimbursements([...reimbursements, saved]);
    //   showNotification("Reimbursement submitted successfully!", "success");
    //   return saved;
    // } catch (error) {
    //   console.error("Error adding reimbursement:", error);
    //   showNotification(
    //     "Failed to submit reimbursement. Please try again.",
    //     "error"
    //   );
    // }

    try {
      const res = await axiosInstance.post("/api/reimbursements", {
        ...reimbursement,
        userId: user?.uid || user?.username,
        userName: user?.displayName || user?.username,
      });

      const saved = res.data;
      setReimbursements([...reimbursements, saved]);
      showNotification("Reimbursement submitted successfully!", "success");
      return saved;
    } catch (error) {
      console.error("Error adding reimbursement:", error);
      showNotification(
        "Failed to submit reimbursement. Please try again.",
        "error"
      );
    }
  };

  const updateReimbursementStatus = (id, status, comment = "") => {
    setReimbursements(
      reimbursements.map((r) =>
        r.id === id
          ? {
              ...r,
              status,
              approvedBy: user?.displayName,
              approvedAt: new Date().toISOString(),
              comment,
            }
          : r
      )
    );
    showNotification(
      `Reimbursement ${status.toLowerCase()} successfully`,
      "success"
    );
  };

  const contextValue = {
    isAdmin,
    isSalesDirector,
    setIsAdmin,
    setIsSalesDirector,
    isAuthenticated,
    setIsAuthenticated,
    user,
    setUser,
    reimbursements,
    setReimbursements,
    addReimbursement,
    updateReimbursementStatus,
    showNotification,
    handleLogout,
    darkMode,
    toggleTheme,
  };

  return (
    <AppContext.Provider value={contextValue}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Toaster position="top-right" /> {/* Add this line */}
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/user"
              element={
                isAuthenticated && !isAdmin ? (
                  <UserDashboard />
                ) : (
                  <Navigate to="/login" />
                )
              }
            />
            <Route
              path="/admin"
              element={
                isAuthenticated && isAdmin ? (
                  <AdminDashboard />
                ) : (
                  <Navigate to="/login" />
                )
              }
            />

            <Route
              path="/sales-director"
              element={
                isAuthenticated && isSalesDirector ? (
                  <SalesDirector />
                ) : (
                  <Navigate to="/login" />
                )
              }
            >
              <Route index element={<SalesDirectorReimbursementList />} />
            </Route>

            <Route path="*" element={<Navigate to="/login" />} />
          </Routes>
        </Router>
        {/* Global Notification Snackbar */}
        <Snackbar
          open={notification.open}
          autoHideDuration={4000}
          onClose={handleCloseNotification}
          anchorOrigin={{ vertical: "top", horizontal: "right" }}
        >
          <Alert
            onClose={handleCloseNotification}
            severity={notification.severity}
            variant="filled"
            sx={{ width: "100%" }}
          >
            {notification.message}
          </Alert>
        </Snackbar>
      </ThemeProvider>
    </AppContext.Provider>
  );
}

export default App;
