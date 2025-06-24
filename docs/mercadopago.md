# 💳 Integración con MercadoPago

## 📋 Índice

- [🔧 Configuración](#-configuración)
- [💰 Procesamiento de Pagos](#-procesamiento-de-pagos)
- [🔗 Sistema de Webhooks](#-sistema-de-webhooks)
- [🔍 Trazabilidad y Auditoría](#-trazabilidad-y-auditoría)
- [🛠️ API Endpoints](#-api-endpoints)
- [📝 Ejemplos de Uso](#-ejemplos-de-uso)
- [🚨 Troubleshooting](#-troubleshooting)

---

## 🔧 Configuración

### Variables de Entorno Requeridas

```env
# MercadoPago
MERCADO_PAGO_ACCESS_TOKEN=APP_USR-your-access-token
MERCADO_PAGO_PUBLIC_KEY=APP_USR-your-public-key
MERCADO_PAGO_WEBHOOK_SECRET=your-webhook-secret
```

### Configuración del Adapter

El sistema utiliza un singleton `MercadoPagoAdapter` que maneja todas las interacciones con la API de MercadoPago:

```typescript
// src/infrastructure/adapters/mercado-pago.adapter.ts
const mpAdapter = MercadoPagoAdapter.getInstance();
```

---

## 💰 Procesamiento de Pagos

### 🛒 Flujo de Pago Completo

1. **Crear Preferencia de Pago**
2. **Redireccionar al Cliente**
3. **Recibir Webhook de Notificación**
4. **Consultar API de MercadoPago**
5. **Actualizar Estado del Pedido**

### 📦 Crear Preferencia de Pago

```http
POST /api/payments/create-preference
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "orderId": "order_123",
  "items": [
    {
      "id": "product_1",
      "title": "Producto Example",
      "quantity": 2,
      "unit_price": 1500.00
    }
  ],
  "payer": {
    "name": "Juan",
    "surname": "Pérez",
    "email": "juan@email.com"
  },
  "external_reference": "ORDER_123",
  "notification_url": "https://tu-dominio.com/webhook"
}
```

**Respuesta:**
```json
{
  "preferenceId": "123456789-abc-def-ghi",
  "initPoint": "https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=123456789-abc-def-ghi",
  "sandboxInitPoint": "https://sandbox.mercadopago.com.ar/checkout/v1/redirect?pref_id=123456789-abc-def-ghi"
}
```

### 💳 Información del Pago Completado

```http
GET /api/payments/{paymentId}
Authorization: Bearer <jwt-token>
```

**Respuesta:**
```json
{
  "id": 123456789,
  "status": "approved",
  "status_detail": "accredited",
  "transaction_amount": 3000.00,
  "currency_id": "ARS",
  "date_created": "2025-01-15T10:29:45.000-04:00",
  "date_approved": "2025-01-15T10:29:47.000-04:00",
  "external_reference": "ORDER_123",
  "payment_method_id": "visa",
  "installments": 3,
  "transaction_details": {
    "net_received_amount": 2850.00,
    "total_paid_amount": 3000.00
  },
  "payer": {
    "email": "juan@email.com",
    "identification": {
      "type": "DNI",
      "number": "12345678"
    }
  }
}
```

---

## 🔗 Sistema de Webhooks

### 🎯 Captura Automática

Todos los webhooks de MercadoPago se capturan automáticamente mediante middleware:

```typescript
// Middleware aplicado automáticamente
app.use('/webhook', webhookLoggerMiddleware);
```

### 📊 Endpoints de Administración de Webhooks

#### 📋 Listar Webhooks Capturados

```http
GET /api/webhooks?page=1&limit=20&source=mercadopago&processed=false
Authorization: Bearer <admin-jwt-token>
```

#### 🔍 Detalle de Webhook

```http
GET /api/webhooks/{webhookId}
Authorization: Bearer <admin-jwt-token>
```

#### 🚀 **Consulta Directa a MercadoPago** (⭐ ENDPOINT ESTRELLA)

```http
GET /api/webhooks/{webhookId}/mercadopago-details
Authorization: Bearer <admin-jwt-token>
```

**Este endpoint:**
- Extrae el `payment_id` del webhook
- Consulta directamente la API de MercadoPago
- Devuelve información completa y real del pago
- Incluye análisis de trazabilidad y duplicados

**Respuesta Completa:**
```json
{
  "webhookInfo": {
    "_id": "65a1b2c3d4e5f6789012345",
    "source": "mercadopago",
    "eventType": "payment",
    "createdAt": "2025-01-15T10:30:00Z",
    "paymentId": "123456789"
  },
  "mercadoPagoPayment": {
    "id": 123456789,
    "status": "approved",
    "transaction_amount": 2500.00,
    "external_reference": "ORDER_ABC123",
    "payment_method_id": "visa",
    "installments": 3,
    "date_approved": "2025-01-15T10:29:47.000-04:00",
    "payer": {
      "email": "cliente@email.com"
    }
  },
  "analysis": {
    "idempotencyKey": "uuid-from-metadata",
    "duplicates": {
      "found": false,
      "count": 0
    },
    "traceability": {
      "canLinkToOrder": true,
      "orderReference": "ORDER_ABC123",
      "paymentCompleted": true
    }
  }
}
```

#### 📈 Estadísticas de Webhooks

```http
GET /api/webhooks/stats
Authorization: Bearer <admin-jwt-token>
```

---

## 🔍 Trazabilidad y Auditoría

### 🎯 Vinculación de Pagos con Órdenes

El sistema permite rastrear cada pago mediante:

1. **`external_reference`**: Referencia de tu orden local
2. **`payment_id`**: ID único de MercadoPago
3. **Clave de idempotencia**: Para evitar duplicados
4. **Timestamps**: Fechas de creación y aprobación

### 🔍 Detección de Duplicados

El sistema automáticamente:
- Busca webhooks con el mismo `payment_id`
- Identifica patrones de duplicación
- Proporciona análisis de trazabilidad

### 📊 Información Crítica para Auditoría

- **Monto exacto cobrado** (`transaction_amount`)
- **Estado real del pago** (`status`)
- **Método de pago utilizado** (`payment_method_id`)
- **Comisiones aplicadas** (`fee_details`)
- **Datos del pagador** (`payer`)
- **Detalles de la tarjeta** (`card` - si aplica)

---

## 🛠️ API Endpoints

### 💳 Gestión de Pagos

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `POST` | `/api/payments/create-preference` | Crear preferencia de pago |
| `GET` | `/api/payments/{id}` | Obtener información de pago |
| `GET` | `/api/payments/search` | Buscar pagos con filtros |
| `POST` | `/api/payments/process-webhook` | Procesar webhook manualmente |

### 🔗 Gestión de Webhooks

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/webhooks` | Listar webhooks con filtros |
| `GET` | `/api/webhooks/stats` | Estadísticas de webhooks |
| `GET` | `/api/webhooks/{id}` | Detalle de webhook específico |
| `GET` | `/api/webhooks/{id}/mercadopago-details` | **Consulta directa a MercadoPago** |

---

## 📝 Ejemplos de Uso

### 🛒 Checkout Completo

```javascript
// 1. Crear preferencia
const preference = await fetch('/api/payments/create-preference', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    orderId: 'ORDER_123',
    items: cartItems,
    external_reference: 'ORDER_123'
  })
});

// 2. Redireccionar al checkout
window.location.href = preference.initPoint;
```

### 🔍 Verificar Estado de Pago

```javascript
// Consultar información real desde MercadoPago
const details = await fetch(`/api/webhooks/${webhookId}/mercadopago-details`, {
  headers: {
    'Authorization': `Bearer ${adminToken}`
  }
});

const paymentInfo = await details.json();
console.log('Estado real:', paymentInfo.mercadoPagoPayment.status);
console.log('Monto:', paymentInfo.mercadoPagoPayment.transaction_amount);
```

---

## 🚨 Troubleshooting

### ❌ Problemas Comunes

#### 🔴 Webhook no recibido
- Verificar URL de webhook en MercadoPago
- Revisar logs: `GET /api/webhooks`
- Comprobar firewall/proxy

#### 🔴 Pago aprobado pero orden no actualizada
- Usar: `GET /api/webhooks/{id}/mercadopago-details`
- Verificar `external_reference`
- Procesar webhook manualmente

#### 🔴 Duplicados de webhook
- Revisar análisis de duplicados en la respuesta
- Implementar idempotencia en procesamiento

### 🔧 Logs Útiles

```bash
# Ver logs de webhooks
tail -f logs/combined-*.log | grep "webhook"

# Ver logs de MercadoPago
tail -f logs/combined-*.log | grep "mercadopago"
```

### 📞 Soporte

Para problemas específicos con MercadoPago:
1. Revisar documentación oficial: https://www.mercadopago.com.ar/developers
2. Consultar logs del sistema
3. Usar endpoints de trazabilidad para diagnóstico

---

## 🔐 Seguridad

### 🛡️ Validación de Webhooks

- Verificación de IP de origen
- Validación de estructura de payload
- Logging completo para auditoría

### 🔑 Manejo de Credenciales

- Access tokens almacenados en variables de entorno
- Rotación periódica recomendada
- Separación entre entornos (sandbox/production)

---

**💡 Tip:** El endpoint `/api/webhooks/{id}/mercadopago-details` es tu herramienta principal para resolver cualquier discrepancia entre tu sistema local y MercadoPago.
