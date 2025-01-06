import { envs } from "./configs/envs"
import { server } from "./presentation/server"


(()=>{
    main()
})()

async function main() {
    //await bd

    //server
    new server(envs.PORT).start()   
}