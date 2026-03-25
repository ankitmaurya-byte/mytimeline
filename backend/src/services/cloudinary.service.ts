import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

class CloudinaryService {
    /**
     * Upload a base64 image to Cloudinary
     */
    async uploadBase64(base64Data: string, options: any = {}) {
        try {
            const uploadOptions = {
                folder: options.folder || 'timeline/profile-pictures',
                resource_type: options.resource_type || 'image',
                overwrite: options.overwrite || false,
                transformation: options.transformation || {
                    width: 300,
                    height: 300,
                    crop: 'fill',
                    gravity: 'face',
                    quality: 'auto',
                    fetch_format: 'auto',
                },
                ...options,
            };

            // Remove public_id from options if not provided
            if (!options.public_id) {
                delete uploadOptions.public_id;
            }

            const result = await cloudinary.uploader.upload(
                base64Data,
                uploadOptions
            );

            console.log('✅ [Cloudinary] Base64 upload successful:', {
                public_id: result.public_id,
                secure_url: result.secure_url,
                bytes: result.bytes,
            });

            return result;
        } catch (error: any) {
            console.error('❌ [Cloudinary] Base64 upload failed:', error);
            throw new Error(`Cloudinary base64 upload failed: ${error.message}`);
        }
    }

    /**
     * Upload a file buffer to Cloudinary
     */
    async uploadBuffer(buffer: Buffer, options: any = {}) {
        try {
            const uploadOptions = {
                folder: options.folder || 'timeline/profile-pictures',
                resource_type: options.resource_type || 'image',
                overwrite: options.overwrite || false,
                transformation: options.transformation || {
                    width: 300,
                    height: 300,
                    crop: 'fill',
                    gravity: 'face',
                    quality: 'auto',
                    fetch_format: 'auto',
                },
                ...options,
            };

            // Remove public_id from options if not provided
            if (!options.public_id) {
                delete uploadOptions.public_id;
            }

            const result = await cloudinary.uploader.upload(
                `data:image/jpeg;base64,${buffer.toString('base64')}`,
                uploadOptions
            );

            console.log('✅ [Cloudinary] Buffer upload successful:', {
                public_id: result.public_id,
                secure_url: result.secure_url,
                bytes: result.bytes,
            });

            return result;
        } catch (error: any) {
            console.error('❌ [Cloudinary] Buffer upload failed:', error);
            throw new Error(`Cloudinary buffer upload failed: ${error.message}`);
        }
    }

    /**
     * Delete an image from Cloudinary
     */
    async deleteImage(publicId: string) {
        try {
            const result = await cloudinary.uploader.destroy(publicId);
            console.log('🗑️ [Cloudinary] Delete result:', result);
            return result;
        } catch (error: any) {
            console.error('❌ [Cloudinary] Delete failed:', error);
            throw new Error(`Cloudinary delete failed: ${error.message}`);
        }
    }

    /**
     * Check if a URL is a Cloudinary URL
     */
    isCloudinaryUrl(url: string): boolean {
        return url.includes('cloudinary.com') || url.includes('res.cloudinary.com');
    }

    /**
     * Extract public ID from Cloudinary URL
     */
    extractPublicIdFromUrl(url: string): string | null {
        try {
            if (!this.isCloudinaryUrl(url)) {
                return null;
            }

            // Extract public ID from URL
            // Example: https://res.cloudinary.com/cloud_name/image/upload/v1234567890/folder/public_id.jpg
            const parts = url.split('/');
            const uploadIndex = parts.findIndex(part => part === 'upload');

            if (uploadIndex === -1) {
                return null;
            }

            // Get the part after 'upload' and before the file extension
            const publicIdWithVersion = parts[uploadIndex + 1];
            if (!publicIdWithVersion) {
                return null;
            }

            // Remove version prefix (v1234567890/) if present
            const publicId = publicIdWithVersion.replace(/^v\d+\//, '');

            return publicId;
        } catch (error) {
            console.error('❌ [Cloudinary] Error extracting public ID:', error);
            return null;
        }
    }
}

// Export singleton instance
export const cloudinaryService = new CloudinaryService();


