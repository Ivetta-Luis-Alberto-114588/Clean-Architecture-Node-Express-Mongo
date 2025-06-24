Ejecutar:

debe estar instalado node 20

se puede usar nvm (list, install, use) para tener un manejador de versiones de node

NPM RUN DEV

npm install, para instalar todos los modulos

instalar docker desktop

* en el directorio del proyecto ejecutar docker-compose up -d (esto va  a hacer un pull de la imagen del contenedor laivetta@mongo-transaccional:v1.1)
* una vez que se haya hecho el pull ejecutar:
  * docker ps (esto buscar el container_id de la imagen que se esta ejecutando y poner el container_id en la linea de abajo
  * docker exec -it  container_id mongosh -u mongo-user -p 123456 --eval "rs.initiate({_id: 'rs0', members: [{_id: 0, host: 'localhost:27017'}]})"
  * la cadena de conexion para mongo compas es:
    * mongodb://mongo-user:123456@localhost:27017/
  * OJO CON ESTO QUE SE ESTA EXPONIENDO EL PUERTO 27017
* comandos utiles docker:
  * docker ps
  * docker-compose up -d
  * docker-compose down
  * docker-compose build

1. la cadena de conexion para mongo y que permita operaciones transaccionales debe ser :

* MONGO_URL = 'mongodb://mongo-user:123456@localhost:27018/?replicaSet=rs0';
* despues ha que ejecutar esta linea de comando:

  * docker exec -it 14-clean-architecture-node-express-mongo-mongo-db-1 mongosh -u mongo-user -p 123456

y despues dentro del shell ejecutar:

* rs.initiate({  _id:"rs0",  members: [  { _id:0,host:"localhost:27017"} ]})
* despues verificar el estado con: rs.status()
* exit

1. docker-compose up -d
2. docker-compose down
3. docker-compose build
4. si no anda, desde vscode en el archivo docker-compose.yml se puede apretar  "run all services"
5. chmod 0600 ./mongo-keyfile/mongodb-keyfile

SI NO ANDA, BORRAR LA IMAGEN Y CREAR EL NUEVO CONTENEDOR

**# 1. Listar los contenedores en ejecución para ver cuál necesitas regenerar**
**docker**ps

**# 2. Detener el contenedor de MongoDB**
**docker** stop **[**nombre-del-contenedor-o-id**]**

**# 3. Eliminar el contenedor**
**docker**rm**[**nombre-del-contenedor-o-id**]**

**# 4. Si necesitas eliminar también la imagen (opcional)**
**docker** images           **# Para ver la lista de imágenes**
**docker** rmi **[**imagen-id**]**# Para eliminar la imagen

**# 5. Reconstruir y reiniciar el contenedor**
**docker-compose** up -d    **# Si estás usando docker-compose**

mongo compass en el puerto 27018 (https://www.mongodb.com/try/download/compass)

npm run dev

openssl rand -hex 16 (para generar una semilla aleatoria de 16 caracteres con open ssl) (hay que buscar el directorio de git/usr/bin y ahi esta el archivo openssl y hay que ponerlo en las variables de entorno de windows

Depurar

* no tiene que estar andando la terminal
* ctrl + shift + p  ==> debug npm script  ==> dev

Rellenar las variables de entrono

* MONGO_URL= mongodb://usuario_del_docker:password_del_docker@localhost:27018
* MONGO_DB_NAME= nombre_de_la_bd_que_creo
* JWT_SEED=MiSemilla

MERCADO PAGO

API KEY MercadoPago TEST

1) hay que usar ngrok para poder recibir los webhook de mercado pago

correr ngrok http http://localhost:3000   (aca es donde va a correr mi backend npm run dev)

2) en navegador abrir ventana incognito,tengo que iniciar https://www.mercadopago.com.ar/developers/

ingresar los datos del vendedor que soy yo en esta ventana incognito # usuario: TESTUSER174603780 contraseña: 9325521F#e74e#4a37#

me voy a integraciones / webhooks / url para pruebas y pego la url de ngrok

(por ejemplo https://7f10-190-138-95-153.ngrok-free.app)

despues puedo simular un pago desde el navegador de mercado pago

lo que va hacer es un post a esa direccion, y como le dije a ngrok que redirija a mi localhost:3000 y ahi esta mi backend va a recibir

ese post y lo va a procesar

3) ahora debo configurar las variables de entorno de mi backend

para que pueda recibir los webhooks de mercado pago y procesarlos

mi backend debe estar corriendo con los datos del vendedor

Vendedor1:

(estas son las variables de entorno)

public key: APP_USR-e3edd4b6-8e44-42b4-b2d4-999d3c855fd9

access token: APP_USR-3328213698076160-102119-335770b2644c50b25c25652c527d7ce5-2036389505

con todo esto ya tengo mi backend corriendo y escuchando los webhooks de mercado pago en modo pruebas

4) ahora debo abrir una nueva ventana de incognito con un nuevo navegador para simular que soy un comprador

#### debo entrar con estas credenciales Comprador1:

url: https://www.mercadopago.com.ar/developers/

usuario: TESTUSER1283783729,

contraseña: FBB90AC2#25c3#4199#

mail: test_user_1283783729@testuser.com

5) ahora debo abrir el frontend en modo incognito y simular que soy un comprador

url: http://localhost:4200

6) ahora debo hacer una compra con el comprador1, por lo cual me debo loguear en el frontend
7) abrir en el mismo modo incognito el front para probar como si fuese el Comprador1

url: http://localhost:4200

3) pagar con tarjeta de debito con estos datos en 1 sola cuota

tarjeta: 5031 7557 3453 0604

nombre: APRO

vencimiento:11/30

codigo seguridad: 123

dni: 12345678

#### esto de abajo es viejo

hay que usar ngrok para poder recibir los webhook de mercado pago

(en navegador ventana incognito, funciona mejor con chrome, tengo que iniciar como si yo fuese un comprador corriendo en mi maquina)

1) debo entrar con estas credenciales Comprador1:
   url: https://www.mercadopago.com.ar/developers/
   usuario: TESTUSER1283783729,
   contraseña: FBB90AC2#25c3#4199#
   mail: test_user_1283783729@testuser.com
2) abrir en el mismo modo incognito el front para probar comosi fuese el Comprador1
3) pagar con tarjeta de debito con estos datos en 1 sola cuota
   tarjeta: 5031 7557 3453 0604
   nombre: APRO
   vencimiento:11/30
   codigo seguridad: 123
   dni: 12345678

mi backend debe estar corriendo con los datos del vendedor
Vendedor1:
	(estas son las variables de entorno)
	public key: APP_USR-e3edd4b6-8e44-42b4-b2d4-999d3c855fd9
	access token: APP_USR-3328213698076160-102119-335770b2644c50b25c25652c527d7ce5-2036389505

    (esto no se pone en ningun lado)
	usuario: TESTUSER174603780,
	contraseña: 9325521F#e74e#4a37#

TENER EN CUENTA LOS PLAZOS DE ACREDITACION DE MP

https://www.mercadopago.com.ar/costs-section  --> en esta parte se debe configurar los plazos de espera y las comisiones que nos va a cobrar mercado pago --> la seccion se llama "cconfigurar costos por cobro" de checkout . Al 2025-03-04 por cobro al instante es del 6.29%, a 10 dias es el 4.39%

TESTING

npm test

npm test -- tests/presentation/auth/controller.auth.test.ts

jest tests/domain/use-cases/customers/get-city-by-id.use-case.test.ts

**npm** run test:coverage

K6 - test de carga

deben estar en el directorio raiz, fuera del src los siguintes archivos:

* generate-test-data.js
* load-test.js

despues se debe generar en mongo los datos para hacer las pruebas, y para esto hay que genera los datos de pruebas

* node generate-test-data.js

y por ultimo correr los test de carga con el comando: k6 run load-test.js

k6 run load-test-complete.js
