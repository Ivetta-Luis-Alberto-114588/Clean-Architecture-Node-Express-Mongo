Ejecutar:

debe estar instalado node 20

se puede usar nvm (list, install, use) para tener un manejador de versiones de node

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
