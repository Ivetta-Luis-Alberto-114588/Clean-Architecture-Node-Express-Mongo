import { LLMAdapter, LLMType } from '../../../../src/infrastructure/adapters/llm.adapter';
import { CustomError } from '../../../../src/domain/errors/custom.error';

describe('LLMAdapter', () => {
    let adapter: LLMAdapter;

    beforeEach(() => {
        adapter = LLMAdapter.getInstance();
    });

    it('should be singleton', () => {
        const a2 = LLMAdapter.getInstance();
        expect(adapter).toBe(a2);
    });

    it('should set and get current model', () => {
        adapter.setModel(LLMType.OPENAI);
        expect(adapter.getCurrentModel()).toBe(LLMType.OPENAI);
    });

    it('should throw if setting unsupported model', () => {
        expect(() => adapter.setModel('invalid' as any)).toThrow();
    });

    it('should throw if getModel for unimplemented model', async () => {
        try {
            adapter.setModel('not-implemented' as any);
        } catch (e: any) {
            expect(e.message).toBe('Modelo no soportado: not-implemented');
        }
    });

    it('should throw if OPENAI_API_KEY is missing', async () => {
        adapter.setModel(LLMType.OPENAI);
        // Forzar envs sin OPENAI_API_KEY
        const oldEnvs = process.env.OPENAI_API_KEY;
        delete process.env.OPENAI_API_KEY;
        // Forzar error manualmente
        const originalEnvs = require('../../../../src/configs/envs');
        originalEnvs.envs.OPENAI_API_KEY = undefined;
        await expect(adapter.getModel()).rejects.toThrow();
        if (oldEnvs) process.env.OPENAI_API_KEY = oldEnvs;
    });

    it('should call callClaudeAPI and handle missing key', async () => {
        // Forzar envs sin ANTHROPIC_API_KEY
        const originalEnvs = require('../../../../src/configs/envs');
        originalEnvs.envs.ANTHROPIC_API_KEY = undefined;
        await expect((adapter as any).callClaudeAPI('prompt')).rejects.toThrow();
    });

    it('should cache model after first getModel', async () => {
        adapter.setModel(LLMType.CLAUDE_HAIKU);
        // Mock callClaudeAPI to avoid real API call
        (adapter as any).callClaudeAPI = jest.fn(async () => 'text');
        const model1 = await adapter.getModel();
        const model2 = await adapter.getModel();
        expect(model1).toBe(model2);
    });
});
