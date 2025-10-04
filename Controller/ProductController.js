import { ProductModel } from "../model/ProductModel.js";

// ✅ Helper: Map image array to full URL
const mapImageArray = (images, req) => {
    if (!images) return [];
    if (Array.isArray(images)) return images.map(img => {
        if (img.startsWith('http')) return img;
        return `${req.protocol}://${req.get('host')}/uploads/${img}`;
    });
    if (typeof images === "string") return [images.startsWith('http') ? images : `${req.protocol}://${req.get('host')}/uploads/${images}`];
    return [];
};

// ✅ Add product
export const AddProduct = async (req, res) => {
    try {
        const { name, title, des, rating, price, weight, tag, category } = req.body;

        let imageArray = [];
        if (req.files && req.files.length > 0) imageArray = req.files.map(f => f.filename);

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
            data: { ...product.toObject(), Image: mapImageArray(product.Image, req) }
        });
    } catch (err) {
        res.status(500).json({ message: "Failed to add product", error: err.message });
    }
};

// ✅ Get all products
export const getProduct = async (req, res) => {
    try {
        const data = await ProductModel.find();
        res.json({ message: "Products fetched", data: data.map(p => ({ ...p.toObject(), Image: mapImageArray(p.Image, req) })) });
    } catch (err) {
        res.status(500).json({ message: "Error fetching products", error: err.message });
    }
};

// ✅ Get single product by id
export const Product_get = async (req, res) => {
    try {
        const product = await ProductModel.findById(req.params.id);
        if (!product) return res.status(404).json({ message: "Product not found" });
        res.status(200).json({ data: { ...product.toObject(), Image: mapImageArray(product.Image, req) } });
    } catch (err) {
        res.status(500).json({ message: "Something went wrong", error: err.message });
    }
};

// ✅ Delete product
export const Del = async (req, res) => {
    try {
        const product = await ProductModel.findByIdAndDelete(req.params.id);
        res.json({ message: "Deleted", data: product });
    } catch (err) {
        res.status(500).json({ message: "Failed to delete", error: err.message });
    }
};

// ✅ Edit GET
export const edite_get = async (req, res) => {
    try {
        const product = await ProductModel.findById(req.params.id);
        if (!product) return res.status(404).json({ message: "Not found" });
        res.status(200).json({ data: { ...product.toObject(), Image: mapImageArray(product.Image, req) } });
    } catch (err) {
        res.status(500).json({ message: "Error", error: err.message });
    }
};

// ✅ Edit POST
export const edite_post = async (req, res) => {
    try {
        const { name, title, des, rating, price, weight, tag, category } = req.body;
        const { id } = req.params;

        let imageArray = [];
        if (req.files && req.files.length > 0) imageArray = req.files.map(f => f.filename);

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

        res.status(200).json({ data: { ...updated.toObject(), Image: mapImageArray(updated.Image, req) } });
    } catch (err) {
        res.status(500).json({ message: "Update failed", error: err.message });
    }
};

// ✅ Products by category
export const Product_category = async (req, res) => {
    try {
        const data = await ProductModel.find({ category: req.params.category });
        res.json(data.map(p => ({ ...p.toObject(), Image: mapImageArray(p.Image, req) })));
    } catch (err) {
        res.status(500).json({ message: "Error fetching products", error: err.message });
    }
};

// ✅ Single product page
export const SingpleProduct = async (req, res) => {
    try {
        const product = await ProductModel.findById(req.params.id);
        if (!product) return res.status(404).json({ message: "Product not found" });
        res.status(200).json({ data: { ...product.toObject(), Image: mapImageArray(product.Image, req) } });
    } catch (err) {
        res.status(500).json({ message: "Something went wrong", error: err.message });
    }
};
