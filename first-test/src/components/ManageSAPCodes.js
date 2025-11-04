import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  Box,
  Typography,
  Button,
  TextField,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Paper,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Chip,
  MenuItem,
  Pagination,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Code as CodeIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import { useManageSapCodesStore } from "../store/manageSapCodesStore.js";

function ManageSAPCodes() {
  const { sapCodes, loading, fetchSapCodes, createSapCode, updateSapCode, deleteSapCode } = useManageSapCodesStore();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedSapCode, setSelectedSapCode] = useState(null);
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    description: "",
    status: "Active",
  });
  const [formErrors, setFormErrors] = useState({});

  // Pagination state
  const [page, setPage] = useState(1);
  const itemsPerPage = 5;

  // Fetch SAP codes on mount
  useEffect(() => {
    fetchSapCodes();
  }, [fetchSapCodes]);

  // Filter SAP codes and reset page when search changes
  const filteredCodes = sapCodes.filter(
    (code) =>
      code.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      code.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Reset page when search changes
  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredCodes.length / itemsPerPage);
  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedCodes = filteredCodes.slice(startIndex, endIndex);

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  // Validate SAP code format
  const validateSapCode = (code) => {
    if (!code) return "Code is required";
    const sapCodeRegex = /^E-\d{5}-\d{4}$/i;
    if (!sapCodeRegex.test(code)) {
      return "Invalid format. Use: E-00000-0000";
    }
    return "";
  };

  // Handle add dialog
  const handleAddClick = () => {
    setFormData({
      code: "",
      name: "",
      description: "",
      status: "Active",
    });
    setFormErrors({});
    setAddDialogOpen(true);
  };

  const handleCloseAddDialog = () => {
    setAddDialogOpen(false);
    setFormData({ code: "", name: "", description: "", status: "Active" });
    setFormErrors({});
  };

  const handleSubmitAdd = async () => {
    // Validate
    const errors = {};
    const codeError = validateSapCode(formData.code);
    if (codeError) errors.code = codeError;
    if (!formData.name.trim()) errors.name = "Name is required";

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const result = await createSapCode(formData);
    if (result.success) {
      handleCloseAddDialog();
    }
  };

  // Handle edit dialog
  const handleEditClick = (sapCode) => {
    setSelectedSapCode(sapCode);
    setFormData({
      code: sapCode.code,
      name: sapCode.name,
      description: sapCode.description || "",
      status: sapCode.status,
    });
    setFormErrors({});
    setEditDialogOpen(true);
  };

  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
    setSelectedSapCode(null);
    setFormData({ code: "", name: "", description: "", status: "Active" });
    setFormErrors({});
  };

  const handleSubmitEdit = async () => {
    // Validate
    const errors = {};
    const codeError = validateSapCode(formData.code);
    if (codeError) errors.code = codeError;
    if (!formData.name.trim()) errors.name = "Name is required";

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const result = await updateSapCode(selectedSapCode.id, formData);
    if (result.success) {
      handleCloseEditDialog();
    }
  };

  // Handle delete dialog
  const handleDeleteClick = (sapCode) => {
    setSelectedSapCode(sapCode);
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setSelectedSapCode(null);
  };

  const handleConfirmDelete = async () => {
    const result = await deleteSapCode(selectedSapCode.id);
    if (result.success) {
      handleCloseDeleteDialog();
    }
  };

  const getStatusColor = (status) => {
    return status === "Active" ? "success" : "default";
  };

  return (
    <Card sx={{ mt: 3, boxShadow: 3 }}>
      <CardContent sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
          <CodeIcon sx={{ fontSize: 32, color: "primary.main", mr: 2 }} />
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: "bold" }}>
              Manage SAP Codes
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Create, edit, and manage SAP project codes
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            sx={{ minWidth: 180 }}
            onClick={handleAddClick}
          >
            Add New SAP Code
          </Button>
        </Box>

        {/* Search */}
        <TextField
          fullWidth
          placeholder="Search SAP codes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ mb: 3 }}
        />

        {/* Loading State */}
        {loading && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {/* SAP Codes List */}
        {!loading && filteredCodes.length > 0 && (
          <>
            <Paper sx={{ border: 1, borderColor: "divider" }}>
              <List>
                {paginatedCodes.map((code, index) => (
                  <React.Fragment key={code.id}>
                    <ListItem
                      sx={{
                        py: 2,
                        "&:hover": {
                          bgcolor: "action.hover",
                        },
                      }}
                      secondaryAction={
                        <Box sx={{ display: "flex", gap: 1 }}>
                          <IconButton
                            edge="end"
                            aria-label="edit"
                            color="primary"
                            onClick={() => handleEditClick(code)}
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            edge="end"
                            aria-label="delete"
                            color="error"
                            onClick={() => handleDeleteClick(code)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      }
                    >
                      <ListItemText
                        primary={
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                              {code.name}
                            </Typography>
                            <Chip
                              label={code.status}
                              size="small"
                              color={getStatusColor(code.status)}
                              sx={{ height: 20 }}
                            />
                          </Box>
                        }
                        secondary={
                          <Box sx={{ mt: 0.5 }}>
                            <Typography
                              variant="body2"
                              color="primary"
                              sx={{ fontWeight: 500 }}
                            >
                              {code.code}
                            </Typography>
                            {code.description && (
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ mt: 0.5 }}
                              >
                                {code.description}
                              </Typography>
                            )}
                            <Typography variant="caption" color="text.secondary">
                              Created: {new Date(code.createdAt).toLocaleDateString()}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < paginatedCodes.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </Paper>

            {/* Pagination */}
            {totalPages > 1 && (
              <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={handlePageChange}
                  color="primary"
                  showFirstButton
                  showLastButton
                />
              </Box>
            )}
          </>
        )}

        {/* Empty State */}
        {!loading && filteredCodes.length === 0 && (
          <Box
            sx={{
              textAlign: "center",
              py: 6,
              color: "text.secondary",
            }}
          >
            <CodeIcon sx={{ fontSize: 64, opacity: 0.3, mb: 2 }} />
            <Typography variant="h6">No SAP codes found</Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              {searchTerm
                ? "Try adjusting your search"
                : "Get started by adding a new SAP code"}
            </Typography>
          </Box>
        )}

        {/* Summary */}
        {!loading && (
          <Box
            sx={{
              mt: 3,
              p: 2,
              bgcolor: "action.hover",
              borderRadius: 1,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Typography variant="body2" color="text.secondary">
              Total SAP Codes: <strong>{sapCodes.length}</strong>
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Showing: <strong>{filteredCodes.length}</strong> codes
            </Typography>
          </Box>
        )}

        {/* Add Dialog */}
        <Dialog open={addDialogOpen} onClose={handleCloseAddDialog} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="h6">Add New SAP Code</Typography>
            <IconButton onClick={handleCloseAddDialog} size="small">
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3, pt: 2 }}>
              <TextField
                label="SAP Code"
                value={formData.code}
                onChange={(e) => {
                  setFormData({ ...formData, code: e.target.value });
                  setFormErrors({ ...formErrors, code: "" });
                }}
                fullWidth
                required
                placeholder="E-00000-0000"
                error={!!formErrors.code}
                helperText={formErrors.code || "Format: E-00000-0000"}
              />

              <TextField
                label="Name"
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  setFormErrors({ ...formErrors, name: "" });
                }}
                fullWidth
                required
                placeholder="Project or Department Name"
                error={!!formErrors.name}
                helperText={formErrors.name}
              />

              <TextField
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                fullWidth
                multiline
                rows={3}
                placeholder="Detailed description of what this code is for"
              />

              <TextField
                select
                label="Status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                fullWidth
              >
                <MenuItem value="Active">Active</MenuItem>
                <MenuItem value="Inactive">Inactive</MenuItem>
              </TextField>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={handleCloseAddDialog} color="inherit">
              Cancel
            </Button>
            <Button
              onClick={handleSubmitAdd}
              variant="contained"
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : "Add SAP Code"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onClose={handleCloseEditDialog} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="h6">Edit SAP Code</Typography>
            <IconButton onClick={handleCloseEditDialog} size="small">
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers>
            {selectedSapCode && (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 3, pt: 2 }}>
                <TextField
                  label="SAP Code"
                  value={formData.code}
                  onChange={(e) => {
                    setFormData({ ...formData, code: e.target.value });
                    setFormErrors({ ...formErrors, code: "" });
                  }}
                  fullWidth
                  required
                  placeholder="E-00000-0000"
                  error={!!formErrors.code}
                  helperText={formErrors.code || "Format: E-00000-0000"}
                />

                <TextField
                  label="Name"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    setFormErrors({ ...formErrors, name: "" });
                  }}
                  fullWidth
                  required
                  placeholder="Project or Department Name"
                  error={!!formErrors.name}
                  helperText={formErrors.name}
                />

                <TextField
                  label="Description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  fullWidth
                  multiline
                  rows={3}
                  placeholder="Detailed description of what this code is for"
                />

                <TextField
                  select
                  label="Status"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  fullWidth
                >
                  <MenuItem value="Active">Active</MenuItem>
                  <MenuItem value="Inactive">Inactive</MenuItem>
                </TextField>
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={handleCloseEditDialog} color="inherit">
              Cancel
            </Button>
            <Button
              onClick={handleSubmitEdit}
              variant="contained"
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : "Save Changes"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onClose={handleCloseDeleteDialog} maxWidth="xs" fullWidth>
          <DialogTitle>Confirm Delete</DialogTitle>
          <DialogContent>
            {selectedSapCode && (
              <Typography>
                Are you sure you want to delete SAP code <strong>{selectedSapCode.code}</strong> ({selectedSapCode.name})? 
                This action cannot be undone.
              </Typography>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={handleCloseDeleteDialog} color="inherit">
              Cancel
            </Button>
            <Button
              onClick={handleConfirmDelete}
              variant="contained"
              color="error"
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : "Delete"}
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
}

export default ManageSAPCodes;