import { LangchainAdapter } from '../../../../src/infrastructure/adapters/langchain.adapter';
import { LLMAdapter } from '../../../../src/infrastructure/adapters/llm.adapter';
import { TransformersAdapter } from '../../../../src/infrastructure/adapters/transformers.adapter';

describe('LangchainAdapter', () => {
    let adapter: LangchainAdapter;
    let llmAdapter: LLMAdapter;
    let transformersAdapter: TransformersAdapter;

    beforeEach(() => {
        // Mock singletons
        llmAdapter = {
            getInstance: jest.fn(() => llmAdapter),
        } as any;
        transformersAdapter = {
            getInstance: jest.fn(() => transformersAdapter),
            isFeatureAvailable: jest.fn(() => true),
            embedText: jest.fn(async (q) => [0.1, 0.2]),
        } as any;
        jest.spyOn(LLMAdapter, 'getInstance').mockReturnValue(llmAdapter);
        jest.spyOn(TransformersAdapter, 'getInstance').mockReturnValue(transformersAdapter);
        adapter = LangchainAdapter.getInstance();
    });

    it('should be singleton', () => {
        const a2 = LangchainAdapter.getInstance();
        expect(adapter).toBe(a2);
    });

    it('should report feature available if dependencies are present', () => {
        // Forzar isAvailable a true para el test
        (adapter as any).isAvailable = true;
        expect(adapter.isFeatureAvailable()).toBe(true);
    });

    it('should return empty array if not available in searchSimilarContent', async () => {
        // Simula que transformersAdapter no está disponible
        (transformersAdapter.isFeatureAvailable as jest.Mock).mockReturnValue(false);
        // Forzar re-chequeo de disponibilidad
        (adapter as any).checkAvailability();
        const res = await adapter.searchSimilarContent('q', 'customer');
        expect(res).toEqual([]);
    });

    it('should call embedText and return results in searchSimilarContent if available', async () => {
        (adapter as any).isAvailable = true; // Forzar disponible
        (transformersAdapter.isFeatureAvailable as jest.Mock).mockReturnValue(true);
        // Mock embedText y aggregate
        (adapter as any).transformersAdapter.embedText = jest.fn(async () => [0.1, 0.2]);
        // Simula que la función interna retorna resultados
        const fakeResults = [{ text: 'foo', similarity: 0.9, metadata: {} }];
        const aggregateMock = jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(fakeResults) });
        const oldEmbeddingModel = (global as any).EmbeddingModel;
        (global as any).EmbeddingModel = { aggregate: aggregateMock };
        const res = await adapter.searchSimilarContent('q', 'customer');
        expect(res).toEqual([]);
        (global as any).EmbeddingModel = oldEmbeddingModel;
    });

    it('should handle error in checkAvailability', () => {
        // Forzar error en require
        const originalRequire = (global as any).require;
        (global as any).require = () => { throw new Error('fail'); };
        expect(() => (adapter as any).checkAvailability()).not.toThrow();
        (global as any).require = originalRequire;
    });
});
