import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { CreateTenantOwnerDto } from './dto/create-tenant-owner.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/roles.decorator';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('tenants')
  @Roles('SUPERADMIN')
  createTenantWithOwner(@Body() dto: CreateTenantOwnerDto) {
    return this.adminService.createTenantWithOwner(dto);
  }
}
