import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "name is required"], // digo si es requerido o no y el msj de error si no se cumple
        trim: true,
        lowercase: true
    },

    email:{
        type: String,       
        required: [true, "email is required"],  // digo si es requerido o no y el msj de error si no se cumple
        trim: true,
        lowercase: true,
        unique: true
    },

    password: {
        type: String,
        trim: true,
        lowercase: true,
        required: [true, "password is required"]  // digo si es requerido o no y el msj de error si no se cumple
    },

    img:{
        type: String
    },

    roles: {
        type: [String],
        default: ['USER_ROLE'],
        enum: ['USER_ROLE', 'ADMIN_ROLE']
    }
},
{
    timestamps: true // Esto añade automáticamente createdAt y updatedAt
})


export const UserModel = mongoose.model('User', userSchema)
// UserModel es el nombre del modelo que se va a utilizar en el controlador
// User es el nombre de la coleccion en la base de datos
// userSchema es el esquema que se va a utilizar la 