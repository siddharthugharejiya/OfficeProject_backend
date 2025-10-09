import express from 'express';
import {
    AddProduct,
    getProduct,
    SingpleProduct,
    Del,
    edite_get,
    edite_post,
    Product_category,
    uploadImage
} from '../Controller/ProductController.js';
import { upload } from '../Controller/ProductController.js';

const router = express.Router();

// ✅ Use upload.array('images') for multiple files
router.post('/product/add', upload.array('images'), AddProduct);
router.put('/product/edite/:id', upload.array('images'), edite_post);
router.post('/product/upload', upload.single('image'), uploadImage);
router.get('/product/get', getProduct);
router.get('/product/:id', SingpleProduct); // ✅ This matches frontend expectation
router.delete('/product/del/:id', Del);
router.get('/product/edite/:id', edite_get);
router.get('/product/category/:category', Product_category);

export default router;