const DocumentService = require('../services/documentService');
const NLPService = require('../services/nlpService');
const { createDocument } = require('../models/documentModel');
const cloudinary = require('cloudinary').v2; // Assuming you've installed cloudinary

// Configure Cloudinary with your credentials
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadController = {
  async uploadAndAnalyze(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const { originalname, buffer, size } = req.file;
      
      // Upload the file buffer to Cloudinary
      const uploadResult = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { resource_type: 'raw', folder: 'documents' }, // Set resource_type to 'raw' for non-image files
          (error, uploadResult) => {
            if (error) return reject(error);
            resolve(uploadResult);
          }
        ).end(buffer);
      });

      // The URL and public ID of the file from Cloudinary
      const filePath = uploadResult.secure_url;
      const publicId = uploadResult.public_id;
      
      // Extract text from document using the new file path (URL)
      const documentService = new DocumentService();
      const extractedText = await documentService.extractText(filePath, originalname);
      
      if (!extractedText || extractedText.trim().length === 0) {
        return res.status(400).json({ error: 'Could not extract text from document' });
      }

      // Perform NLP analysis
      const nlpService = new NLPService();
      const analysis = await nlpService.analyzeDocument(extractedText);

      // Save to database
      const documentData = {
        id: publicId,
        originalName: originalname,
        fileName: publicId, // Use publicId as the file name
        filePath: filePath,
        textContent: extractedText,
        analysis: analysis,
        uploadDate: new Date(),
        fileSize: size
      };

      const savedDocument = await createDocument(documentData);

      res.status(201).json({
        message: 'Document uploaded and analyzed successfully',
        document: savedDocument
      });

    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ 
        error: 'Failed to upload and analyze document',
        message: error.message 
      });
    }
  },

  async uploadMultiple(req, res) {
    // ... (This function needs a similar update to handle cloud uploads)
    res.status(501).json({ error: 'This endpoint is not yet updated for cloud storage.' });
  }
};

module.exports = uploadController;