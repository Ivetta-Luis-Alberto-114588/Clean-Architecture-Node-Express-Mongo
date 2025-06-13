// src/configs/file-storage.ts
import { CloudinaryFileStorageAdapter } from "../infrastructure/adapters/cloudinary-file-storage.adapter";
import { loggerService } from "./logger";

/**
 * Configuración centralizada del servicio de almacenamiento de archivos.
 * Usa la abstracción IFileStorageService con la implementación de Cloudinary.
 */
export const fileStorageService = new CloudinaryFileStorageAdapter(loggerService);
