// src/presentation/chatbot/routes.chatbot.ts
import { Router } from "express";
import { ChatbotController } from "./controller.chatbot";
import { ChatRepositoryImpl } from "../../infrastructure/repositories/chatbot/chat.repository.impl";
import { ChatMongoDatasourceImpl } from "../../infrastructure/datasources/chatbot/chat.mongo.datasource.impl";
import { AuthMiddleware } from "../middlewares/auth.middleware";

export class ChatbotRoutes {
    static get getChatbotRoutes(): Router {
        const router = Router();
        
        // Inicializamos las dependencias
        const chatDatasource = new ChatMongoDatasourceImpl();
        const chatRepository = new ChatRepositoryImpl(chatDatasource);
        const controller = new ChatbotController(chatRepository);
        
        // Rutas públicas para clientes
        router.post('/query', controller.queryChatbot);
        router.get('/session/:sessionId', controller.getSession);
        router.post('/session', controller.createSession);
        
        // Rutas privadas (solo administradores)
        router.get('/sessions', controller.getSessions);
        router.post('/generate-embeddings', controller.generateEmbeddings);
        router.post('/change-llm', controller.changeLLM);
        router.get('/current-llm', controller.getCurrentLLM);
        
        return router;
    }
}