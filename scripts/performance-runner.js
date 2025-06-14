/**
 * Script para ejecutar tests de performance
 * 
 * Permite ejecutar diferentes tipos de tests con configuraciones específicas
 */

const { execSync } = require('child_process');
const path = require('path');

const TESTS = {
    basic: {
        name: 'Basic Load Testing',
        pattern: 'tests/performance/basic-load',
        description: 'Tests básicos de carga con Autocannon'
    },
    endpoints: {
        name: 'Endpoint-Specific Tests',
        pattern: 'tests/performance/endpoint-specific',
        description: 'Tests específicos de endpoints críticos'
    },
    artillery: {
        name: 'Advanced Artillery Tests',
        pattern: 'tests/performance/artillery',
        description: 'Tests avanzados con Artillery para simulación de usuarios'
    },
    all: {
        name: 'All Performance Tests',
        pattern: 'tests/performance',
        description: 'Todos los tests de performance'
    }
};

function runPerformanceTests(testType = 'basic', target = 'render') {
    const test = TESTS[testType];

    if (!test) {
        console.error(`❌ Tipo de test '${testType}' no válido. Opciones: ${Object.keys(TESTS).join(', ')}`);
        process.exit(1);
    }

    console.log(`🚀 Ejecutando: ${test.name}`);
    console.log(`📝 Descripción: ${test.description}`);
    console.log(`🎯 Target: ${target === 'render' ? 'https://sistema-mongo.onrender.com' : 'localhost'}`);
    console.log('━'.repeat(60));

    // Configurar variables de entorno
    const env = {
        ...process.env,
        NODE_ENV: 'test',
        PERFORMANCE_TARGET: target === 'render' ? 'render' : 'local'
    };

    const command = [
        'jest',
        `--testPathPattern=${test.pattern}`,
        '--detectOpenHandles',
        '--forceExit',
        '--runInBand',
        '--verbose'
    ].join(' ');

    try {
        console.log(`📋 Comando: ${command}`);
        console.log('⏳ Ejecutando tests... (esto puede tomar varios minutos)');
        console.log('');

        execSync(command, {
            stdio: 'inherit',
            env: env,
            cwd: process.cwd()
        });

        console.log('');
        console.log('✅ Tests de performance completados exitosamente!');
        console.log('📊 Revisa los logs para ver las métricas detalladas');

    } catch (error) {
        console.error('❌ Error ejecutando tests de performance:', error.message);
        process.exit(1);
    }
}

// Leer argumentos de línea de comandos
const args = process.argv.slice(2);
const testType = args[0] || 'basic';
const target = args[1] || 'render';

// Mostrar ayuda si se solicita
if (args.includes('--help') || args.includes('-h')) {
    console.log('🎯 Script de Performance Testing');
    console.log('');
    console.log('Uso: node performance-runner.js [tipo] [target]');
    console.log('');
    console.log('Tipos de test disponibles:');
    Object.entries(TESTS).forEach(([key, test]) => {
        console.log(`  ${key.padEnd(12)} - ${test.description}`);
    });
    console.log('');
    console.log('Targets disponibles:');
    console.log('  render       - Tests contra https://sistema-mongo.onrender.com');
    console.log('  local        - Tests contra localhost:3000');
    console.log('');
    console.log('Ejemplos:');
    console.log('  node performance-runner.js basic render');
    console.log('  node performance-runner.js endpoints local');
    console.log('  node performance-runner.js all render');
    process.exit(0);
}

runPerformanceTests(testType, target);
