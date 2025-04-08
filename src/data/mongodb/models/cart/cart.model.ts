import mongoose, { Schema, Document, Types } from "mongoose";

// Interfaz para el Item del Carrito en Mongoose
interface ICartItem extends Document {
    productId: Types.ObjectId;
    quantity: number;
    priceAtTime: number; // Precio SIN IVA del producto cuando se añadió
    taxRate: number;     // Tasa de IVA del producto (%)
    productName: string; // Nombre para referencia rápida
    // Podríamos añadir imgUrl si fuera necesario mostrarla directamente desde el carrito
}

// Interfaz para el Carrito en Mongoose
export interface ICart extends Document {
    _id: mongoose.Types.ObjectId;
    userId: Types.ObjectId;  // Cambia a Types.ObjectId
    items: Array<{
        productId: mongoose.Types.ObjectId;
        quantity: number;
        priceAtTime: number;
        taxRate: number;
        productName: string;
    }>;
}

// Esquema para los items embebidos en el carrito
const cartItemSchema = new Schema<ICartItem>({
    productId: {
        type: Schema.Types.ObjectId,
        ref: 'Product', // Referencia al modelo Product
        required: [true, "Product ID is required"]
    },
    quantity: {
        type: Number,
        required: [true, "Quantity is required"],
        min: [1, "Quantity must be at least 1"]
    },
    priceAtTime: { // Precio SIN IVA
        type: Number,
        required: [true, "Price at time of adding is required"],
        min: [0, "Price cannot be negative"]
    },
    productName: { // Guardamos el nombre para evitar lookups constantes al mostrar el carrito
        type: String,
        required: [true, "Product name is required"]
    },
    taxRate: {
        type: Number,
        required: [true, "Tax rate is required"],
        min: 0,
        max: 100
    }
}, { _id: false }); // No necesitamos un _id para los subdocumentos de items

// Esquema principal del carrito
const cartSchema = new Schema<ICart>({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User', // Referencia al modelo User
        required: [true, "User ID is required"],
        unique: true, // Cada usuario tiene un solo carrito
        index: true
    },
    items: [cartItemSchema] // Array de subdocumentos
}, {
    timestamps: true // Añade createdAt y updatedAt automáticamente
});

// Modelo de Mongoose
export const CartModel = mongoose.model<ICart>("Cart", cartSchema);