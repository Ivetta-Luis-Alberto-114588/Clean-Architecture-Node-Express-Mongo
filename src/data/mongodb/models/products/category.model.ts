
import mongoose from "mongoose";

const categorySchema = new mongoose.Schema({

    name: {
        type: String,
        required: [true, "Category name is required"],
        unique: true
    },
    description: {
        type: String,
        required: true,

    },
    isActive: {
        type: Boolean,
        required: false,
        default: true
    }

})

export const CategoryModel = mongoose.model("Category", categorySchema);