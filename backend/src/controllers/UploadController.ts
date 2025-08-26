import type { Request, Response } from "express";

export class UploadController {
  static async uploadProfilePicture(req: Request, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const fileUrl = `/uploads/${req.file.filename}`;
      res.json({ 
        success: true, 
        fileUrl,
        message: 'Profile picture uploaded successfully' 
      });
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ error: 'Failed to upload file' });
    }
  }
}
