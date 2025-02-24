import mongoose from "mongoose";


const productSchema = new mongoose.Schema({

    name: {
        type: String,
        required: [true, "Product name is required"],
        unique: true
    },
    description: {
        type: String,
        required: false,
        default: ""
    },
    price: {
        type: Number,
        required: [true, "Product price is required"],
        default: 0
    },
    stock: {
        type: Number,
        required: false,
        default: 10
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
        required: [true, "Product category is required"]
    },
    unit: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Unit",
        required: [true, "Product unit is required"]
    },
    imgUrl: {
        type: String,
        required: false,
        default: ""
    },
    isActive: {
        type: Boolean,
        required: false,
        default: true
    }
},
{
    timestamps: true // Esto añade automáticamente createdAt y updatedAt
})


export const ProductModel = mongoose.model("Product", productSchema);