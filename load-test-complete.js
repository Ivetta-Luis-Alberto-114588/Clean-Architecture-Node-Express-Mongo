import http from 'k6/http';
import { check, sleep, group } from 'k6';

export const options = {
  stages: [
    // { duration: '30s', target: 10 },   // Empezar con 10 usuarios
    // { duration: '1m', target: 10 },    // Mantener 10 usuarios
    //  { duration: '30s', target: 25 },   // Subir a 25 usuarios
    //  { duration: '1m', target: 25 },    // Mantener 25 usuarios
    // { duration: '30s', target: 50 },   // Subir a 50 usuarios
    // { duration: '1m', target: 50 },    // Mantener 50 usuarios
    //  { duration: '30s', target: 100 },  // Subir a 100 usuarios
    //  { duration: '1m', target: 100 },   // Mantener 100 usuarios
    { duration: '30s', target: 200 },  // Subir a 500 usuarios
    { duration: '1m', target: 200 },   // Mantener 500 usuarios  
    { duration: '30s', target: 0 },    // Terminar gradualmente
  ],
};

// URL base de tu API
const baseUrl = 'http://localhost:3000/api';

// Datos para login
const loginData = JSON.stringify({
  email: 'laivetta@gmail.com',
  password: '123456'
});

const headers = {
  'Content-Type': 'application/json',
};

export default function() {
  let token = '';
  let productId = '';
  let saleId = '';
  


  // Prueba de login
  group('Login', function() {
    const loginRes = http.post(`${baseUrl}/auth/login`, loginData, {
      headers: headers,
    });
    
    check(loginRes, {
      'Login exitoso': (r) => r.status === 200,
      'Respuesta contiene token': (r) => JSON.parse(r.body).user.token !== undefined,
    });
    
    if (loginRes.status === 200) {
      const body = JSON.parse(loginRes.body);
      token = body.user.token;
    }
  });
  
  // Si obtuvimos token, realizar otras peticiones
  if (token) {
    const authHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };



    
    // Prueba de listado de productos
    group('Productos', function() {
      const productsRes = http.get(`${baseUrl}/products`, {
        headers: authHeaders,
      });
      
      check(productsRes, {
        'Obtención de productos exitosa': (r) => r.status === 200,
        'Respuesta contiene datos': (r) => r.body.length > 0,
      });
      
      // Si la respuesta es exitosa y hay productos, guardamos un ID para uso posterior
      if (productsRes.status === 200) {
        try {
          const products = JSON.parse(productsRes.body);
          if (products && products.length > 0) {
            productId = products[0].id;
          }
        } catch (e) {
          console.error('Error al parsear respuesta de productos:', e);
        }
      }
    });


    
    // Prueba de listado de categorías
    group('Categorías', function() {
      const categoriesRes = http.get(`${baseUrl}/categories`, {
        headers: authHeaders,
      });
      
      check(categoriesRes, {
        'Obtención de categorías exitosa': (r) => r.status === 200,
      });
    });



    
    // Prueba de creación de producto
    group('Crear Producto', function() {
      // Obtenemos una categoría y una unidad para usar en la creación
      let categoryId = '';
      let unitId = '';
      
      // Obtener categoría válida
      const categoriesRes = http.get(`${baseUrl}/categories`, {
        headers: authHeaders,
      });
      
      if (categoriesRes.status === 200) {
        try {
          const categories = JSON.parse(categoriesRes.body);
          if (categories && categories.length > 0) {
            categoryId = categories[0].id;
          }
        } catch (e) {
          console.error('Error al parsear respuesta de categorías:', e);
        }
      }
      
      // Obtener unidad válida
      const unitsRes = http.get(`${baseUrl}/units`, {
        headers: authHeaders,
      });
      
      if (unitsRes.status === 200) {
        try {
          const units = JSON.parse(unitsRes.body);
          if (units && units.length > 0) {
            unitId = units[0].id;
          }
        } catch (e) {
          console.error('Error al parsear respuesta de unidades:', e);
        }
      }
      
      // Solo crear producto si tenemos categoría y unidad válidas
      if (categoryId && unitId) {
        const newProduct = JSON.stringify({
            name: `Producto de Prueba ${Date.now()}_${Math.floor(Math.random() * 10000)}`,
            description: "Producto creado durante test de carga",
            price: 100,
            stock: 20,
            category: categoryId,
            unit: unitId,
            imgUrl: "https://via.placeholder.com/150",  // URL de imagen de prueba
            isActive: true
        });
        
        const createProductRes = http.post(`${baseUrl}/products`, newProduct, {
          headers: authHeaders,
        });
        
        check(createProductRes, {
          'Creación de producto exitosa': (r) => r.status === 200,
          'Producto contiene id': (r) => JSON.parse(r.body).id !== undefined,
        });
        
        // Guardar el ID para posible uso posterior
        if (createProductRes.status === 200) {
          try {
            const product = JSON.parse(createProductRes.body);
            productId = product.id;
          } catch (e) {
            console.error('Error al parsear respuesta de creación de producto:', e);
          }
        }
      }
    });
}


    
    
  
  // Esperar antes de la siguiente iteración
  sleep(1);
}