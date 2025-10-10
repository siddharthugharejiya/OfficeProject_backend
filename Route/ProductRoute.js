import express from 'express';
import {
    AddProduct,
    getProduct,
    SingpleProduct,
    Del,
    edite_get,
    edite_post,
    Product_category,
    uploadImage,
    Product_get
} from '../Controller/ProductController.js';
import { upload } from '../Controller/ProductController.js';

const router = express.Router();

// ✅ Use upload.array('images') for multiple files
router.post('/add', upload.array('images'), AddProduct);
router.put('/edite/:id', upload.array('images'), edite_post);
router.post('/upload', upload.single('image'), uploadImage);
router.get('/get', getProduct);
router.get('/get/:id', SingpleProduct);
router.delete('/del/:id', Del);
router.get('/edite-get/:id', edite_get);
router.get('/SinglePage/:id', SingpleProduct)
router.get('/product/:id', Product_get);
router.get('/category/:category', Product_category)

export default router;