// src/presentation/chatbot/controller.chatbot.ts
import { Request, Response } from "express";
import { ChatQueryDto } from "../../domain/dtos/chatbot/chat-query.dto";
import { CustomError } from "../../domain/errors/custom.error";
import { ChatRepository } from "../../domain/repositories/chatbot/chat.repository";
import { QueryChatbotUseCase } from "../../domain/use-cases/chatbot/query-chatbot.use-case";
import { GenerateEmbeddingsUseCase } from "../../domain/use-cases/chatbot/generate-embeddings.use-case";
import { LLMAdapter, LLMType } from "../../infrastructure/adapters/llm.adapter";

export class ChatbotController {
    public readonly llmAdapter = LLMAdapter.getInstance();

    constructor(
        private readonly chatRepository: ChatRepository
    ) { }

    private handleError = (error: unknown, res: Response) => {
        if (error instanceof CustomError) {
            return res.status(error.statusCode).json({ error: error.message });
        }

        console.log("Error en ChatbotController:", error);
        return res.status(500).json({ error: "Error interno del servidor" });
    };

    // Procesar una consulta al chatbot
    queryChatbot = async (req: Request, res: Response): Promise<void> => {
        const [error, chatQueryDto] = ChatQueryDto.create(req.body);
        if (error) {
            res.status(400).json({ error });
            console.log("Error en controller.chatbot.queryChatbot:", error);
            return;
        }
        try {
            const data = await new QueryChatbotUseCase(this.chatRepository)
                .execute(chatQueryDto!);
            res.json(data);
        } catch (err) {
            this.handleError(err, res);
        }
    };

    // Obtener una sesión específica
    getSession = (req: Request, res: Response): void => {
        const { sessionId } = req.params;

        if (!sessionId) {
            res.status(400).json({ error: "ID de sesión requerido" });
            return;
        }

        this.chatRepository.getSession(sessionId)
            .then(session => {
                if (!session) {
                    return res.status(404).json({ error: "Sesión no encontrada" });
                }
                res.json(session);
            })
            .catch(err => this.handleError(err, res));
    };

    // Obtener todas las sesiones
    getSessions = (req: Request, res: Response): void => {
        this.chatRepository.getSessions()
            .then(sessions => res.json(sessions))
            .catch(err => this.handleError(err, res));
    };

    // Crear una nueva sesión
    createSession = (req: Request, res: Response): void => {
        const { userType = 'customer' } = req.body;

        if (userType !== 'customer' && userType !== 'owner') {
            res.status(400).json({ error: "Tipo de usuario debe ser 'customer' o 'owner'" });
            return;
        }

        this.chatRepository.createSession(userType)
            .then(session => res.json(session))
            .catch(err => this.handleError(err, res));
    };

    // Generar embeddings para los datos
    generateEmbeddings = async (req: Request, res: Response): Promise<void> => {
        try {
            await new GenerateEmbeddingsUseCase(this.chatRepository)
                .execute();
            res.json({ message: "Embeddings generados exitosamente" });
        } catch (err) {
            this.handleError(err, res);
        }
    };

    // Cambiar el modelo LLM
    changeLLM = (req: Request, res: Response): void => {
        const { model } = req.body;

        try {
            // Validar modelo
            if (!Object.values(LLMType).includes(model)) {
                res.status(400).json({
                    error: `Modelo no válido. Opciones disponibles: ${Object.values(LLMType).join(', ')}`
                });
            }

            // Cambiar el modelo
            this.llmAdapter.setModel(model);

            res.json({
                message: `Modelo cambiado exitosamente a ${model}`,
                currentModel: this.llmAdapter.getCurrentModel()
            });
        } catch (error) {
            this.handleError(error, res);
        }
    };

    // Obtener el modelo LLM actual
    getCurrentLLM = (req: Request, res: Response): void => {
        try {
            const currentModel = this.llmAdapter.getCurrentModel();
            res.json({ currentModel });
        } catch (error) {
            this.handleError(error, res);
        }
    };

    validateEmbeddings = (req: Request, res: Response): void => {
        this.chatRepository.validateEmbeddings()
            .then(results => res.json(results))
            .catch(err => this.handleError(err, res));
    };
}