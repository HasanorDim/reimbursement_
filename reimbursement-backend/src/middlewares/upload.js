// reimbursement-backend/src/middleware/upload.js
import multer from 'multer';

// 🆕 Use memory storage instead of disk storage
const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed!'));
    }
    cb(null, true);
  },
});

// 🆕 Helper function to convert buffer to base64
export function bufferToBase64(buffer) {
  return buffer.toString('base64');
}

// 🆕 Helper function to convert base64 to buffer (for serving images)
export function base64ToBuffer(base64String) {
  return Buffer.from(base64String, 'base64');
}