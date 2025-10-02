import { Router } from 'express';
import multer from 'multer';
import { proxyIngest, proxyQuery } from '../controllers/ragController.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });

router.post('/upload', upload.array('files', 10), proxyIngest);
router.post('/query', proxyQuery);

export default router;


