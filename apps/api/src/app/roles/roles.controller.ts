import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Permissions } from '../common/permissions.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles as RoleDecor } from '../common/roles.decorator';

@Controller('roles')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  @Permissions('role.manage')
  create(@Body() dto: CreateRoleDto, @Query('tenantId') tenantId?: string) {
    return this.rolesService.create(dto, tenantId);
  }

  @Get()
  @Permissions('role.manage')
  findAll(@Query('tenantId') tenantId?: string) {
    return this.rolesService.findAll(tenantId);
  }

  @Get(':id')
  @Permissions('role.manage')
  findOne(@Param('id') id: string, @Query('tenantId') tenantId?: string) {
    return this.rolesService.findOne(id, tenantId);
  }

  @Patch(':id')
  @Permissions('role.manage')
  update(@Param('id') id: string, @Body() dto: UpdateRoleDto, @Query('tenantId') tenantId?: string) {
    return this.rolesService.update(id, dto, tenantId);
  }

  @Delete(':id')
  @Permissions('role.manage')
  remove(@Param('id') id: string, @Query('tenantId') tenantId?: string) {
    return this.rolesService.remove(id, tenantId);
  }
}
