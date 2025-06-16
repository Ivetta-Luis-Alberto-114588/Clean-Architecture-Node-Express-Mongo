// tests/unit/infrastructure/adapters/cloudinary.adapter.test.ts
import { CloudinaryAdapter } from '../../../../src/infrastructure/adapters/cloudinary.adapter';
import { CustomError } from '../../../../src/domain/errors/custom.error';
import { v2 as cloudinary } from 'cloudinary';

// Mock de cloudinary
jest.mock('cloudinary', () => ({
    v2: {
        config: jest.fn(),
        uploader: {
            upload: jest.fn(),
            destroy: jest.fn()
        }
    }
}));

// Type cast para el mock
const mockUploader = cloudinary.uploader as jest.Mocked<typeof cloudinary.uploader>;

// Mock de las variables de entorno
jest.mock('../../../../src/configs/envs', () => ({
    envs: {
        CLOUDINARY_CLOUD_NAME: 'test-cloud',
        CLOUDINARY_API_KEY: 'test-key',
        CLOUDINARY_API_SECRET: 'test-secret'
    }
}));

// Mock de console.error para evitar logs en tests
const originalConsoleError = console.error;
beforeAll(() => {
    console.error = jest.fn();
});

afterAll(() => {
    console.error = originalConsoleError;
});

describe('CloudinaryAdapter', () => {
    let cloudinaryAdapter: CloudinaryAdapter;

    beforeEach(() => {
        cloudinaryAdapter = CloudinaryAdapter.getInstance();
        mockUploader.upload.mockClear();
        mockUploader.destroy.mockClear();
        (console.error as jest.Mock).mockClear();
    });

    describe('getInstance', () => {
        it('should return the same instance (singleton)', () => {
            const instance1 = CloudinaryAdapter.getInstance();
            const instance2 = CloudinaryAdapter.getInstance();
            
            expect(instance1).toBe(instance2);
        });
    });

    describe('uploadImage', () => {        it('should upload image successfully with default folder', async () => {
            const mockResult = {
                secure_url: 'https://res.cloudinary.com/test-cloud/image/upload/v1234/products/test-image.jpg',
                public_id: 'products/test-image',
                version: 1234567890,
                signature: 'abc123',
                width: 800,
                height: 600,
                format: 'jpg',
                resource_type: 'image',
                created_at: '2023-01-01T00:00:00Z',
                tags: [],
                bytes: 12345,
                type: 'upload',
                etag: 'abc123def456',
                placeholder: false,
                url: 'http://res.cloudinary.com/test-cloud/image/upload/v1234/products/test-image.jpg',
                folder: 'products',
                original_filename: 'test-image',
                api_key: 'test-key'
            };
            mockUploader.upload.mockResolvedValue(mockResult as any);

            const result = await cloudinaryAdapter.uploadImage('/path/to/image.jpg');

            expect(mockUploader.upload).toHaveBeenCalledWith('/path/to/image.jpg', {
                folder: 'products'
            });
            expect(result).toBe(mockResult.secure_url);
        });        it('should upload image successfully with custom folder', async () => {
            const mockResult = {
                secure_url: 'https://res.cloudinary.com/test-cloud/image/upload/v1234/avatars/user-avatar.jpg',
                public_id: 'avatars/user-avatar',
                version: 1234567890,
                signature: 'def456',
                width: 400,
                height: 400,
                format: 'jpg',
                resource_type: 'image',
                created_at: '2023-01-01T00:00:00Z',
                tags: [],
                bytes: 8192,
                type: 'upload',
                etag: 'def456ghi789',
                placeholder: false,
                url: 'http://res.cloudinary.com/test-cloud/image/upload/v1234/avatars/user-avatar.jpg',
                folder: 'avatars',
                original_filename: 'user-avatar',
                api_key: 'test-key'
            };
            mockUploader.upload.mockResolvedValue(mockResult as any);

            const result = await cloudinaryAdapter.uploadImage('/path/to/avatar.jpg', 'avatars');

            expect(mockUploader.upload).toHaveBeenCalledWith('/path/to/avatar.jpg', {
                folder: 'avatars'
            });
            expect(result).toBe(mockResult.secure_url);
        });

        it('should throw CustomError when upload fails', async () => {
            const uploadError = new Error('Upload failed');
            mockUploader.upload.mockRejectedValue(uploadError);

            await expect(cloudinaryAdapter.uploadImage('/path/to/image.jpg'))
                .rejects.toThrow(CustomError);

            expect(console.error).toHaveBeenCalledWith('Error al subir imagen a Cloudinary:', uploadError);
        });
    });

    describe('deleteImage', () => {
        it('should delete image successfully', async () => {
            mockUploader.destroy.mockResolvedValue({ result: 'ok' });

            await expect(cloudinaryAdapter.deleteImage('test-public-id'))
                .resolves.toBeUndefined();

            expect(mockUploader.destroy).toHaveBeenCalledWith('test-public-id');
        });

        it('should handle delete errors gracefully', async () => {
            const deleteError = new Error('Delete failed');
            mockUploader.destroy.mockRejectedValue(deleteError);

            await expect(cloudinaryAdapter.deleteImage('test-public-id'))
                .resolves.toBeUndefined();

            expect(console.error).toHaveBeenCalledWith('Error al eliminar imagen de Cloudinary:', deleteError);
        });
    });

    describe('getPublicIdFromUrl', () => {
        it('should extract public ID from standard Cloudinary URL', () => {
            const url = 'https://res.cloudinary.com/test-cloud/image/upload/v1234567890/products/test-image.jpg';
            const result = cloudinaryAdapter.getPublicIdFromUrl(url);
            
            expect(result).toBe('products/test-image');
        });

        it('should extract public ID from URL without version', () => {
            const url = 'https://res.cloudinary.com/test-cloud/image/upload/products/test-image.jpg';
            const result = cloudinaryAdapter.getPublicIdFromUrl(url);
            
            expect(result).toBe('products/test-image');
        });

        it('should extract public ID from URL with nested folders', () => {
            const url = 'https://res.cloudinary.com/test-cloud/image/upload/v1234567890/products/category/subcategory/test-image.png';
            const result = cloudinaryAdapter.getPublicIdFromUrl(url);
            
            expect(result).toBe('products/category/subcategory/test-image');
        });

        it('should return null for empty URL', () => {
            const result = cloudinaryAdapter.getPublicIdFromUrl('');
            expect(result).toBeNull();
        });

        it('should return null for null URL', () => {
            const result = cloudinaryAdapter.getPublicIdFromUrl(null as any);
            expect(result).toBeNull();
        });

        it('should return null for invalid URL format', () => {
            const url = 'https://example.com/invalid-url.jpg';
            const result = cloudinaryAdapter.getPublicIdFromUrl(url);
            
            expect(result).toBeNull();
        });

        it('should handle URLs with different file extensions', () => {
            const urls = [
                'https://res.cloudinary.com/test-cloud/image/upload/v1234567890/products/image.webp',
                'https://res.cloudinary.com/test-cloud/image/upload/v1234567890/products/image.gif',
                'https://res.cloudinary.com/test-cloud/image/upload/v1234567890/products/image.svg'
            ];

            urls.forEach(url => {
                const result = cloudinaryAdapter.getPublicIdFromUrl(url);
                expect(result).toBe('products/image');
            });
        });

        it('should handle error when extracting public ID', () => {
            // Simular un error en el proceso de extracción
            const originalConsoleError = console.error;
            console.error = jest.fn();

            // URL malformada que podría causar un error en el regex
            const malformedUrl = 'https://res.cloudinary.com/test-cloud/image/upload/';
            const result = cloudinaryAdapter.getPublicIdFromUrl(malformedUrl);

            expect(result).toBeNull();
            
            console.error = originalConsoleError;
        });

        it('should handle URL with query parameters', () => {
            const url = 'https://res.cloudinary.com/test-cloud/image/upload/v1234567890/products/test-image.jpg?_a=BAAAV6Bs2';
            const result = cloudinaryAdapter.getPublicIdFromUrl(url);
            
            expect(result).toBe('products/test-image');
        });        it('should handle URL with transformations', () => {
            const url = 'https://res.cloudinary.com/test-cloud/image/upload/c_scale,w_500/v1234567890/products/test-image.jpg';
            const result = cloudinaryAdapter.getPublicIdFromUrl(url);
            
            expect(result).toBe('c_scale,w_500/v1234567890/products/test-image');
        });
    });
});
