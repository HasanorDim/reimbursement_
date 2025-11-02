import React, { useState, useEffect } from "react";
import { useNavigate, Outlet } from "react-router-dom";
import { useTheme } from "@mui/material/styles";
import MonthlyStats from "../components/MonthlyStats.js";
import UserSettings from "../components/UserSettings.js";
import SalesDirectorReportExport from "../components/SalesDirectorReportExport.js";
import ManageSAPCodes from "../components/ManageSAPCodes.js";
import ManageUsers from "../components/ManageUsers.js";
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
  Collapse,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import ListAltIcon from "@mui/icons-material/ListAlt";
import ReceiptIcon from "@mui/icons-material/Receipt";
import TrackChangesIcon from "@mui/icons-material/TrackChanges";
import ExitToAppIcon from "@mui/icons-material/ExitToApp";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import AssessmentIcon from "@mui/icons-material/Assessment";
import CodeIcon from "@mui/icons-material/Code";
import PeopleIcon from "@mui/icons-material/People";
import ThemeToggle from "../components/ThemeToggle.js";
import { useAppContext } from "../App.js";
import { userUserStore } from "../store/userUserStore.js";
import SalesDirectorReimbursementList from "../components/SalesDirectorReimbursementList.js";

function SalesDirectorDashboard() {
  const theme = useTheme();
  const { user, setIsAuthenticated, setIsAdmin, setUser, showNotification } =
    useAppContext();
  const navigate = useNavigate();
  const { getUser, user: storeUser } = userUserStore();

  const [anchorEl, setAnchorEl] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [reimbursementOpen, setReimbursementOpen] = useState(true);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    getUser();
  }, []);

  const handleProfileClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileClose = () => {
    setAnchorEl(null);
  };

  const handleLogoutClick = async () => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/auth/logout`,
        {
          method: "GET",
          credentials: "include",
        }
      );

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

  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
  };

  const handleReimbursementClick = () => {
    setReimbursementOpen(!reimbursementOpen);
  };

  const handleTabChange = (newValue) => {
    setTabValue(newValue);
  };

  const handleUserProfileClick = () => {
    handleTabChange(-1);
    handleProfileClose();
  };

  const firstName = user?.username?.split(" ")[0] || user?.username || "Admin";

  const renderContent = () => {
    if (tabValue === -1) {
      return <UserSettings />;
    }

    switch (tabValue) {
      case 0:
        return <SalesDirectorReimbursementList />;
      case 1:
      // return <ReimberursementEmployee />;
      case 2:
        return <SalesDirectorReportExport />;
      case 3:
        return <ManageSAPCodes />;
      case 4:
        return <ManageUsers />;
      default:
        return <SalesDirectorReimbursementList />;
    }
  };

  return (
    <Container
      maxWidth="lg"
      sx={{ py: 0, display: "flex", minHeight: "100vh" }}
    >
      {/* Sidepanel */}
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
          {/* Reimbursement Dropdown */}
          <ListItemButton
            selected={tabValue === 0}
            // onClick={handleReimbursementClick}
            onClick={() => handleTabChange(0)}
            sx={{
              borderRadius: 2,
              mb: 0.5,
              "&.Mui-selected": {
                backgroundColor: (theme) => theme.palette.action.selected,
                color: (theme) => theme.palette.primary.main,
              },
            }}
          >
            <ListItemIcon>
              <ListAltIcon />
            </ListItemIcon>
            <ListItemText primary="Reimbursement List" />
          </ListItemButton>

          {/* <Collapse in={reimbursementOpen} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              <ListItemButton
                selected={tabValue === 0}
                onClick={() => handleTabChange(0)}
                sx={{
                  pl: 4,
                  borderRadius: 2,
                  mb: 0.5,
                  "&.Mui-selected": {
                    backgroundColor: (theme) => theme.palette.action.selected,
                    color: (theme) => theme.palette.primary.main,
                  },
                }}
              >
                <ListItemIcon>
                  <ReceiptIcon />
                </ListItemIcon>
                <ListItemText primary="Admin Reimbursement" />
              </ListItemButton>

              <ListItemButton
                selected={tabValue === 1}
                onClick={() => handleTabChange(1)}
                sx={{
                  pl: 4,
                  borderRadius: 2,
                  mb: 0.5,
                  "&.Mui-selected": {
                    backgroundColor: (theme) => theme.palette.action.selected,
                    color: (theme) => theme.palette.primary.main,
                  },
                }}
              >
                <ListItemIcon>
                  <TrackChangesIcon />
                </ListItemIcon>
                <ListItemText primary="Employee Reimbursement" />
              </ListItemButton>
            </List>
          </Collapse> */}

          {/* Export Reports */}
          <ListItemButton
            selected={tabValue === 2}
            onClick={() => handleTabChange(2)}
            sx={{
              borderRadius: 2,
              mb: 0.5,
              "&.Mui-selected": {
                backgroundColor: (theme) => theme.palette.action.selected,
                color: (theme) => theme.palette.primary.main,
              },
            }}
          >
            <ListItemIcon>
              <AssessmentIcon />
            </ListItemIcon>
            <ListItemText primary="Export Reports" />
          </ListItemButton>

          {/* Manage SAP Codes */}
          <ListItemButton
            selected={tabValue === 3}
            onClick={() => handleTabChange(3)}
            sx={{
              borderRadius: 2,
              mb: 0.5,
              "&.Mui-selected": {
                backgroundColor: (theme) => theme.palette.action.selected,
                color: (theme) => theme.palette.primary.main,
              },
            }}
          >
            <ListItemIcon>
              <CodeIcon />
            </ListItemIcon>
            <ListItemText primary="Manage SAP Codes" />
          </ListItemButton>

          {/* Manage Users */}
          <ListItemButton
            selected={tabValue === 4}
            onClick={() => handleTabChange(4)}
            sx={{
              borderRadius: 2,
              mb: 0.5,
              "&.Mui-selected": {
                backgroundColor: (theme) => theme.palette.action.selected,
                color: (theme) => theme.palette.primary.main,
              },
            }}
          >
            <ListItemIcon>
              <PeopleIcon />
            </ListItemIcon>
            <ListItemText primary="Manage Users" />
          </ListItemButton>
        </List>

        {drawerOpen && (
          <Box sx={{ mt: "auto" }}>
            <MonthlyStats />
          </Box>
        )}
      </Drawer>

      {/* Main Content */}
      <Box
        sx={{
          flexGrow: 1,
          ml: drawerOpen ? "240px" : "64px",
          transition: "margin-left 0.3s ease-in-out",
        }}
      >
        {/* Header */}
        <Box
          sx={{
            p: 2,
            borderBottom: 1,
            borderColor: "divider",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
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
              <MenuItem onClick={handleUserProfileClick}>User Profile</MenuItem>
              <MenuItem onClick={handleLogoutClick}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <span>Logout</span>
                  <ExitToAppIcon />
                </Box>
              </MenuItem>
            </Menu>
          </Box>
        </Box>

        {/* Main Content Area for Routes */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 3,
          }}
        >
          {renderContent()}
        </Box>
      </Box>
    </Container>
  );
}

export default SalesDirectorDashboard;