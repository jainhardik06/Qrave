import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { TenancyMiddleware } from './middleware/tenancy.middleware';
import { User, UserSchema } from './schemas/user.schema';
import { Tenant, TenantSchema } from './schemas/tenant.schema';
import { AuthModule } from './app/auth/auth.module';
import { MenuModule } from './app/menu/menu.module';
import { UploadModule } from './app/upload/upload.module';
import { AdminModule } from './app/admin/admin.module';
import { RolesModule } from './app/roles/roles.module';
import { FeatureFlagGuard } from './app/common/guards/feature-flag.guard';
import { OrdersModule } from './app/orders/orders.module';
import { AnalyticsModule } from './app/analytics/analytics.module';
import { StaffModule } from './app/staff/staff.module';
import { InventoryModule } from './app/inventory/inventory.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60_000,
          limit: 120,
        },
      ],
    }),
    DatabaseModule,
    MongooseModule.forFeature([{
      name: User.name,
      schema: UserSchema,
    }, {
      name: Tenant.name,
      schema: TenantSchema,
    }]),
    AuthModule,
    MenuModule,
    UploadModule,
    AdminModule,
    RolesModule,
    OrdersModule,
    AnalyticsModule,
    StaffModule,
    InventoryModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: FeatureFlagGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenancyMiddleware).forRoutes('*');
  }
}
