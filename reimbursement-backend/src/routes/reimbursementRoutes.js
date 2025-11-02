//src/routes/reimbursementRoutes.js
import express from 'express';
import { 
  createReimbursement, 
  getUserReimbursements, 
  updateReimbursementStatus, 
  getPendingApprovals,
  getPendingAllApprovals
} from '../controllers/reimbursementController.js';
import { upload } from '../middlewares/upload.js';
import Reimbursement from '../models/Reimbursement.js';  // ← MUST HAVE THIS
import { Op } from 'sequelize';  // ← MUST HAVE THIS

const router = express.Router();

// ⬅️ Middleware to check if user is authenticated via session (Passport)
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({ message: 'Not authenticated' });
};

// 📤 Submit a new reimbursement request
router.post('/', isAuthenticated, upload.single('receipt'), createReimbursement);

// 📥 Get current user's reimbursements (for Status Tracker)
router.get('/my-reimbursements', isAuthenticated, getUserReimbursements);

// 📊 Get monthly statistics for current user - NEW ROUTE
router.get('/monthly-stats', isAuthenticated, async (req, res) => {
  try {
    console.log('📊 Monthly stats endpoint hit!');
    console.log('req.user:', req.user);
    
    const userId = req.user.id || req.user.userId || req.user.user_id;
    console.log('Looking for reimbursements for userId:', userId);
    
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    console.log('Start of month:', startOfMonth);

    const reimbursements = await Reimbursement.findAll({
      where: {
        user_id: userId,
        submitted_at: {
          [Op.gte]: startOfMonth
        }
      }
    });
    
    console.log('Found reimbursements:', reimbursements.length);

    const stats = {
      submitted: reimbursements.length,
      approved: reimbursements.filter(r => r.status === 'Approved').length,
      pending: reimbursements.filter(r => 
        r.status === 'Pending' || 
        r.status === 'Manager Approved' || 
        r.status === 'Michelle Approved'
      ).length,
      rejected: reimbursements.filter(r => r.status === 'Rejected').length,
      total: reimbursements.length
    };
    
    console.log('Calculated stats:', stats);
    res.json(stats);
  } catch (error) {
    console.error('Error fetching monthly stats:', error);
    res.status(500).json({ message: 'Error fetching monthly statistics' });
  }
});

// 📋 Get reimbursements pending current user's approval (for Approval Dashboard)
router.get('/pending-approvals', isAuthenticated, getPendingApprovals);

router.get('/pending-all-approvals', isAuthenticated, getPendingAllApprovals);

// 📝 Update reimbursement status (approve/reject)
router.put('/:id', isAuthenticated, updateReimbursementStatus);

export default router;