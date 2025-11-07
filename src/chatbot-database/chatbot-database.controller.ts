import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { ChatbotDatabaseService } from './chatbot-database.service';
import {
  GetPropertyDetailsDto,
  SearchPropertiesDto,
  GetPropertyFinancialsDto,
} from './dto/database-query.dto';

@Controller('api/database')
export class ChatbotDatabaseController {
  constructor(private readonly chatbotDatabaseService: ChatbotDatabaseService) {}

  @Post('getPropertyDetails')
  async getPropertyDetails(@Body() dto: GetPropertyDetailsDto) {
    try {
      const result = await this.chatbotDatabaseService.getPropertyDetails(dto);
      return result || { error: 'Property not found' };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to get property details',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('searchProperties')
  async searchProperties(@Body() dto: SearchPropertiesDto) {
    try {
      const result = await this.chatbotDatabaseService.searchProperties(dto);
      return result || [];
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to search properties',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('getPropertyFinancials')
  async getPropertyFinancials(@Body() dto: GetPropertyFinancialsDto) {
    try {
      const result = await this.chatbotDatabaseService.getPropertyFinancials(dto);
      return result || { error: 'Property not found' };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to get property financials',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

