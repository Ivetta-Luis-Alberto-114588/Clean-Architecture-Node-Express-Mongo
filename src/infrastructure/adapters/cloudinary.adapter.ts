import { v2 as cloudinary } from 'cloudinary';
import { envs } from '../../configs/envs';
import { CustomError } from '../../domain/errors/custom.error';

export class CloudinaryAdapter {
    private static instance: CloudinaryAdapter;

    private constructor() {
        // Configuración de Cloudinary
        cloudinary.config({
            cloud_name: envs.CLOUDINARY_CLOUD_NAME,
            api_key: envs.CLOUDINARY_API_KEY,
            api_secret: envs.CLOUDINARY_API_SECRET
        });
    }

    public static getInstance(): CloudinaryAdapter {
        if (!CloudinaryAdapter.instance) {
            CloudinaryAdapter.instance = new CloudinaryAdapter();
        }
        return CloudinaryAdapter.instance;
    }

    async uploadImage(filePath: string, folder = 'products'): Promise<string> {
        try {
            const result = await cloudinary.uploader.upload(filePath, {
                folder: folder
            });
            return result.secure_url;
        } catch (error) {
            console.error('Error al subir imagen a Cloudinary:', error);
            throw CustomError.internalServerError('Error al subir la imagen');
        }
    }

    async deleteImage(publicId: string): Promise<void> {
        try {
            await cloudinary.uploader.destroy(publicId);
        } catch (error) {
            console.error('Error al eliminar imagen de Cloudinary:', error);
        }
    }

    // Extraer el public_id de una URL de Cloudinary
    getPublicIdFromUrl(url: string): string | null {
        if (!url) return null;

        try {
            // Las URLs de Cloudinary suelen tener este formato:
            // https://res.cloudinary.com/tu-cloud-name/image/upload/v1234567890/folder/public_id.jpg

            // Extraer la parte después de /upload/
            const uploadPartMatch = url.match(/\/upload\/(?:v\d+\/)?(.+)$/);
            if (!uploadPartMatch || !uploadPartMatch[1]) return null;

            // Obtener la parte sin la extensión
            const filenameWithExt = uploadPartMatch[1];
            const publicId = filenameWithExt.replace(/\.[^/.]+$/, ""); // Quitar extensión

            return publicId;
        } catch (error) {
            console.error("Error extrayendo publicId:", error);
            return null;
        }
    }
}