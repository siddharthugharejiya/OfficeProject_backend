

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
    category: String,
    l: String,
    h: String,
    w: String,
    s_trap: String,
    size : String,
    p_trap: String,

})
export const ProductModel = mongoose.model("product", productSchema)

