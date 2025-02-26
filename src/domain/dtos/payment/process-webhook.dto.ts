export class ProcessWebhookDto {
    private constructor(
      public type: string,
      public action: string,
      public data: {
        id: string;
      }
    ) {}
  
    static create(object: { [key: string]: any }): [string?, ProcessWebhookDto?] {
      const { type, action, data } = object;
  
      // Validaciones
      if (!type) return ['type es requerido', undefined];
      if (!action) return ['action es requerido', undefined];
      if (!data) return ['data es requerido', undefined];
      if (!data.id) return ['data.id es requerido', undefined];
  
      return [
        undefined,
        new ProcessWebhookDto(
          type,
          action,
          data
        )
      ];
    }
  }