// tests/integration/order/select-payment-method.integration.test.ts
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { server } from '../../../src/presentation/server';
import { MainRoutes } from '../../../src/presentation/routes';
import { OrderModel } from '../../../src/data/mongodb/models/order/order.model';
import { OrderStatusModel } from '../../../src/data/mongodb/models/order/order-status.model';
import { PaymentMethodModel } from '../../../src/data/mongodb/models/payment/payment-method.model';
import { CustomerModel } from '../../../src/data/mongodb/models/customers/customer.model';
import { UserModel } from '../../../src/data/mongodb/models/user.model';
import { NeighborhoodModel } from '../../../src/data/mongodb/models/customers/neighborhood.model';
import { CityModel } from '../../../src/data/mongodb/models/customers/city.model';
import { JwtAdapter } from '../../../src/configs/jwt';

describe('Order Payment Method Integration Tests', () => {
    let mongoServer: MongoMemoryServer; let testServer: server;
    let app: any;
    let adminToken: string; let testUserId: string;
    let testOrderId: string;
    let testCustomerId: string;
    let testCityId: string;
    let testNeighborhoodId: string;
    let pendingStatusId: string;
    let confirmedStatusId: string;
    let awaitingPaymentStatusId: string;
    let cashPaymentMethodId: string;
    let mercadoPagoPaymentMethodId: string; beforeAll(async () => {
        // Disconnect existing connection if any
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
        }

        // Setup in-memory MongoDB
        mongoServer = await MongoMemoryServer.create();
        const mongoUri = mongoServer.getUri();
        await mongoose.connect(mongoUri);        // Setup server
        testServer = new server({
            p_port: 3001,
            p_routes: MainRoutes.getMainRoutes
        });
        app = testServer.app;

        // Setup test data
        await setupTestData();

        // Generate admin token with valid user ID
        const token = await JwtAdapter.generateToken({ id: testUserId }, '1h');
        if (!token) throw new Error('Failed to generate token');
        adminToken = token;
    });

    afterAll(async () => {
        await mongoose.disconnect();
        await mongoServer.stop();
    });

    afterEach(async () => {
        // Reset order status after each test
        await OrderModel.findByIdAndUpdate(testOrderId, {
            status: pendingStatusId,
            paymentMethod: undefined
        });
    }); const setupTestData = async () => {
        // Create test user first
        const testUser = await UserModel.create({
            name: 'Test Admin',
            email: 'admin@test.com',
            password: 'hashedpassword123',
            roles: ['ADMIN_ROLE'],
            emailValidated: true,
            isActive: true
        });
        testUserId = testUser._id.toString();        // Create test city and neighborhood
        const testCity = await CityModel.create({
            name: 'Ciudad Local',
            description: 'Ciudad Local para pruebas',
            isActive: true
        });
        testCityId = testCity._id.toString(); const testNeighborhood = await NeighborhoodModel.create({
            name: 'Barrio Test',
            description: 'Barrio de pruebas',
            city: testCityId,
            isActive: true
        });
        testNeighborhoodId = testNeighborhood._id.toString();

        // Create order statuses
        const pendingStatus = await OrderStatusModel.create({
            code: 'PENDING',
            name: 'Pending',
            description: 'Order is pending',
            color: '#ffc107',
            order: 1,
            isActive: true,
            isDefault: true,
            allowedTransitions: ['CONFIRMED', 'AWAITING_PAYMENT', 'CANCELLED']
        });
        pendingStatusId = pendingStatus._id.toString();

        const confirmedStatus = await OrderStatusModel.create({
            code: 'CONFIRMED',
            name: 'Confirmed',
            description: 'Order is confirmed',
            color: '#28a745',
            order: 2,
            isActive: true,
            isDefault: false,
            allowedTransitions: ['COMPLETED', 'CANCELLED']
        });
        confirmedStatusId = confirmedStatus._id.toString();

        const awaitingPaymentStatus = await OrderStatusModel.create({
            code: 'AWAITING_PAYMENT',
            name: 'Awaiting Payment',
            description: 'Waiting for payment',
            color: '#fd7e14',
            order: 3,
            isActive: true,
            isDefault: false,
            allowedTransitions: ['CONFIRMED', 'CANCELLED']
        });
        awaitingPaymentStatusId = awaitingPaymentStatus._id.toString();

        // Create payment methods
        const cashPaymentMethod = await PaymentMethodModel.create({
            code: 'CASH',
            name: 'Efectivo',
            description: 'Pago en efectivo',
            isActive: true,
            defaultOrderStatusId: confirmedStatusId,
            requiresOnlinePayment: false,
            allowsManualConfirmation: true
        });
        cashPaymentMethodId = cashPaymentMethod._id.toString();

        const mercadoPagoPaymentMethod = await PaymentMethodModel.create({
            code: 'MERCADO_PAGO',
            name: 'Mercado Pago',
            description: 'Pago online con Mercado Pago',
            isActive: true,
            defaultOrderStatusId: awaitingPaymentStatusId,
            requiresOnlinePayment: true,
            allowsManualConfirmation: false
        });
        mercadoPagoPaymentMethodId = mercadoPagoPaymentMethod._id.toString();        // Create test customer
        const customer = await CustomerModel.create({
            name: 'Test Customer',
            email: 'test@example.com',
            phone: '123456789',
            address: 'Test Address',
            neighborhood: testNeighborhoodId,
            isActive: true
        });
        testCustomerId = customer._id.toString();

        // Create test order
        const order = await OrderModel.create({
            customer: testCustomerId,
            items: [{
                product: new mongoose.Types.ObjectId(), // Mock product ID
                quantity: 2,
                unitPrice: 500,
                subtotal: 1000
            }],
            subtotal: 1000,
            taxAmount: 0,
            discountRate: 0,
            discountAmount: 0, total: 1000,
            status: pendingStatusId,
            shippingDetails: {
                recipientName: 'Test Recipient',
                phone: '123456789',
                streetAddress: 'Test Street',
                neighborhoodName: 'Ciudad Local',
                cityName: 'Ciudad Local',
                originalNeighborhoodId: testNeighborhoodId,
                originalCityId: testCityId
            }
        });
        testOrderId = order._id.toString();
    }; describe('PATCH /api/sales/:orderId/payment-method', () => {
        it('should successfully select CASH payment method', async () => {
            const response = await request(app)
                .patch(`/api/sales/${testOrderId}/payment-method`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    paymentMethodCode: 'CASH',
                    notes: 'Test cash payment selection'
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toContain('exitosamente');
            expect(response.body.data).toBeDefined();
            expect(response.body.data.paymentMethod).toBeDefined();
            expect(response.body.data.paymentMethod.code).toBe('CASH');
            expect(response.body.data.status.code).toBe('CONFIRMED');

            // Verify in database
            const updatedOrder = await OrderModel.findById(testOrderId);
            expect(updatedOrder?.paymentMethod?.toString()).toBe(cashPaymentMethodId);
            expect(updatedOrder?.status?.toString()).toBe(confirmedStatusId);
        }); it('should successfully select MERCADO_PAGO payment method', async () => {
            const response = await request(app)
                .patch(`/api/sales/${testOrderId}/payment-method`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    paymentMethodCode: 'MERCADO_PAGO'
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.paymentMethod.code).toBe('MERCADO_PAGO');
            expect(response.body.data.status.code).toBe('AWAITING_PAYMENT');

            // Verify in database
            const updatedOrder = await OrderModel.findById(testOrderId);
            expect(updatedOrder?.paymentMethod?.toString()).toBe(mercadoPagoPaymentMethodId);
            expect(updatedOrder?.status?.toString()).toBe(awaitingPaymentStatusId);
        }); it('should return 400 for invalid order ID', async () => {
            const response = await request(app)
                .patch('/api/sales/invalid-id/payment-method')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    paymentMethodCode: 'CASH'
                })
                .expect(400);

            expect(response.body.error).toContain('ID de orden inválido');
        }); it('should return 400 for missing payment method code', async () => {
            const response = await request(app)
                .patch(`/api/sales/${testOrderId}/payment-method`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({})
                .expect(400);

            expect(response.body.error).toContain('paymentMethodCode');
        }); it('should return 404 for non-existent order', async () => {
            const nonExistentId = new mongoose.Types.ObjectId().toString();

            const response = await request(app)
                .patch(`/api/sales/${nonExistentId}/payment-method`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    paymentMethodCode: 'CASH'
                })
                .expect(404);

            expect(response.body.error).toContain('no encontrada');
        }); it('should return 400 for invalid payment method code', async () => {
            const response = await request(app)
                .patch(`/api/sales/${testOrderId}/payment-method`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    paymentMethodCode: 'INVALID_METHOD'
                })
                .expect(400);

            expect(response.body.error).toContain('paymentMethodCode debe ser uno de');
        }); it('should return 401 without authentication', async () => {
            await request(app)
                .patch(`/api/sales/${testOrderId}/payment-method`)
                .send({
                    paymentMethodCode: 'CASH'
                })
                .expect(401);
        });

        it('should create order with high amount and reject CASH payment', async () => {
            // Create order with high amount (exceeds cash limit)
            const highAmountOrder = await OrderModel.create({
                customer: testCustomerId,
                items: [{
                    product: new mongoose.Types.ObjectId(),
                    quantity: 1,
                    unitPrice: 10000,
                    subtotal: 10000
                }],
                subtotal: 10000,
                taxAmount: 0,
                discountRate: 0,
                discountAmount: 0,
                total: 10000,
                status: pendingStatusId, shippingDetails: {
                    recipientName: 'Test Recipient',
                    phone: '123456789',
                    streetAddress: 'Test Street',
                    neighborhoodName: 'Other City', // Not local
                    cityName: 'Other City',
                    originalNeighborhoodId: testNeighborhoodId,
                    originalCityId: testCityId
                }
            }); const response = await request(app)
                .patch(`/api/sales/${highAmountOrder._id}/payment-method`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    paymentMethodCode: 'CASH'
                })
                .expect(400);

            expect(response.body.error).toContain('no es elegible para pago en efectivo');

            // Cleanup
            await OrderModel.findByIdAndDelete(highAmountOrder._id);
        });

        it('should reject MERCADO_PAGO for low amounts', async () => {
            // Create order with low amount
            const lowAmountOrder = await OrderModel.create({
                customer: testCustomerId,
                items: [{
                    product: new mongoose.Types.ObjectId(),
                    quantity: 1,
                    unitPrice: 50,
                    subtotal: 50
                }],
                subtotal: 50,
                taxAmount: 0,
                discountRate: 0,
                discountAmount: 0,
                total: 50,
                status: pendingStatusId, shippingDetails: {
                    recipientName: 'Test Recipient',
                    phone: '123456789',
                    streetAddress: 'Test Street',
                    neighborhoodName: 'Ciudad Local',
                    cityName: 'Ciudad Local',
                    originalNeighborhoodId: testNeighborhoodId,
                    originalCityId: testCityId
                }
            }); const response = await request(app)
                .patch(`/api/sales/${lowAmountOrder._id}/payment-method`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    paymentMethodCode: 'MERCADO_PAGO'
                })
                .expect(400);

            expect(response.body.error).toContain('monto mínimo para Mercado Pago');

            // Cleanup
            await OrderModel.findByIdAndDelete(lowAmountOrder._id);
        });
    });
});
