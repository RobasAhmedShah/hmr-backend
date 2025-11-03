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
   */
  @Post('image/:category')
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(
    @Param('category') category: 'properties' | 'organizations' | 'kyc',
    @UploadedFile() file: Express.Multer.File
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const result = await this.uploadService.saveFile(file, category, 'image');
    
    return {
      success: true,
      message: 'Image uploaded successfully',
      data: result,
    };
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

