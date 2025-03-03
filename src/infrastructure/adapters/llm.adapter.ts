// src/infrastructure/adapters/llm.adapter.ts
import { ChatOpenAI } from "@langchain/openai";
import axios from "axios";
import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { envs } from "../../configs/envs";
import { CustomError } from "../../domain/errors/custom.error";

// Enum para los modelos disponibles
export enum LLMType {
    CLAUDE_HAIKU = 'claude-3-haiku-20240307',
    CLAUDE_SONNET = 'claude-sonnet',
    CLAUDE_OPUS = 'claude-opus',
    OPENAI = 'openai'
}

export class LLMAdapter {
    private static instance: LLMAdapter;
    private models: Map<LLMType, any> = new Map();
    private currentModel: LLMType = LLMType.CLAUDE_HAIKU

    private constructor() {}

    public static getInstance(): LLMAdapter {
        if (!LLMAdapter.instance) {
            LLMAdapter.instance = new LLMAdapter();
        }
        return LLMAdapter.instance;
    }

    setModel(modelType: LLMType): void {
        if (!Object.values(LLMType).includes(modelType)) {
            throw new Error(`Modelo no soportado: ${modelType}`);
        }
        this.currentModel = modelType;
    }

    getCurrentModel(): LLMType {
        return this.currentModel;
    }

    async getModel(): Promise<any> {
        if (this.models.has(this.currentModel)) {
            return this.models.get(this.currentModel)!;
        }

        let model: any;

        switch (this.currentModel) {
            case LLMType.CLAUDE_HAIKU:
                model = {
                    generateText: async (prompt: string) => this.callClaudeAPI(prompt)
                };
                break;

            case LLMType.OPENAI:
                if (!process.env.OPENAI_API_KEY) {
                    throw CustomError.internalServerError('OPENAI_API_KEY no configurada');
                }
                model = new ChatOpenAI({
                    modelName: "gpt-3.5-turbo",
                    openAIApiKey: process.env.OPENAI_API_KEY,
                    temperature: 0.2,
                });
                break;

            default:
                throw CustomError.internalServerError(`Modelo no implementado: ${this.currentModel}`);
        }

        this.models.set(this.currentModel, model);
        return model;
    }

    private async callClaudeAPI(prompt: string | any): Promise<string> {
        try {
            if (!process.env.ANTHROPIC_API_KEY) {
                throw CustomError.internalServerError('ANTHROPIC_API_KEY no configurada');
            }
    
            // Ensure prompt is a string
            let promptText = '';
            if (typeof prompt === 'string') {
                promptText = prompt;
            } else if (typeof prompt === 'object' && prompt !== null) {
                // Handle LangChain objects or other complex types
                if (prompt.kwargs && prompt.kwargs.value) {
                    promptText = prompt.kwargs.value;
                } else if (prompt.value) {
                    promptText = prompt.value;
                } else {
                    // If we can't find a usable value, convert the object to string
                    promptText = JSON.stringify(prompt);
                }
            }
    
            // Ensure promptText is not empty
            if (!promptText.trim()) {
                throw CustomError.badRequest('Prompt text cannot be empty');
            }
    
            const response = await axios.post(
                'https://api.anthropic.com/v1/messages',
                {
                    model: "claude-3-haiku-20240307",
                    max_tokens: 1000,
                    messages: [{ role: "user", content: promptText }]
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'x-api-key': process.env.ANTHROPIC_API_KEY,
                        'anthropic-version': '2023-06-01'
                    }
                }
            );
            
            return response.data.content[0].text;
        } catch (error) {
            console.error('Error llamando a Claude API:', error);
            throw error;
        }
    }
}