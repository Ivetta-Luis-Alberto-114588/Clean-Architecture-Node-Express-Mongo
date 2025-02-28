import "dotenv/config"
import {get} from "env-var"



export const envs = {

    PORT: get('PORT').required().asPortNumber(),
    
    MONGO_URL: get('MONGO_URL').required().asString(),
    MONGO_DB_NAME : get('MONGO_DB_NAME').required().asString(),

    JWT_SEED: get('JWT_SEED').required().asString(),

    MERCADO_PAGO_ACCESS_TOKEN: get('MERCADO_PAGO_ACCESS_TOKEN').required().asString(),
    MERCADO_PAGO_PUBLIC_KEY: get('MERCADO_PAGO_PUBLIC_KEY').required().asString(),

    FRONTEND_URL: get('FRONTEND_URL').required().asString(),
    URL_RESPONSE_WEBHOOK_NGROK : get('URL_RESPONSE_WEBHOOK_NGROK').required().asUrlString(),

    NODE_ENV: get('NODE_ENV').required().asString(),
}