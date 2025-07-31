import { MCPDataSourceImpl } from '../../../../../src/infrastructure/datasources/mcp/mcp.datasource.impl';
import { CustomError } from '../../../../../src/domain/errors/custom.error';
import { PaginationDto } from '../../../../../src/domain/dtos/shared/pagination.dto';
import { SearchCustomersDto } from '../../../../../src/domain/dtos/customers/search-customers.dto';
import { SearchProductsDto } from '../../../../../src/domain/dtos/products/search-product.dto';

describe('MCPDataSourceImpl', () => {
    let ds: MCPDataSourceImpl;
    let productRepository: any;
    let customerRepository: any;
    let orderRepository: any;

    beforeEach(() => {
        // Recrear mocks completamente en cada test
        productRepository = {
            getAll: jest.fn(),
            search: jest.fn(),
            findById: jest.fn(),
        };
        customerRepository = {
            getAll: jest.fn(),
            searchCustomers: jest.fn(),
            findById: jest.fn(),
        };
        orderRepository = {
            getAll: jest.fn(),
        };
        ds = new MCPDataSourceImpl(productRepository, customerRepository, orderRepository);

        // Limpiar completamente todos los mocks
        jest.clearAllMocks();
        jest.restoreAllMocks();
    });

    afterEach(() => {
        // Limpieza después de cada test
        jest.clearAllMocks();
        jest.restoreAllMocks();
    });


    it('getAvailableTools returns array', async () => {
        const tools = await ds.getAvailableTools();
        expect(Array.isArray(tools)).toBe(true);
        expect(tools.length).toBeGreaterThan(0);
    });

    describe('callTool', () => {
        it('calls get_customers', async () => {
            customerRepository.getAll.mockResolvedValue([{ id: '1', name: 'A', email: 'a', phone: '1', address: 'x', neighborhood: {}, isActive: true }]);
            const res = await ds.callTool('get_customers', { page: 1, limit: 1 });
            expect(res.content[0].text).toContain('customers');
        });
        it('calls get_customer_by_id', async () => {
            customerRepository.findById.mockResolvedValue({ id: '1', name: 'A', email: 'a', phone: '1', address: 'x', neighborhood: {}, isActive: true });
            const res = await ds.callTool('get_customer_by_id', { id: '1' });
            expect(res.content[0].text).toContain('A');
        });
        it('calls search_customers', async () => {
            customerRepository.searchCustomers.mockResolvedValue({ customers: [{ id: '1', name: 'Ab', email: 'a', phone: '1', address: 'x', neighborhood: {}, isActive: true }], total: 1 });
            const res = await ds.callTool('search_customers', { q: 'Ab', page: 1, limit: 1 });
            expect(res.content[0].text).toContain('customers');
        });
        it('calls get_products', async () => {
            productRepository.getAll.mockResolvedValue({ total: 1, products: [{ id: '1', name: 'P', description: 'desc', price: 1, priceWithTax: 1.2, stock: 1, category: {}, unit: {}, tags: [], isActive: true }] });
            const res = await ds.callTool('get_products', { page: 1, limit: 1 });
            expect(res.content[0].text).toContain('products');
        });
        it('calls search_products', async () => {
            productRepository.search.mockResolvedValue({ total: 1, products: [{ id: '1', name: 'P', description: 'desc', price: 1, priceWithTax: 1.2, stock: 1, category: {}, unit: {}, tags: [], isActive: true }] });
            const res = await ds.callTool('search_products', { q: 'P', page: 1, limit: 1 });
            expect(res.content[0].text).toContain('products');
        });
        it('calls get_product_by_id', async () => {
            productRepository.findById.mockResolvedValue({ id: '1', name: 'P', description: 'desc', price: 1, priceWithTax: 1.2, stock: 1, category: {}, unit: {}, tags: [], isActive: true });
            const res = await ds.callTool('get_product_by_id', { id: '1' });
            expect(res.content[0].text).toContain('P');
        });
        it('calls get_orders', async () => {
            orderRepository.getAll.mockResolvedValue({ total: 1, orders: [{ id: '1', customer: { id: 'c', name: 'n', email: 'e' }, subtotal: 1, total: 2, status: { name: 's' }, date: 'd', items: [{}] }] });
            const res = await ds.callTool('get_orders', { page: 1, limit: 1 });
            expect(res.content[0].text).toContain('orders');
        });
        it('calls search_database', async () => {
            productRepository.getAll.mockResolvedValue({ products: [{ id: '1', name: 'P', description: 'desc' }] });
            customerRepository.getAll.mockResolvedValue([{ id: '1', name: 'Pedro', email: 'pedro@test.com' }]);
            const res = await ds.callTool('search_database', { query: 'P', entities: ['products', 'customers'] });
            expect(res.content[0].text).toContain('products');
            expect(res.content[0].text).toContain('customers');
        });
        it('throws on unknown tool', async () => {
            await expect(ds.callTool('unknown_tool', {})).rejects.toThrow('Herramienta desconocida');
        });
        it('throws CustomError as is', async () => {
            // Forzar error en handler
            customerRepository.getAll.mockImplementation(() => { throw CustomError.badRequest('fail'); });
            await expect(ds.callTool('get_customers', { page: 1, limit: 1 })).rejects.toThrow('fail');
        });
        it('wraps non-CustomError', async () => {
            customerRepository.getAll.mockImplementation(() => { throw new Error('fail'); });
            await expect(ds.callTool('get_customers', { page: 1, limit: 1 })).rejects.toThrow('Error ejecutando get_customers: fail');
        });
    });

    describe('handleGetCustomers', () => {
        it('returns customers (no search)', async () => {
            customerRepository.getAll.mockResolvedValue([{ id: '1', name: 'A', email: 'a', phone: '1', address: 'x', neighborhood: {}, isActive: true }]);
            const res = await ds['handleGetCustomers']({ page: 1, limit: 1 });
            expect(res.content[0].text).toContain('customers');
        });
        it('returns customers (with search)', async () => {
            customerRepository.searchCustomers.mockResolvedValue({ customers: [{ id: '1', name: 'Ab', email: 'a', phone: '1', address: 'x', neighborhood: {}, isActive: true }], total: 1 });
            const res = await ds['handleGetCustomers']({ page: 1, limit: 1, search: 'Ab' });
            expect(res.content[0].text).toContain('customers');
        });
        it('throws on invalid pagination', async () => {
            jest.spyOn(PaginationDto, 'create').mockReturnValue(['err', undefined]);
            await expect(ds['handleGetCustomers']({ page: 0, limit: 0 })).rejects.toThrow('err');
        });
        it('throws on invalid search dto', async () => {
            jest.spyOn(SearchCustomersDto, 'create').mockReturnValue(['err', undefined]);
            await expect(ds['handleGetCustomers']({ page: 1, limit: 1, search: 'A' })).rejects.toThrow('err');
        });
    });

    describe('handleGetCustomerById', () => {
        it('returns customer', async () => {
            customerRepository.findById.mockResolvedValue({ id: '1', name: 'A', email: 'a', phone: '1', address: 'x', neighborhood: {}, isActive: true });
            const res = await ds['handleGetCustomerById']({ id: '1' });
            expect(res.content[0].text).toContain('A');
        });
        it('returns not found if error', async () => {
            customerRepository.findById.mockRejectedValue(new Error('fail'));
            const res = await ds['handleGetCustomerById']({ id: '1' });
            expect(res.content[0].text).toContain('no encontrado');
        });
        it('throws if id missing', async () => {
            await expect(ds['handleGetCustomerById']({})).rejects.toThrow('ID del cliente es requerido');
        });
    });

    describe('handleGetProducts', () => {
        it('returns products (no search)', async () => {
            jest.spyOn(PaginationDto, 'create').mockRestore?.(); // Asegura que no esté mockeado
            productRepository.getAll.mockResolvedValue({ total: 1, products: [{ id: '1', name: 'Pr', description: 'desc', price: 1, priceWithTax: 1.2, stock: 1, category: {}, unit: {}, tags: [], isActive: true }] });
            const res = await ds['handleGetProducts']({ page: 1, limit: 1 });
            expect(res.content[0].text).toContain('products');
        });
        it('returns products (with search)', async () => {
            jest.spyOn(PaginationDto, 'create').mockRestore?.();
            jest.spyOn(SearchProductsDto, 'create').mockRestore?.();
            productRepository.search.mockResolvedValue({ total: 1, products: [{ id: '1', name: 'Pr', description: 'desc', price: 1, priceWithTax: 1.2, stock: 1, category: {}, unit: {}, tags: [], isActive: true }] });
            const res = await ds['handleGetProducts']({ page: 1, limit: 1, search: 'Pr' });
            expect(res.content[0].text).toContain('products');
        });
        it('throws on invalid pagination', async () => {
            jest.spyOn(PaginationDto, 'create').mockReturnValue(['err', undefined]);
            await expect(ds['handleGetProducts']({ page: 0, limit: 0 })).rejects.toThrow('err');
        });
        it('throws on invalid search dto', async () => {
            jest.spyOn(SearchProductsDto, 'create').mockReturnValue(['err', undefined]);
            await expect(ds['handleGetProducts']({ page: 1, limit: 1, search: 'P' })).rejects.toThrow('err');
        });
    });

    describe('handleGetProductById', () => {
        it('returns product', async () => {
            productRepository.findById.mockResolvedValue({ id: '1', name: 'P', description: 'desc', price: 1, priceWithTax: 1.2, stock: 1, category: {}, unit: {}, tags: [], isActive: true });
            const res = await ds['handleGetProductById']({ id: '1' });
            expect(res.content[0].text).toContain('P');
        });
        it('returns not found if error', async () => {
            productRepository.findById.mockRejectedValue(new Error('fail'));
            const res = await ds['handleGetProductById']({ id: '1' });
            expect(res.content[0].text).toContain('no encontrado');
        });
        it('throws if id missing', async () => {
            await expect(ds['handleGetProductById']({})).rejects.toThrow('ID del producto es requerido');
        });
    });

    describe('handleGetOrders', () => {
        it('returns orders', async () => {
            orderRepository.getAll.mockResolvedValue({ total: 1, orders: [{ id: '1', customer: { id: 'c', name: 'n', email: 'e' }, subtotal: 1, total: 2, status: { name: 's' }, date: 'd', items: [{}] }] });
            const res = await ds['handleGetOrders']({ page: 1, limit: 1 });
            expect(res.content[0].text).toContain('orders');
        });
        it('returns error if repo fails', async () => {
            orderRepository.getAll.mockRejectedValue(new Error('fail'));
            const res = await ds['handleGetOrders']({ page: 1, limit: 1 });
            expect(res.content[0].text).toContain('Error obteniendo pedidos');
        });
        it('throws on invalid pagination', async () => {
            jest.spyOn(PaginationDto, 'create').mockReturnValue(['err', undefined]);
            await expect(ds['handleGetOrders']({ page: 0, limit: 0 })).rejects.toThrow('err');
        });
    });

    describe('handleSearchDatabase', () => {
        it('throws if query missing', async () => {
            await expect(ds['handleSearchDatabase']({})).rejects.toThrow('Query de búsqueda es requerido');
        });

        it('returns products only if entities is products', async () => {
            productRepository.getAll.mockResolvedValue({ total: 1, products: [{ id: '1', name: 'Pizza', description: 'Product description' }] });
            const res = await ds['handleSearchDatabase']({ query: 'Pizza', entities: ['products'] });
            expect(res.content).toBeDefined();
            expect(res.content[0].text).toContain('Pizza');
            expect(res.content[0].text).not.toContain('customers');
        });

        it('returns customers only if entities is customers', async () => {
            customerRepository.getAll.mockResolvedValue([{ id: '1', name: 'Carlos', email: 'carlos@test.com' }]);
            const res = await ds['handleSearchDatabase']({ query: 'Carlos', entities: ['customers'] });
            expect(res.content).toBeDefined();
            expect(res.content[0].text).toContain('Carlos');
            expect(res.content[0].text).not.toContain('products');
        });

        it('returns empty if entities is empty array', async () => {
            const res = await ds['handleSearchDatabase']({ query: 'X', entities: [] });
            expect(res.content).toBeDefined();
            expect(res.content[0].text).toBe('{}');
        });

        it('ignores unknown entities', async () => {
            productRepository.getAll.mockResolvedValue({ total: 1, products: [{ id: '1', name: 'Pizza', description: 'Product description' }] });
            customerRepository.getAll.mockResolvedValue([{ id: '1', name: 'Carlos', email: 'carlos@test.com' }]);
            const res = await ds['handleSearchDatabase']({ query: 'Pizza', entities: ['unknown', 'products'] });
            expect(res.content).toBeDefined();
            expect(res.content[0].text).toContain('Pizza');
            expect(res.content[0].text).not.toContain('unknown');
        });

        it('returns empty if no entities param', async () => {
            // Sin entidades, usa default ['products', 'customers'] pero con resultados que no coincidan con 'P'
            productRepository.getAll.mockResolvedValue({ total: 1, products: [{ id: '1', name: 'Bebida', description: 'Soft drink' }] });
            customerRepository.getAll.mockResolvedValue([{ id: '1', name: 'Ana', email: 'ana@test.com' }]);
            const res = await ds['handleSearchDatabase']({ query: 'P' });
            expect(res.content).toBeDefined();
            // Como 'P' no coincide con 'Bebida' ni 'Ana', el resultado debería ser un objeto vacío
            expect(res.content[0].text).toBe('{}');
        });

        it('handles error in productRepository', async () => {
            productRepository.getAll.mockRejectedValue(new Error('fail products'));
            customerRepository.getAll.mockResolvedValue([{ id: '1', name: 'Pedro', email: 'pedro@test.com' }]);
            const res = await ds['handleSearchDatabase']({ query: 'Pedro', entities: ['products', 'customers'] });
            expect(res.content).toBeDefined();
            expect(res.content[0].text).toMatch(/Error buscando productos|Pedro/);
        });

        it('handles error in customerRepository', async () => {
            productRepository.getAll.mockResolvedValue({ total: 1, products: [{ id: '1', name: 'Pizza', description: 'Product description' }] });
            customerRepository.getAll.mockRejectedValue(new Error('fail customers'));
            const res = await ds['handleSearchDatabase']({ query: 'Pizza', entities: ['products', 'customers'] });
            expect(res.content).toBeDefined();
            expect(res.content[0].text).toMatch(/Pizza|Error buscando clientes/);
        });

        it('handles both repositories error', async () => {
            productRepository.getAll.mockRejectedValue(new Error('fail products'));
            customerRepository.getAll.mockRejectedValue(new Error('fail customers'));
            const res = await ds['handleSearchDatabase']({ query: 'Pizza', entities: ['products', 'customers'] });
            expect(res.content).toBeDefined();
            expect(res.content[0]).toBeDefined();
            expect(res.content[0].text).toBeDefined();

            // Parse the JSON response to check for errors
            const parsedResponse = JSON.parse(res.content[0].text!);
            expect(parsedResponse.errors).toBeDefined();
            expect(parsedResponse.errors).toHaveLength(2);
            expect(parsedResponse.errors).toEqual(
                expect.arrayContaining([
                    "Error buscando productos: fail products",
                    "Error buscando clientes: fail customers"
                ])
            );
        });
    });

    describe('handleSearchCustomers', () => {
        it('returns customers', async () => {
            jest.spyOn(SearchCustomersDto, 'create').mockImplementation((data: any) => [undefined, data]);
            customerRepository.searchCustomers.mockResolvedValue({ total: 1, customers: [{ id: '1', name: 'Abel', email: 'abel@email.com', phone: '1', address: 'x', neighborhood: {}, isActive: true }] });
            const res = await ds['handleSearchCustomers']({ q: 'Ab', page: 1, limit: 1 });
            expect(res.content[0].text).toContain('customers');
        });
        it('throws on invalid dto', async () => {
            jest.spyOn(SearchCustomersDto, 'create').mockReturnValue(['err', undefined]);
            await expect(ds['handleSearchCustomers']({ q: 'A', page: 1, limit: 1 })).rejects.toThrow('err');
        });
        it('throws internal error', async () => {
            // Mock para que SearchCustomersDto.create devuelva un DTO válido
            const mockDto = {
                q: 'Ab',
                page: 1,
                limit: 1,
                sortBy: 'createdAt',
                sortOrder: 'desc' as const
            } as any;
            jest.spyOn(SearchCustomersDto, 'create').mockReturnValue([undefined, mockDto]);
            customerRepository.searchCustomers.mockRejectedValue(new Error('fail'));
            await expect(ds['handleSearchCustomers']({ q: 'Ab', page: 1, limit: 1 })).rejects.toThrow('Error buscando clientes: fail');
        });
    });

    describe('handleSearchProducts', () => {
        it('returns products', async () => {
            jest.spyOn(SearchProductsDto, 'create').mockImplementation((data: any) => [undefined, data]);
            productRepository.search.mockResolvedValue({ total: 1, products: [{ id: '1', name: 'Producto Prueba', description: 'desc Prueba', price: 1, priceWithTax: 1.2, stock: 1, category: {}, unit: {}, tags: [], imgUrl: '', isActive: true }] });
            const res = await ds['handleSearchProducts']({ q: 'Pr', page: 1, limit: 1 });
            expect(res.content[0].text).toContain('products');
        });
        it('throws on invalid dto', async () => {
            jest.spyOn(SearchProductsDto, 'create').mockReturnValue(['err', undefined]);
            await expect(ds['handleSearchProducts']({ q: 'P', page: 1, limit: 1 })).rejects.toThrow('err');
        });
        it('throws internal error', async () => {
            // Mock para que SearchProductsDto.create devuelva un DTO válido
            const mockDto = {
                query: 'Pr',
                pagination: { page: 1, limit: 1 },
                sortBy: 'createdAt',
                sortOrder: 'desc' as const
            } as any;
            jest.spyOn(SearchProductsDto, 'create').mockReturnValue([undefined, mockDto]);
            productRepository.search.mockRejectedValue(new Error('fail'));
            await expect(ds['handleSearchProducts']({ q: 'Pr', page: 1, limit: 1 })).rejects.toThrow('Error buscando productos: fail');
        });
    });
});
