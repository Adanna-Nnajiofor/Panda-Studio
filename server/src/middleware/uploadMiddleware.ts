import path from 'path';
import multer from 'multer';

// ─── Types ────────────────────────────────────────────────────────────────────

/** Typed req.file shape populated by multer memoryStorage */
export type MulterFile = Express.Multer.File;

// ─── Allowed types ────────────────────────────────────────────────────────────

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'video/mp4',
  'video/quicktime',
  'audio/mpeg',
  'audio/wav',
  'application/pdf',
  'application/zip',
]);

const ALLOWED_EXTENSIONS = new Set([
  '.jpg', '.jpeg', '.png', '.webp', '.gif',
  '.mp4', '.mov',
  '.mp3', '.wav',
  '.pdf', '.zip',
]);

const IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);

// ─── File size limits ─────────────────────────────────────────────────────────

const MB = 1024 * 1024;

const FILE_SIZE_LIMITS = {
  image: 10 * MB,   // 10 MB for images / avatars
  media: 500 * MB,  // 500 MB for video/audio
  document: 50 * MB, // 50 MB for PDFs/ZIPs
  default: 100 * MB,
} as const;

// ─── Filename sanitizer ───────────────────────────────────────────────────────

export const sanitizeFilename = (originalname: string): string => {
  const basename = path.basename(originalname);
  return basename
    .replace(/\.{2,}/g, '.')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .slice(0, 200);
};

// ─── Shared storage ───────────────────────────────────────────────────────────

/**
 * Always use memoryStorage so req.file.buffer is available
 * for the Cloudinary upload helper downstream.
 *
 * Pipeline: Frontend → Multer (memoryStorage) → req.file.buffer
 *           → uploadToCloudinary() → Cloudinary → URL saved to MongoDB
 */
const memStorage = multer.memoryStorage();

// ─── File filter factories ────────────────────────────────────────────────────

const makeFileFilter = (
  allowedMimes: Set<string>,
  allowedExts: Set<string>,
): multer.Options['fileFilter'] =>
  (_req, file, cb) => {
    const safeName = sanitizeFilename(file.originalname);
    const ext = path.extname(safeName).toLowerCase();

    if (!allowedMimes.has(file.mimetype) || !allowedExts.has(ext)) {
      cb(new Error(`Unsupported or unsafe file type: ${ext}`));
      return;
    }

    file.originalname = safeName;
    cb(null, true);
  };

// ─── Named upload instances ───────────────────────────────────────────────────

/**
 * General-purpose upload — images, video, audio, PDF, ZIP.
 * Use: upload.single('file') | upload.array('files', 10)
 */
export const upload = multer({
  storage: memStorage,
  limits: { fileSize: FILE_SIZE_LIMITS.default },
  fileFilter: makeFileFilter(ALLOWED_MIME_TYPES, ALLOWED_EXTENSIONS),
});

/**
 * Avatar / profile image upload — images only, 10 MB max.
 * Use: uploadAvatar.single('avatar')
 */
export const uploadAvatar = multer({
  storage: memStorage,
  limits: { fileSize: FILE_SIZE_LIMITS.image },
  fileFilter: makeFileFilter(IMAGE_MIME_TYPES, IMAGE_EXTENSIONS),
});

/**
 * Project media upload — all types, 500 MB max.
 * Use: uploadMedia.single('file')
 */
export const uploadMedia = multer({
  storage: memStorage,
  limits: { fileSize: FILE_SIZE_LIMITS.media },
  fileFilter: makeFileFilter(ALLOWED_MIME_TYPES, ALLOWED_EXTENSIONS),
});
