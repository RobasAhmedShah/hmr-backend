import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatbotDatabaseController } from './chatbot-database.controller';
import { ChatbotDatabaseService } from './chatbot-database.service';
import { Property } from '../properties/entities/property.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Property])],
  controllers: [ChatbotDatabaseController],
  providers: [ChatbotDatabaseService],
  exports: [ChatbotDatabaseService],
})
export class ChatbotDatabaseModule {}

