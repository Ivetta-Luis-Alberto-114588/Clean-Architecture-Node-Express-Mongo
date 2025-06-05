// Script temporal para configurar estado por defecto
const { MongoClient } = require('mongodb');

const MONGO_URL = 'mongodb+srv://laivetta:cerro1870@cluster0.h835awr.mongodb.net/';
const DB_NAME = 'mystore';

async function setupDefaultStatus() {
    const client = new MongoClient(MONGO_URL);
    
    try {
        await client.connect();
        console.log('✅ Conectado a MongoDB Atlas');
        
        const db = client.db(DB_NAME);
        const statusCollection = db.collection('orderstatuses');
        
        // Primero, ver qué estados existen
        const allStatuses = await statusCollection.find({}).toArray();
        console.log('📋 Estados existentes:');
        allStatuses.forEach((status, index) => {
            console.log(`  ${index + 1}. ${status.name} (ID: ${status._id}) - Default: ${status.isDefault || false}`);
        });
        
        // Buscar si ya hay un estado por defecto
        const defaultStatus = await statusCollection.findOne({ isDefault: true });
        
        if (defaultStatus) {
            console.log(`✅ Ya existe un estado por defecto: ${defaultStatus.name}`);
        } else {
            console.log('⚠️ No hay estado por defecto configurado. Configurando...');
            
            // Buscar un estado apropiado para marcar como default (PENDING, PENDIENTE, etc.)
            const pendingStatus = await statusCollection.findOne({ 
                $or: [
                    { name: /PENDING/i },
                    { name: /PENDIENTE/i },
                    { name: /NUEVO/i },
                    { name: /CREADO/i }
                ]
            });
            
            if (pendingStatus) {
                // Marcar como default
                await statusCollection.updateOne(
                    { _id: pendingStatus._id },
                    { $set: { isDefault: true } }
                );
                console.log(`✅ Estado "${pendingStatus.name}" marcado como por defecto`);
            } else {
                // Si no existe, crear uno nuevo
                const newStatus = {
                    name: 'PENDIENTE',
                    description: 'Pedido pendiente de procesar',
                    isDefault: true,
                    isActive: true,
                    color: '#FFA500',
                    createdAt: new Date(),
                    updatedAt: new Date()
                };
                
                const result = await statusCollection.insertOne(newStatus);
                console.log(`✅ Nuevo estado por defecto creado: ${newStatus.name} (ID: ${result.insertedId})`);
            }
        }
        
        // Verificar el resultado final
        const finalDefaultStatus = await statusCollection.findOne({ isDefault: true });
        console.log(`🎯 Estado por defecto configurado: ${finalDefaultStatus.name} (ID: ${finalDefaultStatus._id})`);
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await client.close();
        console.log('🔌 Conexión cerrada');
    }
}

setupDefaultStatus();
