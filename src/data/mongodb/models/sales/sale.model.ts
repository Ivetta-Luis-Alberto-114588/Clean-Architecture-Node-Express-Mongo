import mongoose from "mongoose";

const saleItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: [true, "Product reference is required"]
    },
    quantity: {
        type: Number,
        required: [true, "Quantity is required"],
        min: [1, "Minimum quantity is 1"]
    },
    unitPrice: {
        type: Number,
        required: [true, "Unit price is required"],
        min: [0, "Price cannot be negative"]
    },
    subtotal: {
        type: Number,
        required: [true, "Subtotal is required"]
    }
});

const saleSchema = new mongoose.Schema({
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Customer",
        required: [true, "Customer reference is required"]
    },
    items: {
        type: [saleItemSchema],
        validate: {
            validator: function(items: any[]) {
                return items.length > 0;
            },
            message: "A sale must have at least one item"
        }
    },
    subtotal: {
        type: Number,
        required: [true, "Subtotal is required"]
    },
    taxRate: {
        type: Number,
        default: 21, // 21% por defecto
        min: 0,
        max: 100
    },
    taxAmount: {
        type: Number,
        required: [true, "Tax amount is required"]
    },
    discountRate: {
        type: Number,
        default: 0, // 0% por defecto
        min: 0,
        max: 100
    },
    discountAmount: {
        type: Number,
        required: [true, "Discount amount is required"]
    },
    total: {
        type: Number,
        required: [true, "Total is required"]
    },
    date: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'cancelled'],
        default: 'pending'
    },
    notes: {
        type: String,
        default: ""
    }
}, {
    timestamps: true
});

export const SaleModel = mongoose.model("Sale", saleSchema);