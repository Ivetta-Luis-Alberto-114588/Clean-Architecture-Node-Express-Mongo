// src/data/mongodb/models/products/tag.model.ts
import mongoose, { Schema, Document } from "mongoose";

export interface ITag extends Document {
    name: string;
    description?: string;
    isActive: boolean;
}

const tagSchema = new Schema<ITag>({
    name: {
        type: String,
        required: [true, "Tag name is required"],
        unique: true, // Cada etiqueta debe ser única
        trim: true,
        lowercase: true, // Guardar en minúsculas para consistencia
        index: true,
    },
    description: {
        type: String,
        trim: true,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
}, {
    timestamps: true
});

export const TagModel = mongoose.model<ITag>("Tag", tagSchema);