import http from 'k6/http';
import { check, sleep, group } from 'k6';

export const options = {
  vus: 1,
  duration: '10s',
};

export default function() {
  let token;
  
  group('Login', function() {
    console.log("Iniciando solicitud de login...");
    
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
    
    console.log(`Status login: ${loginRes.status}, Body: ${loginRes.body.substring(0, 50)}...`);
    
    check(loginRes, {
      'Login exitoso': (r) => r.status === 200,
    });
    
    if (loginRes.status === 200) {
      const body = JSON.parse(loginRes.body);
      token = body.user.token;
      console.log(`Token obtenido: ${token.substring(0, 15)}...`);
    } else {
      console.log("No se pudo obtener token");
    }
  });
  
  if (token) {
    const authHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
    
    group('Productos', function() {
      console.log("Consultando productos...");
      
      const productsRes = http.get(
        'http://localhost:3000/api/products', 
        { headers: authHeaders }
      );
      
      console.log(`Status productos: ${productsRes.status}, Body length: ${productsRes.body.length}`);
      
      check(productsRes, {
        'Productos obtenidos exitosamente': (r) => r.status === 200,
      });
    });
  }
  
  sleep(1);
}