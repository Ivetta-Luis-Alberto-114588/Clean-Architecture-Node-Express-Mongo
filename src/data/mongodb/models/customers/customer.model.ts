import mongoose from "mongoose";

const customerSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Customer name is required"],
        trim: true,
        lowercase: true
    },
    email: {
        type: String,
        required: [true, "Customer email is required"],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/, "Please enter a valid email address"]
    },
    phone: {
        type: String,
        required: [true, "Customer phone is required"],
        trim: true,
        match: [/^\+?[\d\s-]{8,15}$/, "Please enter a valid phone number"]
    },
    address: {
        type: String,
        required: [true, "Customer address is required"],
        trim: true
    },
    neighborhood: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Neighborhood", // Esta es la referencia al modelo Neighborhood
        required: [true, "Neighborhood reference is required"]
    },
    isActive: {
        type: Boolean,
        required: false,
        default: true
    }
}, {
    timestamps: true
});

export const CustomerModel = mongoose.model("Customer", customerSchema);