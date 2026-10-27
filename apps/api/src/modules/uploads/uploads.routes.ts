import { Router, type RequestHandler } from 'express';
import multer from 'multer';
import { CommonErrorCode, InventoryErrorCode, UPLOAD_MAX_BYTES } from '@dzen/shared';
import { uploadsService } from '../../lib/container.js';
import { requireAuth } from '../../middleware/auth.js';
import { AppError } from '../../middleware/error.js';
import { createIpRateLimit } from '../../middleware/rate-limit.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: UPLOAD_MAX_BYTES, files: 1 },
});

const uploadRateLimit = createIpRateLimit(
  30,
  10 * 60 * 1000,
  'Too many uploads, try again in a few minutes',
);

const receiveFile: RequestHandler = (req, res, next) => {
  upload.single('file')(req, res, (err: unknown) => {
    if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
      return next(new AppError(413, InventoryErrorCode.FileTooLarge, 'File is larger than 2 MB'));
    }
    next(err);
  });
};

export const uploadsRouter: Router = Router();

uploadsRouter.post('/uploads', requireAuth, uploadRateLimit, receiveFile, async (req, res) => {
  if (!req.file) {
    throw new AppError(400, CommonErrorCode.ValidationFailed, 'Field "file" is required');
  }
  const url = await uploadsService.saveImage(req.file.buffer);
  res.status(201).json({ url });
});
