import express from 'express';
import {
    Del,
    edite_get,
    edite_post,
    getProduct,
    Product_category,
    Product_get,
    SingpleProduct,
    AddProduct,
    uploadImage,
    upload
} from '../Controller/ProductController.js';

const router = express.Router();

// ------------------- Routes -------------------
// Upload single image
router.post("/upload", upload.single("image"), uploadImage);

// Add product with multiple images
router.post("/add", upload.array("image", 10), AddProduct);

// ------------------- Other Routes -------------------
router.get('/get', getProduct); // get all products
router.get('/product/:id', Product_get); // get by id
router.delete('/del/:id', Del); // delete
router.get('/edite-get/:id', edite_get); // get product for edit
router.put('/edite/:id', upload.array('images', 10), edite_post); // edit product with images
router.get('/SinglePage/:id', SingpleProduct); // single product page
router.get('/category/:category', Product_category); // by category

export default router;
