// tests/smoke/price-calculation-smoke.test.ts
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';
import { server } from '../../src/presentation/server';
import { ProductModel } from '../../src/data/mongodb/models/products/product.model';
import { CategoryModel } from '../../src/data/mongodb/models/products/category.model';
import { UnitModel } from '../../src/data/mongodb/models/products/unit.model';
import { UserModel } from '../../src/data/mongodb/models/user.model';
import { CartModel } from '../../src/data/mongodb/models/cart/cart.model';
import { CustomerModel } from '../../src/data/mongodb/models/customers/customer.model';
import { CityModel } from '../../src/data/mongodb/models/customers/city.model';
import { NeighborhoodModel } from '../../src/data/mongodb/models/customers/neighborhood.model';
import { OrderStatusModel } from '../../src/data/mongodb/models/order/order-status.model';
import { PaymentMethodModel } from '../../src/data/mongodb/models/payment/payment-method.model';
import { BcryptAdapter } from '../../src/configs/bcrypt';
import { JwtAdapter } from '../../src/configs/jwt';
import { envs } from '../../src/configs/envs';
import { TestDbHelper } from '../utils/test-db-helper';

/**
 * Smoke Tests para Cálculos de Precios
 * 
 * Estos tests verifican que los cálculos de precios funcionen correctamente
 * en escenarios reales de uso, probando el flujo completo desde la creación
 * de productos hasta la finalización de órdenes.
 */
describe('Price Calculation Smoke Tests - Real World Scenarios', () => {
    let testServer: server;
    let app: any;
    let adminToken: string;
    let userToken: string;
    let testData: any = {};

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

        // Setup all test data once
        await setupCompleteTestEnvironment();
    }); afterAll(async () => {
        await TestDbHelper.disconnect();
    }); async function setupCompleteTestEnvironment() {
        // Clean database using helper
        await TestDbHelper.clearDatabase(); 
        // Double-check specific collections that pueden dar problemas
        await mongoose.connection.collection('cities').deleteMany({});
        await mongoose.connection.collection('units').deleteMany({});
        await mongoose.connection.collection('orderstatuses').deleteMany({});
        
        // Create location data
        testData.city = await CityModel.create({
            name: 'Buenos Aires',
            description: 'Capital city of Argentina for testing'
        });

        // Create the 'general' neighborhood that the user hook expects
        await NeighborhoodModel.create({
            name: 'general',
            description: 'Barrio por defecto para nuevos usuarios',
            city: testData.city._id
        });

        testData.neighborhood = await NeighborhoodModel.create({
            name: 'Palermo',
            description: 'Un barrio de Buenos Aires',
            city: testData.city._id
        });

        // Create users
        const hashedPassword = BcryptAdapter.hash('password123');

        testData.admin = await UserModel.create({
            name: 'Admin User',
            email: 'admin@ecommerce.com',
            password: hashedPassword,
            roles: ['ADMIN_ROLE'],
            img: 'admin.jpg'
        });

        testData.user = await UserModel.create({
            name: 'Customer User',
            email: 'customer@ecommerce.com',
            password: hashedPassword,
            roles: ['USER_ROLE'],
            img: 'customer.jpg'        });        
        
        // Create customer profile for the test user
        testData.customer = await CustomerModel.create({
            userId: testData.user._id,
            name: 'Juan Pérez',
            phone: '+54911234567',
            address: 'Calle Falsa 123',
            neighborhood: testData.neighborhood._id
        });// Generate tokens
        const adminTokenResult = await JwtAdapter.generateToken({ id: testData.admin._id.toString() });
        const userTokenResult = await JwtAdapter.generateToken({ id: testData.user._id.toString() });

        if (!adminTokenResult || !userTokenResult) {
            throw new Error('Failed to generate test tokens');
        }

        adminToken = adminTokenResult;
        userToken = userTokenResult;

        // Create product categories
        testData.categories = {
            electronics: await CategoryModel.create({
                name: 'Electrónicos',
                description: 'Dispositivos electrónicos y tecnología'
            }),
            food: await CategoryModel.create({
                name: 'Alimentos',
                description: 'Productos alimenticios'
            }),
            books: await CategoryModel.create({
                name: 'Libros',
                description: 'Libros y material educativo'
            })
        };

        // Create units
        testData.units = {
            unit: await UnitModel.create({
                name: 'unidad',
                abbreviation: 'u',
                description: 'Unidad de medida básica'
            }),
            kg: await UnitModel.create({
                name: 'kilogramo',
                abbreviation: 'kg',
                description: 'Kilogramo como unidad de peso'
            })
        };        // Create order status and payment methods
        testData.orderStatus = await OrderStatusModel.create({
            code: 'PENDING',
            name: 'PENDING',
            description: 'Pedido pendiente',
            color: '#ffc107',
            order: 1,
            isActive: true,
            isDefault: true,
            canTransitionTo: []
        });

        testData.paymentMethods = {
            cash: await PaymentMethodModel.create({
                code: 'CASH',
                name: 'CASH',
                description: 'Pago en efectivo',
                requiresOnlinePayment: false,
                defaultOrderStatusId: testData.orderStatus._id
            }),
            card: await PaymentMethodModel.create({
                code: 'CREDIT_CARD',
                name: 'CREDIT_CARD',
                description: 'Tarjeta de crédito',
                requiresOnlinePayment: true,
                defaultOrderStatusId: testData.orderStatus._id
            })
        };
    }

    describe('E-commerce Complete Flow - Price Validation', () => {
        test('SMOKE: Complete e-commerce flow with mixed products and discount', async () => {
            // 1. Create products with different IVA rates (real-world scenario)
            const laptop = await request(app)
                .post('/api/admin/products')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'Laptop Gaming ROG',
                    description: 'Laptop para gaming de alta gama',
                    price: 299999.99, // High-end laptop
                    stock: 5,                    category: testData.categories.electronics._id.toString(),
                    unit: testData.units.unit._id.toString(),
                    taxRate: 21 // General IVA rate for electronics
                })
                .expect(201);

            const coffee = await request(app)
                .post('/api/admin/products')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'Café Premium Colombiano',
                    description: 'Café de origen Colombia, 1kg',
                    price: 2500.50, // Coffee price per kg
                    stock: 100,                    category: testData.categories.food._id.toString(),
                    unit: testData.units.kg._id.toString(),
                    taxRate: 10.5 // Reduced IVA for basic food items
                })
                .expect(201);

            const book = await request(app)
                .post('/api/admin/products')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'Clean Code - Robert Martin',
                    description: 'Libro sobre buenas prácticas de programación',
                    price: 8999, // Book price
                    stock: 20,
                    category: testData.categories.books._id.toString(),
                    unit: testData.units.unit._id.toString(),
                    taxRate: 21 // General IVA for books
                })
                .expect(201);

            // 2. Verify product prices are calculated correctly
            expect(laptop.body.priceWithTax).toBe(362999.99); // 299999.99 * 1.21
            expect(coffee.body.priceWithTax).toBe(2763.05); // 2500.50 * 1.105
            expect(book.body.priceWithTax).toBe(10888.79); // 8999 * 1.21            // 3. Add products to cart
            await request(app)
                .post('/api/cart/items')
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                    productId: laptop.body.id,
                    quantity: 1
                })
                .expect(200);

            await request(app)
                .post('/api/cart/items')
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                    productId: coffee.body.id,
                    quantity: 2 // 2 kg of coffee
                })
                .expect(200);

            await request(app)
                .post('/api/cart/items')
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                    productId: book.body.id,
                    quantity: 3 // 3 books
                })
                .expect(200);

            // 4. Verify cart calculations
            const cartResponse = await request(app)
                .get('/api/cart')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200);

            const cart = cartResponse.body;
            expect(cart.items).toHaveLength(3);            // Verify individual item calculations
            const laptopItem = cart.items.find((item: any) => item.product.name === 'Laptop Gaming ROG');
            const coffeeItem = cart.items.find((item: any) => item.product.name === 'Café Premium Colombiano');
            const bookItem = cart.items.find((item: any) => item.product.name === 'Clean Code - Robert Martin');

            expect(laptopItem.subtotalWithTax).toBe(362999.99);
            expect(coffeeItem.subtotalWithTax).toBe(5526.10); // 2763.05 * 2
            expect(bookItem.subtotalWithTax).toBe(32666.37); // 10888.79 * 3

            // Total cart should be sum of all items
            const expectedTotal = 362999.99 + 5526.10 + 32666.37; // 401192.46
            expect(cart.total).toBeCloseTo(expectedTotal, 2);            // 5. Create order with discount
            const orderResponse = await request(app)
                .post('/api/sales/')
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                    items: [
                        {
                            productId: laptop.body.id,
                            quantity: 1,
                            unitPrice: 299999.99
                        },
                        {
                            productId: coffee.body.id,
                            quantity: 2,
                            unitPrice: 2500.50
                        },
                        {
                            productId: book.body.id,
                            quantity: 3,
                            unitPrice: 8999
                        }                    ],
                    customerId: testData.customer._id.toString(),
                    paymentMethodId: testData.paymentMethods.card._id.toString(),
                    shippingStreetAddress: 'Av. Santa Fe 1234, Piso 5, Dpto B',
                    shippingNeighborhoodId: testData.neighborhood._id.toString(),
                    shippingAdditionalInfo: 'Portero eléctrico, timbre 5B',
                    shippingRecipientName: 'Juan Pérez',
                    shippingPhone: '+54911234567',
                    discountRate: 10 // 10% Black Friday discount
                })
                .expect(201);

            const order = orderResponse.body;

            // 6. Verify order calculations (discount applied before tax)
            // Base amounts:
            // Laptop: 299999.99
            // Coffee: 2500.50 * 2 = 5001
            // Books: 8999 * 3 = 26997
            // Total base: 331997.99

            // Discount 10%: 33199.80 (rounded)
            // After discount: 298798.19

            // Tax calculation per product category:
            // Laptop after discount: 269999.99 (299999.99 - 29999.999)
            // Laptop tax: 269999.99 * 0.21 = 56699.998
            // Coffee after discount: 4500.90 (5001 - 500.1)  
            // Coffee tax: 4500.90 * 0.105 = 472.595
            // Books after discount: 24297.30 (26997 - 2699.7)
            // Books tax: 24297.30 * 0.21 = 5102.433

            expect(order.discountAmount).toBeCloseTo(33199.80, 1);
            expect(order.subtotal).toBeCloseTo(298798.19, 1);
            expect(order.taxAmount).toBeGreaterThan(60000); // Should have substantial tax
            expect(order.total).toBeGreaterThan(350000); // Should be substantial total

            // 7. Verify that discount was applied before tax (business rule)
            // If tax was applied first, the total would be different
            const incorrectFlow = (331997.99 * 1.185) * 0.9; // Tax first, then discount
            expect(order.total).not.toBeCloseTo(incorrectFlow, 0);
        });

        test('SMOKE: High-volume order with bulk discount', async () => {
            // Create bulk product
            const bulkProduct = await request(app)
                .post('/api/admin/products')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'Bolsa de Arroz 25kg',
                    description: 'Arroz largo fino para mayoristas',
                    price: 1500, // Wholesale price
                    stock: 1000,
                    category: testData.categories.food._id.toString(),
                    unit: testData.units.unit._id.toString(),
                    taxRate: 10.5 // Basic food item
                })
                .expect(201);            // Add large quantity to cart
            await request(app)
                .post('/api/cart/items')
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                    productId: bulkProduct.body.id,
                    quantity: 100 // 100 bags = 2500kg
                })
                .expect(200);            // Create order with bulk discount
            const orderResponse = await request(app)
                .post('/api/sales/')
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                    items: [
                        {
                            productId: bulkProduct.body.id,
                            quantity: 100,
                            unitPrice: 1500
                        }                    ],
                    customerId: testData.customer._id.toString(),
                    paymentMethodId: testData.paymentMethods.cash._id.toString(),
                    shippingStreetAddress: 'Galpón Industrial, Zona Norte',
                    shippingNeighborhoodId: testData.neighborhood._id.toString(),
                    shippingAdditionalInfo: 'Entrega para mayorista - horario comercial',
                    shippingRecipientName: 'Juan Pérez',
                    shippingPhone: '+54911234567',
                    discountRate: 25 // 25% bulk discount
                })
                .expect(201);

            const order = orderResponse.body;

            // Verify bulk calculations
            // Base: 1500 * 100 = 150000
            // Discount 25%: 37500
            // After discount: 112500
            // Tax 10.5%: 11812.5
            // Total: 124312.5

            expect(order.discountAmount).toBe(37500);
            expect(order.subtotal).toBe(112500);
            expect(order.taxAmount).toBe(11812.5);
            expect(order.total).toBe(124312.5);
        });

        test('SMOKE: Zero discount scenario', async () => {
            // Create simple product
            const simpleProduct = await request(app)
                .post('/api/admin/products')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'Cuaderno Universitario',
                    description: 'Cuaderno rayado 100 hojas',
                    price: 450, // Simple stationery
                    stock: 200,
                    category: testData.categories.books._id.toString(),
                    unit: testData.units.unit._id.toString(),
                    taxRate: 21
                })
                .expect(201);            // Add to cart
            await request(app)
                .post('/api/cart/items')
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                    productId: simpleProduct.body.id,
                    quantity: 5
                })
                .expect(200);            // Create order without discount
            const orderResponse = await request(app)
                .post('/api/sales/')
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                    items: [
                        {
                            productId: simpleProduct.body.id,
                            quantity: 5,
                            unitPrice: 450
                        }                    ],
                    customerId: testData.customer._id.toString(),
                    paymentMethodId: testData.paymentMethods.cash._id.toString(),
                    shippingStreetAddress: 'Calle Falsa 123',
                    shippingNeighborhoodId: testData.neighborhood._id.toString(),
                    shippingAdditionalInfo: 'Entrega regular',
                    shippingRecipientName: 'Juan Pérez',
                    shippingPhone: '+54911234567'
                    // No discount
                })
                .expect(201);

            const order = orderResponse.body;

            // Verify no-discount calculations
            // Base: 450 * 5 = 2250
            // No discount: 0
            // Tax 21%: 472.5
            // Total: 2722.5

            expect(order.discountAmount).toBe(0);
            expect(order.subtotal).toBe(2250);
            expect(order.taxAmount).toBe(472.5);
            expect(order.total).toBe(2722.5);
        });

        test('SMOKE: Maximum discount scenario', async () => {
            // Create promotional product
            const promoProduct = await request(app)
                .post('/api/admin/products')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'Liquidación Final - Televisor 55"',
                    description: 'Smart TV 4K en liquidación por cambio de modelo',
                    price: 89999, // High-value electronics
                    stock: 3,
                    category: testData.categories.electronics._id.toString(),
                    unit: testData.units.unit._id.toString(),
                    taxRate: 21
                })
                .expect(201);            // Add to cart
            await request(app)
                .post('/api/cart/items')
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                    productId: promoProduct.body.id,
                    quantity: 1
                })
                .expect(200);            // Create order with maximum discount
            const orderResponse = await request(app)
                .post('/api/sales/')
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                    items: [
                        {
                            productId: promoProduct.body.id,
                            quantity: 1,
                            unitPrice: 89999
                        }                    ],
                    customerId: testData.customer._id.toString(),
                    paymentMethodId: testData.paymentMethods.card._id.toString(),
                    shippingStreetAddress: 'Domicilio particular',
                    shippingNeighborhoodId: testData.neighborhood._id.toString(),
                    shippingAdditionalInfo: 'Liquidación final - último modelo',
                    shippingRecipientName: 'Juan Pérez',
                    shippingPhone: '+54911234567',
                    discountRate: 70 // 70% clearance discount
                })
                .expect(201);

            const order = orderResponse.body;

            // Verify maximum discount calculations
            // Base: 89999
            // Discount 70%: 62999.30
            // After discount: 26999.70
            // Tax 21%: 5669.937 -> 5669.94
            // Total: 32669.64

            expect(order.discountAmount).toBeCloseTo(62999.30, 1);
            expect(order.subtotal).toBeCloseTo(26999.70, 1);
            expect(order.taxAmount).toBeCloseTo(5669.94, 1);
            expect(order.total).toBeCloseTo(32669.64, 1);
        });
    });

    describe('Precision and Rounding Validation', () => {
        test('SMOKE: Complex decimal scenarios maintain business precision', async () => {
            // Create product with complex decimal price
            const complexProduct = await request(app)
                .post('/api/admin/products')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'Aceite de Oliva Premium 750ml',
                    description: 'Aceite de oliva extra virgen importado',
                    price: 1234.67, // Complex decimal
                    stock: 50,
                    category: testData.categories.food._id.toString(),
                    unit: testData.units.unit._id.toString(),
                    taxRate: 10.5
                })
                .expect(201);            // Add fractional quantity
            await request(app)
                .post('/api/cart/items')
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                    productId: complexProduct.body.id,
                    quantity: 7 // Odd quantity for complex calculations
                })
                .expect(200);            // Create order with complex discount
            const orderResponse = await request(app)
                .post('/api/sales/')
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                    items: [
                        {
                            productId: complexProduct.body.id,
                            quantity: 7,
                            unitPrice: 1234.67
                        }                    ],
                    customerId: testData.customer._id.toString(),
                    paymentMethodId: testData.paymentMethods.cash._id.toString(),
                    shippingStreetAddress: 'Test Address for Decimals',
                    shippingNeighborhoodId: testData.neighborhood._id.toString(),
                    shippingAdditionalInfo: 'Precision test',
                    shippingRecipientName: 'Juan Pérez',
                    shippingPhone: '+54911234567',
                    discountRate: 12.75 // Complex percentage
                })
                .expect(201);

            const order = orderResponse.body;

            // All amounts should be properly rounded to 2 decimals
            expect(Number.isInteger(order.subtotal * 100)).toBe(true);
            expect(Number.isInteger(order.discountAmount * 100)).toBe(true);
            expect(Number.isInteger(order.taxAmount * 100)).toBe(true);
            expect(Number.isInteger(order.total * 100)).toBe(true);

            // Verify mathematical consistency
            const calculatedTotal = order.subtotal + order.taxAmount;
            expect(order.total).toBeCloseTo(calculatedTotal, 2);
        });
    });

    describe('Business Rules Validation', () => {
        test('SMOKE: Discount always applied before tax across all scenarios', async () => {
            const scenarios = [
                { price: 1000, discount: 10, tax: 21, description: 'Standard scenario' },
                { price: 50.50, discount: 5.5, tax: 10.5, description: 'Small amounts' },
                { price: 99999.99, discount: 50, tax: 27, description: 'Large amounts with luxury tax' },
                { price: 33.33, discount: 33.33, tax: 21, description: 'Equal percentages' }
            ];

            for (const scenario of scenarios) {
                // Create product for scenario
                const product = await request(app)
                    .post('/api/admin/products')
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send({
                        name: `Test Product - ${scenario.description}`,
                        description: scenario.description,
                        price: scenario.price,
                        stock: 100,                        category: testData.categories.electronics._id.toString(),
                        unit: testData.units.unit._id.toString(),
                        taxRate: scenario.tax
                    })
                    .expect(201);                // Add to cart
                await request(app)
                    .post('/api/cart/items')
                    .set('Authorization', `Bearer ${userToken}`)
                    .send({
                        productId: product.body.id,
                        quantity: 1
                    })
                    .expect(200);                // Create order with discount
                const orderResponse = await request(app)
                    .post('/api/sales/')
                    .set('Authorization', `Bearer ${userToken}`)
                    .send({
                        items: [
                            {
                                productId: product.body.id,
                                quantity: 1,
                                unitPrice: scenario.price
                            }                        ],
                        customerId: testData.customer._id.toString(),
                        paymentMethodId: testData.paymentMethods.cash._id.toString(),
                        shippingStreetAddress: `Test Address - ${scenario.description}`,
                        shippingNeighborhoodId: testData.neighborhood._id.toString(),
                        shippingAdditionalInfo: scenario.description,
                        shippingRecipientName: 'Juan Pérez',
                        shippingPhone: '+54911234567',
                        discountRate: scenario.discount
                    })
                    .expect(201);

                const order = orderResponse.body;

                // Verify correct flow: base -> discount -> tax
                const expectedDiscount = Math.round(scenario.price * (scenario.discount / 100) * 100) / 100;
                const expectedSubtotal = Math.round((scenario.price - expectedDiscount) * 100) / 100;
                const expectedTax = Math.round(expectedSubtotal * (scenario.tax / 100) * 100) / 100;
                const expectedTotal = Math.round((expectedSubtotal + expectedTax) * 100) / 100;

                expect(order.discountAmount).toBeCloseTo(expectedDiscount, 2);
                expect(order.subtotal).toBeCloseTo(expectedSubtotal, 2);
                expect(order.taxAmount).toBeCloseTo(expectedTax, 2);
                expect(order.total).toBeCloseTo(expectedTotal, 2);

                // Verify that discount was NOT applied after tax
                const incorrectTotal = Math.round((scenario.price * (1 + scenario.tax / 100) * (1 - scenario.discount / 100)) * 100) / 100;
                expect(order.total).not.toBeCloseTo(incorrectTotal, 1);

                // Clean up cart for next scenario
                await request(app)
                    .delete('/api/cart/clear')
                    .set('Authorization', `Bearer ${userToken}`)
                    .expect(200);
            }
        });
    });
});
