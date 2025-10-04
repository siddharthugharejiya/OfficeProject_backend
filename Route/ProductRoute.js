import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import {
    AddProduct,
    Del,
    edite_get,
    edite_post,
    getProduct,
    Product_category,
    Product_get,
    SingpleProduct
} from '../Controller/ProductController.js';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ Create uploads directory if not exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// ✅ Multer storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'image-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// ✅ Multer instance
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) cb(null, true);
        else cb(new Error('Only image files are allowed!'), false);
    }
});

// ✅ Single image upload (optional)
router.post('/upload', upload.single('image'), (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const imageUrl = `/uploads/${req.file.filename}`;
    res.json({ success: true, imageUrl });
});

// ✅ Add product with multiple images
router.post('/add', upload.array('image', 5), AddProduct);

// ✅ Get all products
router.get('/get', getProduct);

// ✅ Get single product by id
router.get('/product/:id', Product_get);

// ✅ Delete product
router.delete('/del/:id', Del);

// ✅ Edit product
router.get('/edite-get/:id', edite_get);
router.put('/edite/:id', edite_post);

// ✅ Single product page
router.get('/SinglePage/:id', SingpleProduct);

// ✅ Products by category
router.get('/category/:category', Product_category);

export default router;
