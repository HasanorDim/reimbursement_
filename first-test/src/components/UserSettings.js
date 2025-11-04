import { useEffect } from "react";
import { Box, Paper, Typography, Avatar, Chip } from "@mui/material";
import { Mail, User, Briefcase } from "lucide-react";
import { userUserStore } from "../store/userUserStore.js";

const UserSettings = () => {
  const { getUser, user } = userUserStore();

  useEffect(() => {
    getUser();
  }, []);

  // Roles that don't have SAP codes
  const rolesWithoutSapCodes = ['Admin', 'Invoice Specialist', 'Sales Director', 'Finance Officer'];
  
  // Check if user has SAP codes
  const hasSapCodes = user && !rolesWithoutSapCodes.includes(user.role);
  
  // Get user's SAP codes
  const sapCodes = [];
  if (user?.sap_code_1) sapCodes.push(user.sap_code_1);
  if (user?.sap_code_2) sapCodes.push(user.sap_code_2);

  return (
    <Box
      sx={{
        bgcolor: "background.default",
        minHeight: "100vh",
        py: 4,
        marginTop: -10,
      }}
    >
      <Box sx={{ maxWidth: "md", mx: "auto", p: 2, py: 4 }}>
        <Paper
          elevation={1}
          sx={{
            p: 4,
            borderRadius: 2,
            bgcolor: "background.paper",
          }}
        >
          <Box sx={{ textAlign: "center", mb: 4 }}>
            {/* Profile Picture */}
            <Avatar
              src={user?.profilePicture}
              alt={user?.name}
              sx={{
                width: 120,
                height: 120,
                mx: "auto",
                mb: 2,
                fontSize: "3rem",
                bgcolor: "primary.main",
              }}
            >
              {!user?.profilePicture && user?.name?.charAt(0).toUpperCase()}
            </Avatar>

            <Typography
              variant="h4"
              sx={{
                fontWeight: "bold",
                color: "text.primary",
                mb: 1,
              }}
            >
              Profile
            </Typography>
            <Typography variant="body1" sx={{ color: "text.secondary" }}>
              Your profile information
            </Typography>
          </Box>

          {/* Profile Information Section */}
          <Box sx={{ spaceY: 4 }}>
            <Box sx={{ mb: 3 }}>
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}
              >
                <User sx={{ width: 20, height: 20, color: "text.secondary" }} />
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  Full Name
                </Typography>
              </Box>
              <Box
                sx={{
                  px: 2,
                  py: 1.5,
                  bgcolor: "action.hover",
                  borderRadius: 1,
                  border: 1,
                  borderColor: "divider",
                }}
              >
                <Typography sx={{ color: "text.primary" }}>
                  {user?.name}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}
              >
                <Mail sx={{ width: 20, height: 20, color: "text.secondary" }} />
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  Email Address
                </Typography>
              </Box>
              <Box
                sx={{
                  px: 2,
                  py: 1.5,
                  bgcolor: "action.hover",
                  borderRadius: 1,
                  border: 1,
                  borderColor: "divider",
                }}
              >
                <Typography sx={{ color: "text.primary" }}>
                  {user?.email}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}
              >
                <Briefcase sx={{ width: 20, height: 20, color: "text.secondary" }} />
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  Role
                </Typography>
              </Box>
              <Box
                sx={{
                  px: 2,
                  py: 1.5,
                  bgcolor: "action.hover",
                  borderRadius: 1,
                  border: 1,
                  borderColor: "divider",
                }}
              >
                <Typography sx={{ color: "text.primary" }}>
                  {user?.role}
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Account Information Section */}
          <Paper
            variant="outlined"
            sx={{
              mt: 4,
              p: 4,
              bgcolor: "background.default",
            }}
          >
            <Typography
              variant="h6"
              sx={{
                fontWeight: "medium",
                color: "text.primary",
                mb: 2,
              }}
            >
              Account Information
            </Typography>
            <Box sx={{ spaceY: 2 }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  py: 1.5,
                  borderBottom: 1,
                  borderColor: "divider",
                }}
              >
                <Typography sx={{ color: "text.secondary" }}>
                  Member Since
                </Typography>
                <Typography
                  sx={{ color: "text.primary", fontWeight: "medium" }}
                >
                  {user?.createdAt?.split("T")[0]}
                </Typography>
              </Box>
              
              {/* SAP Code Section - Only show if user has SAP codes */}
              {hasSapCodes && (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    py: 1.5,
                    borderBottom: 1,
                    borderColor: "divider",
                  }}
                >
                  <Typography sx={{ color: "text.secondary" }}>
                    {sapCodes.length > 1 ? "SAP Codes" : "SAP Code"}
                  </Typography>
                  <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", justifyContent: "flex-end" }}>
                    {sapCodes.length > 0 ? (
                      sapCodes.map((code, index) => (
                        <Chip
                          key={index}
                          label={code}
                          color="primary"
                          variant="outlined"
                          size="small"
                          sx={{ fontWeight: 600 }}
                        />
                      ))
                    ) : (
                      <Typography
                        sx={{ color: "warning.main", fontWeight: "medium", fontSize: "0.875rem" }}
                      >
                        No SAP codes assigned
                      </Typography>
                    )}
                  </Box>
                </Box>
              )}
              
            </Box>
          </Paper>
        </Paper>
      </Box>
    </Box>
  );
};

export default UserSettings;