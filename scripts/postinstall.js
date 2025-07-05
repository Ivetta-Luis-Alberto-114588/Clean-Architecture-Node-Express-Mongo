#!/usr/bin/env node

// scripts/postinstall.js
// Script para manejar dependencias opcionales en deployment

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 [PostInstall] Verificando dependencias opcionales...');
console.log('[PostInstall] Node version:', process.version);
console.log('[PostInstall] Platform:', process.platform);
console.log('[PostInstall] Architecture:', process.arch);
console.log('[PostInstall] Working directory:', process.cwd());

// Lista de dependencias opcionales problemáticas
const problematicDeps = [
    'onnxruntime-node',
    '@xenova/transformers'
];

// Verificar si estamos en un entorno de CI/CD
const isCI = process.env.CI || process.env.RENDER || process.env.NETLIFY || process.env.VERCEL;

console.log('[PostInstall] Environment variables check:');
console.log('  CI:', !!process.env.CI);
console.log('  RENDER:', !!process.env.RENDER);
console.log('  NETLIFY:', !!process.env.NETLIFY);
console.log('  VERCEL:', !!process.env.VERCEL);
console.log('  NODE_ENV:', process.env.NODE_ENV);
console.log('  Is CI/CD:', isCI);

if (isCI) {
    console.log('🚀 [PostInstall] Entorno de deployment detectado');

    // Verificar si las dependencias problemáticas se instalaron correctamente
    const nodeModulesPath = path.join(process.cwd(), 'node_modules');
    console.log('[PostInstall] Node modules path:', nodeModulesPath);
    console.log('[PostInstall] Node modules exists:', fs.existsSync(nodeModulesPath));

    if (fs.existsSync(nodeModulesPath)) {
        const nodeModulesContents = fs.readdirSync(nodeModulesPath);
        console.log('[PostInstall] Node modules count:', nodeModulesContents.length);
    }

    problematicDeps.forEach(dep => {
        const depPath = path.join(nodeModulesPath, dep);
        const exists = fs.existsSync(depPath);
        console.log(`[PostInstall] Checking ${dep}:`, { path: depPath, exists });
        
        if (exists) {
            console.log(`✅ [PostInstall] ${dep} instalado correctamente`);
        } else {
            console.log(`⚠️ [PostInstall] ${dep} no disponible - funcionalidades de IA deshabilitadas`);
        }
    });

    // Crear un archivo flag para indicar que estamos en deployment
    const flagPath = path.join(process.cwd(), '.deployment-mode');
    const flagContent = `deployed-at=${new Date().toISOString()}\nplatform=${process.env.RENDER ? 'render' : 'unknown'}\nnode-version=${process.version}`;
    
    try {
        fs.writeFileSync(flagPath, flagContent);
        console.log('[PostInstall] Deployment flag created:', flagPath);
    } catch (error) {
        console.error('[PostInstall] Error creating deployment flag:', error);
    }

    console.log('🎯 [PostInstall] Configuración de deployment completada');
} else {
    console.log('🏠 [PostInstall] Entorno de desarrollo detectado - todas las dependencias disponibles');
}

// Verificar que TypeScript compilation funcione
try {
    console.log('[PostInstall] Checking TypeScript compilation...');
    execSync('npx tsc --noEmit', { stdio: 'pipe' });
    console.log('✅ [PostInstall] TypeScript compilation check passed');
} catch (error) {
    console.error('❌ [PostInstall] TypeScript compilation check failed:', error.message);
    if (error.stdout) console.log('STDOUT:', error.stdout.toString());
    if (error.stderr) console.log('STDERR:', error.stderr.toString());
}

console.log('✅ [PostInstall] Script completado exitosamente');
