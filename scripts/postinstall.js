#!/usr/bin/env node

// scripts/postinstall.js
// Script para manejar dependencias opcionales en deployment

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 [PostInstall] Verificando dependencias opcionales...');

// Lista de dependencias opcionales problemáticas
const problematicDeps = [
    'onnxruntime-node',
    '@xenova/transformers'
];

// Verificar si estamos en un entorno de CI/CD
const isCI = process.env.CI || process.env.RENDER || process.env.NETLIFY || process.env.VERCEL;

if (isCI) {
    console.log('🚀 [PostInstall] Entorno de deployment detectado');

    // Verificar si las dependencias problemáticas se instalaron correctamente
    const nodeModulesPath = path.join(process.cwd(), 'node_modules');

    problematicDeps.forEach(dep => {
        const depPath = path.join(nodeModulesPath, dep);
        if (fs.existsSync(depPath)) {
            console.log(`✅ [PostInstall] ${dep} instalado correctamente`);
        } else {
            console.log(`⚠️ [PostInstall] ${dep} no disponible - funcionalidades de IA deshabilitadas`);
        }
    });

    // Crear un archivo flag para indicar que estamos en deployment
    const flagPath = path.join(process.cwd(), '.deployment-mode');
    fs.writeFileSync(flagPath, `deployed-at=${new Date().toISOString()}\nplatform=${process.env.RENDER ? 'render' : 'unknown'}`);

    console.log('🎯 [PostInstall] Configuración de deployment completada');
} else {
    console.log('🏠 [PostInstall] Entorno de desarrollo detectado - todas las dependencias disponibles');
}

console.log('✅ [PostInstall] Script completado exitosamente');
