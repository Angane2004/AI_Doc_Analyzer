const express = require('express');
const multer = require('multer');
const path = require('path');

const uploadController = require('../controllers/uploadController');
const { validateFile } = require('../middleware/fileValidation');

const router = express.Router();

// Configure multer to store files in memory
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.docx'];
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and DOCX files are allowed'), false);
    }
  }
});

// Upload and analyze document
router.post('/', upload.single('document'), validateFile, uploadController.uploadAndAnalyze);

// Upload multiple documents for comparison
router.post('/multiple', upload.array('documents', 5), validateFile, uploadController.uploadMultiple);

module.exports = router;