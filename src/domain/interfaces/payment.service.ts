// src/domain/interfaces/payment.service.ts

export interface PaymentPreferenceItem {
    id: string;
    title: string;
    description?: string;
    quantity: number;
    unitPrice: number;
    pictureUrl?: string;
    categoryId?: string;
}

export interface PaymentPayer {
    name: string;
    surname: string;
    email: string;
    phone?: {
        areaCode: string;
        number: string;
    };
    identification?: {
        type: string;
        number: string;
    };
    address?: {
        zipCode: string;
        streetName: string;
        streetNumber: number;
    };
}

export interface PaymentPreference {
    items: PaymentPreferenceItem[];
    payer?: PaymentPayer;
    backUrls?: {
        success: string;
        failure: string;
        pending: string;
    };
    autoReturn?: 'approved' | 'all';
    notificationUrl?: string;
    statementDescriptor?: string;
    metadata?: Record<string, any>;
}

export interface PaymentPreferenceResponse {
    id: string;
    initPoint: string;
    sandboxInitPoint?: string;
    items: PaymentPreferenceItem[];
    dateCreated: string;
    externalReference?: string;
    collectorId: number;
}

export interface PaymentInfo {
    id: string;
    status: 'pending' | 'approved' | 'authorized' | 'in_process' | 'in_mediation' | 'rejected' | 'cancelled' | 'refunded' | 'charged_back';
    statusDetail: string;
    operationType: string;
    dateCreated: string;
    dateApproved?: string;
    transactionAmount: number;
    currencyId: string;
    externalReference?: string;
    description?: string;
    payer: {
        id: string;
        email: string;
        identification?: {
            type: string;
            number: string;
        };
    };
    paymentMethodId: string;
    paymentTypeId: string;
    metadata?: Record<string, any>;
}

export interface PaymentSearchFilters {
    externalReference?: string;
    status?: string;
    operationType?: string;
    beginDate?: string;
    endDate?: string;
}

export interface PaymentSearchResult {
    paging: {
        total: number;
        limit: number;
        offset: number;
    };
    results: PaymentInfo[];
}

export interface WebhookNotification {
    id: string;
    type: 'payment' | 'plan' | 'subscription' | 'invoice' | 'point_integration_wh';
    dateCreated: string;
    applicationId: string;
    userId: string;
    version: number;
    apiVersion: string;
    action: string;
    liveMode: boolean;
    data: {
        id: string;
    };
}

export interface PaymentServiceConfig {
    idempotencyKey?: string;
}

export interface IPaymentService {
    createPreference(preference: PaymentPreference, config?: PaymentServiceConfig): Promise<PaymentPreferenceResponse>;
    getPayment(paymentId: string): Promise<PaymentInfo>;
    getPreference(preferenceId: string): Promise<PaymentPreferenceResponse>;
    searchPayments(filters?: PaymentSearchFilters, limit?: number, offset?: number): Promise<PaymentSearchResult>;
    validateWebhook(notification: WebhookNotification): boolean;
    isConfigured(): boolean;
}
