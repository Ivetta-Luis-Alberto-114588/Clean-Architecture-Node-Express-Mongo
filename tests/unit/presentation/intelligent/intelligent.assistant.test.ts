import { IntelligentAssistant } from '../../../../src/presentation/intelligent/intelligent.assistant';

describe('IntelligentAssistant', () => {
    let assistant: IntelligentAssistant;
    let productRepository: any;
    let customerRepository: any;
    let orderRepository: any;

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
        assistant = new IntelligentAssistant(productRepository, customerRepository, orderRepository);
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
