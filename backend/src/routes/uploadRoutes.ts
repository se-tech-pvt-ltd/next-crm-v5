import { Router } from 'express';
import { upload, uploadProfilePicture } from '../middlewares/upload.js';
import { v4 as uuidv4 } from 'uuid';
import { AttachmentModel } from '../models/Attachment.js';
import { promises as fs } from 'fs';

const router = Router();
const REMOTE_BASE = process.env.UPLOAD_REMOTE_BASE || 'https://sales.crm-setech.cloud/api';
const REMOTE_HOST = REMOTE_BASE.replace(/\/?api\/?$/, '');

async function forwardToRemote(fieldName: 'file' | 'profilePicture', file: any) {
  try {
    const buf = await fs.readFile(file.path);
    const FD: any = (globalThis as any).FormData;
    const BL: any = (globalThis as any).Blob;
    const fd = new FD();
    const blob = new BL([buf], { type: file.mimetype || 'application/octet-stream' });
    fd.append(fieldName, blob, file.originalname);
    const resp = await fetch(`${REMOTE_BASE}/upload/${fieldName === 'profilePicture' ? 'profile-picture' : 'file'}`, {
      method: 'POST',
      body: fd as any,
    });
    const json: any = await resp.json().catch(() => null);
    if (resp.ok && json && (json.fileUrl || json.url)) {
      const remotePath = String(json.fileUrl || json.url);
      const absoluteUrl = remotePath.startsWith('http') ? remotePath : `${REMOTE_HOST}${remotePath.startsWith('/') ? '' : '/'}${remotePath}`;
      return { ok: true, absoluteUrl } as const;
    }
  } catch (e) {
    console.error('Forward to remote failed:', e);
  }
  return { ok: false, absoluteUrl: '' } as const;
}

// Upload general file (for passport, documents, etc.)
router.post('/file', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    const localUrl = `/uploads/${req.file.filename}`;

    let finalUrl = localUrl;
    const forwarded = await forwardToRemote('file', req.file);
    if (forwarded.ok && forwarded.absoluteUrl) {
      finalUrl = forwarded.absoluteUrl;
      try { await fs.unlink(req.file.path); } catch {}
    }

    const id = uuidv4();
    try { await AttachmentModel.create({ id, path: finalUrl }); } catch (e) { console.error('Failed to persist attachment:', e); }

    res.json({
      success: true,
      fileUrl: finalUrl,
      attachmentId: id,
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
router.post('/profile-picture', uploadProfilePicture.single('profilePicture'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    const localUrl = `/uploads/${req.file.filename}`;

    let finalUrl = localUrl;
    const forwarded = await forwardToRemote('profilePicture', req.file);
    if (forwarded.ok && forwarded.absoluteUrl) {
      finalUrl = forwarded.absoluteUrl;
      try { await fs.unlink(req.file.path); } catch {}
    }

    const id = uuidv4();
    try { await AttachmentModel.create({ id, path: finalUrl }); } catch (e) { console.error('Failed to persist attachment:', e); }

    res.json({
      success: true,
      fileUrl: finalUrl,
      attachmentId: id,
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
