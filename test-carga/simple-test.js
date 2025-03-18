import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 10 },  // Solo subimos a 10 usuarios para ver si funciona
  ],
};

export default function() {
  // Login
  const loginRes = http.post(
    'http://localhost:3000/api/auth/login', 
    JSON.stringify({
      email: 'laivetta@gmail.com',
      password: '123456'
    }), 
    {
      headers: { 'Content-Type': 'application/json' },
    }
  );
  
  const loginSuccess = check(loginRes, {
    'Login exitoso': (r) => r.status === 200,
  });
  
  let token;
  if (loginSuccess && loginRes.status === 200) {
    const body = JSON.parse(loginRes.body);
    token = body.user.token;
    
    // Si obtuvimos token, hacemos la consulta de productos
    if (token) {
      const productsRes = http.get(
        'http://localhost:3000/api/products', 
        { 
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      check(productsRes, {
        'Productos obtenidos exitosamente': (r) => r.status === 200,
      });
    }
  }
  
  sleep(1);
}