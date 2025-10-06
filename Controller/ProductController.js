import { ProductModel } from "../model/ProductModel.js";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import fs from "fs";

// ✅ Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "../uploads/");
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// === Configure Multer ===
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, "image-" + uniqueSuffix + path.extname(file.originalname));
    }
});

export const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
        files: 10 // Maximum 10 files
    },
    fileFilter: function (req, file, cb) {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    }
});

// === Helper: generate dynamic URL with HTTPS ===
const getFullImageUrl = (img, req) => {
    if (!img) return null;

    // ✅ Base64 images
    if (img.startsWith("data:image/")) return img;

    // ✅ Already a full URL - FORCE HTTPS
    if (img.startsWith("http")) {
        return img.replace('http://', 'https://');
    }

    // ✅ Local uploads - Use absolute HTTPS URL
    let cleanPath = img;
    if (cleanPath.startsWith('uploads/')) {
        cleanPath = cleanPath.replace('uploads/', '');
    }
    if (cleanPath.startsWith('/')) {
        cleanPath = cleanPath.slice(1);
    }

    // ✅ Always use HTTPS for production
    return `https://officeproject-backend.onrender.com/uploads/${cleanPath}`;
};

// Map array of images
const mapImageArray = (images, req) => {
    if (!images) return [];
    if (Array.isArray(images)) return images.map(img => getFullImageUrl(img, req));
    if (typeof images === "string") return [getFullImageUrl(images, req)];
    return [];
};

// === Upload Single Image ===
export const uploadImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        const imageUrl = `uploads/${req.file.filename}`;

        res.status(200).json({
            message: "Image uploaded successfully",
            imageUrl: imageUrl,
            filename: req.file.filename
        });
    } catch (err) {
        res.status(500).json({ message: "Upload failed", error: err.message });
    }
};

// === Add Product ===
export const AddProduct = async (req, res) => {
    try {
        const { name, title, des, rating, price, weight, tag, category, linkImages } = req.body;

        let imageArray = [];

        // Handle uploaded files
        if (req.files && req.files.length > 0) {
            const uploadedFiles = req.files.map(file => `uploads/${file.filename}`);
            imageArray = [...imageArray, ...uploadedFiles];
        }

        // Handle link images (from frontend)
        if (linkImages) {
            try {
                const linkImagesArray = JSON.parse(linkImages);
                if (Array.isArray(linkImagesArray)) {
                    imageArray = [...imageArray, ...linkImagesArray];
                }
            } catch (e) {
                console.log("Error parsing linkImages:", e.message);
            }
        }

        if (imageArray.length === 0) {
            return res.status(400).json({ message: "At least one image is required" });
        }

        const product = await ProductModel.create({
            name,
            Image: imageArray,
            title,
            des,
            rating,
            price,
            weight,
            tag,
            category
        });

        res.status(201).json({
            message: "Product added successfully",
            data: {
                ...product.toObject(),
                Image: mapImageArray(product.Image, req)
            }
        });
    } catch (err) {
        console.error("AddProduct error:", err);
        res.status(500).json({ message: "Failed to add product", error: err.message });
    }
};

// === Get All Products ===
export const getProduct = async (req, res) => {
    try {
        const data = await ProductModel.find().sort({ createdAt: -1 });
        const updated = data.map(p => ({
            ...p.toObject(),
            Image: mapImageArray(p.Image, req)
        }));

        res.json({ message: "Products fetched", data: updated });
    } catch (err) {
        res.status(500).json({ message: "Error fetching products", error: err.message });
    }
};

// === Get Single Product ===
export const SingpleProduct = async (req, res) => {
    try {
        const product = await ProductModel.findById(req.params.id);
        if (!product) return res.status(404).json({ message: "Product not found" });

        res.status(200).json({
            message: "Fetched",
            data: {
                ...product.toObject(),
                Image: mapImageArray(product.Image, req)
            }
        });
    } catch (err) {
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
        const product = await ProductModel.findByIdAndDelete(req.params.id);
        res.json({ message: "Deleted", data: product });
    } catch (err) {
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
        const { name, title, des, rating, price, weight, tag, category, linkImages } = req.body;
        const { id } = req.params;

        let imageArray = [];

        // Handle uploaded files
        if (req.files && req.files.length > 0) {
            const uploadedFiles = req.files.map(file => `uploads/${file.filename}`);
            imageArray = [...imageArray, ...uploadedFiles];
        }

        // Handle link images (from frontend)
        if (linkImages) {
            try {
                const linkImagesArray = JSON.parse(linkImages);
                if (Array.isArray(linkImagesArray)) {
                    imageArray = [...imageArray, ...linkImagesArray];
                }
            } catch (e) {
                console.log("Error parsing linkImages:", e.message);
            }
        }

        const updated = await ProductModel.findByIdAndUpdate(id, {
            name,
            Image: imageArray,
            title,
            des,
            rating,
            price,
            weight,
            tag,
            category
        }, { new: true });

        res.status(200).json({
            message: "Updated",
            data: {
                ...updated.toObject(),
                Image: mapImageArray(updated.Image, req)
            }
        });
    } catch (err) {
        console.error("Edit product error:", err);
        res.status(500).json({ message: "Update failed", error: err.message });
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