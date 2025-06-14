# Tests de Performance - Backend E-commerce

Este directorio contiene tests de rendimiento y carga para el backend del e-commerce, diseñados específicamente para trabajar con Render.com en su capa gratuita.

## 🎯 Configuración para Render.com

Los tests están configurados teniendo en cuenta las limitaciones de Render.com free tier:

- **Cold Start**: 50+ segundos para la primera petición
- **Máximo de usuarios concurrentes**: 30 (como solicitaste)
- **Timeouts generosos**: 60 segundos por request
- **Warmup automático**: Antes de cada suite de tests

## 📁 Estructura de Tests

```
tests/performance/
├── performance-config.ts      # Configuración general
├── performance-utils.ts       # Utilidades y helpers
├── basic-load.test.ts        # Tests básicos con Autocannon
├── artillery.test.ts         # Tests avanzados con Artillery
├── endpoint-specific.test.ts # Tests específicos de endpoints
└── artillery-config.yml      # Configuración de Artillery
```

## 🚀 Cómo Ejecutar los Tests

### Scripts Disponibles

```bash
# Tests básicos de carga (recomendado para empezar)
npm run test:performance:basic

# Tests específicos de endpoints críticos
npm run test:performance:endpoints

# Tests avanzados con Artillery (más intensivos)
npm run test:performance:artillery

# Todos los tests de performance
npm run test:performance

# Tests contra servidor local (si tienes el backend corriendo localmente)
npm run test:performance:local
```

### Script Personalizado

También puedes usar el script personalizado:

```bash
# Ayuda
node scripts/performance-runner.js --help

# Tests básicos contra Render
node scripts/performance-runner.js basic render

# Tests de endpoints contra local
node scripts/performance-runner.js endpoints local

# Todos los tests contra Render
node scripts/performance-runner.js all render
```

## 📊 Tipos de Tests

### 1. Basic Load Tests (`basic-load.test.ts`)

Tests simples usando **Autocannon** que verifican:

- ✅ Health checks
- ✅ Listado de productos
- ✅ Categorías
- ✅ Operaciones de carrito (con autenticación)
- ✅ Test de estrés con 30 usuarios concurrentes

**Duración**: ~5-10 minutos
**Recomendado para**: Verificación rápida de rendimiento

### 2. Artillery Tests (`artillery.test.ts`)

Tests avanzados usando **Artillery** que simulan:

- 👥 Múltiples tipos de usuarios (anónimos, registrados)
- 🛒 Journeys completos de e-commerce
- 📈 Escalamiento gradual de carga
- 🎭 Comportamiento realista de usuarios

**Duración**: ~10-15 minutos
**Recomendado para**: Tests completos de carga

### 3. Endpoint-Specific Tests (`endpoint-specific.test.ts`)

Tests focalizados en endpoints críticos:

- ⏱️ Tiempos de respuesta específicos
- 🔄 Consistencia de datos
- 🔐 Performance de autenticación
- 📊 Operaciones concurrentes

**Duración**: ~3-8 minutos
**Recomendado para**: Análisis detallado de endpoints específicos

## 🔧 Configuración

### Variables de Entorno

Los tests usan las mismas variables de entorno que tu aplicación:

```env
# Target URL (automático según configuración)
PERFORMANCE_TARGET=render  # o 'local'

# Las demás variables se toman de tu .env
MONGO_URL=...
JWT_SEED=...
# etc.
```

### Configuración Render vs Local

| Configuración | Render | Local |
|---------------|--------|-------|
| URL Base | https://sistema-mongo.onrender.com | http://localhost:3000 |
| Max Usuarios | 30 | 50 |
| Timeout | 60s | 30s |
| Warmup Delay | 60s | 5s |
| Duración Tests | Más largos | Más cortos |

## 📈 Interpretando Resultados

### Métricas Importantes

- **Requests/sec**: Throughput del servidor
- **Latency avg**: Tiempo promedio de respuesta
- **Latency max**: Tiempo máximo de respuesta
- **Error rate**: Porcentaje de errores/timeouts
- **2xx responses**: Respuestas exitosas

### Valores Esperados para Render

| Métrica | Valor Aceptable | Valor Ideal |
|---------|----------------|-------------|
| Latency avg | < 5000ms | < 2000ms |
| Latency max | < 15000ms | < 8000ms |
| Error rate | < 20% | < 5% |
| Requests/sec | > 1 | > 5 |

### Valores Esperados para Local

| Métrica | Valor Aceptable | Valor Ideal |
|---------|----------------|-------------|
| Latency avg | < 1000ms | < 500ms |
| Latency max | < 3000ms | < 1500ms |
| Error rate | < 5% | < 1% |
| Requests/sec | > 10 | > 50 |

## 📋 Reportes

Los tests generan reportes en:

```
reports/performance/
├── artillery-mixed-[timestamp].json
├── artillery-mixed-[timestamp].html
└── artillery-health-[timestamp].json
```

Los reportes HTML son más fáciles de leer y contienen gráficos.

## ⚠️ Consideraciones Importantes

### Para Render.com

1. **Cold Start**: La primera petición puede tomar 50+ segundos
2. **Warmup necesario**: Los tests incluyen warmup automático
3. **Límites de carga**: No exceder 30 usuarios concurrentes
4. **Timeouts**: Configurados generosamente para evitar falsos negativos

### Para Optimización

1. **Base de datos**: Los tests usan tu BD real en Atlas
2. **Cache**: Considera implementar cache para mejorar performance
3. **Índices**: Asegúrate de tener índices apropiados en MongoDB
4. **Rate limiting**: Los tests respetan el rate limiting configurado

## 🛠️ Troubleshooting

### Error: "Server not responding"

```bash
# Verificar que el servidor esté corriendo
curl https://sistema-mongo.onrender.com/api/health

# Ejecutar solo warmup
npm run performance:warmup
```

### Error: "Timeout"

- Los timeouts son comunes en Render free tier
- Los tests están configurados para ser tolerantes
- Si persiste, revisar la configuración de la base de datos

### Error: "Authentication failed"

- Los tests crean usuarios de prueba automáticamente
- Verificar que los endpoints de auth estén funcionando
- Revisar logs de la aplicación en Render

## 🚀 Próximos Pasos

1. **Ejecutar tests básicos** para establecer baseline
2. **Analizar métricas** y identificar cuellos de botella
3. **Implementar optimizaciones** basadas en resultados
4. **Configurar CI/CD** para ejecutar tests regularmente
5. **Monitoreo continuo** con herramientas como New Relic o DataDog

---

**Nota**: Estos tests están diseñados para ser ejecutados ocasionalmente, no en cada commit, debido a que consumen recursos significativos en Render free tier.
