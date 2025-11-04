import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Typography,
  Button,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  CircularProgress,
  Alert,
  TextField,
  InputAdornment,
  MenuItem,
  Chip,
  Grid,
  Avatar,
  IconButton,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormControl,
  FormLabel,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Pagination,
} from "@mui/material";
import {
  Search as SearchIcon,
  CheckCircle as CheckCircleIcon,
  Person as PersonIcon,
  Close as CloseIcon,
  Cancel as CancelIcon,
  Visibility as VisibilityIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  Download as DownloadIcon,
} from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import { useAppContext } from "../App";

function SalesDirectorReimbursementList() {
  const { user, showNotification } = useAppContext();
  const [pendings, setPendings] = useState([]);
  const [filteredPendings, setFilteredPendings] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [openRejectDialog, setOpenRejectDialog] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [page, setPage] = useState(1);
  const itemsPerPage = 5;

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [categoryFilter, setCategoryFilter] = useState("All Categories");

  // Role filter state
  const [roleFilters, setRoleFilters] = useState({
    Employee: true,
    SUL: true,
    "Invoice Specialist": true,
    "Account Manager": true,
  });

  const [remarks, setRemarks] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [receiptZoom, setReceiptZoom] = useState(1);
  const [receiptLoading, setReceiptLoading] = useState(false);
  const hasFetched = useRef(false);

  useEffect(() => {
    fetchReimbursements();
  }, [user]);

  // Apply all filters whenever any filter changes
  useEffect(() => {
    applyAllFilters();
    setPage(1);
  }, [pendings, searchTerm, statusFilter, categoryFilter, roleFilters]);

  const fetchReimbursements = async () => {
    if (!user || hasFetched.current) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/reimbursements/pending-all-approvals`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch reimbursements");
      }

      const data = await response.json();
      setPendings(data);
      hasFetched.current = true;
    } catch (err) {
      setError(err.message);
      showNotification("Failed to load reimbursements", "error");
    } finally {
      setLoading(false);
    }
  };

  // Enhanced filter logic that combines all filters
  const applyAllFilters = () => {
    let filtered = [...pendings];

    // Apply role filter first
    const selectedRoles = Object.keys(roleFilters).filter(
      (role) => roleFilters[role]
    );
    if (
      selectedRoles.length > 0 &&
      selectedRoles.length < Object.keys(roleFilters).length
    ) {
      filtered = filtered.filter(
        (item) => item.user?.role && selectedRoles.includes(item.user.role)
      );
    }

    // Apply status filter second
    if (statusFilter !== "All Status") {
      filtered = filtered.filter((item) => item.status === statusFilter);
    }

    // Apply category filter third
    if (categoryFilter !== "All Categories") {
      filtered = filtered.filter((item) => item.category === categoryFilter);
    }

    // Apply search filter last (most specific)
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          (item.items && item.items.toLowerCase().includes(term)) ||
          (item.description && item.description.toLowerCase().includes(term)) ||
          (item.category && item.category.toLowerCase().includes(term)) ||
          (item.merchant && item.merchant.toLowerCase().includes(term)) ||
          (item.user?.name && item.user.name.toLowerCase().includes(term)) ||
          (item.user?.role && item.user.role.toLowerCase().includes(term)) ||
          (item.status && item.status.toLowerCase().includes(term)) ||
          (item.submittedAt &&
            new Date(item.submittedAt)
              .toLocaleDateString("en-CA")
              .toLowerCase()
              .includes(term))
      );
    }

    setFilteredPendings(filtered);
  };

  // Search handler
  const handleSearch = (searchValue) => {
    setSearchTerm(searchValue);
  };

  // Status filter handler
  const handleStatusFilter = (searchValue) => {
    setStatusFilter(searchValue);
    // Clear search when changing status filter for better UX
    if (searchValue !== "All Status") {
      setSearchTerm("");
    }
  };

  // Category filter handler
  const handleCategoryFilter = (searchValue) => {
    setCategoryFilter(searchValue);
    // Clear search when changing category filter for better UX
    if (searchValue !== "All Categories") {
      setSearchTerm("");
    }
  };

  // Role filter handlers
  const handleRoleFilterChange = (event) => {
    const { name, checked } = event.target;
    setRoleFilters((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };

  const handleSelectAllRoles = (event) => {
    const checked = event.target.checked;
    setRoleFilters({
      Employee: checked,
      SUL: checked,
      "Invoice Specialist": checked,
      "Account Manager": checked,
    });
  };

  // Calculate role filter states
  const allRolesSelected = Object.values(roleFilters).every(Boolean);
  const someRolesSelected =
    Object.values(roleFilters).some(Boolean) && !allRolesSelected;

  // Get unique statuses
  const getUniqueStatuses = () => {
    return ["All Status", "Pending", "Approved", "Rejected", "Validated"];
  };

  // Get unique categories
  const getUniqueCategories = () => {
    return [
      "All Categories",
      "Transportation (Commute)",
      "Transportation (Drive)",
      "Meal with Client",
      "OverTime Meal",
      "Accomodation",
    ];
  };

  const handleApprove = async (id, remarksText = "") => {
    try {
      setActionLoading(true);
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/approvals/${id}/approve`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ remarks: remarksText }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to approve reimbursement");
      }

      setPendings(pendings.filter((p) => p.id !== id));
      showNotification("Reimbursement approved successfully", "success");
      handleCloseDialog();
    } catch (err) {
      showNotification(
        err.message || "Failed to approve reimbursement",
        "error"
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (id, remarksText) => {
    if (!remarksText || remarksText.trim() === "") {
      showNotification("Please provide remarks for rejection", "warning");
      return;
    }

    try {
      setActionLoading(true);
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/approvals/${id}/reject`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ remarks: remarksText }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to reject reimbursement");
      }

      setPendings(pendings.filter((p) => p.id !== id));
      showNotification("Reimbursement rejected successfully", "success");
      handleCloseRejectDialog();
      handleCloseDialog();
    } catch (err) {
      showNotification(
        err.message || "Failed to reject reimbursement",
        "error"
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenDetails = (ticket) => {
    setSelectedTicket(ticket);
    setOpenDialog(true);
    setRemarks("");
    setReceiptZoom(1);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedTicket(null);
    setRemarks("");
    setReceiptZoom(1);
  };

  const handleOpenRejectDialog = () => {
    setOpenRejectDialog(true);
  };

  const handleCloseRejectDialog = () => {
    setOpenRejectDialog(false);
    setRemarks("");
  };

  const handleZoomIn = () => setReceiptZoom((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () =>
    setReceiptZoom((prev) => Math.max(prev - 0.25, 0.5));

  const handleDownloadReceipt = () => {
    if (!selectedTicket?.receipt) return;

    try {
      let url, filename;
      if (typeof selectedTicket.receipt === "string") {
        url = `${process.env.REACT_APP_API_URL}${selectedTicket.receipt}`;
        filename = `receipt-${selectedTicket.id}.jpg`;
      } else {
        const {
          data,
          mimetype,
          filename: receiptFilename,
        } = selectedTicket.receipt;
        const byteCharacters = atob(data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: mimetype });
        url = URL.createObjectURL(blob);
        filename = receiptFilename || `receipt-${selectedTicket.id}.jpg`;
      }

      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      if (url.startsWith("blob:")) {
        URL.revokeObjectURL(url);
      }
      showNotification("Receipt downloaded successfully", "success");
    } catch (error) {
      console.error("Download failed:", error);
      showNotification("Failed to download receipt", "error");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Pending":
        return "warning";
      case "Approved":
        return "success";
      case "Rejected":
        return "error";
      case "Validated":
        return "info";
      default:
        return "default";
    }
  };

  const getApprovalFlow = (ticket) => {
    if (!ticket.approvals || ticket.approvals.length === 0) {
      return [];
    }

    const sortedApprovals = [...ticket.approvals].sort(
      (a, b) => b.approval_level - a.approval_level
    );

    return sortedApprovals.map((approval) => ({
      role: approval.approver_role,
      status: approval.status,
      name: approval.approver?.name || "Pending Assignment",
      date: approval.approved_at
        ? new Date(approval.approved_at).toLocaleString()
        : null,
      remarks: approval.remarks,
      level: approval.approval_level,
    }));
  };

  const canApprove = (ticket) => {
    if (!ticket.approvals || !user) return false;

    const sortedApprovals = [...ticket.approvals].sort(
      (a, b) => a.approval_level - b.approval_level
    );
    const nextPending = sortedApprovals.find((a) => a.status === "Pending");

    return nextPending && nextPending.approver_role === user.role;
  };

  const theme = useTheme();
  const { darkMode } = useAppContext();

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-CA");
  };

  const totalPages = Math.ceil(filteredPendings.length / itemsPerPage);
  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedPendings = filteredPendings.slice(startIndex, endIndex);

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 3, borderRadius: 3 }}>
      <Typography variant="h6" sx={{ fontWeight: "bold", mb: 3 }}>
        Pending Approvals - {user?.role}
      </Typography>

      {/* Search and Filter Section */}
      <Box
        sx={{
          mb: 3,
          display: "flex",
          gap: 2,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <TextField
          placeholder="Search requests..."
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          sx={{
            minWidth: 250,
            "& .MuiOutlinedInput-root": {
              borderRadius: 2,
            },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          }}
          size="small"
        />

        <TextField
          select
          value={statusFilter}
          onChange={(e) => handleStatusFilter(e.target.value)}
          sx={{
            minWidth: 150,
            "& .MuiOutlinedInput-root": {
              borderRadius: 2,
            },
          }}
          size="small"
        >
          {getUniqueStatuses().map((status) => (
            <MenuItem key={status} value={status}>
              {status}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          select
          value={categoryFilter}
          onChange={(e) => handleCategoryFilter(e.target.value)}
          sx={{
            minWidth: 180,
            "& .MuiOutlinedInput-root": {
              borderRadius: 2,
            },
          }}
          size="small"
        >
          {getUniqueCategories().map((category) => (
            <MenuItem key={category} value={category}>
              {category}
            </MenuItem>
          ))}
        </TextField>

        {/* Submitted By Filter */}
        <FormControl component="fieldset" variant="standard">
          <FormLabel
            component="legend"
            sx={{
              fontSize: "0.875rem",
              mb: 1,
              fontWeight: 600,
              color: "text.primary",
            }}
          >
            Submitted By
          </FormLabel>
          <FormGroup sx={{ flexDirection: "row", gap: 1 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={allRolesSelected}
                  indeterminate={someRolesSelected}
                  onChange={handleSelectAllRoles}
                  size="small"
                />
              }
              label={
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  All Roles
                </Typography>
              }
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={roleFilters.Employee}
                  onChange={handleRoleFilterChange}
                  name="Employee"
                  size="small"
                />
              }
              label={<Typography variant="body2">Employee</Typography>}
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={roleFilters.SUL}
                  onChange={handleRoleFilterChange}
                  name="SUL"
                  size="small"
                />
              }
              label={<Typography variant="body2">SUL</Typography>}
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={roleFilters["Invoice Specialist"]}
                  onChange={handleRoleFilterChange}
                  name="Invoice Specialist"
                  size="small"
                />
              }
              label={
                <Typography variant="body2">Invoice Specialist</Typography>
              }
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={roleFilters["Account Manager"]}
                  onChange={handleRoleFilterChange}
                  name="Account Manager"
                  size="small"
                />
              }
              label={<Typography variant="body2">Account Manager</Typography>}
            />
          </FormGroup>
        </FormControl>

        {/* Results count */}
        <Typography variant="body2" color="text.secondary" sx={{ ml: "auto" }}>
          {filteredPendings.length} requests found
        </Typography>
      </Box>

      {loading ? (
  <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
    <CircularProgress />
  </Box>
) : error ? (
  <Alert severity="error">{error}</Alert>
) : filteredPendings.length === 0 ? (
  <Box sx={{ textAlign: "center", py: 4 }}>
    <Typography color="text.secondary">
      {pendings.length === 0
        ? "No pending approvals at this time"
        : "No requests match your search criteria"}
    </Typography>
  </Box>
) : (
  <>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: "bold" }}>EMPLOYEE</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>REQUEST</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>AMOUNT</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>CATEGORY</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>DATES</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>STATUS</TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
               {paginatedPendings.map((item) => (
                  <TableRow key={item.id} hover>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: "medium" }}>
                        {item.user?.name || "Unknown"}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {item.user?.role || "Unknown Role"}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: "medium" }}>
                        {item.items || `${item.category} Reimbursement`}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {item.description || "No description provided"}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: "medium" }}>
                      ₱
                      {parseFloat(item.total).toLocaleString("en-PH", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{item.category}</Typography>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2">
                        {item.date ? formatDate(item.date) : "N/A"}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Submitted: {formatDate(item.submittedAt)}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={item.status}
                      size="small"
                      color={getStatusColor(item.status)}
                      sx={{
                        fontWeight: 600,
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDetails(item)}
                      title="View Details"
                    >
                      <VisibilityIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      
        {/*Pagination*/}
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
      

      {/* Details Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="xl"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2, minHeight: "80vh", maxWidth: "1400px" },
        }}
      >
        <DialogTitle
          sx={{
            fontWeight: "bold",
            pb: 1,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: 1,
            borderColor: "divider",
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: "bold" }}>
            REIMBURSEMENT DETAILS
          </Typography>
          <IconButton onClick={handleCloseDialog} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 0 }}>
          {selectedTicket && (
            <>
              <Box
                sx={{
                  p: 3,
                  bgcolor: darkMode
                    ? theme.palette.background.paper
                    : theme.palette.grey[50],
                  borderBottom: 1,
                  borderColor: "divider",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Avatar
                    src={selectedTicket.user?.profile_picture}
                    alt={
                      selectedTicket.user?.name || selectedTicket.user?.username
                    }
                    sx={{ width: 56, height: 56, bgcolor: "primary.main" }}
                  >
                    {!selectedTicket.user?.profile_picture &&
                      (selectedTicket.user?.name?.charAt(0).toUpperCase() ||
                        selectedTicket.user?.username?.charAt(0).toUpperCase())}
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {selectedTicket.user?.name || "N/A"}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Role: {selectedTicket.user?.role || "N/A"}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Email: {selectedTicket.user?.email || "N/A"}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              <Grid container spacing={3} wrap="nowrap" sx={{ p: 3 }}>
                <Grid item sx={{ width: "650px", flexShrink: 0 }}>
                  <Box
                    sx={{
                      p: 3,
                      height: "100%",
                      border: 1,
                      borderColor: "divider",
                      borderRadius: 2,
                      bgcolor: "background.paper",
                    }}
                  >
                    <Box sx={{ mb: 2 }}>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ fontWeight: 600 }}
                      >
                        Reimbursement Type:
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {selectedTicket.category}
                      </Typography>
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ fontWeight: 600 }}
                      >
                        Amount:
                      </Typography>
                      <Typography
                        variant="h6"
                        sx={{ fontWeight: 700, color: "primary.main" }}
                      >
                        ₱
                        {parseFloat(selectedTicket.total).toLocaleString(
                          "en-PH",
                          { minimumFractionDigits: 2, maximumFractionDigits: 2 }
                        )}
                      </Typography>
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ fontWeight: 600 }}
                      >
                        Purpose:
                      </Typography>
                      <Typography variant="body2">
                        {selectedTicket.items || "No purpose provided."}
                      </Typography>
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ fontWeight: 600 }}
                      >
                        Description:
                      </Typography>
                      <Typography variant="body2">
                        {selectedTicket.description ||
                          "No description provided."}
                      </Typography>
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ fontWeight: 600 }}
                      >
                        Date of Expense:
                      </Typography>
                      <Typography variant="body2">
                        {new Date(
                          selectedTicket.date || selectedTicket.submittedAt
                        ).toLocaleDateString()}
                      </Typography>
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ fontWeight: 600 }}
                      >
                        Date Submitted:
                      </Typography>
                      <Typography variant="body2">
                        {new Date(selectedTicket.submittedAt).toLocaleString()}
                      </Typography>
                    </Box>

                    {selectedTicket.merchant && (
                      <Box sx={{ mb: 2 }}>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ fontWeight: 600 }}
                        >
                          Merchant:
                        </Typography>
                        <Typography variant="body2">
                          {selectedTicket.merchant}
                        </Typography>
                      </Box>
                    )}

                    {selectedTicket.extractedText && (
                      <Box sx={{ mb: 2 }}>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ fontWeight: 600 }}
                        >
                          Extracted Text:
                        </Typography>
                        <Typography
                          variant="body2"
                          component="pre"
                          sx={{
                            whiteSpace: "pre-wrap",
                            wordBreak: "break-word",
                            fontSize: "0.875rem",
                            bgcolor: "grey.50",
                            p: 1,
                            borderRadius: 1,
                          }}
                        >
                          {selectedTicket.extractedText}
                        </Typography>
                      </Box>
                    )}

                    {selectedTicket.receipt && (
                      <Box sx={{ mt: 3 }}>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            mb: 1,
                          }}
                        >
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ fontWeight: 600 }}
                          >
                            Receipt:
                          </Typography>
                          <Box sx={{ display: "flex", gap: 1 }}>
                            <IconButton
                              size="small"
                              onClick={handleZoomOut}
                              disabled={receiptZoom <= 0.5}
                              title="Zoom Out"
                            >
                              <ZoomOutIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={handleZoomIn}
                              disabled={receiptZoom >= 3}
                              title="Zoom In"
                            >
                              <ZoomInIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={handleDownloadReceipt}
                              title="Download Receipt"
                            >
                              <DownloadIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </Box>

                        <Box
                          sx={{
                            position: "relative",
                            width: "100%",
                            maxHeight: "500px",
                            overflow: "auto",
                            border: 1,
                            borderColor: "divider",
                            borderRadius: 1,
                            bgcolor: darkMode ? "grey.900" : "grey.100",
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            p: 2,
                          }}
                        >
                          {receiptLoading && (
                            <CircularProgress sx={{ position: "absolute" }} />
                          )}
                          <Box
                            component="img"
                            src={
                              typeof selectedTicket.receipt === "string"
                                ? `${process.env.REACT_APP_API_URL}${selectedTicket.receipt}`
                                : `data:${selectedTicket.receipt.mimetype};base64,${selectedTicket.receipt.data}`
                            }
                            alt="Receipt"
                            sx={{
                              maxWidth: "100%",
                              maxHeight: "480px",
                              objectFit: "contain",
                              transform: `scale(${receiptZoom})`,
                              transition: "transform 0.2s ease-in-out",
                              display: receiptLoading ? "none" : "block",
                            }}
                            onLoad={() => setReceiptLoading(false)}
                            onLoadStart={() => setReceiptLoading(true)}
                            onError={(e) => {
                              console.error(
                                "Failed to load receipt:",
                                selectedTicket.receipt
                              );
                              setReceiptLoading(false);
                              showNotification(
                                "Failed to load receipt image",
                                "error"
                              );
                            }}
                          />
                        </Box>

                        {selectedTicket.receipt.filename && (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{
                              display: "block",
                              mt: 1,
                              textAlign: "center",
                            }}
                          >
                            {selectedTicket.receipt.filename}
                          </Typography>
                        )}
                      </Box>
                    )}
                  </Box>
                </Grid>

                <Grid item sx={{ width: "450px", flexShrink: 0 }}>
                  <Box
                    sx={{
                      p: 3,
                      height: "100%",
                      border: 1,
                      borderColor: "divider",
                      borderRadius: 2,
                      bgcolor: "background.paper",
                    }}
                  >
                    <Typography variant="h6" sx={{ fontWeight: "bold", mb: 3 }}>
                      Approval Progress
                    </Typography>

                    <Box sx={{ position: "relative", mb: 3 }}>
                      {getApprovalFlow(selectedTicket).map((step, index) => (
                        <Box
                          key={index}
                          sx={{
                            display: "flex",
                            mb: 3,
                            position: "relative",
                            "&:not(:last-child)::before": {
                              content: '""',
                              position: "absolute",
                              left: "15px",
                              top: "32px",
                              bottom: "-24px",
                              width: "2px",
                              bgcolor:
                                step.status === "Pending"
                                  ? "grey.300"
                                  : step.status === "Rejected"
                                  ? "error.main"
                                  : "success.main",
                            },
                          }}
                        >
                          <Box sx={{ mr: 2 }}>
                            {step.status === "Rejected" ? (
                              <CancelIcon
                                sx={{
                                  fontSize: 32,
                                  color: "error.main",
                                }}
                              />
                            ) : (
                              <CheckCircleIcon
                                sx={{
                                  fontSize: 32,
                                  color:
                                    step.status === "Pending"
                                      ? "grey.400"
                                      : "success.main",
                                }}
                              />
                            )}
                          </Box>
                          <Box sx={{ flex: 1 }}>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                                mb: 0.5,
                              }}
                            >
                              <Typography
                                variant="body1"
                                sx={{ fontWeight: 600 }}
                              >
                                Level {step.level}: {step.role}
                              </Typography>
                            </Box>
                            <Chip
                              label={step.status}
                              size="small"
                              color={getStatusColor(step.status)}
                              sx={{ fontWeight: 600, height: 20, mb: 0.5 }}
                            />
                            {step.name &&
                              step.name !== "Pending Assignment" && (
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                  sx={{ fontStyle: "italic", mt: 0.5 }}
                                >
                                  By: {step.name}
                                </Typography>
                              )}
                            {step.date && (
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                display="block"
                              >
                                {step.status === "Approved"
                                  ? "Approved"
                                  : step.status === "Rejected"
                                  ? "Rejected"
                                  : "Processed"}{" "}
                                at: {step.date}
                              </Typography>
                            )}
                            {step.remarks && (
                              <Typography
                                variant="body2"
                                sx={{
                                  mt: 1,
                                  p: 1,
                                  bgcolor: "grey.50",
                                  borderRadius: 1,
                                  fontStyle: "italic",
                                  fontSize: "0.813rem",
                                }}
                              >
                                <strong>Remarks:</strong> {step.remarks}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      ))}
                    </Box>

                    {canApprove(selectedTicket) && (
                      <Box
                        sx={{
                          mt: 3,
                          pt: 3,
                          borderTop: 1,
                          borderColor: "divider",
                        }}
                      >
                        <Typography
                          variant="body2"
                          sx={{ mb: 2, fontWeight: 600 }}
                        >
                          Optional Remarks:
                        </Typography>
                        <TextField
                          fullWidth
                          multiline
                          rows={3}
                          placeholder="Add remarks (optional for approval, required for rejection)"
                          value={remarks}
                          onChange={(e) => setRemarks(e.target.value)}
                          size="small"
                          sx={{ mb: 2 }}
                        />
                        <Box sx={{ display: "flex", gap: 2 }}>
                          <Button
                            fullWidth
                            variant="contained"
                            color="success"
                            onClick={() =>
                              handleApprove(selectedTicket.id, remarks)
                            }
                            disabled={actionLoading}
                          >
                            {actionLoading ? (
                              <CircularProgress size={24} />
                            ) : (
                              "Approve"
                            )}
                          </Button>
                          <Button
                            fullWidth
                            variant="contained"
                            color="error"
                            onClick={handleOpenRejectDialog}
                            disabled={actionLoading}
                          >
                            Reject
                          </Button>
                        </Box>
                      </Box>
                    )}
                  </Box>
                </Grid>
              </Grid>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Confirmation Dialog */}
      <Dialog
        open={openRejectDialog}
        onClose={handleCloseRejectDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Confirm Rejection</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Please provide a reason for rejecting this reimbursement request.
          </Alert>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Rejection Remarks (Required)"
            placeholder="Please explain why this reimbursement is being rejected..."
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseRejectDialog}>Cancel</Button>
          <Button
            onClick={() =>
              selectedTicket && handleReject(selectedTicket.id, remarks)
            }
            color="error"
            variant="contained"
            disabled={!remarks || remarks.trim() === "" || actionLoading}
          >
            {actionLoading ? (
              <CircularProgress size={24} />
            ) : (
              "Confirm Rejection"
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}

export default SalesDirectorReimbursementList;