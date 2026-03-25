import { NextRequest } from 'next/server';
import { withCORS } from '../../_lib/cors';
import { ensureDb } from '../../_lib/db';
import UserModel from '@/src/models/user.model';
import { authenticateUser } from '@/src/middleware/universal-auth';
import { HTTPSTATUS } from '@/src/config/http.config';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import crypto from 'crypto';
import { cloudinaryService } from '@/src/services/cloudinary.service';

export const OPTIONS = withCORS(() => new Response(null, { status: 204 }));

export const POST = withCORS(async (req: NextRequest) => {
    try {
        await ensureDb();

        // Authenticate user (supports both JWT and biometric tokens)
        const authResult = await authenticateUser(req);
        if (!authResult.success) {
            return new Response(JSON.stringify({ message: authResult.error }), {
                status: HTTPSTATUS.UNAUTHORIZED,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const user = await UserModel.findById(authResult.userId);
        if (!user) {
            return new Response(JSON.stringify({ message: 'User not found' }), {
                status: HTTPSTATUS.NOT_FOUND,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Parse form data
        const formData = await req.formData();
        const file = formData.get('profilePicture') as File;

        if (!file) {
            return new Response(JSON.stringify({
                message: 'No file uploaded. Please select a profile picture.'
            }), {
                status: HTTPSTATUS.BAD_REQUEST,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
        if (!allowedTypes.includes(file.type)) {
            return new Response(JSON.stringify({
                message: 'Invalid file type. Please upload a JPEG, PNG, WebP, or GIF image.'
            }), {
                status: HTTPSTATUS.BAD_REQUEST,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB in bytes
        if (file.size > maxSize) {
            return new Response(JSON.stringify({
                message: 'File too large. Please upload an image smaller than 5MB.'
            }), {
                status: HTTPSTATUS.BAD_REQUEST,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Convert file to buffer for Cloudinary upload
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        console.log('☁️ [profile-upload] Uploading to Cloudinary...', {
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
            userId: user._id
        });

        // Check if Cloudinary is configured
        if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
            console.warn('⚠️ [profile-upload] Cloudinary not configured, falling back to base64 storage');

            // Fallback to base64 storage if Cloudinary is not configured
            const base64Image = `data:${file.type};base64,${buffer.toString('base64')}`;
            const profilePictureUrl = base64Image;

            // Update user profile picture
            const oldProfilePicture = user.profilePicture;
            user.profilePicture = profilePictureUrl;
            await user.save();


            return new Response(JSON.stringify({
                message: 'Profile picture uploaded successfully (base64 storage)',
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    profilePicture: user.profilePicture ? 'updated' : null
                },
                uploadInfo: {
                    fileName: file.name,
                    fileSize: file.size,
                    fileType: file.type,
                    uploadedAt: new Date().toISOString(),
                    storage: 'base64'
                }
            }), {
                status: HTTPSTATUS.OK,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Delete old profile picture from Cloudinary if it exists
        if (user.profilePicture && cloudinaryService.isCloudinaryUrl(user.profilePicture)) {
            const oldPublicId = cloudinaryService.extractPublicIdFromUrl(user.profilePicture);
            if (oldPublicId) {
                console.log('🗑️ [profile-upload] Deleting old Cloudinary image:', oldPublicId);
                await cloudinaryService.deleteImage(oldPublicId);
            }
        }

        // Upload to Cloudinary
        const uploadResult = await cloudinaryService.uploadBuffer(buffer, {
            public_id: `profile-${user._id}-${Date.now()}`,
            folder: 'timeline/profile-pictures'
        });

        const profilePictureUrl = uploadResult.secure_url;

        // Update user profile picture
        const oldProfilePicture = user.profilePicture;
        user.profilePicture = profilePictureUrl;
        await user.save();


        return new Response(JSON.stringify({
            message: 'Profile picture uploaded successfully to Cloudinary',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                profilePicture: user.profilePicture ? 'updated' : null
            },
            uploadInfo: {
                fileName: file.name,
                fileSize: file.size,
                fileType: file.type,
                uploadedAt: new Date().toISOString(),
                storage: 'cloudinary',
                cloudinary: {
                    publicId: uploadResult.public_id,
                    secureUrl: uploadResult.secure_url,
                    width: uploadResult.width,
                    height: uploadResult.height,
                    format: uploadResult.format,
                    bytes: uploadResult.bytes
                }
            }
        }), {
            status: HTTPSTATUS.OK,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('[profile-picture/upload] Error:', error);
        return new Response(JSON.stringify({
            message: 'Failed to upload profile picture',
            error: error instanceof Error ? error.message : 'Unknown error'
        }), {
            status: HTTPSTATUS.INTERNAL_SERVER_ERROR,
            headers: { 'Content-Type': 'application/json' }
        });
    }
});

// DELETE endpoint to remove profile picture
export const DELETE = withCORS(async (req: NextRequest) => {
    try {
        await ensureDb();

        // Authenticate user (supports both JWT and biometric tokens)
        const authResult = await authenticateUser(req);
        if (!authResult.success) {
            return new Response(JSON.stringify({ message: authResult.error }), {
                status: HTTPSTATUS.UNAUTHORIZED,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const user = await UserModel.findById(authResult.userId);
        if (!user) {
            return new Response(JSON.stringify({ message: 'User not found' }), {
                status: HTTPSTATUS.NOT_FOUND,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Remove profile picture
        const oldProfilePicture = user.profilePicture;

        // Delete from Cloudinary if it's a Cloudinary URL
        if (oldProfilePicture && cloudinaryService.isCloudinaryUrl(oldProfilePicture)) {
            const publicId = cloudinaryService.extractPublicIdFromUrl(oldProfilePicture);
            if (publicId) {
                console.log('🗑️ [profile-picture/remove] Deleting from Cloudinary:', publicId);
                const deleted = await cloudinaryService.deleteImage(publicId);
                console.log('🗑️ [profile-picture/remove] Cloudinary deletion result:', deleted);
            }
        }

        user.profilePicture = null;
        await user.save();

        console.log(`[profile-picture/remove] Profile picture removed for user: ${user.email}`, {
            removedPicture: oldProfilePicture,
            wasCloudinary: oldProfilePicture ? cloudinaryService.isCloudinaryUrl(oldProfilePicture) : false
        });

        return new Response(JSON.stringify({
            message: 'Profile picture removed successfully',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                profilePicture: user.profilePicture
            }
        }), {
            status: HTTPSTATUS.OK,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('[profile-picture/remove] Error:', error);
        return new Response(JSON.stringify({
            message: 'Failed to remove profile picture',
            error: error instanceof Error ? error.message : 'Unknown error'
        }), {
            status: HTTPSTATUS.INTERNAL_SERVER_ERROR,
            headers: { 'Content-Type': 'application/json' }
        });
    }
});
