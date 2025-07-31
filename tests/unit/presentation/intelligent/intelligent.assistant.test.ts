
let IntelligentAssistant: any;

describe('IntelligentAssistant', () => {
    let assistant: any;
    let productRepository: any;
    let customerRepository: any;
    let orderRepository: any;

    let originalEnv;
    beforeEach(() => {
        // Mock envs
        jest.resetModules();
        originalEnv = process.env.ANTHROPIC_API_KEY;
        process.env.ANTHROPIC_API_KEY = 'test-key';
        productRepository = {
            search: jest.fn().mockResolvedValue({ total: 1, products: [{ name: 'Pizza', price: 100, priceWithTax: 121, stock: 10, category: { name: 'Comida' } }] })
        };
        customerRepository = {
            getAll: jest.fn().mockResolvedValue([{ name: 'Juan', email: 'juan@mail.com', phone: '123' }]),
            searchCustomers: jest.fn().mockResolvedValue({ total: 1, customers: [{ name: 'Juan', email: 'juan@mail.com', phone: '123' }] })
        };
        orderRepository = {
            getAll: jest.fn().mockResolvedValue({ total: 1, orders: [{ id: '1', total: 200, customer: { name: 'Juan' }, status: { name: 'Completado' } }] })
        };
        // Cargar la clase después de los mocks
        IntelligentAssistant = require('../../../../src/presentation/intelligent/intelligent.assistant').IntelligentAssistant;
        assistant = new IntelligentAssistant(productRepository, customerRepository, orderRepository);
    });
    afterEach(() => {
        process.env.ANTHROPIC_API_KEY = originalEnv;
    });


    // --- TEST DE FALTA DE ANTHROPIC_API_KEY ---

    describe('IntelligentAssistant (sin ANTHROPIC_API_KEY)', () => {
        let IA: any;
        let productRepository: any;
        let customerRepository: any;
        let orderRepository: any;
        beforeAll(() => {
            jest.resetModules();
            jest.mock('../../../../src/configs/envs', () => ({ envs: { ANTHROPIC_API_KEY: '' } }));
            IA = require('../../../../src/presentation/intelligent/intelligent.assistant').IntelligentAssistant;
        });
        beforeEach(() => {
            productRepository = {
                search: jest.fn().mockResolvedValue({ total: 1, products: [{ name: 'Pizza', price: 100, priceWithTax: 121, stock: 10, category: { name: 'Comida' } }] })
            };
            customerRepository = {
                getAll: jest.fn().mockResolvedValue([{ name: 'Juan', email: 'juan@mail.com', phone: '123' }]),
                searchCustomers: jest.fn().mockResolvedValue({ total: 1, customers: [{ name: 'Juan', email: 'juan@mail.com', phone: '123' }] })
            };
            orderRepository = {
                getAll: jest.fn().mockResolvedValue({ total: 1, orders: [{ id: '1', total: 200, customer: { name: 'Juan' }, status: { name: 'Completado' } }] })
            };
        });
        afterAll(() => {
            jest.unmock('../../../../src/configs/envs');
        });
        it('should return message if ANTHROPIC_API_KEY is missing', async () => {
            const assistantNoKey = new IA(productRepository, customerRepository, orderRepository);
            const result = await assistantNoKey.handleNaturalQuery('pizza');
            expect(result).toContain('configurar ANTHROPIC_API_KEY');
        });
    });

    it('should fallback to product search if agent throws error', async () => {
        // Forzar que el agente no esté inicializado y cause error
        (assistant as any).agent = null;
        // Simular error en initialize
        assistant.initialize = jest.fn().mockRejectedValue(new Error('Agent fail'));
        const result = await assistant.handleNaturalQuery('pizza');
        expect(result).toContain('Pizza');
        expect(productRepository.search).toHaveBeenCalled();
    });

    it('should fallback to customer search if query mentions cliente and agent fails', async () => {
        (assistant as any).agent = null;
        assistant.initialize = jest.fn().mockRejectedValue(new Error('Agent fail'));
        const result = await assistant.handleNaturalQuery('cliente Juan');
        expect(result).toContain('Juan');
        expect(customerRepository.searchCustomers).toHaveBeenCalled();
    });

    it('should fallback to order search if query mentions orden and agent fails', async () => {
        (assistant as any).agent = null;
        assistant.initialize = jest.fn().mockRejectedValue(new Error('Agent fail'));
        const result = await assistant.handleNaturalQuery('ordenes');
        expect(result).toContain('Órdenes encontradas');
        expect(orderRepository.getAll).toHaveBeenCalled();
    });

    it('should return fallback message if no keyword matches and agent fails', async () => {
        (assistant as any).agent = null;
        assistant.initialize = jest.fn().mockRejectedValue(new Error('Agent fail'));
        // Mock llm.invoke
        (assistant as any).llm.invoke = jest.fn().mockResolvedValue({ content: 'Respuesta fallback' });
        const result = await assistant.handleNaturalQuery('algo sin sentido');
        expect(result).toContain('Respuesta fallback');
    });

    it('should format analytics results for analytical order query', async () => {
        orderRepository.getAll = jest.fn().mockResolvedValue({
            total: 2, orders: [
                { id: '1', total: 100, customer: { name: 'Juan' }, status: { name: 'Completado' } },
                { id: '2', total: 200, customer: { name: 'Ana' }, status: { name: 'Pendiente' } }
            ]
        });
        const result = await assistant.handleNaturalQuery('mejores ventas');
        expect(result).toContain('Resumen de órdenes');
        expect(result).toContain('💰 Total en ventas: $300.00');
        expect(result).toContain('Promedio por pedido');
    });

    it('should format status results for status order query', async () => {
        orderRepository.getAll = jest.fn().mockResolvedValue({
            total: 1, orders: [
                { id: '1', total: 100, status: { name: 'Pendiente' } }
            ]
        });
        const result = await assistant.handleNaturalQuery('ordenes pendientes');
        expect(result).toContain('Órdenes filtradas');
        expect(result).toContain('Pendiente');
    });

    it('should return message when no orders found', async () => {
        orderRepository.getAll = jest.fn().mockResolvedValue({ total: 0, orders: [] });
        const result = await assistant.handleNaturalQuery('ordenes');
        expect(result).toContain('No encontré órdenes');
    });

    it('should format product results for a simple query', async () => {
        const result = await assistant.handleNaturalQuery('pizza');
        expect(result).toContain('Pizza');
        expect(productRepository.search).toHaveBeenCalled();
    });

    it('should format customer results for a simple query', async () => {
        const result = await assistant.handleNaturalQuery('cliente Juan');
        expect(result).toContain('Juan');
        expect(customerRepository.searchCustomers).toHaveBeenCalled();
    });

    it('should format order results for a simple query', async () => {
        const result = await assistant.handleNaturalQuery('ordenes');
        expect(result).toContain('Órdenes encontradas');
        expect(orderRepository.getAll).toHaveBeenCalled();
    });

    it('should return count of customers for count query', async () => {
        const result = await assistant.handleNaturalQuery('cuántos clientes hay');
        expect(result).toContain('clientes registrados');
        expect(customerRepository.getAll).toHaveBeenCalled();
    });

    it('should return count of orders for count query', async () => {
        const result = await assistant.handleNaturalQuery('cuántas órdenes hay');
        expect(result).toContain('órdenes/pedidos registrados');
        expect(orderRepository.getAll).toHaveBeenCalled();
    });
});
