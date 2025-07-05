import { RunnableSequence } from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { PromptTemplate } from "@langchain/core/prompts";
import { ChatOpenAI } from "@langchain/openai";
import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { MongoDBAtlasVectorSearch } from "@langchain/mongodb";
import { Document } from "@langchain/core/documents";
import { LLMAdapter } from "./llm.adapter";
import { TransformersAdapter } from "./transformers.adapter";
import { EmbeddingModel } from "../../data/mongodb/models/chatbot/chat-models";
import { ChatMessageEntity, MessageRole } from "../../domain/entities/chatbot/chat-message.entity";
import mongoose from "mongoose";
import logger from "../../configs/logger";

export interface VectorSearchResult {
    text: string;
    score: number;
    metadata: any;
}

export class LangchainAdapter {
    private static instance: LangchainAdapter;
    private llmAdapter: LLMAdapter;
    private transformersAdapter: TransformersAdapter;
    private isAvailable: boolean = true;

    private constructor() {
        this.llmAdapter = LLMAdapter.getInstance();
        this.transformersAdapter = TransformersAdapter.getInstance();
        this.checkAvailability();
    }

    private checkAvailability(): void {
        try {
            // Verificar dependencias de LangChain
            require('@langchain/core');
            require('@langchain/openai');

            // Verificar si TransformersAdapter está disponible
            this.isAvailable = this.transformersAdapter.isFeatureAvailable();

            if (this.isAvailable) {
                logger.info('🔗 [LangchainAdapter] LangChain y dependencias disponibles');
            } else {
                logger.info('⚠️ [LangchainAdapter] Funcionalidades de IA limitadas - TransformersAdapter no disponible');
            }
        } catch (error) {
            this.isAvailable = false;
            logger.warn('⚠️ [LangchainAdapter] LangChain no disponible - funcionalidades de chatbot deshabilitadas', {
                error: error.message
            });
        }
    }

    public static getInstance(): LangchainAdapter {
        if (!LangchainAdapter.instance) {
            LangchainAdapter.instance = new LangchainAdapter();
        }
        return LangchainAdapter.instance;
    }

    public isFeatureAvailable(): boolean {
        return this.isAvailable;
    }

    // Buscar información relevante en los embeddings
    async searchSimilarContent(query: string, userType: 'customer' | 'owner', limit: number = 5): Promise<VectorSearchResult[]> {
        try {
            if (!this.isAvailable) {
                logger.info('⚠️ [LangchainAdapter] Búsqueda vectorial no disponible - devolviendo resultados vacíos');
                return [];
            }

            // Obtener embedding para la consulta
            const queryEmbedding = await this.transformersAdapter.embedText(query);

            // Preparar las colecciones a buscar según el tipo de usuario
            const collections = userType === 'owner'
                ? ['Product', 'Sale', 'Category', 'Customer', 'City', 'Neighborhood', 'Unit', 'Payment']
                : ['Product', 'Category', 'City', 'Neighborhood', 'Unit']; // Los clientes no ven ventas ni pagos

            // Buscar documentos similares
            const results = await EmbeddingModel.aggregate([
                {
                    $match: {
                        collectionName: { $in: collections }
                    }
                },
                {
                    $addFields: {
                        similarity: {
                            $reduce: {
                                input: { $zip: { inputs: ["$embedding", queryEmbedding] } },
                                initialValue: 0,
                                in: { $add: ["$$value", { $multiply: [{ $arrayElemAt: ["$$this", 0] }, { $arrayElemAt: ["$$this", 1] }] }] }
                            }
                        }
                    }
                },
                { $sort: { similarity: -1 } },
                { $limit: limit }
            ]).exec();

            return results.map(doc => ({
                text: doc.text,
                score: doc.similarity,
                metadata: doc.metadata
            }));
        } catch (error) {
            console.error('Error al buscar contenido similar:', error);
            return [];
        }
    }

    // Generar respuesta utilizando RAG
    async generateResponse(
        query: string,
        context: string[],
        chatHistory: ChatMessageEntity[] = [],
        userType: 'customer' | 'owner' = 'customer'
    ): Promise<string> {
        try {
            // Imprimir contexto para depuración
            console.log('Contexto recibido:', context);

            // Verificar si hay contexto
            if (context.length === 0) {
                return "Lo siento, no encontré información relevante para tu consulta.";
            }

            // Preparar el modelo LLM
            const llm = await this.llmAdapter.getModel();

            // Preparar el historial de chat
            const chatHistoryText = chatHistory
                .map(msg => `${msg.role === MessageRole.USER ? 'Usuario' : 'Asistente'}: ${msg.content}`)
                .join('\n');

            // Crear un prompt más específico
            const promptTemplate = userType === 'owner'
                ? `Eres un asistente de análisis de negocios. 
                   Historial de chat: ${chatHistoryText}
                   
                   Contexto relevante:
                   ${context.join('\n\n')}
                   
                   Pregunta del usuario: ${query}
                   
                   Responde de manera directa y concisa basándote en el contexto proporcionado. 
                   Si encuentras información relevante, detállala. Si no, indica que no se encontró información.`
                : `Eres un asistente de tienda en línea. 
                   Historial de chat: ${chatHistoryText}
                   
                   Contexto relevante:
                   ${context.join('\n\n')}
                   
                   Pregunta del usuario: ${query}
                   
                   Responde de manera amable y directa basándote en el contexto proporcionado.`;

            // Generar respuesta
            const response = await llm.generateText(promptTemplate);

            console.log('Respuesta generada:', response);
            return response;
        } catch (error) {
            console.error('Error al generar respuesta:', error);
            return "Lo siento, ocurrió un error al procesar tu consulta.";
        }
    }

    private getCustomerPromptTemplate(): PromptTemplate {
        return PromptTemplate.fromTemplate(`
        Eres un asistente virtual de una tienda en línea. Tu objetivo es ayudar a los clientes a encontrar productos y responder sus consultas sobre la tienda, productos, ciudades, barrios y unidades de medida.
        
        Historial de la conversación:
        {chatHistory}
        
        Información relevante sobre productos, categorías, ciudades, barrios y unidades de medida:
        {context}
        
        Pregunta del usuario: {question}
        
        Responde de manera amable, directa y útil. Si no conoces la respuesta o la información no está en el contexto proporcionado, indícalo honestamente y sugiere alternativas.
        Responde siempre en español y de forma profesional.
        `);
    }



    private getOwnerPromptTemplate(): PromptTemplate {
        return PromptTemplate.fromTemplate(`
    Eres un asistente de análisis de negocio para el dueño de una tienda en línea. Proporciona análisis, datos y sugerencias basados en la información de ventas, productos, categorías, clientes, ciudades, barrios, unidades de medida y pagos.
    
    Historial de la conversación:
    {chatHistory}
    
    Información relevante sobre ventas, productos, categorías, clientes, ciudades, barrios, unidades y pagos:
    {context}
    
    Pregunta del dueño: {question}
    
    Proporciona respuestas detalladas y orientadas a datos cuando sea posible. Incluye métricas relevantes y sugerencias accionables para mejorar el negocio.
    Si falta información específica, indícalo claramente y sugiere qué datos adicionales podrían ser útiles para un mejor análisis.
    Responde siempre en español y de forma profesional.
    `);
    }
}