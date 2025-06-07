// tests/domain/entities/payment/payment.entity.test.ts
import { PaymentEntity, PaymentMethod, PaymentProvider } from '../../../../src/domain/entities/payment/payment.entity';
import { MercadoPagoPaymentStatus } from '../../../../src/domain/interfaces/payment/mercado-pago.interface';
import { CustomerEntity } from '../../../../src/domain/entities/customers/customer';
import { SaleEntity } from '../../../../src/domain/entities/sales/sale.entity';
import { NeighborhoodEntity } from '../../../../src/domain/entities/customers/neighborhood';
import { CityEntity } from '../../../../src/domain/entities/customers/citiy';

describe('PaymentEntity', () => {
  // Objetos mock para las pruebas
  const mockCity = new CityEntity(
    "1",
    'Test City',
    'Test City Description',
    true
  );

  const mockNeighborhood = new NeighborhoodEntity(
    "2",
    'Test Neighborhood',
    'Test Neighborhood Description',
    mockCity,
    true
  );

  const mockCustomer = new CustomerEntity(
    "3",
    'John Doe',
    'john.doe@example.com',
    '+123456789',
    'Test Street 123',
    mockNeighborhood,
    true
  );

  const mockSale = new SaleEntity(
    "4",
    mockCustomer,
    [], // items vacíos para la prueba
    100, // subtotal
    21, // taxRate
    21, // taxAmount
    5, // discountRate
    5, // discountAmount
    116, // total
    new Date(), // date
    'pending', // status
    'Test sale notes' // notes
  );

  // Test de creación básica
  test('should create a PaymentEntity instance with all properties', () => {
    // Arrange
    const id = 'payment-123';
    const saleId = 'sale-456';
    const customerId = 'customer-789';
    const amount = 116;
    const provider = PaymentProvider.MERCADO_PAGO;
    const status = MercadoPagoPaymentStatus.PENDING;
    const externalReference = 'ext-ref-123';
    const providerPaymentId = 'prov-pay-456';
    const preferenceId = 'pref-789';
    const paymentMethod = PaymentMethod.CREDIT_CARD;
    const createdAt = new Date('2023-01-01');
    const updatedAt = new Date('2023-01-02');
    const metadata = { key: 'value' };
    const idempotencyKey = 'idem-key-123';

    // Act
    const payment = new PaymentEntity(
      id,
      saleId,
      mockSale,
      customerId,
      mockCustomer,
      amount,
      provider,
      status,
      externalReference,
      providerPaymentId,
      preferenceId,
      paymentMethod,
      createdAt,
      updatedAt,
      metadata,
      idempotencyKey
    );

    // Assert
    expect(payment).toBeInstanceOf(PaymentEntity);
    expect(payment.id).toBe(id);
    expect(payment.saleId).toBe(saleId);
    expect(payment.sale).toBe(mockSale);
    expect(payment.customerId).toBe(customerId);
    expect(payment.customer).toBe(mockCustomer);
    expect(payment.amount).toBe(amount);
    expect(payment.provider).toBe(provider);
    expect(payment.status).toBe(status);
    expect(payment.externalReference).toBe(externalReference);
    expect(payment.providerPaymentId).toBe(providerPaymentId);
    expect(payment.preferenceId).toBe(preferenceId);
    expect(payment.paymentMethod).toBe(paymentMethod);
    expect(payment.createdAt).toBe(createdAt);
    expect(payment.updatedAt).toBe(updatedAt);
    expect(payment.metadata).toBe(metadata);
    expect(payment.idempotencyKey).toBe(idempotencyKey);
  });

  // Test con diferentes estados de pago
  test('should accept different payment statuses', () => {
    // Arrange
    const statuses = Object.values(MercadoPagoPaymentStatus);

    // Act & Assert
    statuses.forEach(status => {
      const payment = new PaymentEntity(
        'test-id',
        'test-sale-id',
        mockSale,
        'test-customer-id',
        mockCustomer,
        100,
        PaymentProvider.MERCADO_PAGO,
        status,
        'test-ext-ref',
        'test-prov-pay-id',
        'test-pref-id',
        PaymentMethod.CREDIT_CARD,
        new Date(),
        new Date()
      );

      expect(payment.status).toBe(status);
    });
  });

  // Test con diferentes métodos de pago
  test('should accept different payment methods', () => {
    // Arrange
    const methods = Object.values(PaymentMethod);

    // Act & Assert
    methods.forEach(method => {
      const payment = new PaymentEntity(
        'test-id',
        'test-sale-id',
        mockSale,
        'test-customer-id',
        mockCustomer,
        100,
        PaymentProvider.MERCADO_PAGO,
        MercadoPagoPaymentStatus.APPROVED,
        'test-ext-ref',
        'test-prov-pay-id',
        'test-pref-id',
        method,
        new Date(),
        new Date()
      );

      expect(payment.paymentMethod).toBe(method);
    });
  });

  // Test con diferentes proveedores de pago
  test('should accept different payment providers', () => {
    // Arrange
    const providers = Object.values(PaymentProvider);

    // Act & Assert
    providers.forEach(provider => {
      const payment = new PaymentEntity(
        'test-id',
        'test-sale-id',
        mockSale,
        'test-customer-id',
        mockCustomer,
        100,
        provider,
        MercadoPagoPaymentStatus.APPROVED,
        'test-ext-ref',
        'test-prov-pay-id',
        'test-pref-id',
        PaymentMethod.CREDIT_CARD,
        new Date(),
        new Date()
      );

      expect(payment.provider).toBe(provider);
    });
  });

  // Test con metadatos opcionales
  test('should handle optional metadata property', () => {
    // Arrange & Act
    const paymentWithoutMetadata = new PaymentEntity(
      'test-id',
      'test-sale-id',
      mockSale,
      'test-customer-id',
      mockCustomer,
      100,
      PaymentProvider.MERCADO_PAGO,
      MercadoPagoPaymentStatus.APPROVED,
      'test-ext-ref',
      'test-prov-pay-id',
      'test-pref-id',
      PaymentMethod.CREDIT_CARD,
      new Date(),
      new Date()
    );

    const complexMetadata = {
      transaction: {
        details: {
          installments: 3,
          installment_amount: 33.33
        }
      },
      customer_info: {
        device_id: 'device-123',
        ip: '192.168.1.1'
      }
    };

    const paymentWithMetadata = new PaymentEntity(
      'test-id',
      'test-sale-id',
      mockSale,
      'test-customer-id',
      mockCustomer,
      100,
      PaymentProvider.MERCADO_PAGO,
      MercadoPagoPaymentStatus.APPROVED,
      'test-ext-ref',
      'test-prov-pay-id',
      'test-pref-id',
      PaymentMethod.CREDIT_CARD,
      new Date(),
      new Date(),
      complexMetadata
    );

    // Assert
    expect(paymentWithoutMetadata.metadata).toBeUndefined();
    expect(paymentWithMetadata.metadata).toBe(complexMetadata);
  });

  // Test con clave de idempotencia opcional
  test('should handle optional idempotencyKey property', () => {
    // Arrange & Act
    const paymentWithoutIdempotencyKey = new PaymentEntity(
      'test-id',
      'test-sale-id',
      mockSale,
      'test-customer-id',
      mockCustomer,
      100,
      PaymentProvider.MERCADO_PAGO,
      MercadoPagoPaymentStatus.APPROVED,
      'test-ext-ref',
      'test-prov-pay-id',
      'test-pref-id',
      PaymentMethod.CREDIT_CARD,
      new Date(),
      new Date()
    );

    const paymentWithIdempotencyKey = new PaymentEntity(
      'test-id',
      'test-sale-id',
      mockSale,
      'test-customer-id',
      mockCustomer,
      100,
      PaymentProvider.MERCADO_PAGO,
      MercadoPagoPaymentStatus.APPROVED,
      'test-ext-ref',
      'test-prov-pay-id',
      'test-pref-id',
      PaymentMethod.CREDIT_CARD,
      new Date(),
      new Date(),
      undefined,
      'test-idem-key'
    );

    // Assert
    expect(paymentWithoutIdempotencyKey.idempotencyKey).toBeUndefined();
    expect(paymentWithIdempotencyKey.idempotencyKey).toBe('test-idem-key');
  });

  // Test con valores extraños para montos (edge cases)
  test('should handle edge cases for amount values', () => {
    // Arrange & Act
    const zeroAmount = new PaymentEntity(
      'test-id',
      'test-sale-id',
      mockSale,
      'test-customer-id',
      mockCustomer,
      0,
      PaymentProvider.MERCADO_PAGO,
      MercadoPagoPaymentStatus.APPROVED,
      'test-ext-ref',
      'test-prov-pay-id',
      'test-pref-id',
      PaymentMethod.CREDIT_CARD,
      new Date(),
      new Date()
    );

    const decimalAmount = new PaymentEntity(
      'test-id',
      'test-sale-id',
      mockSale,
      'test-customer-id',
      mockCustomer,
      99.99,
      PaymentProvider.MERCADO_PAGO,
      MercadoPagoPaymentStatus.APPROVED,
      'test-ext-ref',
      'test-prov-pay-id',
      'test-pref-id',
      PaymentMethod.CREDIT_CARD,
      new Date(),
      new Date()
    );

    const largeAmount = new PaymentEntity(
      'test-id',
      'test-sale-id',
      mockSale,
      'test-customer-id',
      mockCustomer,
      1000000,
      PaymentProvider.MERCADO_PAGO,
      MercadoPagoPaymentStatus.APPROVED,
      'test-ext-ref',
      'test-prov-pay-id',
      'test-pref-id',
      PaymentMethod.CREDIT_CARD,
      new Date(),
      new Date()
    );

    // Assert
    expect(zeroAmount.amount).toBe(0);
    expect(decimalAmount.amount).toBe(99.99);
    expect(largeAmount.amount).toBe(1000000);
  });

  // Test para verificar las relaciones con entidades asociadas
  test('should allow access to associated entities', () => {
    // Arrange & Act
    const payment = new PaymentEntity(
      'test-id',
      'test-sale-id',
      mockSale,
      'test-customer-id',
      mockCustomer,
      100,
      PaymentProvider.MERCADO_PAGO,
      MercadoPagoPaymentStatus.APPROVED,
      'test-ext-ref',
      'test-prov-pay-id',
      'test-pref-id',
      PaymentMethod.CREDIT_CARD,
      new Date(),
      new Date()
    );

    // Assert - Verificamos que podemos navegar por las relaciones
    expect(payment.customer.name).toBe('John Doe');
    expect(payment.customer.email).toBe('john.doe@example.com');
    expect(payment.customer.neighborhood.name).toBe('Test Neighborhood');
    expect(payment.customer.neighborhood.city.name).toBe('Test City');

    expect(payment.sale.total).toBe(116);
    expect(payment.sale.status).toBe('pending');
    expect(payment.sale.customer).toBe(mockCustomer);
  });
});