const fs = require('fs');

// Leer el archivo
const filePath = 'src/infrastructure/datasources/chatbot/chat.mongo.datasource.impl.ts';
let content = fs.readFileSync(filePath, 'utf8');

// Reemplazar patrones específicos para envolver en condiciones
const patterns = [
    {
        // Para save embeddings
        search: /const embedding = await this\.safeGenerateEmbedding\(([^)]+)\);\s*\/\/ Guardar embedding\s*await EmbeddingModel\.create\(\{/g,
        replace: `const embedding = await this.safeGenerateEmbedding($1);
            
            // Solo guardar si se pudo generar el embedding
            if (embedding) {
                await EmbeddingModel.create({`
    },
    {
        // Para cerrar los bloques que no fueron cerrados correctamente
        search: /(\s+)\}\);\s*(\}\s*console\.log)/g,
        replace: '$1});$1}$2'
    }
];

patterns.forEach(pattern => {
    content = content.replace(pattern.search, pattern.replace);
});

// Escribir el archivo
fs.writeFileSync(filePath, content);
console.log('Archivo actualizado exitosamente');
