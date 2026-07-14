import fs from 'fs';
import path from 'path';
import { v2 as cloudinary } from 'cloudinary';
import logger from '../../utils/logger';

export interface IStorageProvider {
  uploadFile(file: Express.Multer.File, folder: string): Promise<string>;
  deleteFile(fileUrl: string): Promise<void>;
}

// ----------------------------------------------------
// CLOUDINARY STORAGE PROVIDER
// ----------------------------------------------------
export class CloudinaryStorageProvider implements IStorageProvider {
  async uploadFile(file: Express.Multer.File, folder: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `healthcare-platform/${folder}`,
          resource_type: 'auto',
        },
        (error, result) => {
          if (error) {
            logger.error('Cloudinary file upload failed:', error);
            return reject(error);
          }
          if (!result) {
            return reject(new Error('Cloudinary returned empty result.'));
          }
          resolve(result.secure_url);
        }
      );
      uploadStream.end(file.buffer);
    });
  }

  async deleteFile(fileUrl: string): Promise<void> {
    try {
      // Extract public ID from Cloudinary URL
      const parts = fileUrl.split('/');
      const filename = parts.pop() || '';
      const folder = parts.slice(parts.indexOf('healthcare-platform')).join('/');
      const publicId = `${folder}/${filename.split('.')[0]}`;
      
      await cloudinary.uploader.destroy(publicId);
      logger.info(`Successfully deleted file from Cloudinary: ${publicId}`);
    } catch (error) {
      logger.error('Failed to delete file from Cloudinary:', error);
    }
  }
}

// ----------------------------------------------------
// LOCAL FILESYSTEM STORAGE PROVIDER (DEVELOPMENT FALLBACK)
// ----------------------------------------------------
export class LocalFileProvider implements IStorageProvider {
  private uploadDir: string;
  private backendUrl: string;

  constructor() {
    // Save to a public uploads folder inside backend
    this.uploadDir = path.join(__dirname, '../../../public/uploads');
    this.backendUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5000}`;
    
    // Ensure upload directory exists
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async uploadFile(file: Express.Multer.File, folder: string): Promise<string> {
    const specificDir = path.join(this.uploadDir, folder);
    if (!fs.existsSync(specificDir)) {
      fs.mkdirSync(specificDir, { recursive: true });
    }

    const uniqueFilename = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}${path.extname(file.originalname)}`;
    const filePath = path.join(specificDir, uniqueFilename);

    await fs.promises.writeFile(filePath, file.buffer);
    
    // Return relative url accessible via express.static
    return `${this.backendUrl}/uploads/${folder}/${uniqueFilename}`;
  }

  async deleteFile(fileUrl: string): Promise<void> {
    try {
      const parts = fileUrl.split('/uploads/');
      if (parts.length < 2) return;
      
      const relativePath = parts[1];
      const filePath = path.join(this.uploadDir, relativePath);
      
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
        logger.info(`Successfully deleted local file: ${filePath}`);
      }
    } catch (error) {
      logger.error('Failed to delete local file:', error);
    }
  }
}

// ----------------------------------------------------
// EXPORT CONFIGURED ACTIVE STORAGE PROVIDER
// ----------------------------------------------------
let storageProvider: IStorageProvider;

const isCloudinaryConfigured = 
  !!process.env.CLOUDINARY_CLOUD_NAME && 
  !!process.env.CLOUDINARY_API_KEY && 
  !!process.env.CLOUDINARY_API_SECRET;

if (isCloudinaryConfigured) {
  storageProvider = new CloudinaryStorageProvider();
} else {
  logger.warn('Cloudinary credentials missing. Falling back to Local Filesystem storage.');
  storageProvider = new LocalFileProvider();
}

export default storageProvider;
