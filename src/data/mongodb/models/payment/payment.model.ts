// src/data/mongodb/models/payment/payment.model.ts
import mongoose from "mongoose";
import { MercadoPagoPaymentStatus } from "../../../../domain/interfaces/payment/mercado-pago.interface";
import { PaymentMethod, PaymentProvider } from "../../../../domain/entities/payment/payment.entity";

const paymentSchema = new mongoose.Schema({
    saleId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Sale",
        required: [true, "Sale reference is required"]
    },
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Customer",
        required: [true, "Customer reference is required"]
    },
    amount: {
        type: Number,
        required: [true, "Amount is required"],
        min: [0, "Amount cannot be negative"]
    },
    provider: {
        type: String,
        enum: Object.values(PaymentProvider),
        default: PaymentProvider.MERCADO_PAGO
    },
    status: {
        type: String,
        enum: Object.values(MercadoPagoPaymentStatus),
        default: MercadoPagoPaymentStatus.PENDING
    },
    externalReference: {
        type: String,
        required: [true, "External reference is required"],
        unique: true  // Define unique here, not again in schema.index()
    },
    providerPaymentId: {
        type: String,
        default: ""
    },
    preferenceId: {
        type: String,
        required: [true, "Preference ID is required"],
        unique: true  // Define unique here, not again in schema.index()
    },
    paymentMethod: {
        type: String,
        enum: Object.values(PaymentMethod),
        default: PaymentMethod.OTHER
    },
    idempotencyKey: {
        type: String,
        required: false,
        unique: true,  // Define unique here, not again in schema.index()
        sparse: true
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    }
}, {
    timestamps: true
});

// Keep only the indexes that don't duplicate the uniqueness constraints above
paymentSchema.index({ saleId: 1 });
paymentSchema.index({ customerId: 1 });
paymentSchema.index({ status: 1 });
// Remove these duplicate indexes:
// paymentSchema.index({ preferenceId: 1 }, { unique: true });
// paymentSchema.index({ externalReference: 1 }, { unique: true });
// paymentSchema.index({ idempotencyKey: 1 }, { unique: true, sparse: true });

export const PaymentModel = mongoose.model("Payment", paymentSchema);