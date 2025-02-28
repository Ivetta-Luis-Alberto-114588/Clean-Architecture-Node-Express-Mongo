export class VerifyPaymentDto {
    private constructor(
      public paymentId: string,
      public providerPaymentId: string
    ) {}
  
    static create(object: { [key: string]: any }): [string?, VerifyPaymentDto?] {
      const { paymentId, providerPaymentId } = object;
    
      // Validaciones
      if (!paymentId) return ['paymentId es requerido', undefined];
      if (!providerPaymentId) return ['providerPaymentId es requerido', undefined];
    
      return [
        undefined,
        new VerifyPaymentDto(
          paymentId,
          providerPaymentId
        )
      ];
    }
  }