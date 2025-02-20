Ejecutar:

* debe estar instalado node 20
* se puede usar nvm (list, install, use) para tener un manejador de versiones de node
* npm install, para instalar todos los modulos
* docker desktop
* docker-compose  up -d
* mongo compass en el puerto 27018 (https://www.mongodb.com/try/download/compass)
* npm run dev

Depurar

* no tiene que estar andando la terminal
* ctrl + shift + p  ==> debug npm script  ==> dev

Rellenar las variables de entrono

* MONGO_URL= mongodb://usuario_del_docker:password_del_docker@localhost:27018
* MONGO_DB_NAME= nombre_de_la_bd_que_creo
* JWT_SEED=MiSemilla

peticiones:

POST:

1) http://localhost:3000/api/auth/login

   {
   "email":"laivetta@gmail.com",
   "password":"123456"
   }

   2. http://localhost:3000/api/auth/register

   {

   "name": "luis",
   "email": "laivetta11@gmail.com",
   "password":"123456"
   }

GET

1. http://localhost:3000/api/auth

   Authorization: 'Bearer 		eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY3YjQ4MmJkYzg3MTFjMzI4ZGZjMmVjNyIsImlhdCI6MTczOTg4MzE5NywiZXhwIjoxNzM5ODkwMzk3fQ.uyIG3mPVkHhKuJ_ESXlDgYG4_BaCMchazsE1Dgtebho'

DELETE

1. http://localhost:3000/api/users/6764af06aa9cf2cfa4fe4601

PUT

1. http://localhost:3000/api/users/67b482bdc8711c328dfc2ec7

   {
   "user": "luis",
   "role": "admin",
   "password":"holas"
   }
