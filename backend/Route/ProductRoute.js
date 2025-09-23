import express from 'express';
// import { AddProduct, getProduct, Del, edite_get, edite_post } from '../controller/ProductController.js';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { AddProduct, Del, edite_get, edite_post, getProduct, Product_get, SingpleProduct } from '../Controller/ProductController.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('Uploads directory created:', uploadsDir);
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'image-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: function (req, file, cb) {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    }
});

const router = express.Router();

// Upload image endpoint
router.post('/upload', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const imageUrl = `/uploads/${req.file.filename}`;
        res.json({
            message: 'File uploaded successfully',
            imageUrl: imageUrl
        });
    } catch (error) {
        res.status(500).json({
            message: 'File upload failed',
            error: error.message
        });
    }
});

// Product routes

router.post('/add', upload.array('image', 5), AddProduct);
router.get('/get', getProduct);
router.get('/product/:id', Product_get);
router.delete('/del/:id', Del);
router.get('/edite-get/:id', edite_get);
router.get('/SinglePage/:id', SingpleProduct); // New route for fetching single product details
router.put('/edite/:id', edite_post);

export default router;