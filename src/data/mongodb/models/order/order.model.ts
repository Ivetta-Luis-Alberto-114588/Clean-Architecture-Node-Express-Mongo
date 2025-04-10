import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
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
    unitPrice: { // <<<--- PRECIO CON IVA
        type: Number,
        required: [true, "Unit price (with tax) is required"],
        min: [0, "Price cannot be negative"]
    },
    subtotal: { // <<<--- SUBTOTAL CON IVA
        type: Number,
        required: [true, "Subtotal (with tax) is required"]
    }
    // Opcional: Guardar la tasa aplicada si puede variar por item/promoción
    // taxRateApplied: { type: Number }
});

const orderSchema = new mongoose.Schema({
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Customer",
        required: [true, "Customer reference is required"]
    },
    items: {
        type: [orderItemSchema],
        validate: [(items: any[]) => items.length > 0, "A sale must have at least one item"]
    },
    subtotal: { // Suma de subtotales de items (CON IVA)
        type: Number,
        required: [true, "Subtotal (with tax) is required"]
    },
    taxAmount: { // Suma total del IVA de la venta
        type: Number,
        required: [true, "Total tax amount is required"]
    },
    discountRate: { // Tasa de descuento sobre el subtotal CON IVA
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    discountAmount: { // Monto del descuento calculado
        type: Number,
        required: [true, "Discount amount is required"]
    },
    total: { // Total final
        type: Number,
        required: [true, "Total is required"]
    },
    // Ya no necesitamos taxRate global obligatorio, pero podría mantenerse opcional
    taxRate: {
        type: Number,
        min: 0,
        max: 100
    },
    date: { type: Date, default: Date.now },
    status: { type: String, enum: ['pending', 'completed', 'cancelled'], default: 'pending' },
    notes: { type: String, default: "" }
}, {
    timestamps: true
});

export const OrderModel = mongoose.model("Order", orderSchema);