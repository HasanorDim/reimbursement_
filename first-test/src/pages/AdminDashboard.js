import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@mui/material/styles";
import MonthlyStats from "../components/MonthlyStats.js";
import {
  Container,
  Box,
  Typography,
  Menu,
  MenuItem,
  IconButton,
  Drawer,
  ListItemButton,
  ListItemIcon,
  List,
  ListItemText,
  Avatar,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import ListAltIcon from "@mui/icons-material/ListAlt";
import AssessmentIcon from "@mui/icons-material/Assessment";
import ReceiptIcon from "@mui/icons-material/Receipt";
import TrackChangesIcon from "@mui/icons-material/TrackChanges";
import ExitToAppIcon from "@mui/icons-material/ExitToApp";
import ReportExport from "../components/ReportExport.js";
import ReceiptUpload from "../components/ReceiptUpload.js";
import StatusTracker from "../components/StatusTracker.js";
import ReimbursementList from "../components/ReimbursementList.js";
import ThemeToggle from "../components/ThemeToggle.js";
import { useAppContext } from "../App.js";
import UserSettings from "../components/UserSettings.js";
import { userUserStore } from "../store/userUserStore.js";

function AdminDashboard() {
  const theme = useTheme();
  const { user, setIsAuthenticated, setIsAdmin, setUser, showNotification } =
    useAppContext();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(true);

  const handleProfileClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileClose = () => {
    setAnchorEl(null);
  };

  const handleLogoutClick = async () => {
    try {
      const response = await fetch("http://localhost:5000/auth/logout", {
        method: "GET",
        credentials: "include",
      });

      if (response.ok) {
        setIsAuthenticated(false);
        setIsAdmin(false);
        setUser(null);
        showNotification("Logged out successfully", "success");
        navigate("/login");
      } else {
        showNotification("Logout failed", "error");
      }
    } catch (error) {
      console.error("Logout error:", error);
      setIsAuthenticated(false);
      setIsAdmin(false);
      setUser(null);
      navigate("/login");
    }
    handleProfileClose();
  };

  const handleTabChange = (newValue) => {
    setTabValue(newValue);
  };

  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
  };

  const { getUser, user: storeUser } = userUserStore();

  useEffect(() => {
    getUser();
  }, []);

  // Check if user is Finance Officer
  const isFinanceOfficer = user?.role === "Finance Officer";

  // Define all tabs with their visibility rules
  const allTabs = [
    {
      label: "Reimbursement Lists",
      icon: <ListAltIcon />,
      component: <ReimbursementList />,
      visible: true, // Always visible
    },
    {
      label: "Export Summary Reports",
      icon: <AssessmentIcon />,
      component: <ReportExport />,
      visible: true, // Always visible
    },
    {
      label: "Upload Receipt",
      icon: <ReceiptIcon />,
      component: <ReceiptUpload />,
      visible: !isFinanceOfficer, // Hidden for Finance Officers
    },
    {
      label: "Track Status",
      icon: <TrackChangesIcon />,
      component: <StatusTracker />,
      visible: !isFinanceOfficer, // Hidden for Finance Officers
    },
  ];

  // Filter tabs based on visibility
  const visibleTabs = allTabs.filter(tab => tab.visible);

  const settingsTab = {
    label: "Settings",
    component: <UserSettings />,
  };

  const firstName = user?.username?.split(" ")[0] || user?.username || "Admin";

  const renderContent = () => {
    if (tabValue === -1) {
      return settingsTab.component;
    }

    // Get the selected tab from visible tabs
    if (tabValue >= 0 && tabValue < visibleTabs.length) {
      return visibleTabs[tabValue].component;
    }

    return null;
  };

  return (
    <Container
      maxWidth="lg"
      sx={{ py: 0, display: "flex", minHeight: "100vh" }}
    >
      <Drawer
        variant="persistent"
        anchor="left"
        open={true}
        sx={{
          width: drawerOpen ? 10 : 10,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: drawerOpen ? 240 : 64,
            boxSizing: "border-box",
            transition: "width 0.3s ease-in-out",
            overflowX: "hidden",
          },
        }}
      >
        <Box
          sx={{
            p: 2,
            display: "flex",
            justifyContent: drawerOpen ? "flex-end" : "center",
          }}
        >
          <IconButton onClick={toggleDrawer} color="inherit" size="large">
            <MenuIcon />
          </IconButton>
        </Box>
        <List>
          {visibleTabs.map((tab, index) => (
            <ListItemButton
              key={tab.label}
              selected={tabValue === index}
              onClick={() => handleTabChange(index)}
              sx={{
                borderRadius: 2,
                mb: 0.5,
                "&.Mui-selected": {
                  backgroundColor: (theme) => theme.palette.action.selected,
                  color: (theme) => theme.palette.primary.main,
                },
              }}
            >
              <ListItemIcon>{tab.icon}</ListItemIcon>
              <ListItemText primary={tab.label} />
            </ListItemButton>
          ))}
        </List>

        {drawerOpen && !isFinanceOfficer && (
          <Box sx={{ mt: "auto" }}>
            <MonthlyStats />
          </Box>
        )}
      </Drawer>

      <Box
        sx={{
          flexGrow: 1,
          ml: drawerOpen ? "240px" : "64px",
          transition: "margin-left 0.3s ease-in-out",
        }}
      >
        <Box
          sx={{
            p: 2,
            borderBottom: 1,
            borderColor: "divider",
            mb: 3,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <img
              src={
                theme.palette.mode === "dark"
                  ? "/erni-logo-darkmode.png"
                  : "/erni-logo.png"
              }
              alt="ERNI Logo"
              style={{ height: "40px" }}
            />
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Typography variant="h6">Welcome, {firstName}</Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <ThemeToggle />
              <IconButton
                onClick={handleProfileClick}
                color="inherit"
                size="large"
              >
                <Avatar
                  src={storeUser?.profilePicture}
                  alt={storeUser?.name || storeUser?.username}
                  sx={{
                    width: 32,
                    height: 32,
                    bgcolor: "primary.main",
                    fontSize: "0.9rem",
                  }}
                >
                  {!storeUser?.profilePicture &&
                    (storeUser?.name?.charAt(0).toUpperCase() ||
                      storeUser?.username?.charAt(0).toUpperCase())}
                </Avatar>
              </IconButton>
            </Box>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleProfileClose}
            >
              <MenuItem
                onClick={() => {
                  handleTabChange(-1);
                  handleProfileClose();
                }}
              >
                User Profile
              </MenuItem>
              <MenuItem onClick={handleLogoutClick}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <span>Logout</span>
                  <ExitToAppIcon />
                </Box>
              </MenuItem>
            </Menu>
          </Box>
        </Box>

        <Box sx={{ p: 2 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 3,
            }}
          ></Box>
          {renderContent()}
        </Box>
      </Box>
    </Container>
  );
}

export default AdminDashboard;