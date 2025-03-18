import http from 'k6/http';
import { check, sleep, group } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 10 },   // Empezar con 10 usuarios
    { duration: '1m', target: 10 },    // Mantener 10 usuarios
    { duration: '30s', target: 25 },   // Subir a 25 usuarios
    { duration: '1m', target: 25 },    // Mantener 25 usuarios
    { duration: '30s', target: 50 },   // Subir a 50 usuarios
    { duration: '1m', target: 50 },    // Mantener 50 usuarios
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
  
  // Prueba de login
  group('Login', function() {
    const loginRes = http.post(`${baseUrl}/auth/login`, loginData, {
      headers: headers,
    });
    
    check(loginRes, {
      'Login exitoso': (r) => r.status === 200,
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
      });
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
  }
  
  // Esperar antes de la siguiente iteración
  sleep(1);
}