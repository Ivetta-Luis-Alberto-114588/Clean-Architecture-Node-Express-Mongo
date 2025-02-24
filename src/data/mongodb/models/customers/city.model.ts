import mongoose from "mongoose";

const citySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "City name is required"],
        unique: true,
        trim: true,
        lowercase: true
    },
    description: {
        type: String,
        required: [true, "City description is required"],
        trim: true,
        lowercase: true
    },
    isActive: {
        type: Boolean,
        required: false,
        default: true
    }
}, {
    timestamps: true // Esto añade automáticamente createdAt y updatedAt
});

export const CityModel = mongoose.model("City", citySchema);