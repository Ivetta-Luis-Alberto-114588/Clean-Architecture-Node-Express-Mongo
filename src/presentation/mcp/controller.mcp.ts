// src/presentation/mcp/controller.mcp.ts
import { Request, Response } from 'express';
import axios from 'axios';
import { CustomError } from '../../domain/errors/custom.error';
import logger from '../../configs/logger';
import { envs } from '../../configs/envs';

export class MCPController {

    constructor() { }

    private handleError = (error: unknown, res: Response) => {
        if (error instanceof CustomError) {
            return res.status(error.statusCode).json({ error: error.message });
        }

        logger.error('Unexpected error in MCPController:', error);
        return res.status(500).json({ error: 'Internal server error' });
    };
    // Endpoint proxy para Anthropic Claude
    public anthropicProxy = async (req: Request, res: Response) => {
        try {
            logger.info('Received request for Anthropic proxy');

            // Verificar que existe la API key
            if (!envs.ANTHROPIC_API_KEY) {
                throw CustomError.internalServerError('Anthropic API key not configured');
            }

            // Obtener el cuerpo de la petición
            const { model, max_tokens, messages, ...otherParams } = req.body;

            // Validar parámetros básicos
            if (!model || !messages) {
                throw CustomError.badRequest('Model and messages are required');
            }

            // Configurar headers para Anthropic
            const headers = {
                'Content-Type': 'application/json',
                'x-api-key': envs.ANTHROPIC_API_KEY,
                'anthropic-version': '2023-06-01'
            };

            // Preparar el cuerpo de la petición para Anthropic
            const anthropicRequestBody = {
                model,
                max_tokens: max_tokens || 1024,
                messages,
                ...otherParams
            };

            logger.info(`Making request to Anthropic API with model: ${model}`);

            // Realizar la petición a la API de Anthropic
            const response = await axios.post(
                'https://api.anthropic.com/v1/messages',
                anthropicRequestBody,
                {
                    headers,
                    timeout: 30000 // 30 segundos timeout
                }
            );

            logger.info('Anthropic API request successful');

            // Devolver la respuesta de Anthropic
            return res.status(200).json(response.data);

        } catch (error) {
            // Manejo específico de errores de Axios/Anthropic
            if (axios.isAxiosError(error)) {
                const status = error.response?.status || 500;
                const message = error.response?.data?.error?.message || 'Error communicating with Anthropic API';

                logger.error(`Anthropic API error (${status}):`, message);

                return res.status(status).json({
                    error: message,
                    details: error.response?.data
                });
            }

            this.handleError(error, res);
        }
    };

    // Endpoint de salud para verificar el servicio
    public health = async (req: Request, res: Response) => {
        try {
            logger.info('Health check requested');

            return res.status(200).json({
                status: 'OK',
                service: 'MCP Service',
                timestamp: new Date().toISOString(),
                anthropic_configured: !!envs.ANTHROPIC_API_KEY
            });

        } catch (error) {
            this.handleError(error, res);
        }
    };
}