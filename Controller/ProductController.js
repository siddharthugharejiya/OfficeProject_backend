import { ProductModel } from "../model/ProductModel.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import express from "express";
import cloudinary from "../config/cloudinary.js";

// ✅ Enhanced multer disk storage configuration (temporary local before Cloudinary upload)
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = 'uploads/';
        // Create uploads directory if it doesn't exist
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'image-' + uniqueSuffix + ext);
    }
});

export const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit (increased)
        files: 10 // Maximum 10 files
    },
    fileFilter: function (req, file, cb) {
        // Check file type
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    }
});

// === Helper: generate dynamic URL ===
const getFullImageUrl = (img, req) => {
    if (!img) return null;

    // ✅ Already a full URL
    if (img.startsWith("http")) {
        return img;
    }

    // ✅ For local uploads (legacy)
    if (img.startsWith('uploads/')) {
        return `${req.protocol}://${req.get('host')}/${img}`;
    }

    return img;
};

// Map array of images
const mapImageArray = (images, req) => {
    if (!images) return [];
    if (Array.isArray(images)) return images.map(img => getFullImageUrl(img, req));
    if (typeof images === "string") return [getFullImageUrl(images, req)];
    return [];
};

export const AddProduct = async (req, res) => {
    try {

        if (req.files) {
            req.files.forEach((file, index) => {
                console.log(`📸 File ${index + 1}:`, {
                    originalname: file.originalname,
                    filename: file.filename,
                    path: file.path,
                    size: file.size,
                    mimetype: file.mimetype
                });
            });
        }

        const { name, title, des, rating, pedestal, price, weight, tag, category, linkImages, h, w, l, s_trap, p_trap, size1, size2, Set, Basin } = req.body;

        // ✅ Validation
        if (!name || !name.trim()) {
            return res.status(400).json({ message: "Product name is required" });
        }

        let imageArray = [];

        // ✅ Handle uploaded files: upload to Cloudinary, then delete temp file
        if (req.files && req.files.length > 0) {
            const uploadedFiles = [];
            for (const file of req.files) {
                const result = await cloudinary.uploader.upload(file.path, {
                    folder: 'prettyware_products'
                });
                uploadedFiles.push(result.secure_url);
                try { fs.unlinkSync(file.path); } catch { }
            }
            imageArray = [...imageArray, ...uploadedFiles];
        }

        // ✅ Handle link images (from frontend)
        if (linkImages && linkImages.trim()) {
            try {
                const linkImagesArray = JSON.parse(linkImages);
                if (Array.isArray(linkImagesArray) && linkImagesArray.length > 0) {
                    // Validate URLs
                    const validLinks = linkImagesArray.filter(link =>
                        link && typeof link === 'string' && link.startsWith('http')
                    );
                    imageArray = [...imageArray, ...validLinks];
                    console.log("🔗 Added link images:", validLinks);
                }
            } catch (e) {
                console.log("❌ Error parsing linkImages:", e.message);
                return res.status(400).json({ message: "Invalid linkImages format" });
            }
        }

        if (imageArray.length === 0) {
            return res.status(400).json({ message: "At least one image is required" });
        }

        console.log("📸 Final image array:", imageArray);

        // ✅ Handle sizes - create array from individual size fields
        const sizesArray = [];
        if (size1 && size1.trim() !== '') {
            console.log("✅ Adding size1:", size1);
            sizesArray.push(size1.trim());
        }
        if (size2 && size2.trim() !== '') {
            console.log("✅ Adding size2:", size2);
            sizesArray.push(size2.trim());
        }

        console.log("📏 Final sizes array:", sizesArray);

        // ✅ Create product - INCLUDING ALL FIELDS
        const productData = {
            name: name.trim(),
            Image: imageArray,
            title: title || "",
            des: des || "",
            rating: rating || "",
            price: price || "",
            weight: weight || "",
            tag: tag || "",
            category: category || "",
            h: h || "",
            sizes: sizesArray, // ✅ Store as array
            w: w || "",
            l: l || "",
            s_trap: s_trap || "",
            p_trap: p_trap || "",
            Set: Set || "",
            semi: Set || "",
            Basin: Basin || "",
            pedestal: pedestal || ""
        };

        console.log("💾 Creating product with data:", productData);
        const product = await ProductModel.create(productData);

        res.status(201).json({
            message: "Product added successfully",
            data: {
                ...product.toObject(),
                Image: mapImageArray(product.Image, req)
            }
        });
    } catch (err) {
        console.error("❌ AddProduct error:", err);
        res.status(500).json({
            message: "Failed to add product",
            error: err.message
        });
    }
};

// === Get All Products ===
export const getProduct = async (req, res) => {
    try {
        console.log("📋 Fetching all products...");
        const data = await ProductModel.find().sort({ createdAt: -1 });
        console.log(`📦 Found ${data.length} products`);

        const updated = data.map(p => ({
            ...p.toObject(),
            Image: mapImageArray(p.Image, req)
        }));

        res.json({ message: "Products fetched", data: updated });
    } catch (err) {
        console.error("❌ getProduct error:", err);
        res.status(500).json({ message: "Error fetching products", error: err.message });
    }
};

// === Get Single Product ===
export const SingpleProduct = async (req, res) => {
    try {
        console.log("🔍 Fetching product with ID:", req.params.id);

        const product = await ProductModel.findById(req.params.id);
        console.log("📦 Product found:", product ? "Yes" : "No");

        if (!product) {
            console.log("❌ Product not found with ID:", req.params.id);
            return res.status(404).json({ message: "Product not found" });
        }

        console.log("✅ Product found, sending response");
        res.status(200).json({
            message: "Fetched",
            data: {
                ...product.toObject(),
                Image: mapImageArray(product.Image, req)
            }
        });
    } catch (err) {
        console.error("❌ SingpleProduct error:", err);
        res.status(500).json({ message: "Something went wrong", error: err.message });
    }
};

export const Product_get = async (req, res) => {
    try {
        const product = await ProductModel.findById(req.params.id);
        if (!product) return res.status(404).json({ message: "Product not found" });

        const category = product.category;
        const productsByCategory = await ProductModel.find({ category });

        const data = productsByCategory.map(p => ({
            ...p.toObject(),
            Image: mapImageArray(p.Image, req)
        }));

        res.status(200).json({
            message: "Fetched products by category",
            data
        });
    } catch (err) {
        res.status(500).json({ message: "Something went wrong", error: err.message });
    }
};

// === Delete Product ===
export const Del = async (req, res) => {
    try {
        const product = await ProductModel.findById(req.params.id);

        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        // Delete local image files (legacy)
        if (product.Image && product.Image.length > 0) {
            for (const imageUrl of product.Image) {
                if (imageUrl.startsWith('uploads/')) {
                    const filePath = imageUrl;
                    if (fs.existsSync(filePath)) {
                        fs.unlinkSync(filePath);
                    }
                }
            }
        }

        await ProductModel.findByIdAndDelete(req.params.id);

        res.json({ message: "Product deleted successfully", data: product });
    } catch (err) {
        console.error("Delete error:", err);
        res.status(500).json({ message: "Failed to delete", error: err.message });
    }
};

// === Edit GET ===
export const edite_get = async (req, res) => {
    try {
        const product = await ProductModel.findById(req.params.id);
        if (!product) return res.status(404).json({ message: "Not found" });

        res.status(200).json({
            message: "Fetched for edit",
            data: {
                ...product.toObject(),
                Image: mapImageArray(product.Image, req)
            }
        });
    } catch (err) {
        res.status(500).json({ message: "Error", error: err.message });
    }
};

// === Edit POST ===
export const edite_post = async (req, res) => {
    try {
        console.log("📥 Edit Product Request Received");
        console.log("📋 Request body:", req.body);
        console.log("📁 Files received:", req.files ? req.files.length : 0);
        console.log("🆔 Product ID:", req.params.id);

        const {
            name,
            title,
            des,
            rating,
            price,
            weight,
            tag,
            category,
            linkImages,
            h,
            semi,
            w,
            l,
            s_trap,
            p_trap,
            size1,
            size2,
            Set,
            Basin, pedestal
        } = req.body;

        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ message: "Product ID is required" });
        }

        // ✅ Find existing product
        const existingProduct = await ProductModel.findById(id);
        if (!existingProduct) {
            return res.status(404).json({ message: "Product not found" });
        }

        let imageArray = [];

        // ✅ Handle new uploaded files: upload to Cloudinary
        if (req.files && req.files.length > 0) {
            console.log("📸 Uploading new files to Cloudinary...");
            const uploadedFiles = [];
            for (const file of req.files) {
                try {
                    const result = await cloudinary.uploader.upload(file.path, {
                        folder: 'prettyware_products'
                    });
                    uploadedFiles.push(result.secure_url);

                    // Delete temporary file
                    try {
                        fs.unlinkSync(file.path);
                        console.log(`🗑️ Deleted temp file: ${file.path}`);
                    } catch (error) {
                        console.log("⚠️ Could not delete temp file:", file.path);
                    }
                } catch (uploadError) {
                    console.error("❌ Cloudinary upload error:", uploadError);
                    return res.status(500).json({
                        message: "Failed to upload image to cloud",
                        error: uploadError.message
                    });
                }
            }
            imageArray = [...uploadedFiles];
            console.log("✅ New files uploaded to Cloudinary:", uploadedFiles);
        } else {
            // ✅ Keep existing images if no new files uploaded
            imageArray = [...existingProduct.Image];
            console.log("🔄 Using existing images");
        }

        // ✅ Handle link images
        if (linkImages && linkImages.trim()) {
            try {
                const linkImagesArray = JSON.parse(linkImages);
                if (Array.isArray(linkImagesArray) && linkImagesArray.length > 0) {
                    const validLinks = linkImagesArray.filter(link =>
                        link && typeof link === 'string' && link.startsWith('http')
                    );
                    imageArray = [...imageArray, ...validLinks];
                    console.log("🔗 Added link images:", validLinks);
                }
            } catch (e) {
                console.log("❌ Error parsing linkImages in edit:", e.message);
                return res.status(400).json({ message: "Invalid linkImages format" });
            }
        }

        // ✅ Handle sizes for edit - create array from individual size fields
        const sizesArray = [];
        if (size1 && size1.trim() !== '') {
            console.log("✅ Adding size1:", size1);
            sizesArray.push(size1.trim());
        }
        if (size2 && size2.trim() !== '') {
            console.log("✅ Adding size2:", size2);
            sizesArray.push(size2.trim());
        }

        console.log("📏 Sizes array for update:", sizesArray);

        // ✅ Ensure at least one image exists
        if (imageArray.length === 0) {
            return res.status(400).json({ message: "At least one image is required" });
        }

        console.log("📸 Final image array for update:", imageArray);

        // ✅ Prepare updated data with ALL fields
        const updatedData = {
            name: name !== undefined && name !== null ? name.trim() : existingProduct.name,
            Image: imageArray,
            title: title !== undefined ? title : existingProduct.title,
            des: des !== undefined ? des : existingProduct.des,
            rating: rating !== undefined ? rating : existingProduct.rating,
            price: price !== undefined ? price : existingProduct.price,
            weight: weight !== undefined ? weight : existingProduct.weight,
            tag: tag !== undefined ? tag : existingProduct.tag,
            category: category !== undefined ? category : existingProduct.category,
            h: h !== undefined ? h : existingProduct.h,
            w: w !== undefined ? w : existingProduct.w,
            l: l !== undefined ? l : existingProduct.l,
            s_trap: s_trap !== undefined ? s_trap : existingProduct.s_trap,
            p_trap: p_trap !== undefined ? p_trap : existingProduct.p_trap,
            sizes: sizesArray, // ✅ Update sizes array
            Set: Set !== undefined ? Set : existingProduct.Set,
            semi: semi !== undefined ? semi : existingProduct.semi,
            Basin: Basin !== undefined ? Basin : existingProduct.Basin,
            pedestal: pedestal !== undefined ? pedestal : existingProduct.pedestal
        };

        console.log("💾 Updating product with data:", updatedData);

        // ✅ Update product in database
        const updatedProduct = await ProductModel.findByIdAndUpdate(
            id,
            updatedData,
            { new: true, runValidators: true }
        );

        if (!updatedProduct) {
            return res.status(500).json({ message: "Failed to update product" });
        }

        // ✅ Map image URLs for response
        const responseData = {
            ...updatedProduct.toObject(),
            Image: mapImageArray(updatedProduct.Image, req)
        };

        console.log("✅ Product updated successfully");

        res.status(200).json({
            message: "Product updated successfully",
            data: responseData
        });

    } catch (err) {
        console.error("❌ Edit product error:", err);
        res.status(500).json({
            message: "Failed to update product",
            error: err.message
        });
    }
};
// === Get Products by Category ===
export const Product_category = async (req, res) => {
    const category = req.params.category;
    try {
        const data = await ProductModel.find({ category: category });
        const updatedData = data.map(p => ({
            ...p.toObject(),
            Image: mapImageArray(p.Image, req)
        }));
        res.json(updatedData);
    } catch (error) {
        res.status(500).json({ message: "Error fetching products", error });
    }
};

// === Upload Single Image ===
export const uploadImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        const result = await cloudinary.uploader.upload(req.file.path, {
            folder: 'prettyware_products'
        });
        try { fs.unlinkSync(req.file.path); } catch { }

        res.status(200).json({
            message: "Image uploaded successfully",
            imageUrl: result.secure_url,
            publicId: result.public_id
        });
    } catch (err) {
        res.status(500).json({ message: "Upload failed", error: err.message });
    }
};

// ✅ Serve static files from uploads directory (legacy local images)
export const serveStaticFiles = (app) => {
    app.use('/uploads', (req, res, next) => {
        res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
        next();
    }, express.static('uploads'));
};