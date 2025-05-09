import { envs } from "./configs/envs"
import { MongoDatabase } from "./data/mongodb/mongo-database"
import { MainRoutes } from "./presentation/routes"
import { server } from "./presentation/server"


(()=>{
    main()
})()

async function main() {
    //await bd
    //el servidor no se ejecuta hasta que la bd no se haya conectado
    await MongoDatabase.connect({
        p_mongoUrl: envs.MONGO_URL,
        p_dbName: envs.MONGO_DB_NAME
    })

    //server, le debo pasar el puerto y las rutas
    new server({
        p_port: envs.PORT, 
        p_routes: MainRoutes.getMainRoutes }).start()   
}