# API - Métodos de Entrega (Delivery Methods)

## Descripción

Este m### GET /api/admin/delivery-methods

Obtiene todos los métodos de entrega (activos e inactivos) con paginación.

**Autenticación:** Requerida (SUPER_ADMIN) gestiona los métodos de entrega disponibles para los pedidos. Los métodos de entrega definen cómo el cliente recibirá su pedido (envío a domicilio, retiro en local, etc.).

## Modelo de Datos

### DeliveryMethod

```typescript
interface DeliveryMethod {
  id: string;
  code: string;           // Código único (ej: 'SHIPPING', 'PICKUP')
  name: string;           // Nombre descriptivo
  description: string;    // Descripción del método
  requiresAddress: boolean; // Si requiere dirección de envío
  isActive: boolean;      // Si está activo
}
```

## Endpoints Públicos

### GET /api/delivery-methods

Obtiene la lista de métodos de entrega activos.

**Descripción:** Endpoint público que retorna solo los métodos de entrega que están activos (`isActive: true`).

**Autenticación:** No requerida

**Respuesta exitosa (200):**
```json
[
  {
    "id": "686ab638a9c878b4009af9dc",
    "code": "SHIPPING",
    "name": "Envío a Domicilio",
    "description": "Recibe tu pedido en la puerta de tu casa.",
    "requiresAddress": true,
    "isActive": true
  },
  {
    "id": "686ab638a9c878b4009af9de",
    "code": "PICKUP",
    "name": "Retiro en Local",
    "description": "Acércate a nuestra tienda a retirar tu pedido.",
    "requiresAddress": false,
    "isActive": true
  }
]
```

**Ejemplo de uso:**
```javascript
// Frontend - Obtener métodos de entrega
fetch('/api/delivery-methods')
  .then(response => response.json())
  .then(methods => {
    // Mostrar opciones al usuario
    methods.forEach(method => {
      console.log(`${method.name}: ${method.description}`);
      if (method.requiresAddress) {
        console.log('Requiere dirección de envío');
      }
    });
  });
```

## Endpoints Administrativos

Todos los endpoints administrativos requieren autenticación con rol SUPER_ADMIN.

### GET /api/admin/delivery-methods

Obtiene todos los métodos de entrega (activos e inactivos).

**Autenticación:** Requerida (ADMIN)

**Respuesta exitosa (200):** Array de DeliveryMethod

### POST /api/admin/delivery-methods

Crea un nuevo método de entrega.

**Autenticación:** Requerida (SUPER_ADMIN)

**Body:**
```json
{
  "code": "EXPRESS",
  "name": "Envío Express",
  "description": "Entrega en 24 horas",
  "requiresAddress": true,
  "isActive": true
}
```

**Respuesta exitosa (201):** DeliveryMethod creado

**Validaciones:**
- `code`: Requerido, único, máximo 20 caracteres
- `name`: Requerido, máximo 100 caracteres
- `description`: Requerido, máximo 500 caracteres
- `requiresAddress`: Requerido, boolean
- `isActive`: Opcional, default true

### PUT /api/admin/delivery-methods/:id

Actualiza un método de entrega existente.

**Autenticación:** Requerida (SUPER_ADMIN)

**Parámetros:**
- `id`: ID del método de entrega

**Body:** Campos a actualizar (parcial)
```json
{
  "name": "Nuevo nombre",
  "isActive": false
}
```

**Respuesta exitosa (200):** DeliveryMethod actualizado

### DELETE /api/admin/delivery-methods/:id

Elimina un método de entrega.

**Autenticación:** Requerida (SUPER_ADMIN)

**Parámetros:**
- `id`: ID del método de entrega

**Respuesta exitosa (200):**
```json
{
  "message": "Método de entrega eliminado correctamente"
}
```

## Integración con Orders

### Campo requerido en Orders

El modelo `Order` ahora incluye el campo `deliveryMethod` como referencia requerida:

```typescript
interface Order {
  // ...otros campos
  deliveryMethod: string; // ID del método de entrega (REQUERIDO)
  // ...otros campos
}
```

### Al crear órdenes

Cuando el frontend crea una orden, debe incluir el `deliveryMethodId`:

```javascript
// Frontend - Crear orden con método de entrega
const orderData = {
  customerId: "customer-id",
  items: [...],
  deliveryMethodId: "686ab638a9c878b4009af9dc", // ID del método seleccionado
  // otros campos...
};

fetch('/api/orders', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(orderData)
});
```

## Datos Iniciales (Seeders)

El sistema incluye 2 métodos de entrega por defecto:

1. **Envío a Domicilio (SHIPPING)**
   - Requiere dirección de envío
   - Para entregas en el domicilio del cliente

2. **Retiro en Local (PICKUP)**
   - No requiere dirección de envío
   - Para retirar en la tienda física

## Lógica de Negocio

### Frontend Considerations

1. **Mostrar métodos disponibles:** Usar GET /api/delivery-methods
2. **Validación de dirección:** Si `requiresAddress: true`, mostrar/validar campos de dirección
3. **Selección obligatoria:** El usuario debe seleccionar un método antes de finalizar la compra
4. **Información clara:** Mostrar descripción del método para que el usuario entienda qué implica cada opción

### Flujo recomendado en el checkout:

1. Cargar métodos de entrega disponibles
2. Mostrar opciones al usuario con descripciones
3. Si selecciona método que requiere dirección, mostrar formulario de dirección
4. Validar selección antes de proceder al pago
5. Incluir `deliveryMethodId` al crear la orden

## Códigos de Error

- **400**: Datos inválidos en el request
- **401**: No autenticado (solo endpoints admin)
- **403**: Sin permisos de super administrador
- **404**: Método de entrega no encontrado
- **500**: Error interno del servidor

## Notas Técnicas

- Los métodos de entrega se almacenan en la colección `deliverymethods`
- Se usa populate en las órdenes para traer información completa del método
- Los seeders se ejecutan automáticamente al iniciar la aplicación por primera vez
- El campo `code` debe ser único y se usa para identificar tipos específicos de entrega
