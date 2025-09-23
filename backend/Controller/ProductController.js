import { ProductModel } from "../model/ProductModel.js";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

// ✅ Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// === Configure Multer ===
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, "../uploads/"));
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
// console.log(storage);


export const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// === Helper: generate dynamic URL based on host ===
const getFullImageUrl = (img, req) => {
    if (!img) return null;

    // Base64 image
    if (img.startsWith("data:image/")) return img;

    // Full URL (http:// or https://) already
    if (img.startsWith("http")) return img;

    // Default: local upload path
    return `${req.protocol}://${req.get("host")}/${img.startsWith("/") ? img.slice(1) : img}`;
};

// Map array of images
const mapImageArray = (images, req) => {
    if (!images) return [];
    if (Array.isArray(images)) return images.map(img => getFullImageUrl(img, req));
    if (typeof images === "string") return [getFullImageUrl(images, req)];
    return [];
};

// === Add Product ===
export const AddProduct = async (req, res) => {
    try {
        const { name, title, des, rating, price, weight, tag, category } = req.body;

        let imageArray = [];

        // Uploaded files
        if (req.files && req.files.length > 0) {
            imageArray = req.files.map(file => file.filename);
        } else if (req.body.Image) {
            const images = typeof req.body.Image === "string" ? JSON.parse(req.body.Image) : req.body.Image;
            imageArray = images;
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
        res.status(500).json({ message: "Failed to add product", error: err.message });
    }
};

// === Get All Products ===
export const getProduct = async (req, res) => {
    try {
        const data = await ProductModel.find();
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
}

export const Product_get = async (req, res) => {
    try {
        // Step 1: पहले वो product find करें
        const product = await ProductModel.findById(req.params.id);
        if (!product) return res.status(404).json({ message: "Product not found" });

        // Step 2: उस product की category लें
        const category = product.category;

        // Step 3: उसी category के सारे products fetch करें
        const productsByCategory = await ProductModel.find({ category });

        // Step 4: images map करें
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
        const { name, title, des, rating, price, weight, tag, category } = req.body;
        const { id } = req.params;

        let imageArray = [];

        if (req.files && req.files.length > 0) {
            imageArray = req.files.map(file => file.filename);
        } else if (req.body.Image) {
            const images = typeof req.body.Image === "string" ? JSON.parse(req.body.Image) : req.body.Image;
            imageArray = images;
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
        res.status(500).json({ message: "Update failed", error: err.message });
    }
};
