export interface IUpdateOrderDto {
  items?: Array<{
    productId: string;
    quantity: number;
    unitPrice: number;
  }>;
  shippingDetails?: Partial<{
    recipientName: string;
    phone: string;
    streetAddress: string;
    postalCode: string;
    neighborhoodId: string;
    cityId: string;
    additionalInfo: string;
  }>;
  notes?: string;
  couponCode?: string | null;
}

export class UpdateOrderDto {
  constructor(public readonly data: IUpdateOrderDto) {}

  static create(input: any): [string | null, UpdateOrderDto | null] {
    // TODO: validar estructura y tipos
    return [null, new UpdateOrderDto({
      items: input.items,
      shippingDetails: input.shippingDetails,
      notes: input.notes,
      couponCode: input.couponCode ?? null
    })];
  }
}
