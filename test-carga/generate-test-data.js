require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Modelos
const UserSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
    roles: [String]
});

const ProductSchema = new mongoose.Schema({
    name: String,
    description: String,
    price: Number,
    stock: Number,
    category: mongoose.Schema.Types.ObjectId,
    unit: mongoose.Schema.Types.ObjectId,
    imgUrl: String,
    isActive: Boolean
});

const CategorySchema = new mongoose.Schema({
    name: String,
    description: String,
    isActive: Boolean
});

const UnitSchema = new mongoose.Schema({
    name: String,
    description: String,
    isActive: Boolean
});

// Registrar modelos
const User = mongoose.model('User', UserSchema);
const Product = mongoose.model('Product', ProductSchema);
const Category = mongoose.model('Category', CategorySchema);
const Unit = mongoose.model('Unit', UnitSchema);

// Configurar conexión - usamos una conexión local simple
const MONGO_URL = 'mongodb://127.0.0.1:27017/test_db';

// Opciones de conexión mejoradas
mongoose.connect(MONGO_URL, {
    serverSelectionTimeoutMS: 5000, // Reducir el tiempo de espera
    directConnection: true // Forzar conexión directa (no replica set)
})
.then(() => {
    console.log('Conectado a MongoDB');
    generateData();
})
.catch(err => {
    console.error('Error al conectar a MongoDB:', err);
});

// Función para generar hash de contraseña
function hashPassword(password) {
    return bcrypt.hashSync(password, 10);
}

async function generateData() {
    try {
        // Limpiar datos existentes
        await User.deleteMany({});
        await Category.deleteMany({});
        await Unit.deleteMany({});
        await Product.deleteMany({});

        console.log('Datos previos eliminados');

        // Crear usuario de prueba
        const user = await User.create({
            name: 'usuario de prueba',
            email: 'test@example.com',
            password: hashPassword('password123'),
            roles: ['USER_ROLE', 'ADMIN_ROLE']
        });

        console.log('Usuario creado:', user.email);

        // Crear unidades
        const units = [];
        const unitNames = ['Kilogramo', 'Litro', 'Unidad', 'Docena', 'Metro'];
        
        for (const name of unitNames) {
            const unit = await Unit.create({
                name: name.toLowerCase(),
                description: `Descripción de ${name}`,
                isActive: true
            });
            units.push(unit);
        }
        
        console.log('Unidades creadas:', units.length);

        // Crear categorías
        const categories = [];
        const categoryNames = ['Electrónica', 'Ropa', 'Alimentos', 'Hogar', 'Deportes'];
        
        for (const name of categoryNames) {
            const category = await Category.create({
                name: name.toLowerCase(),
                description: `Descripción de ${name}`,
                isActive: true
            });
            categories.push(category);
        }
        
        console.log('Categorías creadas:', categories.length);

        // Crear productos
        const products = [];
        
        for (let i = 1; i <= 50; i++) {
            const randomCategory = categories[Math.floor(Math.random() * categories.length)];
            const randomUnit = units[Math.floor(Math.random() * units.length)];
            
            const product = await Product.create({
                name: `producto ${i}`,
                description: `Descripción del producto ${i}`,
                price: Math.floor(Math.random() * 1000) + 100,
                stock: Math.floor(Math.random() * 100) + 10,
                category: randomCategory._id,
                unit: randomUnit._id,
                imgUrl: `https://via.placeholder.com/150?text=Producto${i}`,
                isActive: true
            });
            
            products.push(product);
        }
        
        console.log('Productos creados:', products.length);
        
        console.log('Generación de datos completada exitosamente');
        
        // Desconectar de MongoDB
        await mongoose.disconnect();
        console.log('Desconectado de MongoDB');
        
    } catch (error) {
        console.error('Error en la generación de datos:', error);
        await mongoose.disconnect();
    }
}