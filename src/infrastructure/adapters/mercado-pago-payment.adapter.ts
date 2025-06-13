// src/infrastructure/adapters/mercado-pago-payment.adapter.ts

import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import {
    IPaymentService,
    PaymentPreference,
    PaymentPreferenceResponse,
    PaymentInfo,
    PaymentSearchFilters,
    PaymentSearchResult,
    WebhookNotification,
    PaymentServiceConfig
} from '../../domain/interfaces/payment.service';
import {
    MercadoPagoPreferenceRequest,
    MercadoPagoPreferenceResponse,
    MercadoPagoPayment,
    MercadoPagoWebhookNotification
} from '../../domain/interfaces/payment/mercado-pago.interface';
import { ILogger } from '../../domain/interfaces/logger.interface';
import { CustomError } from '../../domain/errors/custom.error';

export interface MercadoPagoPaymentAdapterConfig {
    accessToken: string;
    baseUrl?: string;
}

export class MercadoPagoPaymentAdapter implements IPaymentService {
    private readonly baseUrl: string;

    constructor(
        private readonly config: MercadoPagoPaymentAdapterConfig,
        private readonly logger: ILogger
    ) {
        this.baseUrl = this.config.baseUrl || 'https://api.mercadopago.com';
    }

    async createPreference(preference: PaymentPreference, config?: PaymentServiceConfig): Promise<PaymentPreferenceResponse> {
        if (!this.isConfigured()) {
            throw CustomError.badRequest('Mercado Pago service is not properly configured');
        }

        try {
            const headers: Record<string, string> = {
                'Authorization': `Bearer ${this.config.accessToken}`,
                'Content-Type': 'application/json',
            };

            if (config?.idempotencyKey) {
                headers['X-Idempotency-Key'] = config.idempotencyKey;
            }

            // Convertir de nuestro formato a formato de Mercado Pago
            const mpPreference: MercadoPagoPreferenceRequest = this.convertToMercadoPagoPreference(preference);

            this.logger.info('Creating payment preference in Mercado Pago');

            const response = await axios.post(`${this.baseUrl}/checkout/preferences`, mpPreference, { headers });

            this.logger.info(`Payment preference created successfully with ID: ${response.data.id}`);

            return this.convertFromMercadoPagoPreference(response.data);

        } catch (error) {
            this.logger.error('Error creating payment preference in Mercado Pago:', error);
            throw CustomError.internalServerError(
                `Error creating payment preference: ${this.parseError(error)}`
            );
        }
    }

    async getPayment(paymentId: string): Promise<PaymentInfo> {
        if (!this.isConfigured()) {
            throw CustomError.badRequest('Mercado Pago service is not properly configured');
        }

        try {
            const response = await axios.get(
                `${this.baseUrl}/v1/payments/${paymentId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${this.config.accessToken}`
                    }
                }
            );

            this.logger.info(`Payment info retrieved successfully for ID: ${paymentId}`);

            return this.convertFromMercadoPagoPayment(response.data);

        } catch (error) {
            this.logger.error(`Error getting payment ${paymentId} from Mercado Pago:`, error);
            throw CustomError.internalServerError(
                `Error getting payment: ${this.parseError(error)}`
            );
        }
    }

    async getPreference(preferenceId: string): Promise<PaymentPreferenceResponse> {
        if (!this.isConfigured()) {
            throw CustomError.badRequest('Mercado Pago service is not properly configured');
        }

        try {
            const response = await axios.get(
                `${this.baseUrl}/checkout/preferences/${preferenceId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${this.config.accessToken}`
                    }
                }
            );

            this.logger.info(`Preference info retrieved successfully for ID: ${preferenceId}`);

            return this.convertFromMercadoPagoPreference(response.data);

        } catch (error) {
            this.logger.error(`Error getting preference ${preferenceId} from Mercado Pago:`, error);
            throw CustomError.internalServerError(
                `Error getting preference: ${this.parseError(error)}`
            );
        }
    }

    async searchPayments(filters?: PaymentSearchFilters, limit = 50, offset = 0): Promise<PaymentSearchResult> {
        if (!this.isConfigured()) {
            throw CustomError.badRequest('Mercado Pago service is not properly configured');
        }

        try {
            const params: Record<string, any> = {
                limit,
                offset
            };

            if (filters) {
                if (filters.externalReference) params.external_reference = filters.externalReference;
                if (filters.status) params.status = filters.status;
                if (filters.operationType) params.operation_type = filters.operationType;
                if (filters.beginDate) params.begin_date = filters.beginDate;
                if (filters.endDate) params.end_date = filters.endDate;
            }

            const response = await axios.get(
                `${this.baseUrl}/v1/payments/search`,
                {
                    headers: {
                        'Authorization': `Bearer ${this.config.accessToken}`
                    },
                    params
                }
            );

            this.logger.info(`Payment search completed successfully. Found ${response.data.paging.total} results`);

            return {
                paging: response.data.paging,
                results: response.data.results.map((payment: MercadoPagoPayment) =>
                    this.convertFromMercadoPagoPayment(payment)
                )
            };

        } catch (error) {
            this.logger.error('Error searching payments in Mercado Pago:', error);
            throw CustomError.internalServerError(
                `Error searching payments: ${this.parseError(error)}`
            );
        }
    }

    validateWebhook(notification: WebhookNotification): boolean {
        // Implementar validación según documentación de MP
        this.logger.info(`Validating webhook notification: ${notification.id}`);
        return true;
    }

    isConfigured(): boolean {
        return !!this.config.accessToken;
    }

    // Métodos privados para conversión de formatos

    private convertToMercadoPagoPreference(preference: PaymentPreference): MercadoPagoPreferenceRequest {
        return {
            items: preference.items.map(item => ({
                id: item.id,
                title: item.title,
                description: item.description || '',
                picture_url: item.pictureUrl,
                category_id: item.categoryId,
                quantity: item.quantity,
                unit_price: item.unitPrice,
                currency_id: 'ARS'
            })),
            payer: preference.payer ? {
                name: preference.payer.name,
                surname: preference.payer.surname,
                email: preference.payer.email,
                phone: preference.payer.phone ? {
                    area_code: preference.payer.phone.areaCode,
                    number: preference.payer.phone.number
                } : undefined,
                identification: preference.payer.identification ? {
                    type: preference.payer.identification.type,
                    number: preference.payer.identification.number
                } : undefined,
                address: preference.payer.address ? {
                    zip_code: preference.payer.address.zipCode,
                    street_name: preference.payer.address.streetName,
                    street_number: preference.payer.address.streetNumber
                } : undefined
            } : undefined,
            back_urls: preference.backUrls,
            auto_return: preference.autoReturn,
            notification_url: preference.notificationUrl,
            statement_descriptor: preference.statementDescriptor,
            metadata: preference.metadata || { uuid: uuidv4() }
        };
    }

    private convertFromMercadoPagoPreference(mpPreference: MercadoPagoPreferenceResponse): PaymentPreferenceResponse {
        return {
            id: mpPreference.id,
            initPoint: mpPreference.init_point,
            sandboxInitPoint: mpPreference.sandbox_init_point,
            items: mpPreference.items.map(item => ({
                id: item.id,
                title: item.title,
                description: item.description,
                quantity: item.quantity,
                unitPrice: item.unit_price,
                pictureUrl: item.picture_url,
                categoryId: item.category_id
            })),
            dateCreated: mpPreference.date_created,
            externalReference: mpPreference.external_reference,
            collectorId: mpPreference.collector_id
        };
    }

    private convertFromMercadoPagoPayment(mpPayment: MercadoPagoPayment): PaymentInfo {
        return {
            id: mpPayment.id.toString(),
            status: mpPayment.status,
            statusDetail: mpPayment.status_detail,
            operationType: mpPayment.operation_type,
            dateCreated: mpPayment.date_created,
            dateApproved: mpPayment.date_approved,
            transactionAmount: mpPayment.transaction_amount,
            currencyId: mpPayment.currency_id,
            externalReference: mpPayment.external_reference,
            description: mpPayment.description, payer: {
                id: mpPayment.payer.id || 'unknown',
                email: mpPayment.payer.email,
                identification: mpPayment.payer.identification ? {
                    type: mpPayment.payer.identification.type,
                    number: mpPayment.payer.identification.number
                } : undefined
            },
            paymentMethodId: mpPayment.payment_method_id,
            paymentTypeId: mpPayment.payment_type_id,
            metadata: mpPayment.metadata
        };
    }

    private parseError(error: any): string {
        if (axios.isAxiosError(error) && error.response) {
            return JSON.stringify(error.response.data);
        }
        return error.message || 'Unknown error';
    }
}
