import "dotenv/config"
import { get } from "env-var"



export const envs = {

    DEFAULT_NEIGHBORHOOD_ID: get('DEFAULT_NEIGHBORHOOD_ID').required().asString(), // ID de barrio por defecto para nuevos clientes

    PORT: get('PORT').required().asPortNumber(),

    MONGO_URL: get('MONGO_URL').required().asString(),
    MONGO_DB_NAME: get('MONGO_DB_NAME').required().asString(),

    JWT_SEED: get('JWT_SEED').required().asString(),

    // Mercado Pago
    MERCADO_PAGO_ACCESS_TOKEN: get('MERCADO_PAGO_ACCESS_TOKEN').required().asString(),
    MERCADO_PAGO_PUBLIC_KEY: get('MERCADO_PAGO_PUBLIC_KEY').required().asString(),

    // Key de las APIs
    ANTHROPIC_API_KEY: get('ANTHROPIC_API_KEY').required().asString(),
    OPENAI_API_KEY: get('OPENAI_API_KEY').required().asString(),


    FRONTEND_URL: get('FRONTEND_URL').required().asString(),


    // Webhooks de respuesta de MP
    URL_RESPONSE_WEBHOOK_NGROK: get('URL_RESPONSE_WEBHOOK_NGROK').required().asUrlString(),

    NODE_ENV: get('NODE_ENV').required().asString(),


    // Cloudinary para imagenes
    CLOUDINARY_CLOUD_NAME: get('CLOUDINARY_CLOUD_NAME').required().asString(),
    CLOUDINARY_API_KEY: get('CLOUDINARY_API_KEY').required().asString(),
    CLOUDINARY_API_SECRET: get('CLOUDINARY_API_SECRET').required().asString(),
    CLOUDINARY_URL: get('CLOUDINARY_URL').required().asString(),



    EMAIL_SERVICE: get('EMAIL_SERVICE').required().asString(), // ej: 'gmail', 'sendgrid', etc.
    EMAIL_USER: get('EMAIL_USER').required().asString(),     // Correo desde el que se envía
    EMAIL_PASS: get('EMAIL_PASS').required().asString(),     // Contraseña del correo o API Key
    EMAIL_SENDER_NAME: get('EMAIL_SENDER_NAME').default('StartUp E-commerce').asString(), // Nombre del remitente
}