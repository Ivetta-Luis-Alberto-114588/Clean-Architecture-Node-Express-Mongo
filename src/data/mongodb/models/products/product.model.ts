// src/data/mongodb/models/products/product.model.ts
import mongoose, { Schema } from "mongoose"; // Asegurar importación de Schema

const productSchema = new Schema({ // Usar new Schema(...)
    name: {
        type: String,
        required: [true, "Product name is required"],
        unique: true,
        index: true // Índice normal para búsquedas exactas/rápidas
    },
    description: {
        type: String,
        required: false,
        default: ""
    },
    price: {
        type: Number,
        required: [true, "Product price is required"],
        default: 0,
        index: true // Indexar precio para filtrado/ordenamiento
    },
    stock: {
        type: Number,
        required: false,
        default: 10
    },
    category: {
        type: Schema.Types.ObjectId, // Usar Schema.Types.ObjectId
        ref: "Category",
        required: [true, "Product category is required"],
        index: true // Indexar categoría para filtrado
    },
    unit: {
        type: Schema.Types.ObjectId, // Usar Schema.Types.ObjectId
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
        default: true,
        index: true // Indexar para filtrar rápidamente activos
    },
    taxRate: {
        type: Number,
        required: true,
        default: 21,
        min: 0,
        max: 100
    }
    // <<<--- (Opcional) Añadir campo brand si se quiere filtrar por marca --- >>>
    // brand: {
    //     type: String,
    //     index: true,
    //     trim: true
    // }
},
    {
        timestamps: true
    });

// <<<--- CREAR ÍNDICE DE TEXTO --- >>>
// Crear un índice compuesto de texto para buscar en 'name' y 'description'
// Dar más peso al nombre en la relevancia de la búsqueda (opcional)
productSchema.index(
    { name: 'text', description: 'text' },
    { weights: { name: 10, description: 5 }, name: 'ProductTextIndex' }
);
// <<<--- FIN ÍNDICE DE TEXTO --- >>>

// --- Virtuals y toJSON/toObject sin cambios ---
productSchema.virtual('priceWithTax').get(function () {
    if (this.price === undefined || this.taxRate === undefined) return 0;
    return Math.round(this.price * (1 + this.taxRate / 100) * 100) / 100;
});
productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

export const ProductModel = mongoose.model("Product", productSchema);