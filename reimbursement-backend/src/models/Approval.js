//reimbursement-backend/src/models/Approval.js

import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Approval = sequelize.define('Approval', {
  id: { 
    type: DataTypes.INTEGER, 
    primaryKey: true, 
    autoIncrement: true 
  },
  reimbursement_id: { 
    type: DataTypes.INTEGER, 
    allowNull: false 
  },
  approver_id: { 
    type: DataTypes.INTEGER, 
    allowNull: true  // ← NULL when pending
  },
  approver_role: {  // ← NEW
    type: DataTypes.STRING,
    allowNull: false
  },
  approval_level: {  // ← NEW
    type: DataTypes.INTEGER,
    allowNull: false
  },
  status: {  // ← NEW
    type: DataTypes.ENUM('Pending', 'Approved', 'Rejected'),
    defaultValue: 'Pending'
  },
  remarks: { 
    type: DataTypes.TEXT 
  },
  approved_at: { 
    type: DataTypes.DATE, 
    allowNull: true
  }
}, {
  tableName: 'approvals',
  timestamps: true
});

export default Approval;