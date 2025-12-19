import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { v2 as cloudinary } from 'cloudinary';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Permissions } from '../common/permissions.decorator';
import { FeatureFlagGuard } from '../common/guards/feature-flag.guard';
import { FeatureFlag } from '../common/decorators/feature-flag.decorator';

@Controller('upload')
@UseGuards(JwtAuthGuard, PermissionsGuard, FeatureFlagGuard)
export class UploadController {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  @Get('signature')
  @Permissions('upload.sign')
  @FeatureFlag('upload')
  getUploadSignature() {
    const timestamp = Math.round(Date.now() / 1000);
    const uploadPreset = process.env.CLOUDINARY_DISH_PRESET || 'qrave_dishes';
    const apiSecret = process.env.CLOUDINARY_API_SECRET || '';

    const signature = cloudinary.utils.api_sign_request(
      { timestamp, upload_preset: uploadPreset },
      apiSecret,
    );

    return {
      signature,
      timestamp,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      uploadPreset,
    };
  }
}
