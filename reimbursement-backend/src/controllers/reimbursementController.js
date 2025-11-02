// reimbursement-backend/src/controllers/reimbursementController.js
import { Reimbursement, User, Approval } from "../models/index.js";
import { sendEmail } from "../utils/sendEmail.js";
import { getApprovalFlow, findApproverBySapCode } from "../utils/approvalFlow.js";
import { bufferToBase64 } from "../middlewares/upload.js";
import { newSubmissionToApproverTemplate } from '../utils/emailTemplates.js';

/**
 * Create new reimbursement with SAP code-based approval routing
 */
export async function createReimbursement(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const user = req.user;
    const payload = req.body;

    console.log("📝 Creating reimbursement for user:", user.name, user.role);
    console.log("📅 Received date_of_expense:", payload.date_of_expense);

    // ✅ Validate SAP code is provided
    if (!payload.sap_code) {
      return res.status(400).json({ error: "SAP code is required" });
    }

    // ✅ Validate user has this SAP code
    if (user.sap_code_1 !== payload.sap_code && user.sap_code_2 !== payload.sap_code) {
      return res.status(400).json({ 
        error: "Invalid SAP code. You can only submit reimbursements with your assigned SAP codes.",
        userSapCodes: [user.sap_code_1, user.sap_code_2].filter(Boolean)
      });
    }

    // ✅ Get the full approval flow for this user's role
    const approvalFlow = getApprovalFlow(user.role);

    if (!approvalFlow || approvalFlow.length === 0) {
      return res.status(400).json({
        error: "No approval flow defined for your role",
        role: user.role,
      });
    }

    console.log("📋 Approval flow:", approvalFlow);

    // ✅ Find all potential approvers
    const allUsers = await User.findAll();

    // ✅ Find the first approver (must match SAP code if SUL/Account Manager)
    const firstApproverRole = approvalFlow[0];
    const firstApprover = findApproverBySapCode(firstApproverRole, payload.sap_code, allUsers);

    if (!firstApprover) {
      return res.status(400).json({
        error: `No ${firstApproverRole} found with matching SAP code: ${payload.sap_code}`,
        sapCode: payload.sap_code
      });
    }

    console.log(`✅ First approver: ${firstApprover.name} (${firstApproverRole})`);

    // ✅ Process receipt image from memory buffer
    let receiptData = null;
    let receiptMimetype = null;
    let receiptFilename = null;

    if (req.file) {
      receiptData = bufferToBase64(req.file.buffer);
      receiptMimetype = req.file.mimetype;
      receiptFilename = req.file.originalname;
      console.log(`📸 Receipt uploaded: ${receiptFilename} (${receiptMimetype}), Size: ${req.file.size} bytes`);
    }

    // ✅ Parse date_of_expense properly
    let dateOfExpense = null;
    if (payload.date_of_expense) {
      // Ensure date is in YYYY-MM-DD format
      const dateStr = payload.date_of_expense;
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        dateOfExpense = dateStr;
      } else {
        // Try to parse and format
        const parsedDate = new Date(dateStr);
        if (!isNaN(parsedDate.getTime())) {
          dateOfExpense = parsedDate.toISOString().split('T')[0];
        }
      }
      console.log("📅 Parsed date_of_expense:", dateOfExpense);
    }

    // ✅ Create the reimbursement with SAP code and date_of_expense
    const reimbursement = await Reimbursement.create({
      user_id: user.id,
      category: payload.category,
      type: payload.type || payload.merchant || payload.category,
      description: payload.description,
      items: payload.items,
      merchant: payload.merchant,
      total: payload.total,
      status: "Pending",
      current_approver: firstApproverRole,
      sap_code: payload.sap_code,
      date_of_expense: dateOfExpense,
      receipt_data: receiptData,
      receipt_mimetype: receiptMimetype,
      receipt_filename: receiptFilename,
      submitted_at: new Date(),
    });

    console.log("✅ Created reimbursement #", reimbursement.id);

    // ✅ Create approval records for all levels in the flow
    const approvalRecords = [];
    
    for (let i = 0; i < approvalFlow.length; i++) {
      const approverRole = approvalFlow[i];
      const potentialApprover = findApproverBySapCode(approverRole, payload.sap_code, allUsers);
      
      approvalRecords.push({
        reimbursement_id: reimbursement.id,
        approver_id: potentialApprover ? potentialApprover.id : null,
        approver_role: approverRole,
        approval_level: i + 1,
        status: "Pending",
        remarks: null,
        approved_at: null,
      });
    }

    await Approval.bulkCreate(approvalRecords);
    console.log(`✅ Created ${approvalRecords.length} approval records`);

    // 📧 Send email to FIRST APPROVER when reimbursement is submitted
    if (firstApprover) {
      try {
        const emailHtml = newSubmissionToApproverTemplate(
          {
            sap_code: reimbursement.sap_code,
            category: reimbursement.category,
            total: reimbursement.total,
            items: reimbursement.items,
            description: reimbursement.description,
            date_of_expense: dateOfExpense,
            submitted_at: reimbursement.submitted_at
          },
          {
            name: user.name,
            role: user.role
          },
          firstApprover.name
        );
        
        await sendEmail(
          firstApprover.email,
          `🔔 New Reimbursement Request - ${reimbursement.sap_code}`,
          emailHtml
        );
        
        console.log(`📧 Submission notification email sent to ${firstApprover.name} (${firstApprover.email})`);
      } catch (emailError) {
        console.error('❌ Failed to send submission notification email:', emailError);
        // Don't fail the submission if email fails
      }
    }

    res.json({ reimbursement });
  } catch (err) {
    console.error("❌ Error creating reimbursement:", err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
}

/**
 * Get current user's reimbursements with approval details
 */
export async function getUserReimbursements(req, res) {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    console.log("📋 Fetching reimbursements for user:", user.name);

    const reimbursements = await Reimbursement.findAll({
      where: { user_id: user.id },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "name", "email", "role", "profile_picture"],
        },
        {
          model: Approval,
          as: "approvals",
          include: [
            {
              model: User,
              as: "approver",
              attributes: ["id", "name", "email", "role", "profile_picture"],
            },
          ],
          order: [["approval_level", "ASC"]],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    console.log(`✅ Found ${reimbursements.length} reimbursements`);

    const formattedReimbursements = reimbursements.map((r) => ({
      id: r.id,
      userId: r.user_id,
      user: r.user
        ? {
            id: r.user.id,
            name: r.user.name,
            email: r.user.email,
            role: r.user.role,
            profile_picture: r.user?.dataValues?.profile_picture,
          }
        : null,
      category: r.category,
      type: r.type,
      description: r.description,
      total: r.total,
      status: r.status,
      currentApprover: r.current_approver,
      sapCode: r.sap_code,
      date: r.date_of_expense ? new Date(r.date_of_expense).toISOString().split('T')[0] : null,
      receipt: r.receipt_data
        ? {
            data: r.receipt_data,
            mimetype: r.receipt_mimetype,
            filename: r.receipt_filename,
          }
        : null,
      submittedAt: r.submitted_at ? r.submitted_at.toISOString() : null,
      approvedAt: r.approved_at ? r.approved_at.toISOString() : null,
      merchant: r.merchant,
      items: r.items,
      extractedText: null,
      approvals: r.approvals || [],
    }));

    res.json(formattedReimbursements);
  } catch (err) {
    console.error("❌ Error fetching reimbursements:", err);
    res.status(500).json({ error: "Failed to fetch reimbursements" });
  }
}

/**
 * Get reimbursements pending the current user's approval (with SAP code filtering)
 */
export async function getPendingApprovals(req, res) {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    console.log("🔍 Fetching pending approvals for role:", user.role);

    const whereClause = {
      current_approver: user.role,
      status: "Pending",
    };

    // ✅ If user is SUL or Account Manager, filter by SAP code
    if (["SUL", "Account Manager"].includes(user.role)) {
      const userSapCodes = [user.sap_code_1, user.sap_code_2].filter(Boolean);
      
      if (userSapCodes.length === 0) {
        console.log("⚠️ User has no SAP codes assigned");
        return res.json([]);
      }
      
      whereClause.sap_code = userSapCodes;
      console.log("🔍 Filtering by SAP codes:", userSapCodes);
    }

    const reimbursements = await Reimbursement.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "name", "email", "role", "profile_picture"],
        },
        {
          model: Approval,
          as: "approvals",
          include: [
            {
              model: User,
              as: "approver",
              attributes: ["id", "name", "email", "role", "profile_picture"],
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    console.log(`✅ Found ${reimbursements.length} pending approvals`);

    const formatted = reimbursements.map((r) => ({
      id: r.id,
      userId: r.user_id,
      user: r.user
        ? {
            id: r.user.id,
            name: r.user.name,
            email: r.user.email,
            role: r.user.role,
            profile_picture: r.user?.dataValues?.profile_picture,
          }
        : null,
      category: r.category,
      type: r.type,
      description: r.description,
      total: r.total,
      status: r.status,
      currentApprover: r.current_approver,
      sapCode: r.sap_code,
      date: r.date_of_expense ? new Date(r.date_of_expense).toISOString().split('T')[0] : null,
      receipt: r.receipt_data
        ? {
            data: r.receipt_data,
            mimetype: r.receipt_mimetype,
            filename: r.receipt_filename,
          }
        : null,
      submittedAt: r.submitted_at ? r.submitted_at.toISOString() : null,
      merchant: r.merchant,
      items: r.items,
      extractedText: null,
      approvals: r.approvals || [],
    }));
    
    res.json(formatted);
  } catch (err) {
    console.error("❌ Error fetching pending approvals:", err);
    res.status(500).json({ error: "Failed to fetch pending approvals" });
  }
}

export async function getPendingAllApprovals(req, res) {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    console.log("🔍 Fetching pending approvals for role:", user.role);

    const whereClause = {
      // current_approver: user.role,
      status: ["Pending"],
    };

    // ✅ If user is SUL or Account Manager, DON'T filter by SAP code - get ALL data
    if (["SUL", "Account Manager"].includes(user.role)) {
      console.log(
        "🔍 SUL/Account Manager - fetching ALL pending approvals without SAP code filter"
      );
      // Remove any SAP code filtering - whereClause remains as is (only role and status)
    } else {
      // For other roles, you can keep SAP code filtering if needed
      const userSapCodes = [user.sap_code_1, user.sap_code_2].filter(Boolean);
      if (userSapCodes.length > 0) {
        whereClause.sap_code = userSapCodes;
        console.log("🔍 Filtering by SAP codes:", userSapCodes);
      }
    }

    const reimbursements = await Reimbursement.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "name", "email", "role", "profile_picture"],
        },
        {
          model: Approval,
          as: "approvals",
          include: [
            {
              model: User,
              as: "approver",
              attributes: ["id", "name", "email", "role", "profile_picture"],
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    console.log(`✅ Found ${reimbursements.length} pending approvals`);

    const formatted = reimbursements.map((r) => ({
      id: r.id,
      userId: r.user_id,
      user: r.user
        ? {
            id: r.user.id,
            name: r.user.name,
            email: r.user.email,
            role: r.user.role,
            profile_picture: r.user?.dataValues?.profile_picture,
          }
        : null,
      category: r.category,
      type: r.type,
      description: r.description,
      total: r.total,
      status: r.status,
      currentApprover: r.current_approver,
      sapCode: r.sap_code,
      // ✅ FIX: Format dates consistently
      date: r.date_of_expense
        ? new Date(r.date_of_expense).toISOString().split("T")[0]
        : null,
      receipt: r.receipt_data
        ? {
            data: r.receipt_data,
            mimetype: r.receipt_mimetype,
            filename: r.receipt_filename,
          }
        : null,
      submittedAt: r.submitted_at ? r.submitted_at.toISOString() : null,
      merchant: r.merchant,
      items: r.items,
      extractedText: null,
      approvals: r.approvals || [],
    }));

    res.json(formatted);
  } catch (err) {
    console.error("❌ Error fetching pending approvals:", err);
    res.status(500).json({ error: "Failed to fetch pending approvals" });
  }
}

/**
 * Update reimbursement status (approve/reject)
 */
export async function updateReimbursementStatus(req, res) {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const reimbursementId = req.params.id;
    const { action, remarks } = req.body;

    console.log(`🔄 User ${user.name} (${user.role}) attempting to ${action} reimbursement #${reimbursementId}`);

    const reimbursement = await Reimbursement.findByPk(reimbursementId, {
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "name", "email", "role"],
        },
        {
          model: Approval,
          as: "approvals",
          include: [
            {
              model: User,
              as: "approver",
              attributes: ["id", "name", "email", "role"],
            },
          ],
          order: [["approval_level", "ASC"]],
        },
      ],
    });

    if (!reimbursement) {
      return res.status(404).json({ error: "Reimbursement not found" });
    }

    if (reimbursement.current_approver !== user.role) {
      return res.status(403).json({ 
        error: "You are not authorized to approve this reimbursement",
        currentApprover: reimbursement.current_approver,
        yourRole: user.role
      });
    }

    if (["SUL", "Account Manager"].includes(user.role)) {
      const userSapCodes = [user.sap_code_1, user.sap_code_2].filter(Boolean);
      
      if (!userSapCodes.includes(reimbursement.sap_code)) {
        return res.status(403).json({ 
          error: "This reimbursement is assigned to a different SAP code",
          reimbursementSapCode: reimbursement.sap_code,
          yourSapCodes: userSapCodes
        });
      }
    }

    const currentApproval = reimbursement.approvals.find(
      (a) => a.approver_role === user.role && a.status === "Pending"
    );

    if (!currentApproval) {
      return res.status(400).json({ 
        error: "No pending approval found for your role"
      });
    }

    if (action === "reject") {
      await currentApproval.update({
        status: "Rejected",
        approver_id: user.id,
        remarks: remarks || "Rejected",
        approved_at: new Date(),
      });

      await reimbursement.update({
        status: "Rejected",
        current_approver: null,
      });

      console.log(`❌ Reimbursement #${reimbursementId} rejected by ${user.name}`);

      return res.json({ 
        message: "Reimbursement rejected successfully",
        reimbursement: await Reimbursement.findByPk(reimbursementId, {
          include: [
            {
              model: User,
              as: "user",
              attributes: ["id", "name", "email", "role"],
            },
            {
              model: Approval,
              as: "approvals",
              include: [
                {
                  model: User,
                  as: "approver",
                  attributes: ["id", "name", "email", "role"],
                },
              ],
            },
          ],
        })
      });
    }

    if (action === "approve") {
      await currentApproval.update({
        status: "Approved",
        approver_id: user.id,
        remarks: remarks || "Approved",
        approved_at: new Date(),
      });

      console.log(`✅ Approval level ${currentApproval.approval_level} completed by ${user.name}`);

      const nextApproval = reimbursement.approvals.find(
        (a) => a.approval_level === currentApproval.approval_level + 1
      );

      if (nextApproval) {
        const allUsers = await User.findAll();
        const nextApprover = findApproverBySapCode(
          nextApproval.approver_role, 
          reimbursement.sap_code, 
          allUsers
        );

        if (nextApprover) {
          if (!nextApproval.approver_id) {
            await nextApproval.update({
              approver_id: nextApprover.id
            });
          }

          await reimbursement.update({
            current_approver: nextApproval.approver_role,
          });

          console.log(`➡️ Moving to next approver: ${nextApprover.name} (${nextApproval.approver_role})`);
        } else {
          return res.status(500).json({ 
            error: `No ${nextApproval.approver_role} found with matching SAP code: ${reimbursement.sap_code}`
          });
        }
      } else {
        await reimbursement.update({
          status: "Approved",
          current_approver: null,
          approved_at: new Date(),
        });

        console.log(`🎉 Reimbursement #${reimbursementId} FULLY APPROVED`);
      }

      return res.json({ 
        message: nextApproval ? "Approval recorded, moved to next approver" : "Reimbursement fully approved",
        reimbursement: await Reimbursement.findByPk(reimbursementId, {
          include: [
            {
              model: User,
              as: "user",
              attributes: ["id", "name", "email", "role", "profile_picture"],
            },
            {
              model: Approval,
              as: "approvals",
              include: [
                {
                  model: User,
                  as: "approver",
                  attributes: ["id", "name", "email", "role", "profile_picture"],
                },
              ],
            },
          ],
        })
      });
    }

    return res.status(400).json({ 
      error: "Invalid action. Must be 'approve' or 'reject'",
      receivedAction: action
    });

  } catch (err) {
    console.error("❌ Error updating reimbursement status:", err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
}