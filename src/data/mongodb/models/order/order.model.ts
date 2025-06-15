// src/data/mongodb/models/order/order.model.ts
import mongoose, { Schema } from "mongoose";

const orderItemSchema = new Schema({
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    subtotal: { type: Number, required: true }
}, { _id: false });

const orderSchema = new Schema({
    customer: { type: Schema.Types.ObjectId, ref: "Customer", required: true, index: true },
    items: { type: [orderItemSchema], validate: [(v: any[]) => v.length > 0, 'Order must have items'] },
    subtotal: { type: Number, required: true },
    taxAmount: { type: Number, required: true },
    discountRate: { type: Number, default: 0, min: 0, max: 100 },
    discountAmount: { type: Number, required: true },
    total: { type: Number, required: true, index: true },
    date: { type: Date, default: Date.now, index: true }, status: { type: Schema.Types.ObjectId, ref: 'OrderStatus', required: true, index: true },
    paymentMethod: { type: Schema.Types.ObjectId, ref: 'PaymentMethod', required: false, index: true },
    notes: { type: String, default: "" },

    // <<<--- CAMPOS SHIPPING DETAILS ACTUALIZADOS --- >>>
    shippingDetails: {
        recipientName: { type: String, required: [true, "Shipping recipient name is required"] },
        phone: { type: String, required: [true, "Shipping phone is required"] },
        streetAddress: { type: String, required: [true, "Shipping street address is required"] },
        postalCode: { type: String },
        neighborhoodName: { type: String, required: [true, "Shipping neighborhood name is required"] },
        cityName: { type: String, required: [true, "Shipping city name is required"] },
        additionalInfo: { type: String },
        originalAddressId: { type: Schema.Types.ObjectId, ref: 'Address', required: false }, // Opcional
        originalNeighborhoodId: { type: Schema.Types.ObjectId, ref: 'Neighborhood', required: true },
        originalCityId: { type: Schema.Types.ObjectId, ref: 'City', required: true },
    },
    // <<<--- FIN CAMPOS SHIPPING DETAILS --- >>>

    metadata: { type: Schema.Types.Mixed, default: {} }

}, {
    timestamps: true
});

export const OrderModel = mongoose.model("Order", orderSchema);