import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { CreateTenantOwnerDto } from './dto/create-tenant-owner.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/roles.decorator';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPERADMIN')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('tenants')
  createTenantWithOwner(@Body() dto: CreateTenantOwnerDto) {
    return this.adminService.createTenantWithOwner(dto);
  }

  @Get('tenants')
  getAllTenants() {
    return this.adminService.getAllTenants();
  }

  @Get('tenants/:id')
  getTenantById(@Param('id') id: string) {
    return this.adminService.getTenantById(id);
  }

  @Patch('tenants/:id/status')
  updateTenantStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.adminService.updateTenantStatus(id, status);
  }

  @Patch('tenants/:id/features')
  updateTenantFeatures(@Param('id') id: string, @Body('features') features: Record<string, boolean>) {
    return this.adminService.updateTenantFeatures(id, features);
  }

  @Delete('tenants/:id')
  deleteTenant(@Param('id') id: string) {
    return this.adminService.deleteTenant(id);
  }

  @Get('stats')
  getPlatformStats() {
    return this.adminService.getPlatformStats();
  }

  @Get('users')
  getAllUsers() {
    return this.adminService.getAllUsers();
  }
}
