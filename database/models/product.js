const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
    product_pic: {
        type: String,
        required: true
    },
    product_name: {
        type: String,
        required: true
    },
    product_price: {
        type: Number,
        required: true
    },
    product_stock: {
        type: Number,
        required: true
    },
    product_desc: {
        type: String,
        required: true
    }
},
{ timestamps: true }
);

const productModel = mongoose.model('product', productSchema);

module.exports = productModel;