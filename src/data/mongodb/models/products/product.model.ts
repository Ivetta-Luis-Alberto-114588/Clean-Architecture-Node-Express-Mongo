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
    },
    taxRate: {
        type: Number,
        required: true,
        default: 21,
        min: 0,
        max: 100
    }
},
    {
        timestamps: true // Esto añade automáticamente createdAt y updatedAt
    })

// Opcional: Añadir un campo virtual para el precio con IVA (útil si se accede directamente al modelo a veces)
productSchema.virtual('priceWithTax').get(function () {
    if (this.price === undefined || this.taxRate === undefined) return 0;
    return Math.round(this.price * (1 + this.taxRate / 100) * 100) / 100;
});

// Asegurarse de que los virtuales se incluyan en toJSON/toObject si se usan fuera de Mongoose
productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });


export const ProductModel = mongoose.model("Product", productSchema);