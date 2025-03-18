import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 1,
  duration: '10s',
};

export default function() {
  console.log("Iniciando solicitud de login...");
  
  const res = http.post(
    'http://localhost:3000/api/auth/login', 
    JSON.stringify({
      email: 'laivetta@gmail.com',
      password: '123456'
    }), 
    {
      headers: { 'Content-Type': 'application/json' },
    }
  );
  
  console.log(`URL: http://localhost:3000/api/auth/login`);
  console.log(`Status: ${res.status}`);
  console.log(`Response body: ${res.body}`);
  console.log(`Error: ${res.error}`);
  
  check(res, {
    'Login exitoso': (r) => r.status === 200,
  });
  
  sleep(1);
}

