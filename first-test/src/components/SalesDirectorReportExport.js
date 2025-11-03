import React, { useEffect, useState } from "react";
import {
  Button,
  Typography,
  Card,
  CardContent,
  Box,
  TextField,
  MenuItem,
  Grid,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
  FormControl,
  FormLabel,
  FormGroup,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import { Download, Preview, Description, TrendingUp } from "@mui/icons-material";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { useAdminStore } from "../store/useAdminStore";

function SalesDirectorReportExport() {
  const { getReport, reportData, resetReportData } = useAdminStore();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showPreview, setShowPreview] = useState(false);
  
  // Role filters
  const [roleFilters, setRoleFilters] = useState({
    Employee: true,
    SUL: true,
    "Invoice Specialist": true,
    "Account Manager": true,
  });

  useEffect(() => {
    resetReportData();
  }, []);

  const handleRoleFilterChange = (event) => {
    setRoleFilters({
      ...roleFilters,
      [event.target.name]: event.target.checked,
    });
  };

  const filterData = () => {
    if (!Array.isArray(reportData)) return [];

    return reportData.filter((item) => {
      const statusMatch =
        statusFilter === "All" || item.status === statusFilter;
      
      // Filter by role - check if user's role is selected
      const userRole = item.user?.role || "Employee";
      const roleMatch = roleFilters[userRole] === true;
      
      return statusMatch && roleMatch;
    });
  };

  const exportToExcel = async () => {
    const filteredData = filterData();

    if (filteredData.length === 0) {
      alert("No data to export with current filters");
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Reimbursement Report");

    // Set column definitions
    worksheet.columns = [
      { header: "Reimbursement ID", key: "id", width: 20 },
      { header: "Employee Name", key: "employeeName", width: 25 },
      { header: "Employee Role", key: "employeeRole", width: 20 },
      { header: "SAP Code", key: "sapCode", width: 15 },
      { header: "Category", key: "category", width: 25 },
      { header: "Subject/Title", key: "subject", width: 30 },
      { header: "Description", key: "description", width: 40 },
      { header: "Amount", key: "amount", width: 15 },
      { header: "Date of Expense", key: "expenseDate", width: 18 },
      { header: "Date Submitted", key: "dateSubmitted", width: 18 },
    ];

    // Add data rows
    filteredData.forEach((item) => {
      // Parse expense date properly
      let expenseDate = null;
      if (item.date) {
        const dateStr = item.date;
        if (typeof dateStr === 'string') {
          if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
            const [year, month, day] = dateStr.split('-').map(Number);
            expenseDate = new Date(year, month - 1, day);
          } else {
            expenseDate = new Date(dateStr);
            if (isNaN(expenseDate.getTime())) {
              expenseDate = null;
            }
          }
        }
      } else if (item.date_of_expense) {
        const dateStr = item.date_of_expense;
        if (typeof dateStr === 'string') {
          if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
            const [year, month, day] = dateStr.split('-').map(Number);
            expenseDate = new Date(year, month - 1, day);
          } else {
            expenseDate = new Date(dateStr);
            if (isNaN(expenseDate.getTime())) {
              expenseDate = null;
            }
          }
        }
      }

      // Parse submitted date properly
      let submittedDate = null;
      if (item.submittedAt) {
        submittedDate = new Date(item.submittedAt);
        if (isNaN(submittedDate.getTime())) {
          submittedDate = null;
        }
      } else if (item.submitted_at) {
        submittedDate = new Date(item.submitted_at);
        if (isNaN(submittedDate.getTime())) {
          submittedDate = null;
        }
      }

      worksheet.addRow({
        id: item.id || "N/A",
        employeeName: item.user?.name || "Unknown",
        employeeRole: item.user?.role || "N/A",
        sapCode: item.sapCode || item.sap_code || "N/A",
        category: item.category || item.type || "N/A",
        subject: item.items || "N/A",
        description: item.description || "N/A",
        amount: parseFloat(item.total) || 0,
        expenseDate: expenseDate,
        dateSubmitted: submittedDate,
      });
    });

    // Style header row
    worksheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF667eea" },
    };
    worksheet.getRow(1).alignment = {
      vertical: "middle",
      horizontal: "center",
    };
    worksheet.getRow(1).height = 25;

    // Format columns
    // Format Amount column as number with 2 decimals and peso sign
    worksheet.getColumn('amount').numFmt = '₱#,##0.00';
    worksheet.getColumn('amount').alignment = { horizontal: 'right' };

    // Format date columns as short date (MM/DD/YYYY)
    worksheet.getColumn('expenseDate').numFmt = 'mm/dd/yyyy';
    worksheet.getColumn('dateSubmitted').numFmt = 'mm/dd/yyyy';

    // Add borders to all cells
    worksheet.eachRow((row, rowNumber) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
        if (rowNumber > 1) {
          cell.alignment = { vertical: "middle" };
        }
      });
    });

    // Add summary section
    worksheet.addRow([]);
    const summaryRow = worksheet.addRow([]);
    summaryRow.getCell(1).value = "SUMMARY";
    summaryRow.getCell(1).font = { bold: true, size: 12 };
    summaryRow.getCell(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFF5F7FA" },
    };

    // Calculate totals
    const totalAmount = filteredData.reduce(
      (sum, item) => sum + parseFloat(item.total),
      0
    );

    worksheet.addRow(["Total Requests:", filteredData.length]);
    worksheet.addRow([
      "Pending:",
      filteredData.filter((item) => item.status === "Pending").length,
    ]);
    worksheet.addRow([
      "Approved:",
      filteredData.filter((item) => item.status === "Approved").length,
    ]);
    worksheet.addRow([
      "Rejected:",
      filteredData.filter((item) => item.status === "Rejected").length,
    ]);
    
    // Add total amount with formatting
    const totalAmountRow = worksheet.addRow(["Total Amount:", totalAmount]);
    totalAmountRow.getCell(2).numFmt = '₱#,##0.00';

    // Add role breakdown
    worksheet.addRow([]);
    const roleBreakdownRow = worksheet.addRow([]);
    roleBreakdownRow.getCell(1).value = "BY ROLE";
    roleBreakdownRow.getCell(1).font = { bold: true, size: 12 };
    Object.keys(roleFilters).forEach((role) => {
      if (roleFilters[role]) {
        const count = filteredData.filter((item) => item.user?.role === role).length;
        worksheet.addRow([`${role}:`, count]);
      }
    });

    // Generate and save file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const filename = `reimbursement_report_${
      new Date().toISOString().split("T")[0]
    }.xlsx`;
    saveAs(blob, filename);
  };

  const filteredData = filterData();
  const stats = {
    total: filteredData.length,
    pending: filteredData.filter((item) => item.status === "Pending").length,
    approved: filteredData.filter((item) => item.status === "Approved").length,
    rejected: filteredData.filter((item) => item.status === "Rejected").length,
    totalAmount: filteredData.reduce(
      (sum, item) => sum + parseFloat(item.total),
      0
    ),
    approvedAmount: filteredData
      .filter((item) => item.status === "Approved")
      .reduce((sum, item) => sum + parseFloat(item.total), 0),
  };

  const handlefilterReports = (dataStart, dataEnd) => {
    setStartDate(dataStart);
    setEndDate(dataEnd);
    getReport({ start: dataStart, end: dataEnd });
  };

  const selectedRoleCount = Object.values(roleFilters).filter(Boolean).length;
  const allRolesSelected = selectedRoleCount === Object.keys(roleFilters).length;
  const someRolesSelected = selectedRoleCount > 0 && !allRolesSelected;

  const handleSelectAllRoles = (event) => {
    const newValue = event.target.checked;
    setRoleFilters({
      Employee: newValue,
      SUL: newValue,
      "Invoice Specialist": newValue,
      "Account Manager": newValue,
    });
  };

  return (
    <Card sx={{ mt: 3, boxShadow: 3 }}>
      <CardContent sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
          <Description sx={{ fontSize: 32, color: "primary.main", mr: 2 }} />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: "bold" }}>
              Export Summary Reports
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Generate detailed Excel reports with filters
            </Typography>
          </Box>
        </Box>

        {/* Filters */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={3}>
            <TextField
              label="Start Date"
              type="date"
              value={startDate}
              onChange={(e) => handlefilterReports(e.target.value, endDate)}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              label="End Date"
              type="date"
              value={endDate}
              onChange={(e) => handlefilterReports(startDate, e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              select
              label="Status Filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              fullWidth
            >
              <MenuItem value="All">All Statuses</MenuItem>
              <MenuItem value="Pending">Pending</MenuItem>
              <MenuItem value="Approved">Approved</MenuItem>
              <MenuItem value="Rejected">Rejected</MenuItem>
            </TextField>
          </Grid>

          <Grid item xs={12}>
            <FormControl component="fieldset" variant="standard" fullWidth>
              <FormLabel component="legend" sx={{ fontSize: "0.875rem", mb: 1 }}>
                Submitted By
              </FormLabel>
              <FormGroup row>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={allRolesSelected}
                      indeterminate={someRolesSelected}
                      onChange={handleSelectAllRoles}
                      size="small"
                    />
                  }
                  label={<Typography variant="body2" sx={{ fontWeight: 600 }}>All Roles</Typography>}
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
                  label={<Typography variant="body2">Invoice Specialist</Typography>}
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
          </Grid>
          
        </Grid>

        {/* Summary Statistics */}
        <Paper 
          sx={{ 
            p: 3, 
            mt: 3, 
            bgcolor: "background.paper",
            border: 1,
            borderColor: "divider",
            borderRadius: 2
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
            <TrendingUp sx={{ mr: 1, color: "primary.main" }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Report Summary
            </Typography>
          </Box>
          
          <Grid container spacing={3}>
            {/* Status Cards */}
            <Grid item xs={6} sm={3}>
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 2, 
                  textAlign: "center",
                  bgcolor: "primary.lighter",
                  border: 1,
                  borderColor: "primary.light"
                }}
              >
                <Typography
                  variant="h4"
                  sx={{ fontWeight: "bold", color: "primary.main" }}
                >
                  {stats.total}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                  Total Records
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 2, 
                  textAlign: "center",
                  bgcolor: "warning.lighter",
                  border: 1,
                  borderColor: "warning.light"
                }}
              >
                <Typography
                  variant="h4"
                  sx={{ fontWeight: "bold", color: "warning.main" }}
                >
                  {stats.pending}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                  Pending
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 2, 
                  textAlign: "center",
                  bgcolor: "success.lighter",
                  border: 1,
                  borderColor: "success.light"
                }}
              >
                <Typography
                  variant="h4"
                  sx={{ fontWeight: "bold", color: "success.main" }}
                >
                  {stats.approved}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                  Approved
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 2, 
                  textAlign: "center",
                  bgcolor: "error.lighter",
                  border: 1,
                  borderColor: "error.light"
                }}
              >
                <Typography
                  variant="h4"
                  sx={{ fontWeight: "bold", color: "error.main" }}
                >
                  {stats.rejected}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                  Rejected
                </Typography>
              </Paper>
            </Grid>

            {/* Amount Summary */}
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box sx={{ textAlign: "center", p: 2 }}>
                <Typography
                  variant="h5"
                  sx={{ fontWeight: "bold", color: "secondary.main" }}
                >
                  ₱{stats.totalAmount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                  Total Amount
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {/* Action Buttons */}
        <Box sx={{ display: "flex", gap: 2, mt: 3, flexWrap: "wrap" }}>
          <Button
            variant="contained"
            color="success"
            startIcon={<Download />}
            onClick={exportToExcel}
            disabled={filteredData.length === 0}
            sx={{ flex: { xs: "1 1 100%", sm: 1 }, minWidth: 200 }}
          >
            Export to Excel ({stats.total} records)
          </Button>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<Preview />}
            onClick={() => setShowPreview(!showPreview)}
            disabled={filteredData.length === 0}
            sx={{ minWidth: 200 }}
          >
            {showPreview ? "Hide Preview" : "Preview Data"}
          </Button>
        </Box>

        {/* Preview Table */}
        {showPreview && filteredData.length > 0 && (
          <TableContainer component={Paper} sx={{ mt: 3, maxHeight: 400, boxShadow: 2 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell
                    sx={{
                      fontWeight: "bold",
                      bgcolor: "primary.main",
                      color: "primary.contrastText",
                    }}
                  >
                    ID
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: "bold",
                      bgcolor: "primary.main",
                      color: "primary.contrastText",
                    }}
                  >
                    Employee
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: "bold",
                      bgcolor: "primary.main",
                      color: "primary.contrastText",
                    }}
                  >
                    SAP Code
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: "bold",
                      bgcolor: "primary.main",
                      color: "primary.contrastText",
                    }}
                  >
                    Category
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: "bold",
                      bgcolor: "primary.main",
                      color: "primary.contrastText",
                    }}
                  >
                    Subject
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: "bold",
                      bgcolor: "primary.main",
                      color: "primary.contrastText",
                    }}
                    align="right"
                  >
                    Amount
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: "bold",
                      bgcolor: "primary.main",
                      color: "primary.contrastText",
                    }}
                  >
                    Dates
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredData.slice(0, 10).map((item, index) => (
                  <TableRow 
                    key={item.id} 
                    hover
                    sx={{ '&:nth-of-type(odd)': { bgcolor: 'action.hover' } }}
                  >
                    <TableCell sx={{ fontFamily: 'monospace' }}>{item.id}</TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {item.user?.name || "Unknown"}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {item.user?.role || "N/A"}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ fontFamily: 'monospace' }}>{item.sapCode || item.sap_code || "N/A"}</TableCell>
                    <TableCell>{item.category || item.type || "N/A"}</TableCell>
                    <TableCell>
                      {item.items?.substring(0, 40) || "N/A"}
                      {item.items?.length > 40 ? "..." : ""}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>
                      ₱{parseFloat(item.total).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="caption" display="block">
                          Expense: {item.date || item.date_of_expense || "N/A"}
                        </Typography>
                        <Typography variant="caption" display="block" color="text.secondary">
                          Submitted: {item.submittedAt ? new Date(item.submittedAt).toLocaleDateString() : item.submitted_at ? new Date(item.submitted_at).toLocaleDateString() : "N/A"}
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {filteredData.length > 10 && (
              <Box sx={{ p: 2, textAlign: "center", bgcolor: "action.hover" }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                  Showing first 10 of {filteredData.length} records. Export to see all data.
                </Typography>
              </Box>
            )}
          </TableContainer>
        )}
      </CardContent>
    </Card>
  );
}

export default SalesDirectorReportExport;