import { Router } from 'express';
import {
  addProjectFile,
  listProjectFiles,
  recordFileDownload,
  uploadProjectFile,
} from '../controllers/fileController';
import { upload } from '../middleware/uploadMiddleware';
import { protect } from '../middleware/authMiddleware';
import { validateOrigin } from '../middleware/csrfMiddleware';

const router = Router({ mergeParams: true });

router.use(protect(), validateOrigin);

router.get('/', listProjectFiles);
router.post('/', addProjectFile);
router.post('/upload', upload.single('file'), uploadProjectFile);
router.post('/:fileId/download', recordFileDownload);

export default router;
