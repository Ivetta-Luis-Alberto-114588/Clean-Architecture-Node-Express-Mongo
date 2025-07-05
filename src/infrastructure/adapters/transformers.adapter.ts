import path from "path";
import fs from "fs";
import logger from "../../configs/logger";

export class TransformersAdapter {
    private static instance: TransformersAdapter;
    private embeddingModel: any = null;
    private readonly modelDirectory: string;
    private isAvailable: boolean = true;

    private constructor() {
        this.modelDirectory = path.join(process.cwd(), "models");

        if (!fs.existsSync(this.modelDirectory)) {
            fs.mkdirSync(this.modelDirectory, { recursive: true });
        }

        // Verificar si las dependencias están disponibles
        this.checkDependencies();
    }

    private checkDependencies(): void {
        try {
            // Verificar si estamos en modo deployment
            const fs = require('fs');
            const path = require('path');
            const deploymentFlag = path.join(process.cwd(), '.deployment-mode');
            const isDeployment = fs.existsSync(deploymentFlag);

            if (isDeployment) {
                logger.info('🚀 [TransformersAdapter] Modo deployment detectado');
            }

            require('@xenova/transformers');
            require('onnxruntime-node');

            logger.info('🤖 [TransformersAdapter] Dependencias de IA disponibles');
        } catch (error) {
            this.isAvailable = false;
            const isCI = process.env.CI || process.env.RENDER || process.env.NETLIFY;
            const logLevel = isCI ? 'info' : 'warn';

            logger[logLevel]('⚠️ [TransformersAdapter] Dependencias de IA no disponibles - funcionalidades de chatbot deshabilitadas', {
                error: error.message,
                environment: process.env.NODE_ENV,
                isCI
            });
        }
    }

    public static getInstance(): TransformersAdapter {
        if (!TransformersAdapter.instance) {
            TransformersAdapter.instance = new TransformersAdapter();
        }
        return TransformersAdapter.instance;
    }

    public isFeatureAvailable(): boolean {
        return this.isAvailable;
    }

    async getEmbeddingModel(): Promise<any> {
        if (!this.isAvailable) {
            throw new Error('Transformers dependencies not available. AI features are disabled.');
        }

        if (!this.embeddingModel) {
            try {
                logger.info("🤖 [TransformersAdapter] Configurando modelo de embedding...");
                process.env.TRANSFORMERS_CACHE = this.modelDirectory;

                // Usar eval para evitar que TypeScript/ts-node convierta esto a require
                const transformers = await eval('import("@xenova/transformers")');
                logger.info("🤖 [TransformersAdapter] Biblioteca importada correctamente");

                const pipeline = transformers.pipeline;
                logger.info("🤖 [TransformersAdapter] Pipeline obtenido, creando modelo...");

                this.embeddingModel = await pipeline(
                    'feature-extraction',
                    'Xenova/all-MiniLM-L6-v2',
                    { quantized: false }
                );

                logger.info("🤖 [TransformersAdapter] Modelo de embedding inicializado correctamente");
            } catch (error) {
                logger.error("❌ [TransformersAdapter] Error al crear el modelo de embedding:", { error });
                this.isAvailable = false;
                throw error;
            }
        }
        return this.embeddingModel;
    }

    async embedText(text: string): Promise<number[]> {
        try {
            const model = await this.getEmbeddingModel();
            console.log("Generando embedding para texto...");

            const result = await model(text, {
                pooling: 'mean',
                normalize: true
            });

            console.log("Embedding generado correctamente");
            return Array.from(result.data);
        } catch (error) {
            console.error("Error al embedear texto:", error);
            throw error;
        }
    }

    async embedDocuments(texts: string[]): Promise<number[][]> {
        const results = [];
        for (const text of texts) {
            results.push(await this.embedText(text));
        }
        return results;
    }
}