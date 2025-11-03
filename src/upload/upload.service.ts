import { Injectable, BadRequestException } from '@nestjs/common';
import { extname, join, resolve } from 'path';
import { promises as fs } from 'fs';
import { randomBytes } from 'crypto';

@Injectable()
export class UploadService {
  // Resolve docs folder - now inside the hmr-backend directory
  // On Vercel, we can only write to /tmp, so use that in production
  // Structure: E:\Blocks\hmr-backend\docs\ (local) or /tmp/docs (Vercel)
  // Backend is at: E:\Blocks\hmr-backend\
  // So we need: E:\Blocks\hmr-backend\docs\ (local) or /tmp/docs (Vercel)
  private readonly uploadDir = process.env.VERCEL 
    ? join('/tmp', 'docs') 
    : join(process.cwd(), 'docs');
  private readonly maxFileSize = 10 * 1024 * 1024; // 10MB
  private readonly allowedImageTypes = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
  private readonly allowedDocTypes = ['.pdf', '.doc', '.docx', '.txt'];

  constructor() {
    this.ensureUploadDir();
  }

  private async ensureUploadDir() {
    try {
      await fs.mkdir(this.uploadDir, { recursive: true });
      
      // Create subdirectories
      await fs.mkdir(join(this.uploadDir, 'properties'), { recursive: true });
      await fs.mkdir(join(this.uploadDir, 'organizations'), { recursive: true });
      await fs.mkdir(join(this.uploadDir, 'kyc'), { recursive: true });
    } catch (error) {
      console.error('Error creating upload directories:', error);
    }
  }

  /**
   * Validate file type and size
   */
  validateFile(file: Express.Multer.File, type: 'image' | 'document'): void {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    if (file.size > this.maxFileSize) {
      throw new BadRequestException(`File size exceeds maximum allowed size of ${this.maxFileSize / 1024 / 1024}MB`);
    }

    const ext = extname(file.originalname).toLowerCase();
    const allowedTypes = type === 'image' ? this.allowedImageTypes : this.allowedDocTypes;

    if (!allowedTypes.includes(ext)) {
      throw new BadRequestException(
        `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`
      );
    }
  }

  /**
   * Generate unique filename
   */
  generateFilename(originalName: string): string {
    const ext = extname(originalName);
    const randomName = randomBytes(16).toString('hex');
    return `${Date.now()}-${randomName}${ext}`;
  }

  /**
   * Save file to disk and return URL
   * Files are stored in: docs/{category}/{filename}
   * URL format for DB: /docs/{category}/{filename}
   */
  async saveFile(
    file: Express.Multer.File,
    category: 'properties' | 'organizations' | 'kyc',
    type: 'image' | 'document' = 'image'
  ): Promise<{ url: string; filename: string; path: string; fullUrl: string }> {
    try {
      this.validateFile(file, type);

      const filename = this.generateFilename(file.originalname);
      const categoryDir = join(this.uploadDir, category);
      const filePath = join(categoryDir, filename);

      console.log('Saving file:', {
        filename,
        categoryDir,
        filePath,
        uploadDir: this.uploadDir,
        isVercel: !!process.env.VERCEL,
        bufferLength: file.buffer?.length,
      });

      // Ensure category directory exists
      await fs.mkdir(categoryDir, { recursive: true });

      // Ensure buffer exists
      if (!file.buffer) {
        throw new BadRequestException('File buffer is empty');
      }

      // Write file to disk
      await fs.writeFile(filePath, file.buffer);
      
      console.log('File saved successfully:', filePath);

    // Return URL for database storage - use the API endpoint path
    // This is the path that will be stored in the database and can be accessed via the API
    const url = `/upload/file/${category}/${filename}`;
    
    // Full URL for API access (can be used for serving files)
    // Note: In production, files should be accessed via /upload/file/:category/:filename endpoint
    const apiBaseUrl = process.env.API_BASE_URL || 
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
      'http://localhost:3000';
    const fullUrl = `${apiBaseUrl}${url}`;

      return {
        url, // Store this in DB: /upload/file/properties/1234-abc.jpg
        filename,
        path: filePath, // Full file system path: hmr-backend/docs/properties/1234-abc.jpg
        fullUrl, // Full accessible URL (optional, for reference)
      };
    } catch (error) {
      console.error('Error saving file:', error);
      throw new BadRequestException(`Failed to save file: ${error.message}`);
    }
  }

  /**
   * Save multiple files
   */
  async saveFiles(
    files: Express.Multer.File[],
    category: 'properties' | 'organizations' | 'kyc',
    type: 'image' | 'document' = 'image'
  ): Promise<Array<{ url: string; filename: string; path: string; fullUrl: string }>> {
    const savedFiles: Array<{ url: string; filename: string; path: string; fullUrl: string }> = [];

    for (const file of files) {
      const result = await this.saveFile(file, category, type);
      savedFiles.push(result);
    }

    return savedFiles;
  }

  /**
   * Delete file from disk
   */
  async deleteFile(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
    } catch (error) {
      console.error('Error deleting file:', error);
      // Don't throw error if file doesn't exist
    }
  }

  /**
   * Get file from disk for serving
   */
  async getFile(category: string, filename: string): Promise<Buffer> {
    const filePath = join(this.uploadDir, category, filename);
    
    try {
      console.log('Reading file:', filePath);
      return await fs.readFile(filePath);
    } catch (error) {
      console.error('Error reading file:', error);
      throw new BadRequestException('File not found');
    }
  }

  /**
   * Check if file exists
   */
  async fileExists(category: string, filename: string): Promise<boolean> {
    const filePath = join(this.uploadDir, category, filename);
    
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
}

