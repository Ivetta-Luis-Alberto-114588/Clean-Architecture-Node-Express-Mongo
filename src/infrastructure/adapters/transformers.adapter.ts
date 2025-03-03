import path from "path";
import fs from "fs";

export class TransformersAdapter {
    private static instance: TransformersAdapter;
    private embeddingModel: any = null;
    private readonly modelDirectory: string;

    private constructor() {
        this.modelDirectory = path.join(process.cwd(), "models");
        
        if (!fs.existsSync(this.modelDirectory)) {
            fs.mkdirSync(this.modelDirectory, { recursive: true });
        }
    }

    public static getInstance(): TransformersAdapter {
        if (!TransformersAdapter.instance) {
            TransformersAdapter.instance = new TransformersAdapter();
        }
        return TransformersAdapter.instance;
    }

    async getEmbeddingModel(): Promise<any> {
        if (!this.embeddingModel) {
            try {
                console.log("Configurando modelo de embedding...");
                process.env.TRANSFORMERS_CACHE = this.modelDirectory;
                
                // Usar eval para evitar que TypeScript/ts-node convierta esto a require
                const transformers = await eval('import("@xenova/transformers")');
                console.log("Biblioteca importada correctamente");
                
                const pipeline = transformers.pipeline;
                console.log("Pipeline obtenido, creando modelo...");
                
                this.embeddingModel = await pipeline(
                    'feature-extraction',
                    'Xenova/all-MiniLM-L6-v2',
                    { quantized: false }
                );
                
                console.log("Modelo de embedding inicializado correctamente");
            } catch (error) {
                console.error("Error al crear el modelo de embedding:", error);
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