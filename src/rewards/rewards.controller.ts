import { Body, Controller, Get, Param, Post, Query, NotFoundException } from '@nestjs/common';
import { RewardsService } from './rewards.service';
import { DistributeRoiDto } from './dto/distribute-roi.dto';

@Controller('rewards')
export class RewardsController {
  constructor(private readonly rewardsService: RewardsService) {}

  @Post('distribute')
  distribute(@Body() dto: DistributeRoiDto) {
    return this.rewardsService.distributeRoi(dto);
  }

  @Get()
  findAll(@Query('userId') userId?: string) {
    if (userId) {
      return this.rewardsService.findByUserId(userId);
    }
    return this.rewardsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const reward = await this.rewardsService.findByIdOrDisplayCode(id);
    if (!reward) throw new NotFoundException('Reward not found');
    return reward;
  }
}
