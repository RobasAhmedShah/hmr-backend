import {
  Controller,
  Post,
  Get,
  Param,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  BadRequestException,
  Res,
  StreamableFile,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { UploadService } from './upload.service';
import { extname } from 'path';

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  /**
   * Upload single image
   * Note: Fastify adapter supports Express interceptors, but we handle multipart manually for compatibility
   */
  @Post('image/:category')
  @UseInterceptors(FileInterceptor('file', {
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
      try {
        console.log('FileInterceptor - File filter called:', {
          fieldname: file?.fieldname,
          originalname: file?.originalname,
          mimetype: file?.mimetype,
        });
        // Accept all files - validation happens in service
        cb(null, true);
      } catch (error) {
        console.error('FileInterceptor - Filter error:', error);
        cb(error as Error, false);
      }
    },
  }))
  async uploadImage(
    @Param('category') category: 'properties' | 'organizations' | 'kyc',
    @UploadedFile() file: Express.Multer.File
  ) {
    try {
      console.log('Upload endpoint called:', {
        category,
        hasFile: !!file,
        fileType: typeof file,
        fileKeys: file ? Object.keys(file) : null,
      });

      if (!file) {
        console.error('No file received in controller');
        throw new BadRequestException('No file uploaded');
      }

      console.log('File received:', {
        fieldname: file.fieldname,
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        bufferLength: file.buffer?.length,
        encoding: file.encoding,
        destination: file.destination,
        filename: file.filename,
        path: file.path,
      });

      const result = await this.uploadService.saveFile(file, category, 'image');
      
      return {
        success: true,
        message: 'Image uploaded successfully',
        data: result,
      };
    } catch (error) {
      console.error('Upload error in controller:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        category,
      });
      throw error;
    }
  }

  /**
   * Upload multiple images
   */
  @Post('images/:category')
  @UseInterceptors(FilesInterceptor('files', 10)) // Max 10 files
  async uploadImages(
    @Param('category') category: 'properties' | 'organizations' | 'kyc',
    @UploadedFiles() files: Express.Multer.File[]
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    const results = await this.uploadService.saveFiles(files, category, 'image');
    
    return {
      success: true,
      message: `${files.length} image(s) uploaded successfully`,
      data: results,
    };
  }

  /**
   * Upload single document
   */
  @Post('document/:category')
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocument(
    @Param('category') category: 'properties' | 'organizations' | 'kyc',
    @UploadedFile() file: Express.Multer.File
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const result = await this.uploadService.saveFile(file, category, 'document');
    
    return {
      success: true,
      message: 'Document uploaded successfully',
      data: result,
    };
  }

  /**
   * Serve/view uploaded file
   */
  @Get('file/:category/:filename')
  async getFile(
    @Param('category') category: string,
    @Param('filename') filename: string,
    @Res({ passthrough: true }) res: Response
  ) {
    const fileBuffer = await this.uploadService.getFile(category, filename);
    
    // Set appropriate content type based on file extension
    const ext = extname(filename).toLowerCase();
    const contentTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml',
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.txt': 'text/plain',
    };

    res.set('Content-Type', contentTypes[ext] || 'application/octet-stream');
    res.set('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
    
    return new StreamableFile(fileBuffer);
  }

  /**
   * Check if file exists
   */
  @Get('exists/:category/:filename')
  async checkFile(
    @Param('category') category: string,
    @Param('filename') filename: string
  ) {
    const exists = await this.uploadService.fileExists(category, filename);
    
    return {
      success: true,
      exists,
    };
  }
}

