// src/infrastructure/adapters/cloudinary-file-storage.adapter.ts

import { v2 as cloudinary } from 'cloudinary';
import { envs } from '../../configs/envs';
import { CustomError } from '../../domain/errors/custom.error';
import { IFileStorageService, FileUploadResult } from '../../domain/interfaces/file-storage.interface';
import { ILogger } from '../../domain/interfaces/logger.interface';

export class CloudinaryFileStorageAdapter implements IFileStorageService {
  
  constructor(private readonly logger: ILogger) {
    // Configuración de Cloudinary
    cloudinary.config({
      cloud_name: envs.CLOUDINARY_CLOUD_NAME,
      api_key: envs.CLOUDINARY_API_KEY,
      api_secret: envs.CLOUDINARY_API_SECRET
    });
  }

  async uploadFile(filePath: string, folder = 'products'): Promise<FileUploadResult> {
    try {
      this.logger.debug('Uploading file to Cloudinary', { filePath, folder });
      
      const result = await cloudinary.uploader.upload(filePath, {
        folder: folder
      });

      this.logger.info('File uploaded successfully to Cloudinary', { 
        publicId: result.public_id, 
        url: result.secure_url 
      });

      return {
        url: result.secure_url,
        publicId: result.public_id
      };
    } catch (error) {
      this.logger.error('Error uploading file to Cloudinary:', { error, filePath, folder });
      throw CustomError.internalServerError('Error al subir la imagen');
    }
  }

  async deleteFile(publicId: string): Promise<void> {
    try {
      this.logger.debug('Deleting file from Cloudinary', { publicId });
      
      const result = await cloudinary.uploader.destroy(publicId);
      
      this.logger.info('File deleted from Cloudinary', { publicId, result });
    } catch (error) {
      this.logger.error('Error deleting file from Cloudinary:', { error, publicId });
      // No lanzamos error para no afectar el flujo principal
    }
  }

  getPublicIdFromUrl(url: string): string | null {
    try {
      // Buscar el patrón típico de Cloudinary: /v{version}/{folder}/{publicId}.{extension}
      const match = url.match(/\/v\d+\/(.+)\.\w+$/);
      if (match) {
        // El public_id incluye las carpetas si las hay
        return match[1];
      }
      
      this.logger.warn('Could not extract public ID from Cloudinary URL', { url });
      return null;
    } catch (error) {
      this.logger.error('Error extracting public ID from URL:', { error, url });
      return null;
    }
  }
}

// Instancia singleton para uso directo
import { loggerAdapter } from './winston-logger.adapter';
export const fileStorageAdapter = new CloudinaryFileStorageAdapter(loggerAdapter);
