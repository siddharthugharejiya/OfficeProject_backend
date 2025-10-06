

import mongoose from 'mongoose';

const productSchema = mongoose.Schema({
    name: String,
    Image: { type: [String], default: [] },
    title: String,
    des: String,
    rating: String,
    price: String,
    weight: String,
    tag: String,
    category: String
})
export const ProductModel = mongoose.model("product", productSchema)

