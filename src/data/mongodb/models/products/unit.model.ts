
import mongoose from "mongoose";

const UnitSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Unit name is required"],
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
},
{
    timestamps: true // Esto añade automáticamente createdAt y updatedAt
})

export const UnitModel = mongoose.model("Unit", UnitSchema);