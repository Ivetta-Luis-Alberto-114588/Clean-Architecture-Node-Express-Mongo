// src/presentation/middlewares/upload.middleware.ts
import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { CustomError } from '../../domain/errors/custom.error';

// ... (configuración de storage y fileFilter sin cambios) ...
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadsDir = path.join(__dirname, '../../../uploads');
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, `${uniqueSuffix}${ext}`);
    }
});

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        // Rechazar archivo con un error específico que Multer puede manejar
        cb(new Error('Formato de archivo no soportado. Solo se permiten imágenes (JPEG, PNG, GIF, WEBP)'));
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});
// --- FIN Configuración Multer ---


export class UploadMiddleware {

    // Middleware que REQUIERE un archivo
    static singleRequired(fieldName: string) {
        return (req: Request, res: Response, next: NextFunction) => {
            // Usar el manejador de errores de Multer
            upload.single(fieldName)(req, res, (err: any) => {
                if (err instanceof multer.MulterError) {
                    // Error de Multer (ej: tamaño excedido)
                    return next(CustomError.badRequest(`Error de Multer: ${err.message}`));
                } else if (err) {
                    // Otro error (ej: tipo de archivo inválido del fileFilter)
                    return next(CustomError.badRequest(err.message));
                }

                // Verificar si el archivo es obligatorio y no se proporcionó
                if (!(req as any).file) {
                    return next(CustomError.badRequest(`El campo de imagen '${fieldName}' es obligatorio.`));
                }
                next(); // Todo bien
            });
        };
    }

    // --- NUEVO: Middleware que hace el archivo OPCIONAL ---
    static singleOptional(fieldName: string) {
        return (req: Request, res: Response, next: NextFunction) => {
            // Usar el manejador de errores de Multer
            upload.single(fieldName)(req, res, (err: any) => {
                if (err instanceof multer.MulterError) {
                    return next(CustomError.badRequest(`Error de Multer: ${err.message}`));
                } else if (err) {
                    return next(CustomError.badRequest(err.message));
                }
                // Si no hay error, simplemente continuamos, haya o no archivo
                next();
            });
        };
    }
    // --- FIN NUEVO MÉTODO ---
}