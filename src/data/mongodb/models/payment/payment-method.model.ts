// src/data/mongodb/models/payment/payment-method.model.ts

import { Schema, model } from 'mongoose';

const paymentMethodSchema = new Schema({
    code: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    defaultOrderStatusId: {
        type: Schema.Types.ObjectId,
        ref: 'OrderStatus',
        required: true
    },
    requiresOnlinePayment: {
        type: Boolean,
        required: true
    }
}, {
    timestamps: true,
    versionKey: false
});

// Índices
paymentMethodSchema.index({ code: 1 });
paymentMethodSchema.index({ isActive: 1 });

export const PaymentMethodModel = model('PaymentMethod', paymentMethodSchema);
