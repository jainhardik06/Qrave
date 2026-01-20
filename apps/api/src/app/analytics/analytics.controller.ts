import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Permissions } from '../common/permissions.decorator';

@Controller('analytics')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('summary')
  @Permissions('analytics.read')
  summary(@Query('days') days?: string) {
    const parsed = days ? Number(days) : 7;
    return this.analyticsService.getSummary(Number.isFinite(parsed) ? parsed : 7);
  }

  @Get('top-items')
  @Permissions('analytics.read')
  topItems(@Query('days') days?: string, @Query('limit') limit?: string) {
    const parsedDays = days ? Number(days) : 30;
    const parsedLimit = limit ? Number(limit) : 5;
    return this.analyticsService.getTopItems(
      Number.isFinite(parsedDays) ? parsedDays : 30,
      Number.isFinite(parsedLimit) ? parsedLimit : 5,
    );
  }
}
