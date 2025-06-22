// src/data/mongodb/models/order/order-status.model.ts
import mongoose, { Schema } from "mongoose";

const orderStatusSchema = new Schema({
    code: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true,
        minlength: 2,
        maxlength: 20
    },
    name: {
        type: String,
        required: true,
        trim: true,
        minlength: 2,
        maxlength: 50
    },
    description: {
        type: String,
        required: true,
        trim: true,
        minlength: 5,
        maxlength: 200
    },
    color: {
        type: String,
        default: '#6c757d',
        match: /^#[0-9A-F]{6}$/i  // Validar formato hexadecimal
    },
    order: {
        type: Number,
        required: true,
        default: 0,
        min: 0
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isDefault: {
        type: Boolean,
        default: false
    },
    canTransitionTo: [{
        type: Schema.Types.ObjectId,
        ref: 'OrderStatus'
    }]
}, {
    timestamps: true
});

// Índices para optimizar consultas
// orderStatusSchema.index({ code: 1 }); // Eliminado: duplicado con unique: true
orderStatusSchema.index({ isActive: 1 });
orderStatusSchema.index({ order: 1 });
orderStatusSchema.index({ isDefault: 1 });

// Middleware para asegurar solo un estado default
orderStatusSchema.pre('save', async function (next) {
    if (this.isDefault && this.isModified('isDefault')) {
        await mongoose.model('OrderStatus').updateMany(
            { _id: { $ne: this._id } },
            { isDefault: false }
        );
    }
    next();
});

export const OrderStatusModel = mongoose.model("OrderStatus", orderStatusSchema);
