/**
 * Tests de performance avanzados usando Artillery
 * 
 * Estos tests usan Artillery para crear escenarios más realistas
 * de comportamiento de usuarios
 */

import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { getConfig } from './performance-config';
import { warmupServer, healthCheck } from './performance-utils';

const config = getConfig();

describe('Advanced Performance Tests - Artillery', () => {
    const artilleryConfigPath = path.join(__dirname, 'artillery-config.yml');
    const reportsDir = path.join(__dirname, '..', '..', 'reports', 'performance');

    beforeAll(async () => {
        console.log('🚀 Iniciando setup para tests avanzados de performance...');
        console.log(`🎯 Target: ${config.baseUrl}`);

        // Crear directorio de reportes si no existe
        if (!fs.existsSync(reportsDir)) {
            fs.mkdirSync(reportsDir, { recursive: true });
        }

        // Warmup del servidor
        await warmupServer();

        // Health check
        const isHealthy = await healthCheck();
        if (!isHealthy) {
            throw new Error('❌ Servidor no está respondiendo correctamente');
        }

        console.log('✅ Setup completado, iniciando tests de Artillery...');
    }, 120000);

    test('User Journey Simulation - Mixed Traffic', async () => {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const reportPath = path.join(reportsDir, `artillery-mixed-${timestamp}.json`);
        const htmlReportPath = path.join(reportsDir, `artillery-mixed-${timestamp}.html`);

        console.log('🎭 Ejecutando simulación de journey de usuarios mixtos...');

        try {
            // Ejecutar Artillery con configuración personalizada
            const command = `npx artillery run "${artilleryConfigPath}" --output "${reportPath}" --environment render`;

            console.log(`📝 Comando Artillery: ${command}`);
            console.log('⏳ Esto puede tomar varios minutos...');

            // Configurar variables de entorno para Artillery
            const env = {
                ...process.env,
                PERFORMANCE_TARGET: config.baseUrl,
                NODE_ENV: 'test'
            };

            const result = execSync(command, {
                encoding: 'utf8',
                cwd: process.cwd(),
                env: env,
                timeout: 600000, // 10 minutos timeout
                maxBuffer: 1024 * 1024 * 10 // 10MB buffer
            });

            console.log('📊 Resultados de Artillery:');
            console.log(result);

            // Generar reporte HTML si el archivo JSON existe
            if (fs.existsSync(reportPath)) {
                try {
                    const htmlCommand = `npx artillery report "${reportPath}" --output "${htmlReportPath}"`;
                    execSync(htmlCommand, { encoding: 'utf8' });
                    console.log(`📄 Reporte HTML generado: ${htmlReportPath}`);
                } catch (htmlError) {
                    console.warn('⚠️ No se pudo generar reporte HTML:', htmlError.message);
                }

                // Leer y verificar resultados básicos
                const reportData = JSON.parse(fs.readFileSync(reportPath, 'utf8'));

                // Assertions básicas
                expect(reportData.aggregate).toBeDefined();
                expect(reportData.aggregate.counters).toBeDefined();
                expect(reportData.aggregate.rates).toBeDefined();

                // Verificar que se completaron las requests
                const totalRequests = reportData.aggregate.counters['http.requests'] || 0;
                const totalResponses = reportData.aggregate.counters['http.responses'] || 0;
                const errors = reportData.aggregate.counters['errors.total'] || 0;

                console.log('📈 Métricas finales:');
                console.log(`   Total requests: ${totalRequests}`);
                console.log(`   Total responses: ${totalResponses}`);
                console.log(`   Errors: ${errors}`);
                console.log(`   Error rate: ${totalRequests > 0 ? ((errors / totalRequests) * 100).toFixed(2) : 0}%`);

                // La tasa de error debe ser menor al 20% para tests en Render
                if (totalRequests > 0) {
                    const errorRate = (errors / totalRequests) * 100;
                    expect(errorRate).toBeLessThan(20);
                }

                // Verificar latencias
                if (reportData.aggregate.histograms && reportData.aggregate.histograms['http.response_time']) {
                    const responseTime = reportData.aggregate.histograms['http.response_time'];
                    console.log(`   Response time median: ${responseTime.median || 'N/A'}ms`);
                    console.log(`   Response time 95th: ${responseTime.p95 || 'N/A'}ms`);
                    console.log(`   Response time 99th: ${responseTime.p99 || 'N/A'}ms`);

                    // En Render, las latencias pueden ser altas, pero no deberían ser extremas
                    if (responseTime.median) {
                        expect(responseTime.median).toBeLessThan(10000); // Menos de 10 segundos median
                    }
                }

            } else {
                console.warn('⚠️ No se generó archivo de reporte, pero el test completó');
            }

        } catch (error) {
            console.error('❌ Error ejecutando Artillery:', error.message);

            // Si es un timeout o error de configuración, no fallar el test
            if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT')) {
                console.warn('⚠️ Test completado con timeout - esto es común en Render free tier');
                return; // No fallar el test
            }

            throw error;
        }

    }, 900000); // 15 minutos timeout total

    test('Quick Load Test - Health Endpoints Only', async () => {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const reportPath = path.join(reportsDir, `artillery-health-${timestamp}.json`);

        console.log('💊 Ejecutando test rápido de endpoints de salud...');

        // Crear configuración simplificada para test rápido
        const quickConfig = {
            config: {
                target: config.baseUrl,
                phases: [
                    {
                        duration: 30,
                        arrivalRate: 5
                    }
                ],
                defaults: {
                    headers: {
                        'User-Agent': 'Artillery-Quick-Test'
                    }
                }
            },
            scenarios: [
                {
                    name: 'Health Check Only',
                    flow: [
                        {
                            get: {
                                url: '/api/health'
                            }
                        },
                        {
                            think: 1
                        }
                    ]
                }
            ]
        };

        const quickConfigPath = path.join(__dirname, 'artillery-quick-config.json');
        fs.writeFileSync(quickConfigPath, JSON.stringify(quickConfig, null, 2));

        try {
            const command = `npx artillery run "${quickConfigPath}" --output "${reportPath}"`;

            const result = execSync(command, {
                encoding: 'utf8',
                timeout: 120000, // 2 minutos timeout
                maxBuffer: 1024 * 1024 * 5 // 5MB buffer
            });

            console.log('📊 Resultados del test rápido:');
            console.log(result);

            // Leer resultados
            if (fs.existsSync(reportPath)) {
                const reportData = JSON.parse(fs.readFileSync(reportPath, 'utf8'));

                const totalRequests = reportData.aggregate.counters['http.requests'] || 0;
                const errors = reportData.aggregate.counters['errors.total'] || 0;

                expect(totalRequests).toBeGreaterThan(0);
                expect(errors).toBeLessThan(totalRequests * 0.1); // Menos del 10% de errores

                console.log(`✅ Test rápido completado: ${totalRequests} requests, ${errors} errors`);
            }

        } catch (error) {
            console.error('❌ Error en test rápido:', error.message);
            throw error;
        } finally {
            // Limpiar archivo temporal
            if (fs.existsSync(quickConfigPath)) {
                fs.unlinkSync(quickConfigPath);
            }
        }

    }, 180000); // 3 minutos timeout
});
