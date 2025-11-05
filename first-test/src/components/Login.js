import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Typography,
  Button,
  Paper,
  Box,
  CircularProgress,
  useTheme,
} from "@mui/material";
import {
  Login as MicrosoftIcon,
  CheckCircleOutline,
} from "@mui/icons-material";
import { useAppContext } from "../App";
import { axiosInstance } from "../lib/axios.js";
import { baseURL } from "../lib/baseUrl.js";

function Login() {
  const {
    setIsAdmin,
    setIsAuthenticated,
    setUser,
    showNotification,
    setIsSalesDirector,
  } = useAppContext();
  const [checking, setChecking] = useState(true);
  const navigate = useNavigate();
  const theme = useTheme();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // const response = await fetch("http://localhost:5000/auth/me", {
        //   credentials: "include",
        // });

        const response = await axiosInstance.get("/auth/me");

        // if (response.ok) {
        //   const data = await response.json();
        //   if (data.user) {
        //     console.log("✅ User data received:", data.user);

        //     setUser({
        //       uid: data.user.id,
        //       username: data.user.name,
        //       email: data.user.email,
        //       role: data.user.role,
        //       authProvider: data.user.authProvider,
        //       sap_code_1: data.user.sap_code_1,
        //       sap_code_2: data.user.sap_code_2,
        //     });
        //     setIsAuthenticated(true);
        //     setIsAdmin(
        //       [
        //         "Admin",
        //         "SUL",
        //         "Account Manager",
        //         "Invoice Specialist",
        //         "Finance Officer",
        //         "Sales Director",
        //       ].includes(data.user.role)
        //     );

        //     setIsSalesDirector(["Sales Director"].includes(data.user.role));
        //     console.log("User role:", data.user.role);

        //     // Navigate based on role
        //     switch (data.user.role) {
        //       case "Admin":
        //       case "SUL":
        //       case "Account Manager":
        //       case "Invoice Specialist":
        //       case "Finance Officer":
        //         navigate("/admin");
        //         break;
        //       case "Employee":
        //         navigate("/user");
        //         break;
        //       case "Sales Director":
        //         navigate("/sales-director");
        //         break;
        //       default:
        //         console.warn("Unknown role:", data.user.role);
        //         navigate("/user");
        //         break;
        //     }

        //     const firstName = data.user.name.split(" ")[0];
        //     showNotification(`Welcome back, ${firstName}!`, "success");
        //   } else {
        //     setChecking(false);
        //   }
        // }
        const data = response.data;

        if (data.user) {
          console.log("✅ User data received:", data.user);

          setUser({
            uid: data.user.id,
            username: data.user.name,
            email: data.user.email,
            role: data.user.role,
            authProvider: data.user.authProvider,
            sap_code_1: data.user.sap_code_1,
            sap_code_2: data.user.sap_code_2,
          });

          setIsAuthenticated(true);
          setIsAdmin(
            [
              "Admin",
              "SUL",
              "Account Manager",
              "Invoice Specialist",
              "Finance Officer",
              "Sales Director",
            ].includes(data.user.role)
          );

          setIsSalesDirector(["Sales Director"].includes(data.user.role));
          console.log("User role:", data.user.role);

          // Navigate based on role
          switch (data.user.role) {
            case "Admin":
            case "SUL":
            case "Account Manager":
            case "Invoice Specialist":
            case "Finance Officer":
              navigate("/admin");
              break;
            case "Employee":
              navigate("/user");
              break;
            case "Sales Director":
              navigate("/sales-director");
              break;
            default:
              console.warn("Unknown role:", data.user.role);
              navigate("/user");
              break;
          }

          const firstName = data.user.name.split(" ")[0];
          showNotification(`Welcome back, ${firstName}!`, "success");
        } else {
          setChecking(false);
        }
      } catch (error) {
        console.log("Not authenticated, showing login form");
        setChecking(false);
      }
    };

    checkAuth();
  }, [
    navigate,
    setIsAdmin,
    setIsAuthenticated,
    setUser,
    showNotification,
    setIsSalesDirector,
  ]);

  const handleMicrosoftLogin = () => {
    window.location.href = `${baseURL}/auth/microsoft`;
  };

  if (checking) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background:
          theme.palette.mode === "dark"
            ? "linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)"
            : "linear-gradient(135deg, #ffffff 0%, #f0f4f8 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        py: 4,
      }}
    >
      <Container maxWidth="xs">
        <Paper
          sx={{
            p: 5,
            borderRadius: 3,
            boxShadow: "0 10px 40px rgba(0, 0, 0, 0.08)",
            border:
              theme.palette.mode === "dark"
                ? "1px solid rgba(255, 255, 255, 0.1)"
                : "1px solid rgba(0, 0, 0, 0.05)",
          }}
        >
          {/* Header */}
          <Box sx={{ mb: 3, textAlign: "center" }}>
            <Box sx={{ mb: 3, display: "flex", justifyContent: "center" }}>
              <img
                src={
                  theme.palette.mode === "dark"
                    ? "/erni-logo-darkmode.png"
                    : "/erni-logo.png"
                }
                alt="Logo"
                style={{ height: "60px" }}
                onError={(e) => (e.target.style.display = "none")}
              />
            </Box>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                color: theme.palette.mode === "dark" ? "#ffffff" : "#4f5455",
                mb: 0,
                lineHeight: 1.2,
              }}
            >
              Reimbursement Tool
            </Typography>
          </Box>

          {/* Features */}
          <Box
            sx={{
              mb: 4,
              display: "flex",
              flexDirection: "column",
              gap: 2,
              pl: 2,
            }}
          >
            <Box sx={{ display: "flex", gap: 2, alignItems: "flex-start" }}>
              <CheckCircleOutline
                sx={{ color: "#0078D4", fontSize: 20, mt: 0.3, flexShrink: 0 }}
              />
              <Typography
                variant="body2"
                sx={{
                  color: theme.palette.mode === "dark" ? "#ccc" : "#555",
                  fontSize: "0.9rem",
                }}
              >
                Quick submission and tracking
              </Typography>
            </Box>
            <Box sx={{ display: "flex", gap: 2, alignItems: "flex-start" }}>
              <CheckCircleOutline
                sx={{ color: "#0078D4", fontSize: 20, mt: 0.3, flexShrink: 0 }}
              />
              <Typography
                variant="body2"
                sx={{
                  color: theme.palette.mode === "dark" ? "#ccc" : "#555",
                  fontSize: "0.9rem",
                }}
              >
                Secure document uploads
              </Typography>
            </Box>
            <Box sx={{ display: "flex", gap: 2, alignItems: "flex-start" }}>
              <CheckCircleOutline
                sx={{ color: "#0078D4", fontSize: 20, mt: 0.3, flexShrink: 0 }}
              />
              <Typography
                variant="body2"
                sx={{
                  color: theme.palette.mode === "dark" ? "#ccc" : "#555",
                  fontSize: "0.9rem",
                }}
              >
                Real-time approval updates
              </Typography>
            </Box>
          </Box>

          {/* Divider */}
          <Box
            sx={{
              borderTop:
                theme.palette.mode === "dark"
                  ? "1px solid rgba(255, 255, 255, 0.1)"
                  : "1px solid #e0e0e0",
              mb: 4,
            }}
          />

          {/* Login Button */}
          <Button
            fullWidth
            variant="contained"
            size="large"
            startIcon={<MicrosoftIcon />}
            onClick={handleMicrosoftLogin}
            sx={{
              py: 1.6,
              textTransform: "none",
              fontWeight: 600,
              fontSize: "0.95rem",
              backgroundColor: "#0078D4",
              color: "white",
              borderRadius: 1.5,
              transition: "all 0.2s ease",
              "&:hover": {
                backgroundColor: "#106EBE",
                boxShadow: "0 6px 20px rgba(0, 120, 212, 0.3)",
                transform: "translateY(-2px)",
                color: "white",
              },
              "&:disabled": {
                backgroundColor: "#a0c4f4",
                color: "white",
              },
            }}
          >
            Sign in with Microsoft
          </Button>

          {/* Footer */}
          <Typography
            variant="caption"
            sx={{
              display: "block",
              textAlign: "center",
              color: theme.palette.mode === "dark" ? "#999" : "#999",
              fontSize: "0.8rem",
              mt: 3,
            }}
          >
            Use your corporate Microsoft account
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
}

export default Login;
