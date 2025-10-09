import { ProductModel } from "../model/ProductModel.js";
import multer from "multer";
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

// ✅ Simple Cloudinary Configuration without complex options
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'Root',
    api_key: process.env.CLOUDINARY_API_KEY || '449944619464392',
    api_secret: process.env.CLOUDINARY_API_SECRET || 'vadgdi9q31peMzPoanckAJixhKc'
});

// ✅ Simple Cloudinary Storage without complex format handling
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'products',
        public_id: (req, file) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            return "image-" + uniqueSuffix;
        },
    },
});

export const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: function (req, file, cb) {
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

    // ✅ Already a full URL (Cloudinary or other)
    if (img.startsWith("http")) {
        return img;
    }

    // ✅ For backward compatibility with local uploads
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

// === Add Product ===
export const AddProduct = async (req, res) => {
    try {
        console.log("📥 Add Product Request Received");

        const { name, title, des, rating, price, weight, tag, category, linkImages } = req.body;

        // ✅ Validation
        if (!name || !name.trim()) {
            return res.status(400).json({ message: "Product name is required" });
        }

        let imageArray = [];

        // ✅ Handle uploaded files (Cloudinary)
        if (req.files && req.files.length > 0) {
            console.log(`📸 Found ${req.files.length} uploaded files`);
            const uploadedFiles = req.files.map(file => file.path);
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
                }
            } catch (e) {
                console.log("❌ Error parsing linkImages:", e.message);
                return res.status(400).json({ message: "Invalid linkImages format" });
            }
        }

        if (imageArray.length === 0) {
            return res.status(400).json({ message: "At least one image is required" });
        }

        // ✅ Create product
        const productData = {
            name: name.trim(),
            Image: imageArray,
            title: title || "",
            des: des || "",
            rating: rating || "",
            price: price || "",
            weight: weight || "",
            tag: tag || "",
            category: category || ""
        };

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

// === Delete Product with Cloudinary cleanup ===
export const Del = async (req, res) => {
    try {
        const product = await ProductModel.findById(req.params.id);

        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        // Delete images from Cloudinary
        if (product.Image && product.Image.length > 0) {
            for (const imageUrl of product.Image) {
                if (imageUrl.includes('cloudinary.com')) {
                    // Extract public_id from Cloudinary URL
                    const urlParts = imageUrl.split('/');
                    const publicIdWithExtension = urlParts[urlParts.length - 1];
                    const publicId = 'products/' + publicIdWithExtension.split('.')[0];

                    try {
                        await cloudinary.uploader.destroy(publicId);
                    } catch (cloudinaryError) {
                        console.log('Error deleting from Cloudinary:', cloudinaryError);
                    }
                }
            }
        }

        // Delete product from database
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

// === Edit POST with Cloudinary ===
export const edite_post = async (req, res) => {
    try {
        const { name, title, des, rating, price, weight, tag, category, linkImages } = req.body;
        const { id } = req.params;

        // Get existing product to manage old images
        const existingProduct = await ProductModel.findById(id);
        if (!existingProduct) {
            return res.status(404).json({ message: "Product not found" });
        }

        let imageArray = [];

        // ✅ Handle uploaded files (Cloudinary)
        if (req.files && req.files.length > 0) {
            const uploadedFiles = req.files.map(file => file.path);
            imageArray = [...uploadedFiles];
        }

        // ✅ Handle link images (from frontend)
        if (linkImages && linkImages.trim()) {
            try {
                const linkImagesArray = JSON.parse(linkImages);
                if (Array.isArray(linkImagesArray) && linkImagesArray.length > 0) {
                    const validLinks = linkImagesArray.filter(link =>
                        link && typeof link === 'string' && link.startsWith('http')
                    );
                    imageArray = [...imageArray, ...validLinks];
                }
            } catch (e) {
                console.log("❌ Error parsing linkImages in edit:", e.message);
                return res.status(400).json({ message: "Invalid linkImages format" });
            }
        }

        if (imageArray.length === 0) {
            return res.status(400).json({ message: "At least one image is required" });
        }

        const updatedData = {
            name: name ? name.trim() : existingProduct.name,
            Image: imageArray,
            title: title || existingProduct.title,
            des: des || existingProduct.des,
            rating: rating || existingProduct.rating,
            price: price || existingProduct.price,
            weight: weight || existingProduct.weight,
            tag: tag || existingProduct.tag,
            category: category || existingProduct.category
        };

        const updated = await ProductModel.findByIdAndUpdate(
            id,
            updatedData,
            { new: true }
        );

        res.status(200).json({
            message: "Product updated successfully",
            data: {
                ...updated.toObject(),
                Image: mapImageArray(updated.Image, req)
            }
        });
    } catch (err) {
        console.error("❌ Edit product error:", err);
        res.status(500).json({
            message: "Update failed",
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

        const imageUrl = req.file.path;

        res.status(200).json({
            message: "Image uploaded successfully",
            imageUrl: imageUrl,
            filename: req.file.filename,
            cloudinary_id: req.file.filename
        });
    } catch (err) {
        res.status(500).json({ message: "Upload failed", error: err.message });
    }
};