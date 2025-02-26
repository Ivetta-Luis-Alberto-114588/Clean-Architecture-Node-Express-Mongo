FROM mongo:6.0.6

# Crear directorio para el keyfile
RUN mkdir -p /data/mongo-keyfile

# Copiar el keyfile desde el host a la imagen
COPY mongodb-keyfile /data/mongo-keyfile/

# Establecer los permisos correctos del keyfile
# MongoDB requiere que el keyfile tenga permisos 0600
RUN chmod 0600 /data/mongo-keyfile/mongodb-keyfile && \
    chown -R mongodb:mongodb /data/mongo-keyfile

# Puerto de MongoDB
EXPOSE 27017

# Comando para iniciar MongoDB con replica set y keyfile
CMD ["mongod", "--replSet", "rs0", "--bind_ip_all", "--keyFile", "/data/mongo-keyfile/mongodb-keyfile"]