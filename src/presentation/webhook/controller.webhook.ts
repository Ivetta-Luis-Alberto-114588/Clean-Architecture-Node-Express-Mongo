import { Request, Response } from 'express';
import { WebhookLogModel } from '../../data/mongodb/models/webhook/webhook-log.model';
import { PaginationDto } from '../../domain/dtos/shared/pagination.dto';
import { CustomError } from '../../domain/errors/custom.error';

export class WebhookController {

  private handleError = (error: unknown, res: Response) => {
    if (error instanceof CustomError) {
      return res.status(error.statusCode).json({ error: error.message });
    }

    console.error("Error en WebhookController:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  };

  getAllWebhooks = async (req: Request, res: Response): Promise<void> => {
    try {
      const { page = 1, limit = 10, source, eventType, processed } = req.query;

      const [error, paginationDto] = PaginationDto.create(Number(page), Number(limit));
      if (error) {
        res.status(400).json({ error });
        return;
      }

      const filters: any = {};
      if (source) filters.source = source;
      if (eventType) filters.eventType = eventType;
      if (processed !== undefined) filters.processed = processed === 'true';      const total = await WebhookLogModel.countDocuments(filters);
      const skip = (paginationDto!.page - 1) * paginationDto!.limit;
      const webhooks = await WebhookLogModel
        .find(filters)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(paginationDto!.limit)
        .lean();

      res.json({
        total,
        webhooks,
        pagination: {
          page: paginationDto!.page,
          limit: paginationDto!.limit,
          totalPages: Math.ceil(total / paginationDto!.limit)
        }
      });

    } catch (error) {
      this.handleError(error, res);
    }
  };

  getWebhookById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const webhook = await WebhookLogModel.findById(id);
      if (!webhook) {
        res.status(404).json({ error: 'Webhook no encontrado' });
        return;
      }

      res.json({ webhook });

    } catch (error) {
      this.handleError(error, res);
    }
  };

  getWebhookStats = async (req: Request, res: Response): Promise<void> => {
    try {
      const stats = await WebhookLogModel.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            processed: { $sum: { $cond: ['$processed', 1, 0] } },
            successful: { 
              $sum: { 
                $cond: [
                  { $and: ['$processed', '$processingResult.success'] }, 
                  1, 
                  0
                ] 
              } 
            }
          }
        },
        {
          $project: {
            _id: 0,
            total: 1,
            processed: 1,
            successful: 1,
            pending: { $subtract: ['$total', '$processed'] },
            failed: { $subtract: ['$processed', '$successful'] }
          }
        }
      ]);

      const bySource = await WebhookLogModel.aggregate([
        {
          $group: {
            _id: '$source',
            count: { $sum: 1 },
            processed: { $sum: { $cond: ['$processed', 1, 0] } }
          }
        }
      ]);

      const byEventType = await WebhookLogModel.aggregate([
        {
          $group: {
            _id: '$eventType',
            count: { $sum: 1 },
            processed: { $sum: { $cond: ['$processed', 1, 0] } }
          }
        }
      ]);

      res.json({
        general: stats[0] || { total: 0, processed: 0, successful: 0, pending: 0, failed: 0 },
        bySource,
        byEventType
      });

    } catch (error) {
      this.handleError(error, res);
    }
  };
}
