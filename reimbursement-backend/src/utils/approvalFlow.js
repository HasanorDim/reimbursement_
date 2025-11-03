// reimbursement-backend/src/utils/approvalFlow.js

// Define all possible approval chains based on submitter's role
const approvalFlows = {
  Employee: ["SUL", "Account Manager", "Invoice Specialist", "Finance Officer"],
  SUL: ["Sales Director", "Invoice Specialist", "Finance Officer"],
  "Account Manager": ["Sales Director", "Invoice Specialist", "Finance Officer"],
  "Invoice Specialist": ["Sales Director", "Invoice Specialist", "Finance Officer"],
};

// Roles that don't need SAP code matching (can approve any request at their level)
const NON_SAP_DEPENDENT_ROLES = ["Sales Director", "Invoice Specialist", "Finance Officer"];

/**
 * Get the full approval flow for a submitter
 * @param {string} submitterRole - The role of the person submitting
 * @returns {Array} Array of approval roles in order
 */
export function getApprovalFlow(submitterRole) {
  return approvalFlows[submitterRole] || [];
}

/**
 * Get the next approver role in the sequence
 * @param {string} submitterRole - The role of the submitter
 * @param {string} currentApproverRole - Current approver's role
 * @returns {string|null} Next approver role or null if complete
 */
export function getNextApprover(submitterRole, currentApproverRole = null) {
  const flow = approvalFlows[submitterRole];
  if (!flow || flow.length === 0) return null;

  // If no current approver, return the first in the flow
  if (!currentApproverRole) return flow[0];

  // Otherwise, find next in sequence
  const idx = flow.indexOf(currentApproverRole);
  if (idx === -1) return null;
  return flow[idx + 1] || null; // return null if last approver
}

/**
 * Check if a role requires SAP code matching for approval
 * @param {string} role - The approver's role
 * @returns {boolean} True if SAP code matching is required
 */
export function requiresSapCodeMatch(role) {
  return !NON_SAP_DEPENDENT_ROLES.includes(role);
}

/**
 * Find eligible approver with matching SAP code
 * @param {string} role - Target approver role
 * @param {string} sapCode - SAP code from reimbursement request
 * @param {Array} users - List of users to search from
 * @returns {Object|null} Matching user or null
 */
export function findApproverBySapCode(role, sapCode, users) {
  if (!requiresSapCodeMatch(role)) {
    // For non-SAP dependent roles, return any user with that role
    return users.find(u => u.role === role) || null;
  }
  
  // For SUL and Account Manager, match SAP code
  return users.find(u => 
    u.role === role && 
    (u.sap_code_1 === sapCode || u.sap_code_2 === sapCode)
  ) || null;
}