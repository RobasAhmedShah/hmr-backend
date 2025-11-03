import {
  Controller,
  Post,
  Get,
  Param,
  Req,
  BadRequestException,
  Res,
  StreamableFile,
} from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import type { Response } from 'express';
import { UploadService } from './upload.service';
import { extname } from 'path';

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  /**
   * Upload single image
   * Using Fastify's native multipart handling instead of Express multer
   */
  @Post('image/:category')
  async uploadImage(
    @Param('category') category: 'properties' | 'organizations' | 'kyc',
    @Req() request: FastifyRequest
  ) {
    try {
      console.log('Upload endpoint called:', {
        category,
        isMultipart: request.isMultipart(),
        contentType: request.headers['content-type'],
      });

      if (!request.isMultipart()) {
        throw new BadRequestException('Request is not multipart/form-data');
      }

      const data = await request.file();
      
      if (!data) {
        throw new BadRequestException('No file uploaded');
      }

      console.log('File received from Fastify multipart:', {
        fieldname: data.fieldname,
        filename: data.filename,
        mimetype: data.mimetype,
        encoding: data.encoding,
      });

      // Read file buffer
      const buffer = await data.toBuffer();

      // Convert Fastify multipart file to Multer-like format for service
      const multerLikeFile: Express.Multer.File = {
        fieldname: data.fieldname,
        originalname: data.filename || 'upload',
        encoding: data.encoding,
        mimetype: data.mimetype || 'application/octet-stream',
        buffer: buffer,
        size: buffer.length,
        destination: '',
        filename: '',
        path: '',
        stream: null as any,
      };

      console.log('Converted file info:', {
        originalname: multerLikeFile.originalname,
        mimetype: multerLikeFile.mimetype,
        size: multerLikeFile.size,
        bufferLength: multerLikeFile.buffer.length,
      });

      const result = await this.uploadService.saveFile(multerLikeFile, category, 'image');
      
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
   * Using Fastify's native multipart handling
   */
  @Post('images/:category')
  async uploadImages(
    @Param('category') category: 'properties' | 'organizations' | 'kyc',
    @Req() request: FastifyRequest
  ) {
    try {
      if (!request.isMultipart()) {
        throw new BadRequestException('Request is not multipart/form-data');
      }

      const files: Express.Multer.File[] = [];
      
      for await (const part of request.parts()) {
        if (part.type === 'file') {
          // When part.type === 'file', the part itself is the file object
          const filePart = part as any; // Fastify multipart file part
          const buffer = await filePart.toBuffer();
          files.push({
            fieldname: filePart.fieldname,
            originalname: filePart.filename || 'upload',
            encoding: filePart.encoding,
            mimetype: filePart.mimetype || 'application/octet-stream',
            buffer: buffer,
            size: buffer.length,
            destination: '',
            filename: '',
            path: '',
            stream: null as any,
          });
        }
      }

      if (files.length === 0) {
        throw new BadRequestException('No files uploaded');
      }

      const results = await this.uploadService.saveFiles(files, category, 'image');
      
      return {
        success: true,
        message: `${files.length} image(s) uploaded successfully`,
        data: results,
      };
    } catch (error) {
      console.error('Upload images error:', error);
      throw error;
    }
  }

  /**
   * Upload single document
   * Using Fastify's native multipart handling
   */
  @Post('document/:category')
  async uploadDocument(
    @Param('category') category: 'properties' | 'organizations' | 'kyc',
    @Req() request: FastifyRequest
  ) {
    try {
      if (!request.isMultipart()) {
        throw new BadRequestException('Request is not multipart/form-data');
      }

      const data = await request.file();
      
      if (!data) {
        throw new BadRequestException('No file uploaded');
      }

      const buffer = await data.toBuffer();

      const multerLikeFile: Express.Multer.File = {
        fieldname: data.fieldname,
        originalname: data.filename || 'upload',
        encoding: data.encoding,
        mimetype: data.mimetype || 'application/octet-stream',
        buffer: buffer,
        size: buffer.length,
        destination: '',
        filename: '',
        path: '',
        stream: null as any,
      };

      const result = await this.uploadService.saveFile(multerLikeFile, category, 'document');
      
      return {
        success: true,
        message: 'Document uploaded successfully',
        data: result,
      };
    } catch (error) {
      console.error('Upload document error:', error);
      throw error;
    }
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

