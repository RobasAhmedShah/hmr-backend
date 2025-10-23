import { Controller, Get, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { AdminAnalyticsService } from './admin-analytics.service';
import { DashboardQueryDto } from './dto/dashboard-query.dto';
import { AnalyticsQueryDto } from './dto/analytics-query.dto';

@Controller('admin')
export class AdminAnalyticsController {
  constructor(private readonly adminAnalyticsService: AdminAnalyticsService) {}

  @Get('dashboard')
  @HttpCode(HttpStatus.OK)
  async getDashboardStats(@Query() query: DashboardQueryDto) {
    return this.adminAnalyticsService.getDashboardStats(query);
  }

  @Get('analytics')
  @HttpCode(HttpStatus.OK)
  async getAnalytics(@Query() query: AnalyticsQueryDto) {
    return this.adminAnalyticsService.getAnalytics(query);
  }
}
