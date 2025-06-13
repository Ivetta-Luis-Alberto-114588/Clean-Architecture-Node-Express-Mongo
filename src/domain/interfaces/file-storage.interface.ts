// src/domain/interfaces/file-storage.interface.ts

export interface FileUploadResult {
    url: string;
    publicId: string;
}

export interface IFileStorageService {
    /**
     * Upload a file to the storage service
     * @param filePath - Local path of the file to upload
     * @param folder - Optional folder name to organize files
     * @returns Promise with the uploaded file URL and public ID
     */
    uploadFile(filePath: string, folder?: string): Promise<FileUploadResult>;

    /**
     * Delete a file from the storage service
     * @param publicId - The public ID of the file to delete
     * @returns Promise that resolves when the file is deleted
     */
    deleteFile(publicId: string): Promise<void>;

    /**
     * Extract the public ID from a file URL
     * @param url - The URL of the file
     * @returns The public ID or null if not found
     */
    getPublicIdFromUrl(url: string): string | null;
}
