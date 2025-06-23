// tests/integration/price-calculation-integration.test.ts
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';
import { server } from '../../src/presentation/server';
import { ProductModel } from '../../src/data/mongodb/models/products/product.model';
import { CategoryModel } from '../../src/data/mongodb/models/products/category.model';
import { UnitModel } from '../../src/data/mongodb/models/products/unit.model';
import { UserModel } from '../../src/data/mongodb/models/user.model';
import { CartModel } from '../../src/data/mongodb/models/cart/cart.model';
import { OrderModel } from '../../src/data/mongodb/models/order/order.model';
import { OrderStatusModel } from '../../src/data/mongodb/models/order/order-status.model';
import { PaymentMethodModel } from '../../src/data/mongodb/models/payment/payment-method.model';
import { CustomerModel } from '../../src/data/mongodb/models/customers/customer.model';
import { CityModel } from '../../src/data/mongodb/models/customers/city.model';
import { NeighborhoodModel } from '../../src/data/mongodb/models/customers/neighborhood.model';
import { BcryptAdapter } from '../../src/configs/bcrypt';
import { JwtAdapter } from '../../src/configs/jwt';
import { envs } from '../../src/configs/envs';
import { TestDbHelper } from '../utils/test-db-helper';

describe('Price Calculation Integration Tests', () => {
    let testServer: server;
    let app: any;
    let adminToken: string;
    let userToken: string;
    let testUser: any;
    let testAdmin: any;
    let testCategory: any;
    let testUnit: any;
    let testCustomer: any;
    let testCity: any;
    let testNeighborhood: any;
    let testOrderStatus: any;
    let testPaymentMethod: any;

    beforeAll(async () => {
        // Setup MongoDB Memory Server using helper
        const mongoUri = await TestDbHelper.connect();

        // Setup test server
        const { MainRoutes } = await import('../../src/presentation/routes');
        testServer = new server({
            p_port: 0,
            p_routes: MainRoutes.getMainRoutes
        });

        app = testServer.app;
    }); afterAll(async () => {
        await TestDbHelper.disconnect();
    });

    beforeEach(async () => {
        // Clean database using helper
        await TestDbHelper.clearDatabase();
        
        // Asegurarse de que no hayan usuarios con emails duplicados
        await mongoose.connection.collection('users').deleteMany({
            email: { $in: ['admin@test.com', 'user@test.com'] }
        });

        // Create test data
        await setupTestData();
    });

    async function setupTestData() {        // Create test city and neighborhood
        // Primero buscar si existe, para evitar duplicados
        testCity = await CityModel.findOne({ name: 'Test City' });
        
        if (!testCity) {
            testCity = await CityModel.create({
                name: 'Test City',
                description: 'Test city for integration tests'
            });
        }

        // Buscar o crear barrio
        testNeighborhood = await NeighborhoodModel.findOne({ name: 'Test Neighborhood' });
        
        if (!testNeighborhood) {
            testNeighborhood = await NeighborhoodModel.create({
                name: 'Test Neighborhood',
                description: 'Test neighborhood for integration tests',
                city: testCity._id
            });
        }

        // Create test users
        const hashedPassword = BcryptAdapter.hash('password123');

        // Buscar o crear el usuario admin
        // Eliminar usuario admin si existe y recrear
        await UserModel.deleteOne({ email: 'admin@test.com' });
        testAdmin = await UserModel.create({
            name: 'Admin User',
            email: 'admin@test.com',
            password: hashedPassword,
            roles: ['ADMIN_ROLE'],
            img: 'default.jpg'
        });

        // Eliminar usuario regular si existe y recrear
        await UserModel.deleteOne({ email: 'user@test.com' });
        testUser = await UserModel.create({
            name: 'Test User',
            email: 'user@test.com',
            password: hashedPassword,
            roles: ['USER_ROLE'],
            img: 'default.jpg'
        });

        // Create test customer
        // Eliminar customer existente y recrear
        await CustomerModel.deleteOne({ userId: testUser._id });
        testCustomer = await CustomerModel.create({
            name: 'Test Customer',
            email: 'customer@test.com',
            phone: '+1234567890',
            address: 'Integration Test Address 123',
            userId: testUser._id,
            neighborhood: testNeighborhood._id
        });        // Generate tokens
        const adminTokenResult = await JwtAdapter.generateToken({ id: testAdmin._id.toString() });
        const userTokenResult = await JwtAdapter.generateToken({ id: testUser._id.toString() });

        if (!adminTokenResult || !userTokenResult) {
            throw new Error('Failed to generate test tokens');
        }

        adminToken = adminTokenResult;
        userToken = userTokenResult;

        // Create test category and unit
        testCategory = await CategoryModel.create({
            name: 'Test Category',
            description: 'Test category for integration tests'
        });

        testUnit = await UnitModel.create({
            name: 'unit',
            abbreviation: 'u',
            description: 'Unidad de medida para tests'
        });
          // Create test order status and payment method
        testOrderStatus = await OrderStatusModel.create({
            code: 'PENDING',
            name: 'PENDING',
            description: 'Pending order',
            color: '#ffc107',
            order: 1,
            isActive: true,
            isDefault: true,
            canTransitionTo: []
        });

        testPaymentMethod = await PaymentMethodModel.create({
            code: 'CASH',
             name: 'CASH',
             description: 'Cash payment',
             requiresOnlinePayment: false,
             defaultOrderStatusId: testOrderStatus._id
         });
    }

    describe('Product Price Calculations via API', () => {
         test('should create product and calculate prices correctly with different IVA rates', async () => {
            // Producto con IVA 21%
            const product21 = await request(app)
                .post('/api/admin/products')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'Test Product 21% IVA',
                    description: 'Product with 21% tax',
                    price: 100,
                    stock: 50,
                    category: testCategory._id,
                    unit: testUnit._id,
                    taxRate: 21
                })
                .expect(201);

            expect(product21.body.price).toBe(100);
            expect(product21.body.taxRate).toBe(21);
            expect(product21.body.priceWithTax).toBe(121); // 100 + (100 * 0.21)

            // Producto con IVA 10.5%
            const product105 = await request(app)
                .post('/api/admin/products')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'Test Product 10.5% IVA',
                    description: 'Product with 10.5% tax',
                    price: 100,
                    stock: 50,
                    category: testCategory._id,
                    unit: testUnit._id,
                    taxRate: 10.5
                })
                .expect(201);

            expect(product105.body.price).toBe(100);
            expect(product105.body.taxRate).toBe(10.5);
            expect(product105.body.priceWithTax).toBe(110.5); // 100 + (100 * 0.105)
        });

        test('should handle decimal prices correctly in product creation', async () => {
            const response = await request(app)
                .post('/api/admin/products')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'Decimal Price Product',
                    description: 'Product with decimal price',
                    price: 99.99,
                    stock: 25,
                    category: testCategory._id,
                    unit: testUnit._id,
                    taxRate: 21
                })
                .expect(201);

            expect(response.body.price).toBe(99.99);
            expect(response.body.priceWithTax).toBe(120.99); // 99.99 + (99.99 * 0.21) = 99.99 + 20.9979 = 120.9879 -> 120.99
        });
    });

    describe('Cart Price Calculations via API', () => {
        let testProduct21: any;
        let testProduct105: any;        beforeEach(async () => {
            // Clear cart before each test
            await CartModel.deleteMany({ userId: testUser._id });
            
            // Create test products with different IVA rates
            testProduct21 = await ProductModel.create({
                name: 'Product 21% IVA',
                description: 'Product with 21% tax',
                price: 100,
                stock: 50,
                category: testCategory._id,
                unit: testUnit._id,
                taxRate: 21
            });

            testProduct105 = await ProductModel.create({
                name: 'Product 10.5% IVA',
                description: 'Product with 10.5% tax',
                price: 50,
                stock: 100,
                category: testCategory._id,
                unit: testUnit._id,
                taxRate: 10.5
            });
        });        test('should add items to cart and calculate prices correctly', async () => {
            // Add first item to cart
            await request(app)
                .post('/api/cart/items')
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                    productId: testProduct21._id.toString(),
                    quantity: 2
                })
                .expect(200);

            // Add second item to cart
            await request(app)
                .post('/api/cart/items')
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                    productId: testProduct105._id.toString(),
                    quantity: 3
                })
                .expect(200);

            // Get cart and verify calculations
            const cartResponse = await request(app)
                .get('/api/cart')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200);

            const cart = cartResponse.body;            expect(cart.items).toHaveLength(2);

            // Verify first item (100 * 2 units, 21% IVA)
            const item1 = cart.items.find((item: any) => item.product.id === testProduct21._id.toString());
            expect(item1.quantity).toBe(2);
            expect(item1.priceAtTime).toBe(100);
            expect(item1.unitPriceWithTax).toBe(121); // 100 + (100 * 0.21)
            expect(item1.subtotalWithTax).toBe(242); // 121 * 2

            // Verify second item (50 * 3 units, 10.5% IVA)
            const item2 = cart.items.find((item: any) => item.product.id === testProduct105._id.toString());
            expect(item2.quantity).toBe(3);
            expect(item2.priceAtTime).toBe(50);
            expect(item2.unitPriceWithTax).toBe(55.25); // 50 + (50 * 0.105)
            expect(item2.subtotalWithTax).toBe(165.75); // 55.25 * 3            // Verify cart totals
            expect(cart.items.length).toBe(2);
            expect(cart.totalItems).toBe(5); // 2+3 items quantity
            expect(cart.total).toBe(407.75); // 242 + 165.75
        });        test('should handle cart updates and maintain correct calculations', async () => {
            // Add item to cart
            await request(app)
                .post('/api/cart/items')
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                    productId: testProduct21._id.toString(),
                    quantity: 1
                })
                .expect(200);

            // Update quantity
            await request(app)
                .put(`/api/cart/items/${testProduct21._id.toString()}`)
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                    quantity: 5
                })
                .expect(200);

            // Verify updated calculations
            const cartResponse = await request(app)
                .get('/api/cart')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200);            const cart = cartResponse.body;
            const item = cart.items[0];

            expect(item.quantity).toBe(5);
            expect(item.subtotalWithTax).toBe(605); // 121 * 5
            expect(cart.total).toBe(605);
        });
    });

    describe('Order Price Calculations with Discounts via API', () => {
        let testProduct: any;

        beforeEach(async () => {
            testProduct = await ProductModel.create({
                name: 'Order Test Product',
                description: 'Product for order testing',
                price: 100,
                stock: 100,
                category: testCategory._id,
                unit: testUnit._id,
                taxRate: 21
            });            // Add product to cart
            await request(app)
                .post('/api/cart/items')
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                    productId: testProduct._id.toString(),
                    quantity: 2
                })
                .expect(200);
        });        test('should create order with discount and calculate prices correctly', async () => {
            const orderData = {
                items: [
                    {
                        productId: testProduct._id.toString(),
                        quantity: 2,
                        unitPrice: 100
                    }                ],
                customerId: testCustomer._id.toString(),
                paymentMethodId: testPaymentMethod._id.toString(),
                shippingStreetAddress: 'Test Address 123',
                shippingNeighborhoodId: testNeighborhood._id.toString(),
                shippingAdditionalInfo: 'Test notes',
                shippingRecipientName: 'Test Customer',
                shippingPhone: '+1234567890',
                discountRate: 15 // 15% discount
            };

            const orderResponse = await request(app)
                .post('/api/sales/')
                .set('Authorization', `Bearer ${userToken}`)
                .send(orderData)
                .expect(201);

            const order = orderResponse.body;

            // Verificar que el descuento se aplicó antes del IVA
            // Precio base: 100 * 2 = 200
            // Descuento 15%: 200 * 0.15 = 30
            // Precio después descuento: 200 - 30 = 170
            // IVA 21% sobre precio descontado: 170 * 0.21 = 35.7
            // Precio final: 170 + 35.7 = 205.7

            expect(order.subtotal).toBe(170); // Precio después del descuento, antes del IVA
            expect(order.taxAmount).toBe(35.7); // IVA calculado sobre precio descontado
            expect(order.discountAmount).toBe(30); // Descuento aplicado
            expect(order.total).toBe(205.7); // Total final
        });        test('should create order without discount and calculate prices correctly', async () => {
            const orderData = {
                items: [
                    {
                        productId: testProduct._id.toString(),
                        quantity: 2,
                        unitPrice: 100
                    }
                ],
                customerId: testCustomer._id.toString(),
                paymentMethodId: testPaymentMethod._id.toString(),
                shippingStreetAddress: 'Test Address 123',
                shippingNeighborhoodId: testNeighborhood._id.toString(),
                shippingAdditionalInfo: 'Test notes',
                shippingRecipientName: 'Test Customer',
                shippingPhone: '+1234567890'
                // No discount
            };

            const orderResponse = await request(app)
                .post('/api/sales/')
                .set('Authorization', `Bearer ${userToken}`)
                .send(orderData)
                .expect(201);

            const order = orderResponse.body;

            // Sin descuento:
            // Precio base: 100 * 2 = 200
            // IVA 21%: 200 * 0.21 = 42
            // Total: 200 + 42 = 242

            expect(order.subtotal).toBe(200); // Precio base sin descuento
            expect(order.taxAmount).toBe(42); // IVA sobre precio completo
            expect(order.discountAmount).toBe(0); // Sin descuento
            expect(order.total).toBe(242); // Total final
        });        test('should handle high discount rates correctly', async () => {
            const orderData = {
                items: [
                    {
                        productId: testProduct._id.toString(),
                        quantity: 2,
                        unitPrice: 100
                    }
                ],
                customerId: testCustomer._id.toString(),
                paymentMethodId: testPaymentMethod._id.toString(),
                shippingStreetAddress: 'Test Address 123',
                shippingNeighborhoodId: testNeighborhood._id.toString(),
                shippingAdditionalInfo: 'Test notes',
                shippingRecipientName: 'Test Customer',
                shippingPhone: '+1234567890',
                discountRate: 50 // 50% discount
            };const orderResponse = await request(app)
                .post('/api/sales/')
                .set('Authorization', `Bearer ${userToken}`)
                .send(orderData)
                .expect(201);

            const order = orderResponse.body;

            // 50% de descuento:
            // Precio base: 100 * 2 = 200
            // Descuento 50%: 200 * 0.5 = 100
            // Precio después descuento: 200 - 100 = 100
            // IVA 21% sobre precio descontado: 100 * 0.21 = 21
            // Total: 100 + 21 = 121

            expect(order.subtotal).toBe(100);
            expect(order.taxAmount).toBe(21);
            expect(order.discountAmount).toBe(100);
            expect(order.total).toBe(121);
        });
    });

    describe('Mixed IVA Rates in Orders', () => {
        let productGeneral: any;
        let productBasic: any;

        beforeEach(async () => {
            // Producto con IVA general (21%)
            productGeneral = await ProductModel.create({
                name: 'General Product',
                description: 'Product with general tax',
                price: 100,
                stock: 100,
                category: testCategory._id,
                unit: testUnit._id,
                taxRate: 21
            });

            // Producto básico con IVA reducido (10.5%)
            productBasic = await ProductModel.create({
                name: 'Basic Product',
                description: 'Product with reduced tax',
                price: 50,
                stock: 100,
                category: testCategory._id,
                unit: testUnit._id,
                taxRate: 10.5
            });            // Add both products to cart
            await request(app)
                .post('/api/cart/items')
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                    productId: productGeneral._id.toString(),
                    quantity: 1
                });

            await request(app)
                .post('/api/cart/items')
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                    productId: productBasic._id.toString(),
                    quantity: 2
                });
        });        test('should handle mixed IVA rates in order with discount', async () => {
            const orderData = {
                items: [
                    {
                        productId: productGeneral._id.toString(),
                        quantity: 1,
                        unitPrice: 100
                    },
                    {
                        productId: productBasic._id.toString(),
                        quantity: 2,
                        unitPrice: 50
                    }
                ],
                customerId: testCustomer._id.toString(),
                paymentMethodId: testPaymentMethod._id.toString(),
                shippingStreetAddress: 'Test Address 123',
                shippingNeighborhoodId: testNeighborhood._id.toString(),
                shippingAdditionalInfo: 'Test notes',
                shippingRecipientName: 'Test Customer',
                shippingPhone: '+1234567890',
                discountRate: 10 // 10% discount
            };

            const orderResponse = await request(app)
                .post('/api/sales/')
                .set('Authorization', `Bearer ${userToken}`)
                .send(orderData)
                .expect(201);

            const order = orderResponse.body;

            // Cálculo esperado:
            // Producto General: 100 * 1 = 100
            // Producto Básico: 50 * 2 = 100
            // Subtotal antes descuento: 200
            // Descuento 10%: 20
            // Subtotal después descuento: 180

            // IVA se calcula por producto después del descuento proporcional:
            // Producto General después descuento: 90 (100 - 10)
            // IVA General: 90 * 0.21 = 18.9
            // Producto Básico después descuento: 90 (100 - 10)  
            // IVA Básico: 90 * 0.105 = 9.45
            // Total IVA: 18.9 + 9.45 = 28.35
            // Total final: 180 + 28.35 = 208.35

            expect(order.subtotal).toBe(180);
            expect(order.discountAmount).toBe(20);
            expect(order.taxAmount).toBeCloseTo(28.35, 2);
            expect(order.total).toBeCloseTo(208.35, 2);
        });        test('should handle mixed IVA rates in order without discount', async () => {
            const orderData = {
                items: [
                    {
                        productId: productGeneral._id.toString(),
                        quantity: 1,
                        unitPrice: 100
                    },
                    {
                        productId: productBasic._id.toString(),
                        quantity: 2,
                        unitPrice: 50
                    }
                ],
                customerId: testCustomer._id.toString(),
                paymentMethodId: testPaymentMethod._id.toString(),
                shippingStreetAddress: 'Test Address 123',
                shippingNeighborhoodId: testNeighborhood._id.toString(),
                shippingAdditionalInfo: 'Test notes',
                shippingRecipientName: 'Test Customer',
                shippingPhone: '+1234567890'
                // No discount
            };

            const orderResponse = await request(app)
                .post('/api/sales/')
                .set('Authorization', `Bearer ${userToken}`)
                .send(orderData)
                .expect(201);

            const order = orderResponse.body;

            // Sin descuento:
            // Producto General: 100, IVA: 21
            // Producto Básico: 100 (50*2), IVA: 10.5  
            // Total IVA: 21 + 10.5 = 31.5
            // Total: 200 + 31.5 = 231.5

            expect(order.subtotal).toBe(200);
            expect(order.discountAmount).toBe(0);
            expect(order.taxAmount).toBe(31.5);
            expect(order.total).toBe(231.5);
        });
    });

    describe('Edge Cases and Error Handling', () => {
        test('should handle very small amounts correctly', async () => {
            const smallProduct = await ProductModel.create({
                name: 'Small Product',
                description: 'Very cheap product',
                price: 0.01,
                stock: 100,
                category: testCategory._id,
                unit: testUnit._id,
                taxRate: 21
            });

            const response = await request(app)
                .post('/api/admin/products')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'Penny Product',
                    description: 'One cent product',
                    price: 0.01,
                    stock: 1000,
                    category: testCategory._id.toString(),
                    unit: testUnit._id.toString(),
                    taxRate: 21
                })
                .expect(201);

            expect(response.body.price).toBe(0.01);
            expect(response.body.priceWithTax).toBe(0.01); // 0.01 + (0.01 * 0.21) = 0.01 + 0.0021 = 0.0121 -> 0.01
        });

        test('should handle large amounts correctly', async () => {
            const response = await request(app)
                .post('/api/admin/products')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'Expensive Product',
                    description: 'Very expensive product',
                    price: 99999.99,
                    stock: 1,
                    category: testCategory._id.toString(),
                    unit: testUnit._id.toString(),
                    taxRate: 21
                })
                .expect(201);

            expect(response.body.price).toBe(99999.99);
            expect(response.body.priceWithTax).toBe(120999.99); // 99999.99 + (99999.99 * 0.21)
        });
    });
});
