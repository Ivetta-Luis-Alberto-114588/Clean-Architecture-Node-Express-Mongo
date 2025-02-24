import mongoose from "mongoose";

const neighborhoodSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Neighborhood name is required"],
        trim: true,
        lowercase: true
    },
    description: {
        type: String,
        required: [true, "Neighborhood description is required"],
        trim: true,
        lowercase: true
    },
    city: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "City", // Esta es la referencia al modelo City
        required: [true, "City reference is required"]
    },
    isActive: {
        type: Boolean,
        required: false,
        default: true
    }
}, {
    timestamps: true
});

// Creamos un índice compuesto para asegurar que no haya barrios duplicados en la misma ciudad
neighborhoodSchema.index({ name: 1, city: 1 }, { unique: true });

export const NeighborhoodModel = mongoose.model("Neighborhood", neighborhoodSchema);