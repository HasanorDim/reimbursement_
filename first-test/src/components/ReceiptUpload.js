import { useTheme } from '@mui/material/styles';
import React, { useState, useEffect } from 'react';
import { useAppContext } from '../App';
import {
  Box,
  Button,
  Typography,
  TextField,
  Card,
  CardContent,
  LinearProgress,
  MenuItem,
  Grid,
  IconButton,
  Paper,
  Alert,
  Backdrop,
  CircularProgress,
} from '@mui/material';
import {
  CloudUpload,
  Image as ImageIcon,
  Delete,
  CheckCircle,
  Refresh,
} from '@mui/icons-material';

function ReceiptUpload() {
  const theme = useTheme();
  const { showNotification, user } = useAppContext();
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [extractedText, setExtractedText] = useState('');
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    items: '',
    total: '',
    description: '',
    category: 'Meal with Client',
    merchant: '',
    sap_code: '',
  });
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [errors, setErrors] = useState({});
  const [availableSapCodes, setAvailableSapCodes] = useState([]);

  const categories = [
    'Transportation (Commute)',
    'Transportation (Drive)',
    'Meal with Client',
    'Overtime Meal',
    'Accomodation',
    'Other',
  ];

  useEffect(() => {
    if (user) {
      const codes = [user.sap_code_1, user.sap_code_2].filter(Boolean);
      setAvailableSapCodes(codes);
      
      if (codes.length === 1) {
        setFormData(prev => ({ ...prev, sap_code: codes[0] }));
      }
    }
  }, [user]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showNotification('File size must be less than 5MB', 'error');
        return;
      }
      if (!file.type.startsWith('image/')) {
        showNotification('Please upload an image file', 'error');
        return;
      }

      setImage(file);
      setExtractedText('');
      setErrors((prev) => ({ ...prev, image: '' }));

      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOCR = async () => {
    if (!image) {
      showNotification('Please select an image first', 'warning');
      return;
    }
 
    setLoading(true);
    setOcrProgress(0);
 
    try {
      const progressInterval = setInterval(() => {
        setOcrProgress((prev) => {
          if (prev >= 90) return 90;
          return prev + 10;
        });
      }, 200);
 
      const formDataToSend = new FormData();
      formDataToSend.append('image', image);
 
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/ocr/structured`, {
        method: 'POST',
        body: formDataToSend,
        credentials: 'include',
      });
 
      clearInterval(progressInterval);
      setOcrProgress(100);
 
      const data = await res.json();
 
      if (!res.ok) throw new Error(data.error || 'OCR failed');
 
      setExtractedText(data.cleanedText || data.rawText);
 
      if (data.structured) {
        const structured = data.structured;
       
        console.log('🤖 AI Extracted Data:', structured);
       
        let formattedDate = formData.date;
        if (structured.date) {
          try {
            const parts = structured.date.split(/[/-]/);
            if (parts.length === 3) {
              let [day, month, year] = parts;
             
              day = day.padStart(2, '0');
              month = month.padStart(2, '0');
             
              if (year.length === 2) {
                year = '20' + year;
              }
             
              formattedDate = `${year}-${month}-${day}`;
              console.log('📅 Date:', structured.date, '→', formattedDate);
            }
          } catch (e) {
            console.error('❌ Date parse error:', e);
          }
        }
 
        let itemsText = '';
        if (Array.isArray(structured.items) && structured.items.length > 0) {
          itemsText = structured.items
            .map(item => {
              if (typeof item === 'object' && item.description) {
                return item.price && item.price > 0
                  ? `${item.description} - ₱${parseFloat(item.price).toFixed(2)}`
                  : item.description;
              }
              return '';
            })
            .filter(line => line.trim())
            .join('\n');
         
          console.log('📦 Items:', structured.items.length, 'extracted');
        }
 
        let formattedTotal = '';
        if (structured.total) {
          formattedTotal = String(parseFloat(structured.total).toFixed(2));
          console.log('💰 Total: ₱', formattedTotal);
        }
 
        setFormData((prev) => ({
          ...prev,
          date: formattedDate,
          merchant: structured.merchant || prev.merchant,
          total: formattedTotal || prev.total,
          description: itemsText || prev.description,
        }));
 
        const details = [
          structured.merchant ? `${structured.merchant}` : null,
          structured.date ? `${structured.date}` : null,
          structured.total ? `₱${structured.total}` : null,
        ].filter(Boolean).join(' | ');
 
        showNotification(`✅ Receipt extracted! ${details}`, 'success');
       
      } else {
        showNotification('⚠️ OCR completed but no structured data found', 'warning');
      }
 
    } catch (error) {
      console.error('❌ OCR Error:', error);
      showNotification(`OCR failed: ${error.message}`, 'error');
    } finally {
      setLoading(false);
      setTimeout(() => setOcrProgress(0), 500);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateDate = (dateString) => {
    const selectedDate = new Date(dateString);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    if (selectedDate > today) {
      return 'Date cannot be in the future';
    }
    return '';
  };

  const validateForm = () => {
    const newErrors = {};
   
    const dateError = validateDate(formData.date);
    if (dateError) newErrors.date = dateError;
   
    if (!formData.date) newErrors.date = 'Date is required';
    if (!formData.total || parseFloat(formData.total) <= 0) {
      newErrors.total = 'Valid total amount is required';
    }
    if (!formData.category) newErrors.category = 'Category is required';
    if (!formData.items.trim()) newErrors.items = 'Purpose is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.sap_code) newErrors.sap_code = 'SAP code is required';
    if (!image) newErrors.image = 'Receipt image is required';
   
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      showNotification('Please fill in all required fields', 'error');
      return;
    }

    if (!user) {
      showNotification('Please log in first', 'error');
      return;
    }

    setSubmitting(true);

    try {
      // Create FormData for multipart upload
      const formDataToSend = new FormData();
      formDataToSend.append('category', formData.category);
      formDataToSend.append('type', formData.category);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('items', formData.items);
      formDataToSend.append('total', parseFloat(formData.total));
      formDataToSend.append('merchant', formData.merchant);
      formDataToSend.append('date_of_expense', formData.date);
      formDataToSend.append('sap_code', formData.sap_code);
      
      // Append the actual image file
      if (image) {
        formDataToSend.append('receipt', image);
      }

      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/reimbursements`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
        body: formDataToSend,
        credentials: 'include',
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `Server responded with ${res.status}`);
      }
      
      const data = await res.json();

      showNotification('Reimbursement submitted successfully!', 'success');
      console.log('Created reimbursement:', data);

      // Reset form
      setFormData({
        date: new Date().toISOString().split('T')[0],
        items: '',
        total: '',
        description: '',
        category: 'Meal with Client',
        merchant: '',
        sap_code: availableSapCodes.length === 1 ? availableSapCodes[0] : '',
      });
      setImage(null);
      setImagePreview(null);
      setExtractedText('');
      setErrors({});
    } catch (err) {
      console.error('Error submitting reimbursement:', err);
      showNotification(err.message || 'Failed to submit reimbursement', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClearImage = () => {
    setImage(null);
    setImagePreview(null);
    setExtractedText('');
    setErrors((prev) => ({ ...prev, image: '' }));
  };

  return (
    <>
      <Card>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3 }}>
            Upload Receipt for Reimbursement
          </Typography>

          {availableSapCodes.length === 0 && (
            <Alert severity="warning" sx={{ mb: 3 }}>
              No SAP codes assigned to your account. Please contact your administrator.
            </Alert>
          )}

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Paper
                sx={{
                  p: 3,
                  border: 2,
                  borderStyle: 'dashed',
                  borderColor: errors.image ? 'error.main' : 'divider',
                  borderRadius: 2,
                  textAlign: 'center',
                  bgcolor: 'action.hover',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  '&:hover': {
                    borderColor: 'primary.main',
                    bgcolor: 'action.selected',
                  },
                }}
              >
                {imagePreview ? (
                  <Box>
                    <Box sx={{ position: 'relative', mb: 2 }}>
                      <img
                        src={imagePreview}
                        alt="Receipt preview"
                        style={{
                          maxWidth: '100%',
                          maxHeight: '400px',
                          borderRadius: '8px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        }}
                        onError={() => showNotification('Failed to load image preview', 'error')}
                      />
                      <IconButton
                        onClick={handleClearImage}
                        sx={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          bgcolor: 'background.paper',
                          '&:hover': { bgcolor: 'background.default' },
                        }}
                      >
                        <Delete color="error" />
                      </IconButton>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                      <Button
                        variant="contained"
                        startIcon={loading ? <Refresh /> : <ImageIcon />}
                        onClick={handleOCR}
                        disabled={loading}
                        color="primary"
                      >
                        {loading ? 'Processing...' : 'Extract Text (OCR)'}
                      </Button>
                    </Box>
                    {loading && (
                      <Box sx={{ mt: 2 }}>
                        <LinearProgress variant="determinate" value={ocrProgress} />
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                          {ocrProgress}% Complete
                        </Typography>
                      </Box>
                    )}
                  </Box>
                ) : (
                  <label htmlFor="receipt-upload" style={{ cursor: 'pointer', display: 'block' }}>
                    <input
                      id="receipt-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      style={{ display: 'none' }}
                    />
                    <CloudUpload sx={{ 
                      fontSize: 64, 
                      color: theme.palette.mode === 'dark' ? theme.palette.primary.light : '#00387e', 
                      mb: 2 
                    }} />
                    <Typography variant="h6" sx={{ mb: 1 }}>
                      Click to Upload Receipt
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Supported formats: JPG, PNG, JPEG (Max 5MB)
                    </Typography>
                  </label>
                )}
                {errors.image && (
                  <Typography variant="caption" sx={{ color: 'error.main', mt: 1, display: 'block' }}>
                    {errors.image}
                  </Typography>
                )}
              </Paper>

              {extractedText && (
                <Paper sx={{ mt: 2, p: 2, bgcolor: 'action.hover' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                    Extracted Text:
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      maxHeight: 150,
                      overflow: 'auto',
                      whiteSpace: 'pre-wrap',
                      fontFamily: 'monospace',
                      fontSize: '0.75rem',
                    }}
                  >
                    {extractedText}
                  </Typography>
                </Paper>
              )}
            </Grid>

            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                <TextField
                  select
                  label="SAP Code *"
                  name="sap_code"
                  value={formData.sap_code}
                  onChange={handleChange}
                  fullWidth
                  error={!!errors.sap_code}
                  helperText={errors.sap_code || 'Select the department/project for this expense'}
                  disabled={availableSapCodes.length === 0}
                >
                  {availableSapCodes.map((code) => (
                    <MenuItem key={code} value={code}>
                      {code}
                    </MenuItem>
                  ))}
                </TextField>

                <TextField
                  select
                  label="Category *"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  fullWidth
                  error={!!errors.category}
                  helperText={errors.category}
                >
                  {categories.map((cat) => (
                    <MenuItem key={cat} value={cat}>
                      {cat}
                    </MenuItem>
                  ))}
                </TextField>

                <TextField
                  label="Date *"
                  name="date"
                  type="date"
                  value={formData.date}
                  onChange={handleChange}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  error={!!errors.date}
                  helperText={errors.date}
                  InputProps={{
                    sx: {
                      '& input[type="date"]::-webkit-calendar-picker-indicator': {
                        filter: theme.palette.mode === 'dark' ? 'invert(1)' : 'none'
                      }
                    }
                  }}
                />

                <TextField
                  label="Merchant/Vendor"
                  name="merchant"
                  value={formData.merchant}
                  onChange={handleChange}
                  fullWidth
                  placeholder="e.g., Grab, Jollibee, Office Depot"
                />

                <TextField
                  label="Total Amount (₱) *"
                  name="total"
                  type="number"
                  value={formData.total}
                  onChange={handleChange}
                  fullWidth
                  inputProps={{ step: '0.01', min: '0' }}
                  error={!!errors.total}
                  helperText={errors.total}
                />

                <TextField
                  label="Purpose *"
                  name="items"
                  value={formData.items}
                  onChange={handleChange}
                  fullWidth
                  multiline
                  rows={3}
                  placeholder="Purpose of the expense..."
                  error={!!errors.items}
                  helperText={errors.items || 'Explain the business purpose of this expense'}
                />
                
                <TextField
                  label="Description *"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  fullWidth
                  multiline
                  rows={3}
                  placeholder="Description of this reimbursement application..."
                  error={!!errors.description}
                  helperText={errors.description}
                />

                <Button
                  variant="contained"
                  onClick={handleSubmit}
                  size="large"
                  startIcon={<CheckCircle />}
                  sx={{
                    py: 1.5,
                    fontWeight: 600,
                    bgcolor: '#2e7d32',
                    color: '#fafafa',
                    '&:hover': {
                      bgcolor: '#1b5e20',
                    },
                    '&:disabled': {
                      bgcolor: 'action.disabledBackground',
                      color: 'action.disabled',
                    },
                  }}
                  disabled={loading || availableSapCodes.length === 0 || submitting}
                >
                  {submitting ? 'Submitting...' : 'Submit for Approval'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Backdrop Loader for Submission */}
      <Backdrop
        sx={{
          color: '#fff',
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backdropFilter: 'blur(8px)',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
        }}
        open={submitting}
      >
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress color="inherit" size={60} thickness={4} />
          <Typography variant="h6" sx={{ mt: 3, fontWeight: 600 }}>
            Submitting Receipt...
          </Typography>
          <Typography variant="body2" sx={{ mt: 1, opacity: 0.8 }}>
            Please wait while we process your reimbursement
          </Typography>
        </Box>
      </Backdrop>
    </>
  );
}

export default ReceiptUpload