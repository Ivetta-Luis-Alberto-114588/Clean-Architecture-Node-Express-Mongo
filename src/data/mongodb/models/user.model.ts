import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        // digo si es requerido o no y el msj de error si no se cumple
        required: [true, "name is required"]
    },

    email:{
        type: String,
        // digo si es requerido o no y el msj de error si no se cumple
        required: [true, "email is required"],
        unique: true
    },

    password: {
        type: String,
        // digo si es requerido o no y el msj de error si no se cumple
        required: [true, "password is required"]
    },

    img:{
        type: String
    },

    roles: {
        type: [String],
        default: ['USER_ROLE'],
        enum: ['USER_ROLE', 'ADMIN_ROLE']
    }
})


export const UserModel = mongoose.model('User', userSchema)
// UserModel es el nombre del modelo que se va a utilizar en el controlador
// User es el nombre de la coleccion en la base de datos
// userSchema es el esquema que se va a utilizar la 