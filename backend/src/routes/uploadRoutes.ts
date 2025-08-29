import { Router } from 'express';
import { upload } from '../middlewares/upload.js';
import path from 'path';

const router = Router();

// Upload general file (for passport, documents, etc.)
router.post('/file', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        error: 'No file uploaded' 
      });
    }

    // Return file URL that can be accessed via static files
    const fileUrl = `/uploads/${req.file.filename}`;
    
    res.json({
      success: true,
      fileUrl,
      originalName: req.file.originalname,
      filename: req.file.filename,
      size: req.file.size
    });
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to upload file' 
    });
  }
});

// Upload profile picture (existing)
router.post('/profile-picture', upload.single('profilePicture'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        error: 'No file uploaded' 
      });
    }

    // Return file URL that can be accessed via static files
    const fileUrl = `/uploads/${req.file.filename}`;
    
    res.json({
      success: true,
      fileUrl,
      originalName: req.file.originalname,
      filename: req.file.filename,
      size: req.file.size
    });
  } catch (error) {
    console.error('Profile picture upload error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to upload profile picture' 
    });
  }
});

export default router;
