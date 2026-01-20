import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { StaffService } from './staff.service';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Permissions } from '../common/permissions.decorator';

@Controller('staff')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @Post()
  @Permissions('staff.write')
  create(@Body() dto: CreateStaffDto) {
    return this.staffService.create(dto);
  }

  @Get()
  @Permissions('staff.read')
  findAll() {
    return this.staffService.findAll();
  }

  @Get(':id')
  @Permissions('staff.read')
  findOne(@Param('id') id: string) {
    return this.staffService.findOne(id);
  }

  @Patch(':id')
  @Permissions('staff.write')
  update(@Param('id') id: string, @Body() dto: UpdateStaffDto) {
    return this.staffService.update(id, dto);
  }

  @Patch(':id/reset-password')
  @Permissions('staff.write')
  resetPassword(@Param('id') id: string, @Body() body: { password: string }) {
    return this.staffService.resetPassword(id, body.password);
  }
}
