import { CloudinaryFileStorageAdapter } from '../../../../src/infrastructure/adapters/cloudinary-file-storage.adapter';
import { ILogger } from '../../../../src/domain/interfaces/logger.interface';
import { CustomError } from '../../../../src/domain/errors/custom.error';

describe('CloudinaryFileStorageAdapter', () => {
    let logger: jest.Mocked<ILogger>;
    let adapter: CloudinaryFileStorageAdapter;

    beforeEach(() => {
        logger = {
            debug: jest.fn(),
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
        } as any;
        adapter = new CloudinaryFileStorageAdapter(logger);
    });

    describe('uploadFile', () => {
        it('should upload file and return url and publicId', async () => {
            const mockResult = { secure_url: 'url', public_id: 'pid' };
            jest.spyOn(require('cloudinary').v2.uploader, 'upload').mockResolvedValueOnce(mockResult);
            const result = await adapter.uploadFile('file');
            expect(result).toEqual({ url: 'url', publicId: 'pid' });
            expect(logger.info).toHaveBeenCalledWith('File uploaded successfully to Cloudinary', expect.any(Object));
        });
        it('should log and throw on error', async () => {
            jest.spyOn(require('cloudinary').v2.uploader, 'upload').mockRejectedValueOnce(new Error('fail'));
            await expect(adapter.uploadFile('file')).rejects.toThrow(CustomError);
            expect(logger.error).toHaveBeenCalled();
        });
    });

    describe('deleteFile', () => {
        it('should delete file and log info', async () => {
            jest.spyOn(require('cloudinary').v2.uploader, 'destroy').mockResolvedValueOnce('ok');
            await adapter.deleteFile('pid');
            expect(logger.info).toHaveBeenCalledWith('File deleted from Cloudinary', expect.any(Object));
        });
        it('should log error but not throw', async () => {
            jest.spyOn(require('cloudinary').v2.uploader, 'destroy').mockRejectedValueOnce(new Error('fail'));
            await expect(adapter.deleteFile('pid')).resolves.toBeUndefined();
            expect(logger.error).toHaveBeenCalled();
        });
    });

    describe('getPublicIdFromUrl', () => {
        it('should extract publicId from valid url', () => {
            const url = 'https://res.cloudinary.com/demo/image/upload/v1234/folder/pid.jpg';
            const publicId = adapter.getPublicIdFromUrl(url);
            expect(publicId).toBe('folder/pid');
        });
        it('should return null and warn if url is invalid', () => {
            const publicId = adapter.getPublicIdFromUrl('invalid-url');
            expect(publicId).toBeNull();
            expect(logger.warn).toHaveBeenCalled();
        });
        it('should return null and log error on exception', () => {
            // Force error by passing object instead of string
            // @ts-ignore
            const publicId = adapter.getPublicIdFromUrl({});
            expect(publicId).toBeNull();
            expect(logger.error).toHaveBeenCalled();
        });
    });
});
